import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';

import { styles } from './styles';

type SplashOverlayProps = {
  onFinish: () => void;
};

const SPLASH_FONT_SIZE = 64;

function formatWordmark(name: string): string {
  if (name.includes(' ')) {
    return name.replace(' ', '\n');
  }
  const camelMatch = name.match(/^([A-Z][a-z]*)([A-Z].*)$/);
  if (camelMatch) {
    return `${camelMatch[1]}\n${camelMatch[2]}`;
  }
  return name;
}

export default function SplashOverlay({
  onFinish,
}: SplashOverlayProps): JSX.Element {
  const { t } = useTranslation();
  const wordmark = formatWordmark(t('pages.signIn.appName'));

  const wordmarkOpacity = useSharedValue(0);
  const wordmarkScale = useSharedValue(0.8);
  const handsOpacity = useSharedValue(0);
  const handsScale = useSharedValue(0.85);
  const screenOpacity = useSharedValue(1);

  function triggerHaptic(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  useEffect(() => {
    wordmarkOpacity.value = withTiming(1, { duration: 600 });
    wordmarkScale.value = withTiming(1, { duration: 600 });

    handsOpacity.value = withDelay(
      1700,
      withTiming(1, { duration: 900 }, (finished) => {
        if (finished) runOnJS(triggerHaptic)();
      }),
    );
    handsScale.value = withDelay(1700, withTiming(1, { duration: 900 }));

    screenOpacity.value = withDelay(
      3100,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ scale: wordmarkScale.value }],
  }));
  const handsStyle = useAnimatedStyle(() => ({
    opacity: handsOpacity.value,
    transform: [{ scale: handsScale.value }],
  }));

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <AppBackground>
        <View style={styles.content}>
          <Animated.View style={[styles.wordmarkBlock, wordmarkStyle]}>
            <BubbleHeading text={wordmark} fontSize={SPLASH_FONT_SIZE} />
          </Animated.View>

          <Animated.View style={[styles.handsImageWrap, handsStyle]}>
            <Image
              source={require('@/assets/images/hands-exchange.png')}
              style={styles.handsImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </AppBackground>
    </Animated.View>
  );
}
