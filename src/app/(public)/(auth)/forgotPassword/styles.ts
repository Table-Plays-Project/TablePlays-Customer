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
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 28,
    letterSpacing: -0.25,
    color: colors.textInverse,
    marginBottom: spacing[1],
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.textInverse,
    marginBottom: spacing[6],
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
  backLink: {
    alignItems: 'center',
    marginTop: spacing[3],
    paddingVertical: spacing[2],
  },
  backLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: colors.textInverse,
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default styles;
