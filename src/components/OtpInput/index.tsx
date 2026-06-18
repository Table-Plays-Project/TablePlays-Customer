import { useRef } from 'react';
import { TextInput, View } from 'react-native';

import { OTP_LENGTH } from '@/constants/config';

import { styles } from './styles';

type OtpInputProps = {
  code: string[];
  onCodeChange: (code: string[]) => void;
};

export default function OtpInput({
  code,
  onCodeChange,
}: OtpInputProps): JSX.Element {
  const inputs = useRef<Array<TextInput | null>>([]);

  function handleChange(text: string, index: number): void {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...code];
    updated[index] = digit;
    onCodeChange(updated);

    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number): void {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const updated = [...code];
      updated[index - 1] = '';
      onCodeChange(updated);
    }
  }

  return (
    <View style={styles.container}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        return (
          <View
            key={index}
            style={[styles.box, code[index] ? styles.boxFilled : null]}
          >
            <TextInput
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={styles.input}
              value={code[index]}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          </View>
        );
      })}
    </View>
  );
}
