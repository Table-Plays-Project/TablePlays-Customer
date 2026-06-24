/* ============================================================
   SpinWheel — single source of truth for colours, geometry, motion.
   Sampled 1:1 from the Claude Design prototype (TablePlays_Spin_Wheel.html).

   NOTE: per CODE_RULES.md no component hardcodes colours — they all read
   from here. When GAME_UI_SYSTEM.md is available, move WHEEL_COLORS into the
   game theme tokens and import them here instead of re-declaring, so this file
   becomes a thin geometry/motion layer over the shared palette.
   ============================================================ */

export const WHEEL_COLORS = {
  // App background gradient (linear-gradient(176deg, blue → mid → violet))
  bgGradient: ['#3D6AE9', '#6A5DF0', '#9E5DEF'] as const,
  bgGradientLocations: [0, 0.52, 1] as const,
  bgGradientAngleDeg: 176,

  // Brand
  coral: '#FF6B6B',
  coralLight: '#FF8E8E',
  pink: '#FF5CA8',
  pinkDeep: '#C53C82', // pressed shadow on "Spin Again"
  ink: '#2A1B4A', // dark outline / shadow ink
  labelStroke: '#B83A57', // stroke around names + winner name

  // Gold (pointer, ring, winner avatar halo)
  goldLight: '#FFE9A8',
  gold: '#FFC24B',
  goldDeep: '#C9871C',
  goldRingStops: [
    '#B9781A',
    '#FFE9A8',
    '#E7A92E',
    '#B9781A',
    '#FFE9A8',
    '#C98B1F',
    '#FFE08A',
    '#A86A14',
    '#B9781A',
  ] as const,
  goldRingStopOffsets: [0, 0.12, 0.25, 0.38, 0.52, 0.66, 0.8, 0.92, 1] as const,

  // Pointer vertical gradient
  pointerGradient: ['#FFE9A8', '#FFC24B', '#D2901F'] as const,
  pointerStroke: '#9A6610',
  pointerDot: '#FF6B6B',

  white: '#FFFFFF',

  // Segment faces — [centre (lighter), rim (darker)] → radial dome
  faces: [
    ['#FF8C8C', '#FF6B6B'], // coral
    ['#FFD88A', '#FFC24B'], // gold
    ['#C79BFF', '#A86BF0'], // soft purple
    ['#FF93C4', '#FF5CA8'], // pink
    ['#FFAE7E', '#FF8E53'], // orange
    ['#F58AD2', '#E96AC0'], // magenta
  ] as ReadonlyArray<readonly [string, string]>,

  // Per-player avatar fallback gradients (used behind initials when no image)
  avatarFallbackGradients: [
    ['#FF9A6B', '#FF6B6B'],
    ['#FFD279', '#FFB02E'],
    ['#C79BFF', '#9E5DEF'],
    ['#FF92BD', '#FF5CA8'],
    ['#7FE3C0', '#23B89A'],
    ['#7AB6FF', '#3D6AE9'],
  ] as ReadonlyArray<readonly [string, string]>,

  // Strokes inside the wheel
  sliceStroke: 'rgba(120,40,30,0.22)',
  nameStroke: 'rgba(150,40,70,0.55)',

  confetti: [
    '#FF6B6B',
    '#FFC24B',
    '#A86BF0',
    '#FF5CA8',
    '#FF8E53',
    '#23B89A',
    '#FFFFFF',
  ] as const,
} as const;

/* ---- geometry (matches the prototype's SVG viewBox exactly) ---- */
export const WHEEL_GEOMETRY = {
  VIEWBOX: 400,
  CENTER: 200,
  FACE_RADIUS: 180,
  AVATAR_RADIUS_RATIO: 0.78, // radial position of avatar centre
  NAME_RADIUS_RATIO: 0.55, // radial position of name
  DEFAULT_DISPLAY_SIZE: 344, // .wheel-wrap width/height in the prototype

  // ratios of the display size (derived from the prototype CSS)
  RING_THICKNESS_RATIO: 13 / 344,
  SPIN_BTN_RATIO: 104 / 344,
  POINTER_W_RATIO: 46 / 344,
  POINTER_H_RATIO: 56 / 344,
} as const;

/* avatar + name font sizing by player count (from buildWheel()) */
export function avatarRadiusForCount(count: number): number {
  if (count <= 3) return 30;
  if (count <= 4) return 26;
  return 23;
}
export function nameSizeForCount(count: number): number {
  if (count <= 3) return 18;
  if (count <= 5) return 15;
  return 13;
}

/* ---- motion spec (transferable to react-native-reanimated) ---- */
export const WHEEL_MOTION = {
  DURATION_MS: 10000,
  EASING_TYPE: 'inOutCubic' as const,
  MIN_TURNS: 14,
  MAX_TURNS: 18,
  JITTER_RATIO: 0.42, // jitter = (rand-0.5) * seg * 0.42  → stays inside slice
  TICK_MIN_INTERVAL_MS: 100,
  REDUCED_MOTION_DURATION_MS: 600, // honours OS "reduce motion"

  WINNER_MODAL_DELAY_MS: 520, // prototype: modal appears 520ms after spin ends
  RESPIN_DELAY_MS: 300, // "Spin Again" → closeModal → spin after 300ms
} as const;

/* ---- fonts ----
   The prototype uses 'Baloo 2' (display) + 'Nunito' (body). Baloo 2 is already
   in the project (@expo-google-fonts/baloo-2). Nunito would be a NEW font dep —
   only add it if GAME_UI_SYSTEM.md mandates it; otherwise point `body` at your
   existing body family (e.g. DMSans_700Bold). */
export const WHEEL_FONTS = {
  display: 'Baloo2_800ExtraBold',
  displaySemi: 'Baloo2_600SemiBold',
  body: 'DMSans_700Bold',
} as const;

export const PLAYER_MIN = 2;
export const PLAYER_MAX = 4;
