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
  headerSpacer: {
    width: 44,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  gameCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(244,115,106,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(244,115,106,0.85)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  gameCardDisabled: {
    opacity: 0.55,
  },
  gameCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gameLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.textInverse,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    ...TEXT_SHADOW,
  },
  gameLabelDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.sm,
    paddingVertical: 2,
    paddingHorizontal: spacing[2],
  },
  comingSoonText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    lineHeight: 14,
    color: colors.textInverse,
    letterSpacing: 1,
  },
});

export default styles;
