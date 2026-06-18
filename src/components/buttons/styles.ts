import { StyleSheet, ViewStyle } from 'react-native';
import {
  colors,
  borderRadius,
  fonts,
  fontSize,
  spacing,
  shadows,
} from '@/constants/theme';

const pillWrapper: ViewStyle = {
  width: '100%',
  marginBottom: spacing[5],
  borderRadius: borderRadius.full,
  overflow: 'hidden',
};

export const buttonStyles = StyleSheet.create({
  // Primary gradient CTA wrapper (Pressable) — gradient lives inside `action`
  wrapper: pillWrapper,
  disabledWrapper: {
    opacity: 0.6,
  },
  pressedWrapper: {
    opacity: 0.85,
  },
  action: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  actionText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.2,
    // Required, not decorative: white text directly on ctaStart measures 2.28:1 (fails AA).
    // This shadow is what brings it to a passing contrast.
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Secondary outlined pill button (used on gradient screens)
  secondary: {
    ...pillWrapper,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.textInverse,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  secondaryText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.2,
  },

  // Back / navigation circular button — translucent on gradient backgrounds
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: borderRadius.full,
    marginBottom: spacing[4],
    padding: spacing[3],
  },
  backButtonDisabled: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    marginBottom: spacing[4],
    padding: spacing[3],
  },
  arrowBackIcon: {
    color: colors.textInverse,
  },

  // White pill "Continue with Google" button (gradient screens)
  google: {
    ...pillWrapper,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.textInverse,
    ...shadows.sm,
  },
  googleText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.2,
  },
});
