import { StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    gap: spacing[3],
  },
  wordmarkBlock: {
    alignItems: 'center',
  },
  handsWrap: {
    width: '130%',
    aspectRatio: 1080 / 734,
  },
  handsImage: {
    width: '100%',
    height: '100%',
  },
});
