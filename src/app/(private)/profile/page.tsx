import { useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Image as RNImage,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import AppBackground from '@/components/AppBackground';
import { NavigationButton } from '@/components/buttons';
import AuthContext from '@/contexts/auth';
import { signOutUser } from '@/services/auth';
import ProfileContext from '@/contexts/profile';
import { colors } from '@/constants/theme';

import styles from './styles';

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
};

function MenuItem({
  icon,
  iconBg,
  label,
  onPress,
  trailing,
}: MenuItemProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && onPress && styles.menuRowPressed,
      ]}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.textInverse}
          style={styles.iconShadow}
        />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {trailing ?? (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textInverse}
          style={styles.chevron}
        />
      )}
    </Pressable>
  );
}

type ToggleBadgeProps = {
  isOn: boolean;
};

function ToggleBadge({ isOn }: ToggleBadgeProps): JSX.Element {
  return (
    <View
      style={[
        styles.togglePill,
        isOn ? styles.togglePillOn : styles.togglePillOff,
      ]}
    >
      <Text style={styles.togglePillText}>{isOn ? 'ON' : 'OFF'}</Text>
    </View>
  );
}

export default function Profile(): JSX.Element {
  const { user, setAuth } = AuthContext.useAuth();

  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const { profileImage, avatarSource } = ProfileContext.useProfile();

  const firstName =
    user?.user_metadata?.first_name ?? user?.user_metadata?.name ?? '';
  const lastName = user?.user_metadata?.last_name ?? '';
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n) => n.charAt(0).toUpperCase())
      .join('') || '?';

  async function performSignOut(): Promise<void> {
    try {
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
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Sign out failed. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
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
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <NavigationButton
              onPress={() => router.back()}
              arrow="arrow-back"
            />
            <Text style={styles.headerTitle}>SETTINGS</Text>
            <View style={styles.avatarCircle}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : avatarSource ? (
                <RNImage
                  source={avatarSource}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
          </View>

          <MenuItem
            icon="person"
            iconBg={colors.success}
            label="Edit Profile"
            onPress={() => router.push('/(private)/editProfile/page')}
          />

          <MenuItem
            icon="color-palette"
            iconBg={colors.ctaSolid}
            label="Change Avatar"
            onPress={() => router.push('/(private)/avatar/page')}
          />

          <MenuItem
            icon="volume-high"
            iconBg={colors.gradientStart}
            label="Sound"
            onPress={() => setSoundOn((prev) => !prev)}
            trailing={<ToggleBadge isOn={soundOn} />}
          />

          <MenuItem
            icon="musical-notes"
            iconBg={colors.gradientEnd}
            label="Music"
            onPress={() => setMusicOn((prev) => !prev)}
            trailing={<ToggleBadge isOn={musicOn} />}
          />

          <MenuItem
            icon="pricetag"
            iconBg={colors.accent}
            label="Voucher & Stamp Cards"
          />

          <MenuItem
            icon="people"
            iconBg={colors.gradientStart}
            label="Friends List"
          />

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.menuRowPressed,
            ]}
          >
            <View style={[styles.menuIconCircle, styles.logoutIconCircle]}>
              <Ionicons
                name="log-out-outline"
                size={22}
                color={colors.error}
                style={styles.iconShadow}
              />
            </View>
            <Text style={styles.logoutLabel}>Logout</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.error}
              style={styles.chevron}
            />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
