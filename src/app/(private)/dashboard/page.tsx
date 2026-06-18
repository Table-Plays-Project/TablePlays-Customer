import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthContext from '@/contexts/auth';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';

export default function Dashboard(): JSX.Element {
  const { user } = AuthContext.useAuth();

  const firstName =
    user?.user_metadata?.first_name ?? user?.user_metadata?.name ?? '';
  const greeting = firstName ? `Hello, ${firstName}` : 'Welcome back';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subGreeting}>Ready to play?</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(private)/profile/page')}
            style={styles.avatarButton}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {firstName ? firstName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Play Now</Text>
          <View style={styles.grid}>
            <Pressable style={styles.actionCard}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="game-controller-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.actionLabel}>Join Game</Text>
            </Pressable>

            <Pressable style={styles.actionCard}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.accentLight },
                ]}
              >
                <Ionicons
                  name="ribbon-outline"
                  size={28}
                  color={colors.accent}
                />
              </View>
              <Text style={styles.actionLabel}>My Stamps</Text>
            </Pressable>

            <Pressable style={styles.actionCard}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.successLight },
                ]}
              >
                <Ionicons
                  name="ticket-outline"
                  size={28}
                  color={colors.success}
                />
              </View>
              <Text style={styles.actionLabel}>Vouchers</Text>
            </Pressable>

            <Pressable style={styles.actionCard}>
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: colors.backgroundSubtle },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={28}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.actionLabel}>History</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Tables</Text>
          <View style={styles.emptyCard}>
            <Ionicons
              name="location-outline"
              size={40}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>No active tables nearby</Text>
            <Text style={styles.emptySubText}>
              Ask your host for the table code
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  greeting: {
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  avatarButton: {
    padding: spacing[1],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.textInverse,
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  actionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing[8],
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing[3],
  },
  emptySubText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing[1],
  },
});
