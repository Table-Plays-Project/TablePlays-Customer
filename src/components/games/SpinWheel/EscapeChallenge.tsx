import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ReduceMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { WHEEL_COLORS, WHEEL_FONTS, ESCAPE_CHALLENGE } from './wheelConfig';

interface EscapeChallengeProps {
  start: number;
  step: number;
  deadline: string;
  playerName: string;
  onAnswer: (value: number) => void;
}

const TIMEOUT_SENTINEL = -1;
const INTRO_DURATION_MS = 2500;

function generateOptions(start: number, step: number): number[] {
  const correct = start + step * 3;
  const distractors = new Set<number>();
  [correct - step, correct + step].forEach((c) => {
    if (c > 0 && c !== correct) distractors.add(c);
  });
  let guard = 0;
  while (distractors.size < 3 && guard < 20) {
    guard += 1;
    const offset = 1 + Math.floor(Math.random() * Math.max(step - 1, 1));
    const sign = Math.random() < 0.5 ? -1 : 1;
    const candidate = correct + sign * offset;
    if (candidate > 0 && candidate !== correct && !distractors.has(candidate)) {
      distractors.add(candidate);
    }
  }
  const options = [correct, ...Array.from(distractors).slice(0, 3)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

export default function EscapeChallenge({
  start,
  step,
  deadline,
  playerName,
  onAnswer,
}: EscapeChallengeProps): React.JSX.Element {
  const optionsKey = `${start}-${step}-${deadline}`;
  const options = useMemo(() => generateOptions(start, step), [optionsKey]);
  const sequence = useMemo(
    () => [start, start + step, start + step * 2],
    [start, step],
  );

  const [phase, setPhase] = useState<'intro' | 'question'>('intro');
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(ESCAPE_CHALLENGE.TIME_LIMIT_MS / 1000),
  );
  const [answered, setAnswered] = useState(false);
  const timedOutRef = useRef(false);
  const questionStartRef = useRef<number | null>(null);

  // Heartbeat sound — plays during question phase, stops on answer/timeout
  const soundRef = useRef<{
    playAsync: () => Promise<unknown>;
    stopAsync: () => Promise<unknown>;
    setIsLoopingAsync: (loop: boolean) => Promise<unknown>;
    unloadAsync: () => Promise<unknown>;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { Audio } = await import('expo-av');
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/heartbeat.mp3'),
          { shouldPlay: false, volume: 1.0, isLooping: true },
        );
        if (mounted) soundRef.current = sound;
      } catch {
        // Sound unavailable — haptic only
      }
    })();
    return () => {
      mounted = false;
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase === 'question' && !answered) {
      soundRef.current?.playAsync().catch(() => {});
    } else {
      soundRef.current?.stopAsync().catch(() => {});
    }
  }, [phase, answered]);

  // Haptic pulse — gets faster as time runs out (question phase only)
  const hapticRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== 'question' || answered) {
      if (hapticRef.current) clearInterval(hapticRef.current);
      return;
    }
    const interval = secondsLeft <= 1 ? 300 : secondsLeft <= 2 ? 450 : secondsLeft <= 3 ? 600 : 800;
    if (hapticRef.current) clearInterval(hapticRef.current);
    hapticRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, interval);
    return () => {
      if (hapticRef.current) clearInterval(hapticRef.current);
    };
  }, [phase, secondsLeft, answered]);

  // Intro phase → question phase transition
  useEffect(() => {
    setPhase('intro');
    setAnswered(false);
    timedOutRef.current = false;
    questionStartRef.current = null;
    setSecondsLeft(Math.ceil(ESCAPE_CHALLENGE.TIME_LIMIT_MS / 1000));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );

    const introTimer = setTimeout(() => {
      setPhase('question');
      questionStartRef.current = Date.now();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, INTRO_DURATION_MS);

    return () => clearTimeout(introTimer);
  }, [deadline]);

  // Question countdown — starts ONLY when phase === 'question'
  useEffect(() => {
    if (phase !== 'question') return;
    const interval = setInterval(() => {
      if (!questionStartRef.current) return;
      const elapsed = Date.now() - questionStartRef.current;
      const remaining = Math.max(
        0,
        Math.ceil((ESCAPE_CHALLENGE.TIME_LIMIT_MS - elapsed) / 1000),
      );
      setSecondsLeft(remaining);
    }, 200);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-timeout
  useEffect(() => {
    if (
      phase === 'question' &&
      secondsLeft <= 0 &&
      !timedOutRef.current &&
      !answered
    ) {
      timedOutRef.current = true;
      setAnswered(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      onAnswer(TIMEOUT_SENTINEL);
    }
  }, [phase, secondsLeft, answered, onAnswer]);

  // Pulse animation for timer
  const timerScale = useSharedValue(1);
  useEffect(() => {
    if (phase === 'question') {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 350, reduceMotion: ReduceMotion.Never }),
          withTiming(1, { duration: 350, reduceMotion: ReduceMotion.Never }),
        ),
        -1,
        true,
      );
    }
  }, [phase, timerScale]);

  const timerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  const handlePress = useCallback(
    (value: number): void => {
      if (answered || phase !== 'question') return;
      setAnswered(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      onAnswer(value);
    },
    [answered, phase, onAnswer],
  );

  const timerColor =
    secondsLeft <= 1 ? '#FF4444' : secondsLeft <= 2 ? WHEEL_COLORS.gold : '#FFFFFF';

  // ========== INTRO PHASE ==========
  if (phase === 'intro') {
    return (
      <View style={styles.fullScreen}>
        <LinearGradient
          colors={WHEEL_COLORS.bgGradient}
          locations={WHEEL_COLORS.bgGradientLocations}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          entering={FadeIn.duration(400).reduceMotion(ReduceMotion.Never)}
          style={styles.introContent}
        >
          <Image
            source={require('@/assets/images/success-star.gif')}
            style={styles.introStar}
            resizeMode="contain"
          />
          <Text style={styles.introTitle}>SURVIVAL</Text>
          <Text style={styles.introTitle}>CHALLENGE</Text>
          <View style={styles.introDivider} />
          <Text style={styles.introPlayerName}>{playerName}</Text>
          <Text style={styles.introSubtitle}>you have been chosen!</Text>
          <Text style={styles.introReady}>Get ready...</Text>
        </Animated.View>
      </View>
    );
  }

  // ========== QUESTION PHASE ==========
  return (
    <View style={styles.fullScreen}>
      <LinearGradient
        colors={WHEEL_COLORS.bgGradient}
        locations={WHEEL_COLORS.bgGradientLocations}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Timer */}
      <Animated.View
        entering={FadeInDown.duration(300).reduceMotion(ReduceMotion.Never)}
        style={styles.timerSection}
      >
        <Text style={styles.timerLabel}>TIME LEFT</Text>
        <Animated.View style={[styles.timerCircle, timerAnimStyle]}>
          <Text style={[styles.timerText, { color: timerColor }]}>
            {secondsLeft}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Question card */}
      <Animated.View
        entering={FadeIn.duration(400).delay(100).reduceMotion(ReduceMotion.Never)}
        style={styles.questionCard}
      >
        <Text style={styles.questionLabel}>WHAT COMES NEXT?</Text>
        <View style={styles.sequenceRow}>
          {sequence.map((n, i) => (
            <View key={`${i}-${n}`} style={styles.sequenceBubble}>
              <Text style={styles.sequenceText}>{n}</Text>
            </View>
          ))}
          <Ionicons
            name="arrow-forward"
            size={20}
            color="rgba(109, 74, 255, 0.5)"
          />
          <View style={styles.questionBubble}>
            <Text style={styles.questionMark}>?</Text>
          </View>
        </View>
      </Animated.View>

      {/* Answers */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(200).reduceMotion(ReduceMotion.Never)}
        style={styles.answersSection}
      >
        <Text style={styles.answersLabel}>PICK YOUR ANSWER</Text>
        <View style={styles.answersGrid}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              accessibilityRole="button"
              accessibilityLabel={`Answer ${opt}`}
              accessibilityState={{ disabled: answered }}
              disabled={answered}
              style={({ pressed }) => [
                styles.answerBtn,
                pressed && !answered && styles.answerBtnPressed,
                answered && styles.answerBtnDisabled,
              ]}
              onPress={() => handlePress(opt)}
            >
              <Text style={styles.answerText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    paddingHorizontal: 24,
  },

  // ---- INTRO ----
  introContent: {
    alignItems: 'center',
    gap: 4,
  },
  introStar: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  introTitle: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 38,
    lineHeight: 46,
    color: WHEEL_COLORS.gold,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  introDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: WHEEL_COLORS.gold,
    marginVertical: 14,
  },
  introPlayerName: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 36,
    color: WHEEL_COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  introSubtitle: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  introReady: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 15,
    color: WHEEL_COLORS.gold,
    marginTop: 24,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ---- TIMER ----
  timerSection: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  timerLabel: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timerCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 36,
    lineHeight: 42,
  },

  // ---- QUESTION CARD (white/glass) ----
  questionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 18,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  questionLabel: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 13,
    color: '#6D4AFF',
    letterSpacing: 2,
  },
  sequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sequenceBubble: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F4F3F8',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequenceText: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
    color: '#161A2E',
  },
  questionBubble: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#6D4AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D4AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  questionMark: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 30,
    color: WHEEL_COLORS.white,
  },

  // ---- ANSWERS (green buttons) ----
  answersSection: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  answersLabel: {
    fontFamily: WHEEL_FONTS.body,
    fontWeight: '700',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  answerBtn: {
    width: '46%',
    height: 62,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  answerBtnPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  answerBtnDisabled: {
    opacity: 0.3,
  },
  answerText: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 30,
    color: WHEEL_COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
