import { StyleSheet } from 'react-native';
import { borderRadius, fonts, fontSize, spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing[8],
    alignItems: 'center',
    marginHorizontal: spacing[5],
  },
  mascotImage: {
    width: 220,
    height: 220,
    marginBottom: spacing[6],
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: spacing[8],
  },
});
