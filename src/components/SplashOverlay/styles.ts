import { StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';

const HANDS_IMAGE_ASPECT_RATIO = 373 / 239;

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
  handsImageWrap: {
    width: '130%',
    aspectRatio: HANDS_IMAGE_ASPECT_RATIO,
  },
  handsImage: {
    width: '100%',
    height: '100%',
  },
});
