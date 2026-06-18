export const colors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundSubtle: '#F4F3F8',

  // Primary — vibrant violet to blue
  primary: '#6D4AFF',
  primaryLight: '#EDE9FF',
  primaryDark: '#4F30D6',

  // Gradient — signature TablePlays hero gradient. BLUE top → VIOLET bottom, vertical.
  gradientStart: '#3D6AE9',
  gradientEnd: '#9E5DEF',
  gradientOverlay: 'rgba(20, 10, 60, 0.08)',

  // Secondary — deep navy
  secondary: '#161A2E',
  secondaryLight: '#2A2F4A',

  // CTA accent — coral to pink, LEFT to RIGHT.
  // White text on ctaStart alone is 2.28:1 (fails AA) — always pair with the
  // required text-shadow (see buttons/styles.ts `actionText`), never use ctaStart bare.
  ctaStart: '#FE8A8A',
  ctaEnd: '#FD447E',
  ctaSolid: '#FD5E81',

  // Accent — warm gold
  accent: '#E0A000',
  accentLight: '#FFF3CC',

  // Neutrals
  textPrimary: '#161A2E',
  textSecondary: '#5B6472',
  textMuted: '#767F8C',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#15803D',
  successLight: '#DCFCE7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#B45309',
  warningLight: '#FEF3C7',

  // Game specific
  potatoHot: '#FD5E81',
  potatoExplode: '#DC2626',
  mathChallenge: '#161A2E',
  eliminated: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#6D4AFF',

  // Wordmark — bubble-letter "TablePlays" treatment only, never used for
  // body text or other headings. Coral fill with a darker orange-red outline.
  wordmarkFill: '#FF8283',
  wordmarkOutline: '#E85D4A',
} as const;

export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  // Chunky rounded display font — reserved for the "TablePlays" wordmark only.
  wordmark: 'Baloo2_800ExtraBold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
  '5xl': 52,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#1A1F36',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1F36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1F36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
