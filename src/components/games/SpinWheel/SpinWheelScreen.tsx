/* ============================================================
   SpinWheelScreen — screen chrome around <SpinWheel/>.

   Presentational: it receives the real players + the spin RPC from a container
   (Screen → Hook → Service → Supabase, per CODE_RULES.md §8). The container
   resolves avatars through the existing avatar/profile service and passes a
   `requestWinner` bound to the authoritative spin RPC.

   Example container wiring:
     const { players, loading, error, refetch } = useWheelPlayers(sessionId);
     const requestWinner = useCallback(
       () => spinService.requestWinner(sessionId),   // → supabase.rpc('spin_wheel', …)
       [sessionId],
     );
     return (
       <SpinWheelScreen
         players={players} loading={loading} error={error} onRetry={refetch}
         requestWinner={requestWinner} onBack={() => navigation.goBack()}
       />
     );
   ============================================================ */

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  PLAYER_MAX,
  PLAYER_MIN,
  WHEEL_COLORS,
  WHEEL_FONTS,
} from './wheelConfig';
import type { SpinWheelScreenProps } from './types';
import { SpinWheel } from './SpinWheel';
import { useWheelSound } from './useWheelSound';

/* decorative scattered shapes — low-opacity background texture.
   NOTE: this duplicates UI_SYSTEM's DecorativeShapesLayer; replace with your
   shared <AppBackground> if GAME_UI_SYSTEM.md exposes one. */
const SHAPES: ReadonlyArray<{
  xr: number;
  yr: number;
  type: string;
  s: number;
}> = [
  { xr: 40 / 390, yr: 150 / 844, type: 'star', s: 1.3 },
  { xr: 300 / 390, yr: 180 / 844, type: 'plus', s: 1 },
  { xr: 60 / 390, yr: 360 / 844, type: 'dot', s: 1.2 },
  { xr: 330 / 390, yr: 330 / 844, type: 'tri', s: 1.1 },
  { xr: 120 / 390, yr: 560 / 844, type: 'star', s: 1 },
  { xr: 310 / 390, yr: 520 / 844, type: 'ring', s: 1.1 },
  { xr: 40 / 390, yr: 640 / 844, type: 'plus', s: 1.1 },
  { xr: 340 / 390, yr: 700 / 844, type: 'dot', s: 1.3 },
  { xr: 150 / 390, yr: 760 / 844, type: 'tri', s: 0.9 },
  { xr: 70 / 390, yr: 470 / 844, type: 'ring', s: 0.8 },
];

function Shape({ type }: { type: string }): React.JSX.Element {
  const stroke = WHEEL_COLORS.white;
  switch (type) {
    case 'dot':
      return <Circle cx={6} cy={6} r={4} fill={stroke} />;
    case 'star':
      return (
        <Path
          d="M9 1l2 5 5 .4-3.8 3.2 1.2 5L9 17l-4.6 2.6 1.2-5L1.8 6.4 7 6z"
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
        />
      );
    case 'tri':
      return (
        <Path
          d="M9 2 16 15 2 15z"
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
        />
      );
    case 'plus':
      return (
        <Path
          d="M9 2v14M2 9h14"
          stroke={stroke}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      );
    default:
      return (
        <Circle
          cx={9}
          cy={9}
          r={6.5}
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
        />
      );
  }
}

