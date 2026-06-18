import { ReactNode, useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

import { styles } from './styles';

type InputVariant = 'standard' | 'pill';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type CustomTextInputProps = {
  errorMessage?: string;
  icon?: IconName;
  inputMode?: TextInputProps['inputMode'];
  keyboardType?: TextInputProps['keyboardType'];
  label: string;
  onBlur?: TextInputProps['onBlur'];
  onChangeText: TextInputProps['onChangeText'];
  onFocus?: TextInputProps['onFocus'];
  placeholder: TextInputProps['placeholder'];
  textContentType?: TextInputProps['textContentType'];
  value: TextInputProps['value'];
  variant?: InputVariant;
};

const MyAppTextBaseInput = (
  props: CustomTextInputProps & {
    secureTextEntry?: boolean;
    inputChildren?: ReactNode;
  },
): JSX.Element => {
  const isPill = props.variant === 'pill';
  const hasIcon = isPill && props.icon;

  return (
    <View style={styles.container}>
      {!isPill ? <Text style={styles.label}>{props.label}</Text> : null}
      <View
        style={[
          isPill ? styles.formItemPill : styles.formItem,
          props.errorMessage ? styles.errorBorder : null,
        ]}
      >
        {hasIcon ? (
          <Ionicons
            name={props.icon}
            size={18}
            color={colors.textMuted}
            style={styles.pillIcon}
          />
        ) : null}
        <TextInput
          onChangeText={props.onChangeText}
          value={props.value}
          placeholder={isPill ? props.label : props.placeholder}
          placeholderTextColor={colors.textMuted}
          onBlur={props.onBlur}
          onFocus={props.onFocus}
          keyboardType={props.keyboardType ?? 'default'}
          style={
            hasIcon
              ? styles.inputPill
              : isPill
                ? styles.inputPillNoIcon
                : styles.input
          }
          secureTextEntry={props.secureTextEntry}
          inputMode={props.inputMode}
          textContentType={props.textContentType}
        />
        {props.inputChildren}
      </View>
      {props.errorMessage ? (
        <Text style={isPill ? styles.errorMessagePill : styles.errorMessage}>
          {props.errorMessage}
        </Text>
      ) : null}
    </View>
  );
};

export const MyAppTextInput = (props: CustomTextInputProps): JSX.Element => {
  return <MyAppTextBaseInput {...props} />;
};

export const MyAppEmailInput = (props: CustomTextInputProps): JSX.Element => {
  return (
    <MyAppTextBaseInput
      {...props}
      keyboardType="email-address"
      inputMode="email"
      textContentType="emailAddress"
    />
  );
};

export const MyAppPasswordInput = (
  props: CustomTextInputProps & { passwordVisible?: boolean },
): JSX.Element => {
  const [visible, setVisible] = useState<boolean>(false);
  const isPill = props.variant === 'pill';

  return (
    <MyAppTextBaseInput
      {...props}
      secureTextEntry={!visible}
      inputChildren={
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={isPill ? colors.textMuted : colors.textSecondary}
          onPress={() => setVisible(!visible)}
        />
      }
    />
  );
};
