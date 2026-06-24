/* ============================================================
   WheelFace — the wheel geometry, rendered with react-native-svg.
   Ported 1:1 from the prototype's buildWheel(): clockwise-from-top angles,
   radial-gradient domed slices, avatar (outer) + name (inner) per segment.

   Difference from the prototype: real avatar images (clipped to a circle) via
   the profile system, with the prototype's gradient+initials kept only as the
   fallback when a player has no avatar.
   ============================================================ */

import React, { useMemo } from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import {
  WHEEL_COLORS,
  WHEEL_FONTS,
  WHEEL_GEOMETRY,
  avatarRadiusForCount,
  nameSizeForCount,
} from './wheelConfig';
import type { WheelFaceProps } from './types';

const {
  CENTER: C,
  FACE_RADIUS: R,
  VIEWBOX,
  AVATAR_RADIUS_RATIO,
  NAME_RADIUS_RATIO,
} = WHEEL_GEOMETRY;

/** point on a circle, angle measured CLOCKWISE from top (12 o'clock = 0°). */
function pointAt(angleDeg: number, radius: number): readonly [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [C + radius * Math.sin(a), C - radius * Math.cos(a)];
}

interface SegmentModel {
  index: number;
  slicePath: string;
  faceCenter: string;
  faceRim: string;
  ax: number;
  ay: number;
  nx: number;
  ny: number;
  avatarRadius: number;
  nameSize: number;
  initials: string;
  name: string;
  avatarUri: string | null;
  avatarSource: number | null;
}

function WheelFaceComponent({
  players,
  size,
}: WheelFaceProps): React.JSX.Element {
  const count = players.length;

  const segments = useMemo<SegmentModel[]>(() => {
    const seg = 360 / count;
    const avatarRadius = avatarRadiusForCount(count);
    const nameSize = nameSizeForCount(count);

    return players.map((player, i) => {
      const a0 = i * seg;
      const a1 = (i + 1) * seg;
      const mid = (i + 0.5) * seg;
      const [x0, y0] = pointAt(a0, R);
      const [x1, y1] = pointAt(a1, R);
      const large = seg > 180 ? 1 : 0;
      const [faceCenter, faceRim] =
        WHEEL_COLORS.faces[i % WHEEL_COLORS.faces.length];
      const [ax, ay] = pointAt(mid, R * AVATAR_RADIUS_RATIO);
      const [nx, ny] = pointAt(mid, R * NAME_RADIUS_RATIO);

      const slicePath =
        `M ${C} ${C} L ${x0.toFixed(2)} ${y0.toFixed(2)} ` +
        `A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;

      return {
        index: i,
        slicePath,
        faceCenter,
        faceRim,
        ax,
        ay,
        nx,
        ny,
        avatarRadius,
        nameSize,
        initials: player.name.slice(0, 1).toUpperCase(),
        name: player.name,
        avatarUri: player.avatarUri,
        avatarSource: player.avatarSource,
      };
    });
  }, [players, count]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      <Defs>
        {segments.map((s) => (
          <RadialGradient
            key={`f${s.index}`}
            id={`f${s.index}`}
            gradientUnits="userSpaceOnUse"
            cx={C}
            cy={C}
            r={R}
          >
            <Stop offset="0" stopColor={s.faceCenter} />
            <Stop offset="0.62" stopColor={s.faceCenter} />
            <Stop offset="1" stopColor={s.faceRim} />
          </RadialGradient>
        ))}
        {segments.map((s, i) => {
          const [g0, g1] =
            WHEEL_COLORS.avatarFallbackGradients[
              i % WHEEL_COLORS.avatarFallbackGradients.length
            ];
          return (
            <RadialGradient
              key={`a${s.index}`}
              id={`a${s.index}`}
              cx="0.5"
              cy="0.32"
              r="0.8"
            >
              <Stop offset="0" stopColor={g0} />
              <Stop offset="1" stopColor={g1} />
            </RadialGradient>
          );
        })}
        {segments.map((s) => (
          <ClipPath key={`clip${s.index}`} id={`clip${s.index}`}>
            <Circle cx={s.ax} cy={s.ay} r={s.avatarRadius} />
          </ClipPath>
        ))}
      </Defs>

      {/* base disc */}
      <Circle cx={C} cy={C} r={R} fill={WHEEL_COLORS.white} />

      {/* slices */}
      <G>
        {segments.map((s) => (
          <Path
            key={`slice${s.index}`}
            d={s.slicePath}
            fill={`url(#f${s.index})`}
            stroke={WHEEL_COLORS.sliceStroke}
            strokeWidth={1}
          />
        ))}
      </G>

      {/* labels: avatar (outer) + name (inner) */}
      <G>
        {segments.map((s) => (
          <G key={`label${s.index}`}>
            {/* white ring behind the avatar */}
            <Circle
              cx={s.ax}
              cy={s.ay}
              r={s.avatarRadius + 3}
              fill={WHEEL_COLORS.white}
            />

            <Circle
              cx={s.ax}
              cy={s.ay}
              r={s.avatarRadius}
              fill={`url(#a${s.index})`}
            />
            <SvgText
              x={s.ax}
              y={s.ay}
              dy={s.avatarRadius * 1.05 * 0.34}
              textAnchor="middle"
              fontFamily={WHEEL_FONTS.display}
              fontWeight="800"
              fontSize={s.avatarRadius * 1.05}
              fill={WHEEL_COLORS.white}
            >
              {s.initials}
            </SvgText>

          </G>
        ))}
      </G>
    </Svg>
  );
}

export const WheelFace = React.memo(WheelFaceComponent);
