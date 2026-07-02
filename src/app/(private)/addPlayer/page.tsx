import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import AppBackground from '@/components/AppBackground';
import { getAvatarById } from '@/constants/avatars';
import AuthContext from '@/contexts/auth';
import useGameSession from '@/hooks/game/useGameSession';
import { addManualPlayer, kickOfflinePlayer } from '@/services/game';
import { getFriends, inviteFriendToSession } from '@/services/friends';
import type { Friend } from '@/services/friends';

function TrashIcon(): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 6V4h8v2" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 6l1 14h12l1-14" stroke="#E53935" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6" stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 11v6" stroke="#E53935" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function AddPlayerPage(): JSX.Element {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user } = AuthContext.useAuth();
  const accountName =
    user?.user_metadata?.first_name ??
    user?.user_metadata?.name ??
    'Player';

  const { players } = useGameSession(
    sessionId ?? null,
    user?.id ?? null,
    accountName,
  );
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const manualPlayers = players.filter((p) => !p.user_id);
  const playerUserIds = new Set(players.map((p) => p.user_id).filter(Boolean));

  const loadFriends = useCallback(async (): Promise<void> => {
    setFriendsLoading(true);
    const result = await getFriends();
    if (!result.error) {
      setFriends(result.friends.filter((f) => f.status === 'accepted'));
    }
    setFriendsLoading(false);
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  async function handleAdd(): Promise<void> {
    if (!name.trim() || !sessionId || adding) return;
    setAdding(true);
    try {
      const result = await addManualPlayer(sessionId, name.trim());
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        setName('');
      }
    } catch {
      Alert.alert('Error', 'Failed to add player.');
    } finally {
      setAdding(false);
    }
  }

  async function handleInvite(friend: Friend): Promise<void> {
    if (!sessionId || invitingId) return;
    const friendUserId = friend.user_id === user?.id ? friend.friend_id : friend.user_id;
    setInvitingId(friendUserId);
    try {
      const result = await inviteFriendToSession(sessionId, friendUserId);
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        setInvitedIds((prev) => new Set(prev).add(friendUserId));
      }
    } catch {
      Alert.alert('Error', 'Failed to invite friend.');
    } finally {
      setInvitingId(null);
    }
  }

  async function handleRemove(playerId: string): Promise<void> {
    if (!sessionId) return;
    const result = await kickOfflinePlayer(sessionId, playerId);
    if (result.error) {
      Alert.alert('Error', result.error.message);
    }
  }

  function renderAvatar(avatarId: string | null, name: string | null, size: number): React.JSX.Element {
    const avatar = avatarId ? getAvatarById(avatarId) : null;
    return (
      <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        {avatar ? (
          <RNImage
            source={avatar.source}
            style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[s.avatarLetter, { fontSize: size * 0.4 }]}>
            {name ? name.charAt(0).toUpperCase() : '?'}
          </Text>
        )}
      </View>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>

          <Text style={s.title}>ADD PLAYER</Text>

          {/* ── Friends Section ── */}
          {friendsLoading ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" style={{ marginBottom: 20 }} />
          ) : friends.length > 0 ? (
            <>
              <Text style={s.sectionLabel}>INVITE FRIENDS</Text>
              {friends.map((f) => {
                const friendUserId = f.user_id === user?.id ? f.friend_id : f.user_id;
                const alreadyIn = playerUserIds.has(friendUserId);
                const isInviting = invitingId === friendUserId;
                return (
                  <View key={f.id} style={s.friendRow}>
                    {renderAvatar(f.friend_avatar_id, f.friend_name, 42)}
                    <Text style={s.friendName} numberOfLines={1}>{f.friend_name ?? 'Unknown'}</Text>
                    {alreadyIn ? (
                      <View style={s.joinedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                        <Text style={s.joinedText}>Joined</Text>
                      </View>
                    ) : invitedIds.has(friendUserId) ? (
                      <View style={s.invitedBadge}>
                        <Ionicons name="time-outline" size={14} color="#F4736A" />
                        <Text style={s.invitedText}>Invited</Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => handleInvite(f)}
                        disabled={isInviting}
                        style={({ pressed }) => [
                          s.inviteBtn,
                          pressed && { opacity: 0.7 },
                          isInviting && { opacity: 0.5 },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Invite ${f.friend_name}`}
                      >
                        {isInviting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={s.inviteText}>Invite</Text>
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </>
          ) : null}

          {/* ── Manual Players Section ── */}
          <Text style={s.sectionLabel}>ADD MANUAL PLAYER</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.nameInput}
              placeholder="Player Name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable
              onPress={handleAdd}
              disabled={adding || !name.trim()}
              style={({ pressed }) => [
                s.addBox,
                pressed && { opacity: 0.6 },
                (adding || !name.trim()) && { opacity: 0.35 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add player"
            >
              <Text style={s.addText}>Add</Text>
            </Pressable>
          </View>

          {manualPlayers.map((player) => (
            <View key={player.id} style={s.playerRow}>
              <View style={s.playerCard}>
                <Text style={s.playerName}>{player.player_name}</Text>
              </View>
              <Pressable
                onPress={() => handleRemove(player.id)}
                style={({ pressed }) => [s.trashBox, pressed && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${player.player_name}`}
              >
                <TrashIcon />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View style={s.bottomRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.bottomBtn, s.backBtnBottom, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.backBtnBottomText}>BACK</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, { flex: 1 }]}
          >
            <LinearGradient
              colors={['#F4736A', '#E8556A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.bottomBtn, s.nextBtn]}
            >
              <Text style={s.nextBtnText}>NEXT</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 36,
    color: '#F4736A',
    textShadowColor: '#B83A1A',
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 0,
    textAlign: 'center',
    marginBottom: 24,
  },

  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 4,
  },

  // ── Friend rows ──
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatar: {
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
  },
  friendName: {
    flex: 1,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  inviteBtn: {
    backgroundColor: '#F4736A',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  inviteText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinedText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: '#22C55E',
  },

  invitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244,115,106,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  invitedText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: '#F4736A',
  },

  // ── Input row ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 18,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#333',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  addBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  addText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#333',
  },

  // ── Player rows ──
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  playerCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  playerName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#333',
  },
  trashBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  // ── Bottom buttons ──
  bottomRow: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    gap: 12,
  },
  bottomBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnBottom: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  backBtnBottomText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  nextBtn: { flex: 1 },
  nextBtnText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
