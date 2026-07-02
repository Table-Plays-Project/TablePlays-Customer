import { useCallback, useEffect, useRef } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image as RNImage,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import AppBackground from '@/components/AppBackground';
import { ActionButton, SecondaryButton } from '@/components/buttons';
import AuthContext from '@/contexts/auth';
import ProfileContext from '@/contexts/profile';
import {
  findActiveSession,
  joinGameSession,
  leaveAllActiveSessions,
} from '@/services/game';
import { getPendingInvites, respondToInvite } from '@/services/friends';

import styles from './styles';

type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: 'people',
    label: 'Friend\nList',
    route: '/(private)/friendList/page',
  },
  {
    icon: 'time',
    label: 'View\nHistory',
    route: '/(private)/viewHistory/page',
  },
  {
    icon: 'settings-sharp',
    label: 'Settings',
    route: '/(private)/profile/page',
  },
  {
    icon: 'pricetag',
    label: 'Voucher &\nStamp Cards',
    route: '/(private)/stampCards/page',
  },
];

export default function Dashboard(): JSX.Element {
  const { user } = AuthContext.useAuth();
  const { t } = useTranslation();
  const { profileImage, avatarSource, avatarId } = ProfileContext.useProfile();

  const firstName =
    user?.user_metadata?.first_name ?? user?.user_metadata?.name ?? '';
  const greeting = firstName ? `Hello, ${firstName}` : 'Welcome back';

  // Refs so the one-time mount effect below always reads the latest
  // values inside its async Alert callbacks without needing to re-run.
  const firstNameRef = useRef(firstName);
  firstNameRef.current = firstName;
  const avatarIdRef = useRef(avatarId);
  avatarIdRef.current = avatarId;

  // One-time rejoin check on mount — handles force-close / app restart
  const checkedRef = useRef(false);
  useEffect(() => {
    if (checkedRef.current || !user) return;
    checkedRef.current = true;

    findActiveSession().then(({ sessionId, status }) => {
      if (!sessionId || !status) return;
      Alert.alert(
        'Active Game Found',
        'You have an active game session. Would you like to rejoin?',
        [
          {
            text: 'Leave All Games',
            style: 'destructive',
            onPress: () => {
              leaveAllActiveSessions().catch((e) => {
                console.error('leaveAllActiveSessions failed:', e);
              });
            },
          },
          {
            text: 'Rejoin',
            onPress: () => {
              if (status === 'waiting') {
                router.replace({
                  pathname: '/(private)/lobby/page',
                  params: { sessionId },
                } as never);
              } else {
                router.replace({
                  pathname: '/(private)/spinWheel/page',
                  params: { sessionId },
                } as never);
              }
            },
          },
        ],
      );
    });
  }, [user]);

  // Invite polling — runs on focus and every 5 s while dashboard is open.
  // Without this, an invite sent while the dashboard is already open is
  // never shown because the old one-time check had already fired.
  const shownInviteIdsRef = useRef<Set<string>>(new Set());
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const checkInvites = async (): Promise<void> => {
        const { invites } = await getPendingInvites();
        if (invites.length === 0) return;
        const invite = invites[0];
        if (shownInviteIdsRef.current.has(invite.id)) return;
        shownInviteIdsRef.current.add(invite.id);
        const inviterName = invite.inviter_name ?? 'A friend';
        Alert.alert(
          "You've Been Invited!",
          `${inviterName} has invited you to join a game on TablePlays. Ready to play?`,
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => {
                respondToInvite(invite.id, false).catch(() => {});
              },
            },
            {
              text: 'Join Game',
              onPress: async () => {
                await respondToInvite(invite.id, true);
                const { sessionId: joinedId, error: joinErr } =
                  await joinGameSession(
                    invite.room_code,
                    firstNameRef.current || 'Player',
                    avatarIdRef.current,
                  );
                if (joinErr || !joinedId) {
                  Alert.alert('Error', joinErr?.message ?? 'Failed to join game.');
                  return;
                }
                router.replace({
                  pathname: '/(private)/lobby/page',
                  params: { sessionId: joinedId },
                } as never);
              },
            },
          ],
        );
      };

      void checkInvites();
      const t = setInterval(() => { void checkInvites(); }, 5000);
      return () => clearInterval(t);
    }, [user]),
  );

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
                onPress={() =>
                  action.route && router.push(action.route as never)
                }
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
            <ActionButton
              onPress={() => router.push('/(private)/selectGame/page')}
              text="HOST GAME"
            />
            <SecondaryButton
              onPress={() =>
                router.push({
                  pathname: '/(private)/joinSession/page',
                  params: { mode: 'join' },
                } as never)
              }
              text="JOIN GAME"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
