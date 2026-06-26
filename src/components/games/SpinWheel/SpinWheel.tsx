/* ============================================================
   SpinWheel — orchestrates geometry + physics + result.

   Motion is a 1:1 port of the prototype:
     • rotation driven by withTiming over DURATION_MS
     • easing p(t)=1-(1-t)^4.2  →  Easing.out(Easing.poly(4.2))  (exact)
     • 4–6 turns + alignment delta + in-slice jitter
     • a tick fires on every segment boundary that crosses the pointer, detected
       on the UI thread via useAnimatedReaction → ticks space out as it slows,
       staying perfectly in sync with the deceleration.

   Outcome integrity (CODE_RULES.md §10): the winner is NOT chosen here. The
   component calls `requestWinner()` (a Supabase RPC) and animates to that index.
   The only randomness left is presentational (turn count + in-slice jitter).
   ============================================================ */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image as RNImage,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import {
  WHEEL_COLORS,
  WHEEL_FONTS,
  WHEEL_GEOMETRY,
  WHEEL_MOTION,
} from './wheelConfig';
import type { SpinWheelProps } from './types';
import { WheelFace } from './WheelFace';
import { Confetti } from './Confetti';
import { WinnerModal } from './WinnerModal';
import EscapeChallenge from './EscapeChallenge';

/* ---------- gold ring (faux-conic via stroked arc segments) ---------- */
function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number): string => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function conicColorAt(p: number): string {
  const stops = WHEEL_COLORS.goldRingStops;
  const offs = WHEEL_COLORS.goldRingStopOffsets;
  for (let i = 0; i < offs.length - 1; i++) {
    if (p >= offs[i] && p <= offs[i + 1]) {
      const span = offs[i + 1] - offs[i] || 1;
      const f = (p - offs[i]) / span;
      const a = hexToRgb(stops[i]);
      const b = hexToRgb(stops[i + 1]);
      return rgbToHex(
        a[0] + (b[0] - a[0]) * f,
        a[1] + (b[1] - a[1]) * f,
        a[2] + (b[2] - a[2]) * f,
      );
    }
  }
  return stops[stops.length - 1];
}

const RING_SEGMENTS = 72;

