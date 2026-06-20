import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import BubbleHeading from '@/components/BubbleHeading';
import { ActionButton } from '@/components/buttons';
import { fontSize } from '@/constants/theme';

import { styles } from './styles';

type SuccessMascotProps = {
  heading: string;
  subtitle?: string;
  buttonLabel: string;
  onPress: () => void;
};

export default function SuccessMascot({
  heading,
  subtitle,
  buttonLabel,
  onPress,
}: SuccessMascotProps): JSX.Element {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 175 }),
        withTiming(6, { duration: 350 }),
        withTiming(0, { duration: 175 }),
      ),
      -1,
      false,
    );

    textScale.value = withDelay(200, withTiming(1, { duration: 200 }));
    textOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
    buttonOpacity.value = withDelay(350, withTiming(1, { duration: 150 }));
    buttonTranslateY.value = withDelay(350, withTiming(0, { duration: 150 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={bounceStyle}>
        <Image
          source={require('@/assets/images/success-star.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.headingWrap, textAnimStyle]}>
        <BubbleHeading
          text={heading}
          fontSize={fontSize['4xl']}
          align="center"
        />
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Animated.View>

      <Animated.View style={[styles.buttonWrap, buttonAnimStyle]}>
        <ActionButton onPress={onPress} text={buttonLabel} />
      </Animated.View>
    </View>
  );
}
