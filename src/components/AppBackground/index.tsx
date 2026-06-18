import { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants/theme';

import { styles } from './styles';

type AppBackgroundProps = {
  children?: ReactNode;
};

export default function AppBackground({
  children,
}: AppBackgroundProps): JSX.Element {
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
        source={require('@/assets/images/app-background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.scrim} />
      {children}
    </View>
  );
}
