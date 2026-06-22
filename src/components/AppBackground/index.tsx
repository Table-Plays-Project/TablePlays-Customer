import { ReactNode } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants/theme';

import { styles } from './styles';

// Standard Android "sw600dp" tablet breakpoint, also a safe cutoff for
// iPad mini and up — shortest screen dimension, so it holds in either
// orientation.
const TABLET_BREAKPOINT = 600;

type AppBackgroundProps = {
  children?: ReactNode;
};

export default function AppBackground({
  children,
}: AppBackgroundProps): JSX.Element {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;

  return (
    <View style={styles.root}>
      <View style={styles.gradientFallback} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={
          isTablet
            ? require('@/assets/images/app-background-tablet.jpeg')
            : require('@/assets/images/app-background.png')
        }
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.scrim} />
      {children}
    </View>
  );
}
