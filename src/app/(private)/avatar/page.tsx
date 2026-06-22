import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import { ActionButton, NavigationButton } from '@/components/buttons';
import AVATARS from '@/constants/avatars';
import ProfileContext from '@/contexts/profile';

import styles from './styles';

export default function AvatarPicker(): JSX.Element {
  const { avatarId, setAvatarId } = ProfileContext.useProfile();
  const [selectedId, setSelectedId] = useState<string | null>(avatarId);

  function handleSave(): void {
    setAvatarId(selectedId);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(private)/profile/page');
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
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace('/(private)/profile/page')
              }
              arrow="arrow-back"
            />
          </View>

          <View style={styles.headingWrap}>
            <BubbleHeading text="CHOOSE YOUR AVATAR" />
          </View>

          <View style={styles.card}>
            <View style={styles.grid}>
              {AVATARS.map((avatar) => {
                const isSelected = selectedId === avatar.id;
                return (
                  <Pressable
                    key={avatar.id}
                    onPress={() => setSelectedId(avatar.id)}
                    style={({ pressed }) => [
                      styles.avatarButton,
                      pressed && !isSelected && styles.avatarButtonPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.avatarCircle,
                        isSelected && styles.avatarCircleSelected,
                      ]}
                    >
                      <Image
                        source={avatar.source}
                        style={styles.avatarImage}
                        contentFit="cover"
                        transition={150}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.saveWrap}>
            <ActionButton onPress={handleSave} text="SAVE" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
