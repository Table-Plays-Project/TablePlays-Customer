import { StyleSheet } from 'react-native';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';

const SLOT_SIZE = 68;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[10],
    alignItems: 'center',
  },
  backRow: {
    alignSelf: 'flex-start',
  },
  headingWrap: {
    marginBottom: spacing[8],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[8],
    paddingHorizontal: spacing[2],
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: borderRadius.full,
    backgroundColor: colors.ctaSolid,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  slotStamped: {
    backgroundColor: 'rgba(200, 50, 90, 1)',
  },
  slotEmpty: {
    opacity: 0.6,
  },
  stampNumber: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textInverse,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  plusIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaSection: {
    width: '100%',
    gap: 0,
  },
});

export default styles;
