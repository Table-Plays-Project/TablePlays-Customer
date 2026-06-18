import { router } from 'expo-router';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AuthContext from '@/contexts/auth';
import { signOutUser } from '@/services/auth';
import {
  colors,
  fonts,
  fontSize,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';

export default function Profile(): JSX.Element {
  const { user, setAuth } = AuthContext.useAuth();

  const firstName =
    user?.user_metadata?.first_name ?? user?.user_metadata?.name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User';
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n) => n.charAt(0).toUpperCase())
      .join('') || '?';

  async function performSignOut(): Promise<void> {
    const { error } = await signOutUser();
    if (error) {
      if (Platform.OS === 'web') {
        alert(error.message);
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }
    setAuth(null);
    router.replace('/(public)/(auth)/signin/page');
  }

  async function handleSignOut(): Promise<void> {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to sign out?')) {
        await performSignOut();
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: performSignOut },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.menuItem}>
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.menuLabel}>Account Details</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.menuItem}>
            <View
              style={[styles.menuIcon, { backgroundColor: colors.accentLight }]}
            >
              <Ionicons name="trophy-outline" size={20} color={colors.accent} />
            </View>
            <Text style={styles.menuLabel}>My Rewards</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.menuItem}>
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: colors.backgroundSubtle },
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.menuLabel}>Settings</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.menuItem}>
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: colors.backgroundSubtle },
              ]}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    color: colors.textInverse,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    ...shadows.sm,
    marginBottom: spacing[6],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing[4] + 36 + spacing[3],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  signOutText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSize.base,
    color: colors.error,
  },
});
