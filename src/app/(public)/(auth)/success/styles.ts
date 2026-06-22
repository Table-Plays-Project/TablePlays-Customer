import { StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[8],
  },
});

export default styles;
