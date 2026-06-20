import { StyleSheet } from 'react-native';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
} from '@/constants/theme';

const TEXT_SHADOW = {
  textShadowColor: 'rgba(0, 0, 0, 0.3)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 4,
} as const;

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    lineHeight: 32,
    color: colors.textInverse,
    letterSpacing: -0.25,
    ...TEXT_SHADOW,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.ctaSolid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.textInverse,
    ...TEXT_SHADOW,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  menuRowPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.textInverse,
    letterSpacing: 0.2,
    ...TEXT_SHADOW,
  },
  chevron: {
    ...TEXT_SHADOW,
  },
  togglePill: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    minWidth: 56,
    alignItems: 'center',
  },
  togglePillOn: {
    backgroundColor: '#4ADE80',
  },
  togglePillOff: {
    backgroundColor: colors.error,
  },
  togglePillText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    lineHeight: 16,
    color: colors.textInverse,
    letterSpacing: 0.5,
    ...TEXT_SHADOW,
  },
  logoutIconCircle: {
    backgroundColor: colors.errorLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.error,
    letterSpacing: 0.2,
    ...TEXT_SHADOW,
  },
});

export default styles;
