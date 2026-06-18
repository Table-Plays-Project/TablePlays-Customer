import { StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

export const styles = StyleSheet.create({
  // Sizing is intentionally redundant (flex + 100% width/height) rather than
  // relying solely on flex:1 propagating through every ancestor. On native,
  // Yoga always resolves flex:1 against the device screen; on web, flex:1
  // only resolves if every ancestor in the chain is an active flex container.
  // 100% width/height works against any layout mode the ancestor uses,
  // so this stays correct regardless of how React Navigation's web screen
  // container is implemented.
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  // Solid fallback in the gradient's own starting color, painted first.
  // If the LinearGradient layer ever fails to apply its CSS background-image
  // on web (load-order, missing layout measurement, etc.), this guarantees
  // the screen still shows the correct brand color instead of falling back
  // to a blank/white screen.
  gradientFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gradientStart,
  },
  // Faint texture overlay only — the vibrant gradient underneath carries the brand color.
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gradientOverlay,
  },
});