function BgTexture(): React.JSX.Element {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SHAPES.map((sh, i) => {
        const size = 18 * sh.s;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${sh.xr * 100}%`,
              top: `${sh.yr * 100}%`,
              opacity: 0.16,
            }}
          >
            <Svg width={size} height={size} viewBox="0 0 18 18">
              <Shape type={sh.type} />
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

export function SpinWheelScreen({
  players,
  loading,
  error,
  requestWinner,
  onBack,
  onRetry,
  onChangeCount,
  autoSpin,
  canSpin,
  spinKey,
  onResult,
  onGameEnd,
}: SpinWheelScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { playTick, playWin, startTicking, muted, toggleMute } =
    useWheelSound();
  const count = players.length;
  const wheelDisplaySize = Math.min(screenWidth * 0.85, 344);
  const spinSoundStartedRef = React.useRef(false);

  const handleTick = useCallback((): void => {
    if (!spinSoundStartedRef.current) {
      spinSoundStartedRef.current = true;
      startTicking();
      playTick();
    }
  }, [playTick, startTicking]);

  const handleWin = useCallback((): void => {
    spinSoundStartedRef.current = false;
    playWin();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
  }, [playWin]);

  return (
    <View style={styles.root}>
      {/* AppBackground: blue → violet gradient. Swap for your shared
          <AppBackground> if GAME_UI_SYSTEM.md provides one. */}
      <LinearGradient
        colors={WHEEL_COLORS.bgGradient}
        locations={WHEEL_COLORS.bgGradientLocations}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BgTexture />

      {/* top bar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Back'}
          onPress={onBack}
          style={styles.iconBtn}
        >
          <BlurView
            intensity={20}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="chevron-back" size={20} color={WHEEL_COLORS.white} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text
            style={styles.title}
            maxFontSizeMultiplier={1.2}
            accessibilityRole="header"
          >
            {'SPIN TO PLAY'}
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.2}>
            {'WHO GOES FIRST?'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={muted ? 'Unmute sound' : 'Mute sound'}
          accessibilityState={{ selected: muted }}
          onPress={toggleMute}
          style={styles.iconBtn}
        >
          <BlurView
            intensity={20}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name={muted ? 'volume-mute' : 'volume-high'}
            size={20}
            color={WHEEL_COLORS.white}
          />
        </Pressable>
      </View>

      {/* wheel area */}
      <View style={styles.wheelArea}>
        {loading ? (
          <ActivityIndicator size="large" color={WHEEL_COLORS.white} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{"Couldn't load players."}</Text>
            {onRetry ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={'Try again'}
                onPress={onRetry}
                style={styles.retryBtn}
              >
                <Text style={styles.retryLabel}>{'Try again'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : count < PLAYER_MIN ? (
          <Text style={styles.errorTitle}>
            {'Need at least 2 players to spin.'}
          </Text>
        ) : (
          <SpinWheel
            players={players}
            requestWinner={requestWinner}
            onTick={handleTick}
            onWin={handleWin}
            onTickStop={() => {}}
            autoSpin={autoSpin}
            canSpin={canSpin}
            spinKey={spinKey}
            onResult={onResult}
            onGameEnd={onGameEnd}
            size={wheelDisplaySize}
          />
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.playersRow}>
          {players.map((player) => (
            <View key={player.id} style={styles.playerSlot}>
              <View style={styles.playerBubble}>
                {player.avatarUri ? (
                  <Image
                    source={{ uri: player.avatarUri }}
                    style={styles.playerBubbleImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.playerInitial}>
                    {player.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.playerLabel} maxFontSizeMultiplier={1.2}>
                {player.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0a13',
  },
  topbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: 0.5,
    lineHeight: 28,
    color: WHEEL_COLORS.gold,
    textShadowColor: 'rgba(42,27,74,0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0.5,
  },
  subtitle: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 3,
    color: WHEEL_COLORS.white,
    opacity: 0.85,
    marginTop: 4,
  },
  wheelArea: {
    position: 'absolute',
    top: 110,
    bottom: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 14,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepperBtnPressed: {
    transform: [{ translateY: 3 }],
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperSign: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 26,
    lineHeight: 28,
    color: '#9E5DEF',
  },
  count: {
    minWidth: 96,
    textAlign: 'center',
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 16,
    color: WHEEL_COLORS.white,
    textShadowColor: 'rgba(42,27,74,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0.5,
  },
  hint: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.85)',
  },
  errorBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 15,
    color: '#FFE3E3',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: WHEEL_COLORS.coral,
  },
  retryLabel: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 15,
    color: WHEEL_COLORS.white,
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  playerSlot: {
    alignItems: 'center',
  },
  playerBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playerBubbleImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  playerInitial: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 20,
    color: WHEEL_COLORS.white,
  },
  playerLabel: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },
});
