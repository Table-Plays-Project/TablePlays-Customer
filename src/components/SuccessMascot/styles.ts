import { StyleSheet } from 'react-native';
import { fonts, fontSize as fs, spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing[5],
  },
  mascotImage: {
    width: 320,
    height: 320,
  },
  headingWrap: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: fs.base,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    lineHeight: 22,
  },
  buttonWrap: {
    width: '100%',
    paddingHorizontal: spacing[4],
  },
});
