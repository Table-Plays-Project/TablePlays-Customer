/* ============================================================
   WinnerModal — result card over a blurred scrim.
   Entrance matches the prototype: scrim fades (300ms) and the card springs
   scale .8→1 / translateY 10→0 on a cubic-bezier(.2,1.5,.4,1) curve (350ms).
   ============================================================ */

import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { WHEEL_COLORS, WHEEL_FONTS } from './wheelConfig';
import type { WinnerModalProps } from './types';

const AVATAR_SIZE = 108;

function FallbackAvatar({ index }: { index: number }): React.JSX.Element {
  const [g0, g1] =
    WHEEL_COLORS.avatarFallbackGradients[
      index % WHEEL_COLORS.avatarFallbackGradients.length
    ];
  return (
    <Svg width={AVATAR_SIZE} height={AVATAR_SIZE} viewBox="0 0 108 108">
      <Defs>
        <RadialGradient id="winAva" cx="0.5" cy="0.32" r="0.85">
          <Stop offset="0" stopColor={g0} />
          <Stop offset="1" stopColor={g1} />
        </RadialGradient>
      </Defs>
      <Circle cx={54} cy={54} r={54} fill="url(#winAva)" />
    </Svg>
  );
}

function WinnerModalComponent({
  visible,
  winner,
  onSpinAgain,
  onClose,
  canSpin = true,
  billAmount,
}: WinnerModalProps): React.JSX.Element | null {
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 350 : 250,
      easing: Easing.bezier(0.2, 1.5, 0.4, 1),
    });
  }, [visible, shown]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: shown.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [
      { scale: 0.8 + 0.2 * shown.value },
      { translateY: 10 * (1 - shown.value) },
    ],
  }));

  if (!winner) return null;

  const initials = winner.name.slice(0, 1).toUpperCase();
  // Stable index for fallback gradient selection.
  const idx =
    Math.abs(hashString(winner.id)) %
    WHEEL_COLORS.avatarFallbackGradients.length;

  return (
    <Animated.View
      style={[styles.scrim, scrimStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
      {canSpin ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={'Dismiss'}
        />
      ) : null}

      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.crown}>{'★  PAYS THE BILL  ★'}</Text>

        <View style={styles.avatarHalo}>
          <View style={styles.avatarInner}>
            {winner.avatarUri ? (
              <Image
                source={{ uri: winner.avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <>
                <FallbackAvatar index={idx} />
                <Text style={styles.avatarInitials}>{initials}</Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {winner.name}
        </Text>
        <Text style={styles.sub}>
          {billAmount && billAmount > 0
            ? `PAYS ${billAmount % 1 === 0 ? billAmount : billAmount.toFixed(2)}`
            : 'PAYS THE BILL!'}
        </Text>

        {canSpin ? (
          <Pressable
            style={({ pressed }) => [
              styles.again,
              pressed && styles.againPressed,
            ]}
            onPress={onSpinAgain}
            accessibilityRole="button"
            accessibilityLabel="Spin Again"
          >
            <Text style={styles.againLabel} maxFontSizeMultiplier={1.2}>
              {'Spin Again'}
            </Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.waitingLabel} maxFontSizeMultiplier={1.2}>
              {'Waiting for host...'}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.leaveBtn,
                pressed && styles.leaveBtnPressed,
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Leave Game"
            >
              <Text style={styles.leaveLabel}>{'Leave Game'}</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18,8,40,0.55)',
  },
  card: {
    width: 280,
    paddingTop: 30,
    paddingHorizontal: 26,
    paddingBottom: 26,
    borderRadius: 34,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: WHEEL_COLORS.ink,
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 24,
  },
  crown: {
    fontFamily: WHEEL_FONTS.displaySemi,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 3,
    color: '#9E5DEF',
  },
  avatarHalo: {
    width: AVATAR_SIZE + 16,
    height: AVATAR_SIZE + 16,
    borderRadius: (AVATAR_SIZE + 16) / 2,
    backgroundColor: WHEEL_COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  avatarInner: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    backgroundColor: WHEEL_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarInitials: {
    position: 'absolute',
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 42,
    color: WHEEL_COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  name: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 30,
    color: WHEEL_COLORS.coral,
    marginTop: 6,
  },
  sub: {
    fontFamily: WHEEL_FONTS.displaySemi,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 2,
    color: '#9E5DEF',
    marginTop: 2,
  },
  again: {
    marginTop: 20,
    width: '100%',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHEEL_COLORS.coral,
    shadowColor: WHEEL_COLORS.pinkDeep,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  againPressed: {
    transform: [{ translateY: 5 }],
    shadowOffset: { width: 0, height: 2 },
  },
  leaveBtn: {
    marginTop: 16,
    width: '100%',
    height: 48,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#F3F3F5',
    borderWidth: 1,
    borderColor: '#E0E0E4',
  },
  leaveBtnPressed: {
    backgroundColor: '#E8E8EC',
    transform: [{ scale: 0.98 }],
  },
  leaveLabel: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
    color: '#666',
  },
  waitingLabel: {
    fontFamily: WHEEL_FONTS.displaySemi,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
    color: '#9E5DEF',
    marginTop: 20,
    textAlign: 'center',
  },
  againLabel: {
    fontFamily: WHEEL_FONTS.display,
    fontWeight: '800',
    fontSize: 19,
    letterSpacing: 0.5,
    color: WHEEL_COLORS.white,
    textShadowColor: 'rgba(120,10,55,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
});

export const WinnerModal = React.memo(WinnerModalComponent);
