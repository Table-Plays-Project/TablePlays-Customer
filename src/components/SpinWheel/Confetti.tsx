/* ============================================================
   Confetti — celebratory burst, rebuilt with react-native-reanimated so no
   extra dependency is needed. Projectile params match the prototype's canvas
   confetti (launch velocity, gravity, rotation, bottom fade).

   A single shared `progress` (0→1) drives every piece; each piece integrates
   its own constant params in a worklet. Tune PIECE_COUNT for device budget.
   ============================================================ */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { WHEEL_COLORS } from './wheelConfig';
import type { ConfettiProps } from './types';

const PIECE_COUNT = 90;
const FRAMES = 150; // prototype ran ~150 integration frames
const DURATION_MS = 2500;
const GRAVITY = 0.32; // per frame, from the prototype

interface PieceParams {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  size: number;
  rot0: number;
  vr: number;
  color: string;
}

interface PieceProps {
  params: PieceParams;
  progress: SharedValue<number>;
  height: number;
}

function ConfettiPiece({
  params,
  progress,
  height,
}: PieceProps): React.JSX.Element {
  const style = useAnimatedStyle(() => {
    const f = progress.value * FRAMES;
    const x = params.x0 + params.vx * f;
    const y = params.y0 + params.vy * f + 0.5 * GRAVITY * f * f;
    const rot = params.rot0 + params.vr * f;

    const fadeZone = height * 0.7;
    const opacity =
      y > fadeZone ? Math.max(0, 1 - (y - fadeZone) / (height * 0.3)) : 1;

    return {
      opacity: progress.value <= 0 || progress.value >= 1 ? 0 : opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rot}rad` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          width: params.size,
          height: params.size * 0.6,
          backgroundColor: params.color,
        },
        style,
      ]}
    />
  );
}

function ConfettiComponent({
  burstKey,
  width,
  height,
  originX = 0.5,
  originY = 0.42,
}: ConfettiProps): React.JSX.Element {
  const progress = useSharedValue(0);

  const pieces = useMemo<PieceParams[]>(() => {
    const cols = WHEEL_COLORS.confetti;
    return Array.from({ length: PIECE_COUNT }, () => ({
      x0: width * originX + (Math.random() - 0.5) * 120,
      y0: height * originY + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 9,
      vy: -7 - Math.random() * 9,
      size: 5 + Math.random() * 7,
      rot0: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.4,
      color: cols[Math.floor(Math.random() * cols.length)],
    }));
    // Re-randomise on each burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstKey, width, height, originX, originY]);

  useEffect(() => {
    if (burstKey <= 0) return;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: DURATION_MS,
      easing: Easing.linear,
    });
  }, [burstKey, progress]);

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { width, height }]}
    >
      {pieces.map((params, i) => (
        <ConfettiPiece
          key={i}
          params={params}
          progress={progress}
          height={height}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 1,
  },
});

export const Confetti = React.memo(ConfettiComponent);