function GoldRing({ size }: { size: number }): React.JSX.Element {
  const thickness = size * WHEEL_GEOMETRY.RING_THICKNESS_RATIO;
  const cx = size / 2;
  const midR = size / 2 - thickness / 2;

  const arcs = useMemo(() => {
    const step = 360 / RING_SEGMENTS;
    return Array.from({ length: RING_SEGMENTS }, (_, i) => {
      const a0 = (i * step - 90) * (Math.PI / 180);
      const a1 = ((i + 1) * step - 90 + 0.6) * (Math.PI / 180); // slight overlap
      const x0 = cx + midR * Math.cos(a0);
      const y0 = cx + midR * Math.sin(a0);
      const x1 = cx + midR * Math.cos(a1);
      const y1 = cx + midR * Math.sin(a1);
      return {
        d: `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${midR.toFixed(2)} ${midR.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        color: conicColorAt((i + 0.5) / RING_SEGMENTS),
      };
    });
  }, [cx, midR]);

  return (
    <Svg
      width={size}
      height={size}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {arcs.map((a, i) => (
        <Path
          key={i}
          d={a.d}
          stroke={a.color}
          strokeWidth={thickness}
          fill="none"
        />
      ))}
      {/* dark seat between ring and faces */}
      <Circle
        cx={cx}
        cy={cx}
        r={size / 2 - thickness}
        fill="none"
        stroke="rgba(90,45,0,0.35)"
        strokeWidth={2}
      />
    </Svg>
  );
}

/* ---------- glossy dome highlight (static, above faces) ---------- */
function Gloss({ size }: { size: number }): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="glossHi" cx="0.32" cy="0.2" r="0.7">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.42} />
          <Stop offset="0.36" stopColor="#FFFFFF" stopOpacity={0.12} />
          <Stop offset="0.64" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glossLo" cx="0.7" cy="0.92" r="0.6">
          <Stop offset="0" stopColor="#280846" stopOpacity={0.2} />
          <Stop offset="0.55" stopColor="#280846" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glossHi)" />
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glossLo)" />
    </Svg>
  );
}

/* ---------- pointer (SVG, at top) ---------- */
function Pointer({ size }: { size: number }): React.JSX.Element {
  const w = size * WHEEL_GEOMETRY.POINTER_W_RATIO;
  const h = size * WHEEL_GEOMETRY.POINTER_H_RATIO;
  return (
    <View style={[styles.pointer, { top: -(size * (12 / 344)) }]}>
      <Svg width={w} height={h} viewBox="0 0 46 56">
        <Defs>
          <RadialGradient id="pg" cx="0.5" cy="0.1" r="1.0">
            <Stop offset="0" stopColor={WHEEL_COLORS.pointerGradient[0]} />
            <Stop offset="0.5" stopColor={WHEEL_COLORS.pointerGradient[1]} />
            <Stop offset="1" stopColor={WHEEL_COLORS.pointerGradient[2]} />
          </RadialGradient>
        </Defs>
        <Path
          d="M23 52 L7 22 a16 16 0 0 1 32 0 Z"
          fill="url(#pg)"
          stroke={WHEEL_COLORS.pointerStroke}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Circle
          cx={23}
          cy={20}
          r={8}
          fill={WHEEL_COLORS.white}
          stroke={WHEEL_COLORS.goldDeep}
          strokeWidth={2.5}
        />
        <Circle cx={23} cy={20} r={3.4} fill={WHEEL_COLORS.pointerDot} />
      </Svg>
    </View>
  );
}

/* ---------- read-only status banner for non-challenged devices ---------- */
function ChallengeBanner({
  playerName,
}: {
  playerName: string;
}): React.JSX.Element {
  return (
    <View style={styles.challengeBanner} accessibilityLiveRegion="polite">
      <View style={styles.challengeBannerIcon}>
        <Ionicons name="flash" size={16} color={WHEEL_COLORS.gold} />
      </View>
      <Text style={styles.challengeBannerText}>
        {playerName} is answering the challenge...
      </Text>
    </View>
  );
}

/* ---------- center spin button face (radial gradient via SVG) ---------- */
function SpinButtonFace({ diameter }: { diameter: number }): React.JSX.Element {
  return (
    <Svg
      width={diameter}
      height={diameter}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="spinFace" cx="0.5" cy="0.22" r="0.9">
          <Stop offset="0" stopColor={WHEEL_COLORS.coralLight} />
          <Stop offset="0.42" stopColor={WHEEL_COLORS.coral} />
          <Stop offset="1" stopColor={WHEEL_COLORS.pink} />
        </RadialGradient>
      </Defs>
      <Circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={diameter / 2}
        fill="url(#spinFace)"
      />
    </Svg>
  );
}

/* ============================================================ */
function SpinWheelComponent({
  players,
  requestWinner,
  onTick,
  onWin,
  onTickStop,
  onResult,
  size = WHEEL_GEOMETRY.DEFAULT_DISPLAY_SIZE,
  autoSpin = false,
  canSpin = true,
  spinKey = null,
  onGameEnd,
  onChallengeReady,
  challengeStatus = null,
  isChallengedPlayer = false,
  challengedPlayerName = null,
  challengeStart = null,
  challengeStep = null,
  challengeDeadline = null,
  onSubmitEscapeAnswer,
}: SpinWheelProps): React.JSX.Element {
  const count = players.length;
  const rotation = useSharedValue(0);
  const restAngle = useRef(0);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const prevCountRef = useRef(count);
  if (count !== prevCountRef.current) {
    prevCountRef.current = count;
    if (winnerIndex !== null && winnerIndex >= count) {
      setWinnerIndex(null);
      setModalVisible(false);
    }
  }
  const [confettiKey, setConfettiKey] = useState(0);
  const [spinError, setSpinError] = useState(false);
  const [layout, setLayout] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  const modalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const respinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ringThickness = size * WHEEL_GEOMETRY.RING_THICKNESS_RATIO;
  const wheelSize = size - ringThickness * 2;
  const spinBtn = size * WHEEL_GEOMETRY.SPIN_BTN_RATIO;

  const startTickTimer = useCallback(
    (totalDelta: number, duration: number, onCutoff: () => void): void => {
      const seg = 360 / count;
      const startTime = Date.now();
      let lastCrossing = 0;
      let cutoffFired = false;

      if (tickTimerRef.current) clearInterval(tickTimerRef.current);

      const cutoff = duration - 2000;

      tickTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= cutoff) {
          if (tickTimerRef.current) {
            clearInterval(tickTimerRef.current);
            tickTimerRef.current = null;
          }
          if (!cutoffFired) {
            cutoffFired = true;
            onCutoff();
          }
          return;
        }
        const t = elapsed / duration;
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const currentAngle = totalDelta * eased;
        const crossing = Math.floor(currentAngle / seg);
        if (crossing > lastCrossing) {
          lastCrossing = crossing;
          onTick();
        }
      }, 16);
    },
    [count, onTick],
  );

  const stopTickTimer = useCallback((): void => {
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  const challengeStatusRef = useRef(challengeStatus);
  challengeStatusRef.current = challengeStatus;
  const onChallengeReadyRef = useRef(onChallengeReady);
  onChallengeReadyRef.current = onChallengeReady;

  const handleComplete = useCallback(
    (idx: number, to: number): void => {
      stopTickTimer();
      restAngle.current = to;
      setIsSpinning(false);
      if (__DEV__) {
        const deadlineStr = challengeDeadline ?? 'null';
        const secsLeft = challengeDeadline
          ? Math.round((new Date(challengeDeadline).getTime() - Date.now()) / 1000)
          : 'N/A';
        console.log(
          `[Challenge] handleComplete: idx=${idx} status=${challengeStatusRef.current} deadline=${deadlineStr} secsLeft=${secsLeft}`,
        );
      }
      onWin();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      setConfettiKey((k) => k + 1);
      if (modalTimer.current) clearTimeout(modalTimer.current);

      if (challengeStatusRef.current === 'pending') {
        if (__DEV__) console.log('[Challenge] challenge ready — notifying page');
        setShowChallenge(true);
        onChallengeReadyRef.current?.();
      } else {
        modalTimer.current = setTimeout(
          () => setModalVisible(true),
          WHEEL_MOTION.WINNER_MODAL_DELAY_MS,
        );
      }
      onResult?.(idx);
    },
    [onWin, onResult, stopTickTimer],
  );

  // Reveal the deferred winner modal once a pending challenge resolves
  // to 'failed' (payer confirmed). Success instead starts a brand new
  // spin via the spinKey watcher below, so this branch never fires then.
  const prevChallengeStatusRef = useRef(challengeStatus);
  useEffect(() => {
    if (prevChallengeStatusRef.current === 'pending' && challengeStatus === 'failed') {
      setShowChallenge(false);
      if (!isSpinning && winnerIndex !== null) {
        setModalVisible(true);
      }
    }
    if (prevChallengeStatusRef.current === 'pending' && challengeStatus === null) {
      setShowChallenge(false);
    }
    prevChallengeStatusRef.current = challengeStatus;
  }, [challengeStatus, isSpinning, winnerIndex]);

  const runSpinAnimation = useCallback(
    (idx: number): void => {
      const seg = 360 / count;
      const mid = (idx + 0.5) * seg;
      const targetMod = ((-mid % 360) + 360) % 360;
      const curMod = ((restAngle.current % 360) + 360) % 360;
      // Fixed turns + zero jitter — both devices must compute identical
      // final angles from the same payer_index, otherwise narrow segments
      // (4+ players) can visually land on different segments across devices.
      const turns = WHEEL_MOTION.MIN_TURNS;
      const delta =
        turns * 360 + ((((targetMod - curMod) % 360) + 360) % 360);
      const to = restAngle.current + delta;
      const duration = WHEEL_MOTION.DURATION_MS;

      startTickTimer(delta, duration, () => {
        if (onTickStop) onTickStop();
      });

      rotation.value = withTiming(
        to,
        {
          duration,
          easing: Easing.inOut(Easing.cubic),
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          'worklet';
          if (finished) runOnJS(handleComplete)(idx, to);
        },
      );
    },
    [count, rotation, handleComplete, startTickTimer, onTickStop],
  );

  const isSpinningRef = useRef(isSpinning);
  isSpinningRef.current = isSpinning;

  const spin = useCallback(async (): Promise<void> => {
    if (isSpinningRef.current) return;
    if (__DEV__) console.log('[Challenge] spin() called, setting isSpinning=true');
    cancelAnimation(rotation);
    setSpinError(false);
    setIsSpinning(true);
    setShowChallenge(false);
    setModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    try {
      const idx = await requestWinner();
      if (!Number.isInteger(idx) || idx < 0 || idx >= count) {
        throw new Error(
          `requestWinner returned out-of-range index ${idx} for ${count} players`,
        );
      }
      setWinnerIndex(idx);
      runSpinAnimation(idx);
    } catch (error) {
      console.error('SpinWheel: requestWinner failed:', error);
      setSpinError(true);
      setIsSpinning(false);
    }
  }, [isSpinning, requestWinner, count, runSpinAnimation]);

  const closeModal = useCallback((): void => {
    setModalVisible(false);
    if (!canSpin && onGameEnd) onGameEnd();
  }, [canSpin, onGameEnd]);

  // Stable reference — without this, an inline arrow function here would
  // be recreated on every render (every 500ms poll during the spinning
  // phase), tearing down and re-creating EscapeChallenge's internal
  // timeout-checking effect on nearly every tick. Same class of bug
  // fixed earlier in useGameSession (unstable deps causing effect churn).
  const handleEscapeAnswer = useCallback(
    (value: number): void => {
      void onSubmitEscapeAnswer?.(value);
    },
    [onSubmitEscapeAnswer],
  );

  // Ref ensures timeouts always call the LATEST spin, not the one
  // captured when the timeout was created (stale-closure bug).
  const spinRef = useRef(spin);
  spinRef.current = spin;

  const spinAgain = useCallback((): void => {
    setModalVisible(false);
    if (respinTimer.current) clearTimeout(respinTimer.current);
    respinTimer.current = setTimeout(() => {
      void spinRef.current();
    }, WHEEL_MOTION.RESPIN_DELAY_MS);
  }, []);

  const lastSpinKey = useRef<string | null>(null);
  useEffect(() => {
    if (
      autoSpin &&
      count >= 2 &&
      spinKey &&
      spinKey !== lastSpinKey.current &&
      layout.w > 0
    ) {
      if (__DEV__) console.log(`[Challenge] autoSpin watcher: setting isSpinning=false, will call spin() in 800ms`);
      lastSpinKey.current = spinKey;
      setModalVisible(false);
      setWinnerIndex(null);
      setIsSpinning(false);
      setShowChallenge(false);
      setTimeout(() => {
        if (__DEV__) console.log(`[Challenge] autoSpin watcher: calling spin() now`);
        void spinRef.current();
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSpin, count, spinKey, layout.w]);

  useEffect(() => {
    return () => {
      cancelAnimation(rotation);
      stopTickTimer();
      if (modalTimer.current) clearTimeout(modalTimer.current);
      if (respinTimer.current) clearTimeout(respinTimer.current);
    };
  }, [rotation, stopTickTimer]);

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const onContainerLayout = useCallback((e: LayoutChangeEvent): void => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ w: width, h: height });
  }, []);

  const winner = winnerIndex !== null ? (players[winnerIndex] ?? null) : null;

  return (
    <View style={styles.root} onLayout={onContainerLayout}>
      <View style={[styles.wheelWrap, { width: size, height: size }]}>
        {/* soft cast shadow under the wheel */}
        <View
          style={[
            styles.castShadow,
            { left: size * 0.13, right: size * 0.13, bottom: -size * 0.075 },
          ]}
        />

        <GoldRing size={size} />

        {/* rotating wheel (centered) */}
        <View style={styles.centerFill} pointerEvents="none">
          <Animated.View
            style={[{ width: wheelSize, height: wheelSize }, wheelStyle]}
          >
            <WheelFace players={players} size={wheelSize} />
            {players.map((player, i) => {
              const uri = player.avatarUri ?? null;
              if (!uri) return null;

              const seg = 360 / count;
              const mid = (i + 0.5) * seg;
              const rad = (mid * Math.PI) / 180;
              const avatarR = count <= 3 ? 30 : count <= 4 ? 26 : 23;
              const scale = wheelSize / WHEEL_GEOMETRY.VIEWBOX;
              const posR = WHEEL_GEOMETRY.FACE_RADIUS * WHEEL_GEOMETRY.AVATAR_RADIUS_RATIO;
              const cx = (WHEEL_GEOMETRY.CENTER + posR * Math.sin(rad)) * scale;
              const cy = (WHEEL_GEOMETRY.CENTER - posR * Math.cos(rad)) * scale;
              const r = avatarR * scale;

              return (
                <View
                  key={player.id}
                  style={{
                    position: 'absolute',
                    left: cx - r,
                    top: cy - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: r,
                    overflow: 'hidden',
                    backgroundColor: 'transparent',
                  }}
                >
                  <RNImage
                    source={{ uri }}
                    style={{
                      width: r * 2,
                      height: r * 2,
                    }}
                    resizeMode="cover"
                    onError={() => {
                      if (__DEV__) {
                        console.log(
                          `[Avatar] Image load FAILED for ${player.name}`,
                        );
                      }
                    }}
                  />
                </View>
              );
            })}
          </Animated.View>
        </View>

        {/* glossy dome highlight (centered, above faces) */}
        <View style={styles.centerFill} pointerEvents="none">
          <Gloss size={wheelSize} />
        </View>

        <Pointer size={size} />

        <View style={styles.centerFill} pointerEvents="box-none">
          <View
            style={[
              styles.spinRingOuter,
              {
                width: spinBtn + 16,
                height: spinBtn + 16,
                borderRadius: (spinBtn + 16) / 2,
              },
            ]}
          >
            <View
              style={[
                styles.spinRingInner,
                {
                  width: spinBtn + 12,
                  height: spinBtn + 12,
                  borderRadius: (spinBtn + 12) / 2,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={canSpin ? 'Spin the wheel' : 'Waiting for host'}
                accessibilityState={{ disabled: !canSpin || isSpinning }}
                disabled={!canSpin || isSpinning}
                onPress={() => {
                  void spin();
                }}
                style={({ pressed }) => [
                  styles.spinBtn,
                  {
                    width: spinBtn,
                    height: spinBtn,
                    borderRadius: spinBtn / 2,
                  },
                  pressed && canSpin && !isSpinning && styles.spinBtnPressed,
                  (!canSpin || isSpinning) && styles.spinBtnDisabled,
                ]}
              >
                <SpinButtonFace diameter={spinBtn} />
                <Text style={styles.spinLabel} maxFontSizeMultiplier={1.2}>
                  {'SPIN'}
                </Text>
                <Text
                  style={styles.spinLabelSmall}
                  maxFontSizeMultiplier={1.2}
                >
                  {'TAP!'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {spinError ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {"Spin couldn't start. Please try again."}
        </Text>
      ) : null}

      {null /* diagnostic logs removed — use handleComplete log for timing */}

      {showChallenge && !isChallengedPlayer && challengedPlayerName ? (
        <ChallengeBanner playerName={challengedPlayerName} />
      ) : null}

      {layout.w > 0 ? (
        <Confetti
          burstKey={confettiKey}
          width={layout.w}
          height={layout.h}
          originY={0.42}
        />
      ) : null}

      <WinnerModal
        visible={modalVisible}
        winner={winner}
        onSpinAgain={spinAgain}
        onClose={closeModal}
        canSpin={canSpin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castShadow: {
    position: 'absolute',
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(20,8,40,0.45)',
    opacity: 0.7,
  },
  pointer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 8,
    shadowColor: WHEEL_COLORS.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  spinRingOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,180,210,0.55)',
  },
  spinRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  spinBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(176,30,90,1)',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  spinBtnPressed: {
    transform: [{ scale: 0.92 }],
  },
  spinBtnDisabled: {
    opacity: 0.96,
  },
  spinLabel: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 1,
    lineHeight: 28,
    color: WHEEL_COLORS.white,
    textShadowColor: 'rgba(120,10,55,0.65)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
  },
  spinLabelSmall: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 2,
    lineHeight: 14,
    color: WHEEL_COLORS.white,
    opacity: 0.92,
    marginTop: -2,
  },
  errorText: {
    marginTop: 16,
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 13,
    color: '#FFE3E3',
    textAlign: 'center',
  },
  challengeOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -110 }],
    zIndex: 20,
  },
  challengeBanner: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 10, 60, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 194, 75, 0.35)',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  challengeBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 194, 75, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBannerText: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 14,
    color: WHEEL_COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export const SpinWheel = React.memo(SpinWheelComponent);
