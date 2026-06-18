import { StyleSheet } from 'react-native';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '@/constants/theme';

const loginPageStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  titleWrap: {
    marginBottom: spacing[2],
  },
  subtitleText: {
    fontFamily: fonts.wordmark,
    fontSize: fontSize.xl,
    color: colors.wordmarkFill,
    alignSelf: 'flex-start',
    marginLeft: spacing[1],
    marginBottom: spacing[6],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing[5],
    marginTop: -spacing[2],
  },
  forgotPasswordText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  registerPrompt: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  registerLink: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.wordmarkFill,
    marginLeft: spacing[1],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dividerText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textInverse,
    marginHorizontal: spacing[3],
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  signUpPrompt: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textInverse,
  },
  signUpLink: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.textInverse,
    marginLeft: spacing[1],
    textDecorationLine: 'underline',
  },
  errorBanner: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    color: colors.textInverse,
    flex: 1,
  },
});

export default loginPageStyles;
