import { StyleSheet } from 'react-native';
import { fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  wrapperLeft: {
    alignItems: 'flex-start',
  },
  layerBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    fontFamily: fonts.wordmark,
    letterSpacing: 0.5,
  },
  offsetUp: { transform: [{ translateY: -2.5 }] },
  offsetDown: { transform: [{ translateY: 2.5 }] },
  offsetLeft: { transform: [{ translateX: -2.5 }] },
  offsetRight: { transform: [{ translateX: 2.5 }] },
  offsetUpLeft: { transform: [{ translateX: -2.5 }, { translateY: -2.5 }] },
  offsetUpRight: { transform: [{ translateX: 2.5 }, { translateY: -2.5 }] },
  offsetDownLeft: { transform: [{ translateX: -2.5 }, { translateY: 2.5 }] },
  offsetDownRight: { transform: [{ translateX: 2.5 }, { translateY: 2.5 }] },
  fillLayer: {
    fontFamily: fonts.wordmark,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 4,
  },
});
