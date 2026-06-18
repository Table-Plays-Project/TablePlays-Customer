import { StyleSheet } from 'react-native';
import { borderRadius, fonts, fontSize, spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  boxFilled: {
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  input: {
    width: '100%',
    height: '100%',
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    color: '#FFFFFF',
    textAlign: 'center',
    padding: 0,
  },
});
