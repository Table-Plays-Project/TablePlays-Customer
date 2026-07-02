import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import { getAvatarById } from '@/constants/avatars';
import AuthContext from '@/contexts/auth';
import {
  acceptFriendRequest,
  getFriends,
  removeFriend,
  sendFriendRequest,
} from '@/services/friends';
import type { Friend } from '@/services/friends';

export default function FriendListPage(): JSX.Element {
  const { user } = AuthContext.useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const hasLoadedRef = useRef(false);

  const loadFriends = useCallback(async (): Promise<void> => {
    if (!hasLoadedRef.current) setLoading(true);
    const result = await getFriends();
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      setFriends(result.friends);
    }
    hasLoadedRef.current = true;
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends]),
  );

  useEffect(() => {
    const t = setInterval(() => {
      loadFriends();
    }, 3000);
    return () => clearInterval(t);
  }, [loadFriends]);

  const accepted = friends.filter((f) => f.status === 'accepted');
  const pendingReceived = friends.filter(
    (f) => f.status === 'pending' && f.requested_by !== user?.id,
  );
  const pendingSent = friends.filter(
    (f) => f.status === 'pending' && f.requested_by === user?.id,
  );

  async function handleSend(): Promise<void> {
    if (!email.trim() || sending) return;
    setSending(true);
    const result = await sendFriendRequest(email);
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      setEmail('');
      setShowAddModal(false);
      Alert.alert('Sent', 'Friend request sent!');
      loadFriends();
    }
    setSending(false);
  }

  async function handleAccept(friendshipId: string): Promise<void> {
    const result = await acceptFriendRequest(friendshipId);
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      loadFriends();
    }
  }

  async function handleRemove(friendshipId: string, name: string): Promise<void> {
    Alert.alert(
      'Remove Friend',
      `Remove ${name || 'this friend'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFriend(friendshipId);
            if (result.error) {
              Alert.alert('Error', result.error.message);
            } else {
              loadFriends();
            }
          },
        },
      ],
    );
  }

  function initials(name: string | null): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function renderAvatar(avatarId: string | null, name: string | null): React.JSX.Element {
    const avatar = avatarId ? getAvatarById(avatarId) : null;
    if (avatar) {
      return (
        <View style={s.avatarCircle}>
          <RNImage source={avatar.source} style={s.avatarImage} resizeMode="cover" />
        </View>
      );
    }
    return (
      <View style={s.avatarCircle}>
        <Text style={s.avatarLetter}>{initials(name)}</Text>
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
          <View style={s.header}>
            <Pressable
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace('/(private)/dashboard/page')
              }
              style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <Text style={s.title}>Friend List</Text>
            <View style={s.headerAvatars}>
              <View style={[s.headerAvatarCircle, { backgroundColor: '#E040A0', zIndex: 2 }]}>
                <Text style={s.headerAvatarLetter}>
                  {initials(user?.user_metadata?.first_name ?? null)}
                </Text>
              </View>
              <View style={[s.headerAvatarCircle, { backgroundColor: '#22C55E', marginLeft: -10 }]}>
                <Ionicons name="people" size={14} color="#fff" />
              </View>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Pending requests received */}
              {pendingReceived.map((f) => (
                <View key={f.id} style={s.friendCard}>
                  {renderAvatar(f.friend_avatar_id, f.friend_name)}
                  <Text style={s.friendName} numberOfLines={1}>{f.friend_name ?? 'Unknown'}</Text>
                  <Pressable
                    onPress={() => handleAccept(f.id)}
                    style={({ pressed }) => [s.actionPill, pressed && { opacity: 0.7 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Accept request"
                  >
                    <Text style={s.actionPillText}>ACCEPT</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemove(f.id, f.friend_name ?? 'this request')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Decline request"
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}

              {/* Accepted friends */}
              {accepted.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 ? (
                <Text style={s.emptyText}>
                  No friends yet. Tap "Add Friend" to get started!
                </Text>
              ) : (
                accepted.map((f) => (
                  <View key={f.id} style={s.friendCard}>
                    {renderAvatar(f.friend_avatar_id, f.friend_name)}
                    <Text style={s.friendName} numberOfLines={1}>{f.friend_name ?? 'Unknown'}</Text>
                    <Pressable
                      onPress={() => handleRemove(f.id, f.friend_name ?? 'this friend')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${f.friend_name}`}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))
              )}

              {/* Sent requests */}
              {pendingSent.map((f) => (
                <View key={f.id} style={s.friendCard}>
                  {renderAvatar(f.friend_avatar_id, f.friend_name)}
                  <Text style={s.friendName} numberOfLines={1}>{f.friend_name ?? 'Unknown'}</Text>
                  <View style={s.pendingPill}>
                    <Text style={s.pendingPillText}>PENDING</Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(f.id, f.friend_name ?? 'this request')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel request"
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </>
          )}

          <Pressable
            onPress={() => setShowAddModal(true)}
            style={({ pressed }) => [s.addFriendBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Add friend"
          >
            <Text style={s.addFriendText}>ADD FRIEND</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {/* Add friend modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={s.modalScrim} onPress={() => setShowAddModal(false)}>
          <Pressable style={s.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>Add Friend</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Enter friend's email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={handleSend}
              returnKeyType="send"
              autoFocus
            />
            <Pressable
              onPress={handleSend}
              disabled={sending || !email.trim()}
              style={({ pressed }) => [
                s.modalSendBtn,
                pressed && { opacity: 0.7 },
                (sending || !email.trim()) && { opacity: 0.4 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send friend request"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.modalSendText}>SEND REQUEST</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },
  headerAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerAvatarLetter: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },

  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4736A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  friendName: {
    flex: 1,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },

  actionPill: {
    backgroundColor: '#F4736A',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionPillText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pendingPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pendingPillText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },

  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  },

  addFriendBtn: {
    borderWidth: 2,
    borderColor: '#F4736A',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  addFriendText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // ── Add friend modal ──
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#5A4FCF',
    borderRadius: 24,
    padding: 24,
    gap: 14,
  },
  modalTitle: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#333',
  },
  modalSendBtn: {
    backgroundColor: '#F4736A',
    borderRadius: 999,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSendText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
