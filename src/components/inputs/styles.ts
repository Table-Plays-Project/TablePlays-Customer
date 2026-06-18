import { StyleSheet } from 'react-native';
import {
  colors,
  borderRadius,
  fonts,
  fontSize,
  spacing,
  shadows,
} from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  errorBorder: {
    borderColor: colors.borderFocus,
    borderWidth: 2,
  },
  errorMessage: {
    color: colors.error,
    fontSize: fontSize.xs,
    fontFamily: fonts.regular,
    marginTop: spacing[1],
  },
  errorMessagePill: {
    color: '#FFD7D7',
    fontSize: fontSize.xs,
    fontFamily: fonts.medium,
    marginTop: spacing[1],
    marginLeft: spacing[2],
  },

  // Standard input — white background screens (settings, dashboard forms)
  formItem: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSubtle,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing[1],
    overflow: 'hidden',
    paddingRight: spacing[3],
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    fontFamily: fonts.regular,
    height: 52,
    includeFontPadding: false,
    paddingLeft: spacing[4],
    color: colors.textPrimary,
  },
  label: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontFamily: fonts.medium,
    marginBottom: spacing[2],
  },

  // Pill input — floating white pill on gradient auth screens
  formItemPill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    marginBottom: spacing[1],
    overflow: 'hidden',
    paddingRight: spacing[4],
    width: '100%',
    ...shadows.sm,
  },
  pillIcon: {
    marginLeft: spacing[4],
  },
  inputPill: {
    flex: 1,
    fontSize: fontSize.base,
    fontFamily: fonts.regular,
    height: 52,
    includeFontPadding: false,
    paddingLeft: spacing[3],
    color: colors.textPrimary,
  },
  inputPillNoIcon: {
    flex: 1,
    fontSize: fontSize.base,
    fontFamily: fonts.regular,
    height: 52,
    includeFontPadding: false,
    paddingLeft: spacing[5],
    color: colors.textPrimary,
  },
});
