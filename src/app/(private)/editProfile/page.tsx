import { useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Image as RNImage,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import AppBackground from '@/components/AppBackground';
import { ActionButton, NavigationButton } from '@/components/buttons';
import AuthContext from '@/contexts/auth';
import { updateUserProfile } from '@/services/auth';
import ProfileContext from '@/contexts/profile';
import { colors } from '@/constants/theme';
import type { CurrentUser } from '@/contexts/auth/types';

import styles from './styles';

export default function EditProfile(): JSX.Element {
  const { user, setAuth } = AuthContext.useAuth();

  const [firstName, setFirstName] = useState(
    user?.user_metadata?.first_name ?? user?.user_metadata?.name ?? '',
  );
  const [lastName, setLastName] = useState(
    user?.user_metadata?.last_name ?? '',
  );
  const { profileImage, setProfileImage, avatarSource } = ProfileContext.useProfile();
  const [localImage, setLocalImage] = useState<string | null>(profileImage);
  const [error, setError] = useState<string | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  const email = user?.email ?? '';
  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n) => n.charAt(0).toUpperCase())
      .join('') || '?';

  const displayImage = localImage ?? profileImage;

  async function handlePickImage(): Promise<void> {
    try {
      const ImagePicker = await import('expo-image-picker');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      setLocalImage(uri);
      await setProfileImage(uri);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (
        msg.includes('native module') ||
        msg.includes('not found') ||
        msg.includes('not a function')
      ) {
        setError('Photo picker requires a development build.');
      } else {
        console.error('Image pick failed:', e);
        setError('Failed to pick image. Please try again.');
      }
    }
  }

  async function handleSave(): Promise<void> {
    try {
      setError(null);
      const { error: updateError } = await updateUserProfile(
        firstName.trim(),
        lastName.trim(),
      );

      if (updateError) {
        if (Platform.OS === 'web') {
          alert(updateError.message);
        } else {
          Alert.alert('Error', updateError.message);
        }
        setError(updateError.message);
        return;
      }

      if (user) {
        setAuth({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        } as CurrentUser);
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(private)/profile/page');
      }
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Profile update failed. Please try again.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      setError(message);
    }
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
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(private)/profile/page')}
              arrow="arrow-back"
            />
            <Text style={styles.headerTitle}>EDIT PROFILE</Text>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <View style={styles.profileImageSection}>
            <Pressable
              onPress={() => (displayImage || avatarSource) && setLightboxVisible(true)}
              style={styles.profileImageContainer}
            >
              {displayImage ? (
                <Image
                  source={{ uri: displayImage }}
                  style={styles.profileImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : avatarSource ? (
                <RNImage
                  source={avatarSource}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.profileInitials}>{initials}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={handlePickImage}
              style={styles.cameraIconOverlay}
            >
              <Ionicons name="camera" size={18} color={colors.textInverse} />
            </Pressable>
          </View>

          <Modal
            visible={lightboxVisible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => setLightboxVisible(false)}
          >
            <StatusBar
              backgroundColor="rgba(0,0,0,0.95)"
              barStyle="light-content"
            />
            <Pressable
              style={styles.lightboxBackdrop}
              onPress={() => setLightboxVisible(false)}
            >
              <Pressable
                style={styles.lightboxClose}
                onPress={() => setLightboxVisible(false)}
              >
                <Ionicons name="close" size={28} color={colors.textInverse} />
              </Pressable>
              {displayImage ? (
                <Image
                  source={{ uri: displayImage }}
                  style={styles.lightboxImage}
                  contentFit="contain"
                  transition={300}
                />
              ) : avatarSource ? (
                <RNImage
                  source={avatarSource}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              ) : null}
            </Pressable>
          </Modal>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.textInverse}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.inputPill}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor={colors.textMuted}
              textContentType="givenName"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.inputPill}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor={colors.textMuted}
              textContentType="familyName"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.inputDisabled}
              value={email}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>

          <Pressable
            onPress={() => router.push('/(private)/avatar/page')}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.menuRowPressed,
            ]}
          >
            <View
              style={[
                styles.menuIconCircle,
                { backgroundColor: colors.ctaSolid },
              ]}
            >
              <Ionicons
                name="color-palette"
                size={22}
                color={colors.textInverse}
                style={styles.iconShadow}
              />
            </View>
            <Text style={styles.menuLabel}>Change Avatar</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textInverse}
              style={styles.chevron}
            />
          </Pressable>

          <View style={styles.saveWrap}>
            <ActionButton onPress={handleSave} text="SAVE" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
