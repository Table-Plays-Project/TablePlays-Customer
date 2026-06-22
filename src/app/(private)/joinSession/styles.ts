import { StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing } from '@/constants/theme';

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
    paddingBottom: spacing[10],
  },
  header: {
    marginBottom: spacing[4],
  },
  headingWrap: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  errorBanner: {
    backgroundColor: colors.error,
    borderRadius: 14,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
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
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[5],
    gap: spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
  },
});

export default styles;
