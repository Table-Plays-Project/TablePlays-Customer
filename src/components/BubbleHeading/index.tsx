import { Text, TextStyle, View } from 'react-native';

import { colors, fontSize as themeFontSize } from '@/constants/theme';

import { styles } from './styles';

type BubbleHeadingProps = {
  text: string;
  fontSize?: number;
  align?: 'center' | 'left';
};

const OFFSET_STYLES = [
  styles.offsetUp,
  styles.offsetDown,
  styles.offsetLeft,
  styles.offsetRight,
  styles.offsetUpLeft,
  styles.offsetUpRight,
  styles.offsetDownLeft,
  styles.offsetDownRight,
];

export default function BubbleHeading({
  text,
  fontSize = themeFontSize['4xl'],
  align = 'center',
}: BubbleHeadingProps): JSX.Element {
  const sizeStyle: TextStyle = {
    fontSize,
    // Baloo2_800ExtraBold's glyph metrics run taller than its nominal
    // fontSize. 1.05x is enough for a single line, but a wrapped second
    // line bleeds past its line box and overlaps whatever follows — needs
    // real headroom, not just a hairline buffer.
    lineHeight: fontSize * 1.25,
    textAlign: align,
  };

  return (
    <View style={align === 'left' ? styles.wrapperLeft : styles.wrapper}>
      {OFFSET_STYLES.map((offsetStyle, index) => (
        <Text
          key={index}
          style={[
            styles.layerBase,
            sizeStyle,
            offsetStyle,
            { color: colors.wordmarkOutline },
          ]}
        >
          {text}
        </Text>
      ))}
      <Text
        style={[styles.fillLayer, sizeStyle, { color: colors.wordmarkFill }]}
      >
        {text}
      </Text>
    </View>
  );
}
