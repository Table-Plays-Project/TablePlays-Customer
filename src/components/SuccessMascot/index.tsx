import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { ActionButton } from '@/components/buttons';

import { styles } from './styles';

type SuccessMascotProps = {
  heading: string;
  buttonLabel: string;
  onPress: () => void;
};

export default function SuccessMascot({
  heading,
  buttonLabel,
  onPress,
}: SuccessMascotProps): JSX.Element {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.card}>
      <Animated.View style={bounceStyle}>
        <Image
          source={require('@/assets/images/success-star.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.heading}>{heading}</Text>
      <ActionButton onPress={onPress} text={buttonLabel} />
    </View>
  );
}
