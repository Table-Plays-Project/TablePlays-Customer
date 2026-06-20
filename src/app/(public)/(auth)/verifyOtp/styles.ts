import { StyleSheet } from 'react-native';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '@/constants/theme';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[8],
  },
  backButton: {
    marginBottom: spacing[4],
  },
  titleWrap: {
    marginBottom: spacing[6],
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.textInverse,
    marginBottom: spacing[8],
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  errorBanner: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.textInverse,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: spacing[4],
  },
  resendText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.ctaSolid,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resendDisabledText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.textInverse,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resendCountdown: {
    fontFamily: fonts.bold,
    color: colors.wordmarkFill,
    fontVariant: ['tabular-nums'],
  },
  spamHint: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    lineHeight: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: spacing[4],
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default styles;
