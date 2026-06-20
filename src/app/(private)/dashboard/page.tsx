import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image as RNImage, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import AppBackground from '@/components/AppBackground';
import { ActionButton, SecondaryButton } from '@/components/buttons';
import AuthContext from '@/contexts/auth';
import ProfileContext from '@/contexts/profile';

import styles from './styles';

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'people', label: 'Friend List' },
  { icon: 'time', label: 'View History' },
  { icon: 'settings-sharp', label: 'Settings', route: '/(private)/profile/page' },
  { icon: 'pricetag', label: 'Voucher &\nStamp Cards' },
];

export default function Dashboard(): JSX.Element {
  const { user } = AuthContext.useAuth();
  const { t } = useTranslation();
  const { profileImage, avatarSource } = ProfileContext.useProfile();

  const firstName =
    user?.user_metadata?.first_name ?? user?.user_metadata?.name ?? '';
  const greeting = firstName ? `Hello, ${firstName}` : 'Welcome back';

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.greetingWrap}>
              <Text style={styles.greeting}>{greeting}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(private)/profile/page')}
              style={styles.avatarButton}
            >
              <View style={styles.avatar}>
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
                  <Text style={styles.avatarText}>
                    {firstName ? firstName.charAt(0).toUpperCase() : '?'}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>

          <View style={styles.promoBanner}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTag}>JUST FOR YOU</Text>
              <Text style={styles.promoHeading}>
                GET SPECIAL{'\n'}DISCOUNT{'\n'}UP TO 50%
              </Text>
              <Pressable style={styles.promoButton}>
                <Text style={styles.promoButtonText}>START NOW</Text>
              </Pressable>
            </View>
            <Image
              source={require('@/assets/images/app-background.png')}
              style={styles.promoImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => action.route && router.push(action.route as never)}
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && styles.actionCardPressed,
                ]}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons
                    name={action.icon}
                    size={30}
                    color="#FFFFFF"
                    style={styles.actionIconShadow}
                  />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.ctaSection}>
            <ActionButton onPress={() => {}} text="HOST GAME" />
            <SecondaryButton onPress={() => {}} text="JOIN GAME" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
