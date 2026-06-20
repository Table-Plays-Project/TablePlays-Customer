import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

const AVATAR_SIZE = 60;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[12],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  headingWrap: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    rowGap: spacing[4],
  },
  avatarButton: {
    borderRadius: borderRadius.full,
  },
  avatarButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.93 }],
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarCircleSelected: {
    borderColor: colors.textInverse,
    shadowColor: colors.textInverse,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarImage: {
    width: AVATAR_SIZE - 6,
    height: AVATAR_SIZE - 6,
    borderRadius: borderRadius.full,
  },
  saveWrap: {
    paddingHorizontal: spacing[4],
  },
});

export default styles;
