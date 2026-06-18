import React, { useState } from 'react';
import {
  Text,
  Pressable,
  PressableProps,
  FlexAlignType,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { buttonStyles } from './styles';
import { Ionicons } from '@expo/vector-icons';
import GoogleLogo from '@/components/icons/GoogleLogo';
import { colors } from '@/constants/theme';

type StyleOverrides = {
  alignSelf?: 'auto' | FlexAlignType | undefined;
};

type CustomButtonProps = {
  onPress:
    | PressableProps['onPress']
    | ((_event: GestureResponderEvent) => Promise<void>);
  text: string | undefined;
  disabled?: boolean;
};

type NavigationButtonProps = {
  onPress: PressableProps['onPress'];
  disabled?: boolean;
  arrow:
    | 'arrow-back'
    | 'arrow-back-circle'
    | 'arrow-back-circle-outline'
    | 'arrow-back-circle-sharp'
    | 'arrow-back-outline'
    | 'arrow-back-sharp'
    | 'arrow-down-circle-outline'
    | 'arrow-down-circle-sharp'
    | 'arrow-down-outline'
    | 'arrow-down-sharp'
    | 'arrow-forward'
    | 'arrow-forward-circle'
    | 'arrow-forward-circle-outline'
    | 'arrow-forward-circle-sharp'
    | 'arrow-forward-outline'
    | 'arrow-forward-sharp';
  styleOverrides?: StyleOverrides;
};

export const ActionButton = (props: CustomButtonProps): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false);
  const isDisabled = props.disabled || loading;

  async function handlePress(ev: GestureResponderEvent): Promise<void> {
    if (!props.onPress) return;
    setLoading(true);
    try {
      await props.onPress(ev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        buttonStyles.wrapper,
        isDisabled && buttonStyles.disabledWrapper,
        pressed && !isDisabled && buttonStyles.pressedWrapper,
      ]}
    >
      <LinearGradient
        colors={[colors.ctaStart, colors.ctaEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={buttonStyles.action}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={buttonStyles.actionText}>{props.text}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

export const SecondaryButton = (props: CustomButtonProps): JSX.Element => {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [
        buttonStyles.secondary,
        props.disabled && buttonStyles.disabledWrapper,
        pressed && !props.disabled && buttonStyles.pressedWrapper,
      ]}
    >
      <Text style={buttonStyles.secondaryText}>{props.text}</Text>
    </Pressable>
  );
};

type GoogleSignInButtonProps = {
  onPress: () => void;
  text: string;
};

export const GoogleSignInButton = (
  props: GoogleSignInButtonProps,
): JSX.Element => {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        buttonStyles.google,
        pressed && buttonStyles.pressedWrapper,
      ]}
    >
      <GoogleLogo size={20} />
      <Text style={buttonStyles.googleText}>{props.text}</Text>
    </Pressable>
  );
};

export const NavigationButton = (props: NavigationButtonProps): JSX.Element => {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        props.disabled
          ? buttonStyles.backButtonDisabled
          : buttonStyles.backButton,
        pressed && !props.disabled && buttonStyles.pressedWrapper,
      ]}
      disabled={props.disabled}
    >
      <Ionicons
        name={props.arrow}
        size={24}
        style={{
          ...buttonStyles.arrowBackIcon,
          alignSelf: props.styleOverrides?.alignSelf,
        }}
      />
    </Pressable>
  );
};
