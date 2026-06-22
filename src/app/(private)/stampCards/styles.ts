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
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[10],
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    lineHeight: 32,
    letterSpacing: -0.25,
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing[6],
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardList: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  ticket: {
    backgroundColor: colors.ctaSolid,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 100,
  },
  ticketPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  ticketLeft: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  barcodeContainer: {
    width: 16,
    height: 60,
    justifyContent: 'space-between',
  },
  barcodeBar: {
    width: '100%',
    borderRadius: 1,
  },
  forYouText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    lineHeight: 14,
    letterSpacing: 1,
    color: colors.textInverse,
    textTransform: 'uppercase',
    transform: [{ rotate: '-90deg' }],
    width: 60,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ticketRight: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[5],
  },
  stampCardLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    lineHeight: 18,
    letterSpacing: 0.5,
    color: 'rgba(255, 255, 255, 0.85)',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  restaurantName: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textInverse,
    marginTop: spacing[1],
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomAction: {
    marginTop: spacing[4],
  },
});

export default styles;
