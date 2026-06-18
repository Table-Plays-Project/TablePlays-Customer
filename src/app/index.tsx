import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { setZodCustomErrorMap } from '@/lib/zod';
import { colors } from '@/constants/theme';

setZodCustomErrorMap();

export default function Index(): JSX.Element {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={44} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
