import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
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
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);

  useEffect(() => {
    textScale.value = withDelay(500, withTiming(1, { duration: 300 }));
    textOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
    buttonOpacity.value = withDelay(3000, withTiming(1, { duration: 200 }));
    buttonTranslateY.value = withDelay(3000, withTiming(0, { duration: 200 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Image
        source={require('@/assets/images/success-star.gif')}
        style={styles.mascotImage}
        resizeMode="contain"
      />

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
