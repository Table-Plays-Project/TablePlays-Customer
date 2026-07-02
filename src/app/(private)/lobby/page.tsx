import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  Image,
  Platform,
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
import * as Linking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import AuthContext from '@/contexts/auth';
import useGameSession from '@/hooks/game/useGameSession';
import {
  cancelGameSession,
  kickOfflinePlayer,
  leaveGameSession,
  startGame,
  updateBillAmount,
} from '@/services/game';
import { colors } from '@/constants/theme';

import styles from './styles';

function initialsFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function navigateToDashboard(): void {
  router.replace('/(private)/dashboard/page');
}

function navigateToWheel(sid: string): void {
  router.replace({
    pathname: '/(private)/spinWheel/page',
    params: { sessionId: sid },
  } as never);
}

// ── Custom Trash Icon ──
function TrashIcon(): React.JSX.Element {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M8 6V4h8v2"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 6l1 14h12l1-14"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 11v6"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M14 11v6"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Toggle Pill (OUT indicator) ──
function TogglePill({ onPress }: { onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.togglePill, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel="Toggle player out"
    >
      <View style={styles.toggleThumb} />
      <Text style={styles.toggleText}>OUT</Text>
    </Pressable>
  );
}

export default function LobbyPage(): JSX.Element {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user } = AuthContext.useAuth();
  const accountName =
    user?.user_metadata?.first_name ?? user?.user_metadata?.name ?? 'Player';

  const { session, players, onlineUserIds, loading, error, refetch } =
    useGameSession(sessionId ?? null, user?.id ?? null, accountName);
  const [actionLoading, setActionLoading] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const billInitRef = useRef(false);
  const [toggledIds, setToggledIds] = useState<Set<string>>(new Set());
  const kickedNamesRef = useRef<Set<string>>(new Set());
  const isHost = session?.host_id === user?.id;
  const navigatedRef = useRef(false);

  // Initialize bill amount from session (returning to lobby)
  useEffect(() => {
    if (billInitRef.current || !session) return;
    if (session.bill_amount !== null && session.bill_amount > 0) {
      setBillAmount(String(session.bill_amount));
      billInitRef.current = true;
    }
  }, [session]);

  function handleBillBlur(): void {
    if (!sessionId || !isHost) return;
    const parsed = parseFloat(billAmount);
    const amount = isNaN(parsed) || parsed <= 0 ? null : parsed;
    updateBillAmount(sessionId, amount).catch(() => {});
  }

  // ── Offline detection (heartbeat-based) ──
  const OFFLINE_MS = 10_000;
  const GRACE_MS = 15_000;
  const [offTick, setOffTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setOffTick((v) => v + 1), 3000);
    return () => clearInterval(t);
  }, []);
  const isPlayerOffline = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, boolean>();
    players.forEach((p) => {
      if (p.user_id === user?.id) {
        map.set(p.id, false);
        return;
      }
      if (!p.user_id) {
        map.set(p.id, false);
        return;
      }
      if (!p.last_active_at) {
        map.set(p.id, false);
        return;
      }
      const joinedAgo = now - new Date(p.created_at).getTime();
      if (joinedAgo < GRACE_MS) {
        map.set(p.id, false);
        return;
      }
      map.set(p.id, now - new Date(p.last_active_at).getTime() > OFFLINE_MS);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, user?.id, offTick]);
  const anyOffline = Array.from(isPlayerOffline.values()).some(Boolean);

  // ── Lifecycle logging ──
  useEffect(() => {
    if (__DEV__) console.log('[Screen] LobbyPage MOUNTED');
    return () => {
      if (__DEV__) console.log('[Screen] LobbyPage UNMOUNTED');
    };
  }, []);

  // ── Host background cleanup ──
  const bgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHost || !sessionId) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        bgTimerRef.current = setTimeout(() => {
          cancelGameSession(sessionId).catch(() => {});
        }, 15_000);
      } else if (state === 'active') {
        if (bgTimerRef.current) {
          clearTimeout(bgTimerRef.current);
          bgTimerRef.current = null;
        }
      }
    });
    return () => {
      sub.remove();
      if (bgTimerRef.current) clearTimeout(bgTimerRef.current);
    };
  }, [isHost, sessionId]);

  // ── Kicked detection ──
  useEffect(() => {
    if (navigatedRef.current || !user || players.length === 0) return;
    const stillInGame = players.some((p) => p.user_id === user.id);
    if (
      !stillInGame &&
      session?.status &&
      session.status !== 'finished' &&
      session.status !== 'abandoned'
    ) {
      navigatedRef.current = true;
      Alert.alert(
        'Removed',
        'You have been removed from the game by the host.',
      );
      navigateToDashboard();
    }
  }, [players, user, session?.status]);

  // ── Auto-navigate on status change ──
  useEffect(() => {
    if (navigatedRef.current || !sessionId) return;
    const status = session?.status;
    if ((status === 'active' || status === 'spinning') && players.length >= 2) {
      navigatedRef.current = true;
      navigateToWheel(sessionId);
    }
    if (status === 'abandoned' || status === 'finished') {
      navigatedRef.current = true;
      navigateToDashboard();
    }
  }, [session?.status, sessionId, players.length]);

  // ── Android hardware back ──
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => sub.remove();
  });

  // ── Player change tracking ──
  const playerKey = useMemo(
    () => players.map((p) => p.id).join(','),
    [players],
  );
  const prevCountRef = useRef(players.length);
  const prevNamesRef = useRef<string[]>([]);
  useEffect(() => {
    const prevCount = prevCountRef.current;
    const prevNames = prevNamesRef.current;
    const currentNames = players.map((p) => p.player_name);
    if (prevCount > 0 && players.length < prevCount) {
      const left = prevNames.filter((n) => !currentNames.includes(n));
      if (left.length > 0 && isHost) {
        const kicked = left.filter((n) => kickedNamesRef.current.has(n));
        const departed = left.filter((n) => !kickedNamesRef.current.has(n));
        if (kicked.length > 0) {
          Alert.alert(
            'Player Removed',
            `${kicked.join(', ')} has been removed.`,
          );
          kicked.forEach((n) => kickedNamesRef.current.delete(n));
        }
        if (departed.length > 0) {
          Alert.alert('Player Left', `${departed.join(', ')} left the game.`);
        }
      }
    }
    prevCountRef.current = players.length;
    prevNamesRef.current = currentNames;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerKey, isHost]);

  // ── Actions ──
  async function doHostExit(): Promise<void> {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (sessionId) await cancelGameSession(sessionId);
    } catch {
      /* best-effort */
    }
    navigateToDashboard();
  }

  async function doPlayerLeave(): Promise<void> {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (sessionId) await leaveGameSession(sessionId);
    } catch {
      /* best-effort */
    }
    navigateToDashboard();
  }

  function handleExit(): void {
    if (isHost) {
      doHostExit();
      return;
    }
    Alert.alert('Leave Game', 'Are you sure you want to leave?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: doPlayerLeave },
    ]);
  }

  function handleKickPlayer(playerId: string, playerName: string): void {
    if (!sessionId) return;
    Alert.alert('Remove Player', `Remove ${playerName} from the game?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          kickedNamesRef.current.add(playerName);
          const result = await kickOfflinePlayer(sessionId, playerId);
          if (result.error) {
            kickedNamesRef.current.delete(playerName);
            if (__DEV__) console.log(`[Kick] FAILED: ${result.error.message}`);
            Alert.alert('Error', result.error.message);
          }
        },
      },
    ]);
  }

  function togglePlayer(playerId: string): void {
    setToggledIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  async function handleStartGame(): Promise<void> {
    if (!sessionId || actionLoading) return;
    setActionLoading(true);
    try {
      // Save the bill amount before starting — guarantees it's persisted
      // even if the host taps Start before the input blurs naturally.
      const parsedBill = parseFloat(billAmount);
      const billToSave =
        isNaN(parsedBill) || parsedBill <= 0 ? null : parsedBill;
      await updateBillAmount(sessionId, billToSave);

      const { error: startError } = await startGame(sessionId);
      if (startError) {
        setActionLoading(false);
        if (Platform.OS === 'web') {
          Alert.alert('Error', startError.message);
        } else {
          Alert.alert('Error', startError.message);
        }
        return;
      }
      navigatedRef.current = true;
      navigateToWheel(sessionId);
    } catch {
      setActionLoading(false);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    }
  }

  const roomCode = session?.room_code ?? '------';
  const canStart =
    isHost && players.length >= 2 && !actionLoading && !anyOffline;

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.6 },
            ]}
            onPress={handleExit}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>

          {/* QR Code — coral background, white QR, encodes deep link */}
          <View style={styles.qrCard}>
            <QRCode
              value={Linking.createURL('(private)/joinSession/page', {
                queryParams: { mode: 'join', code: roomCode },
              })}
              size={148}
              color="#FFFFFF"
              backgroundColor="transparent"
            />
          </View>

          {/* Room Code */}
          <Text style={styles.roomLabel}>ROOM CODE</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>

          {/* Bill Amount Input */}
          <View style={{ width: '100%', marginBottom: 16 }}>
            <Text style={styles.optionalText}>OPTIONAL</Text>
            <View style={styles.billInput}>
              <Ionicons
                name="receipt-outline"
                size={18}
                color="#4A6CF7"
                style={styles.billIcon}
              />
              <TextInput
                style={styles.billText}
                placeholder="Pop in the bill amount"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                value={billAmount}
                onChangeText={setBillAmount}
                onBlur={handleBillBlur}
                onSubmitEditing={handleBillBlur}
                returnKeyType="done"
                editable={isHost}
              />
              {isHost && billAmount.trim().length > 0 ? (
                <Pressable
                  onPress={handleBillBlur}
                  style={({ pressed }) => [
                    styles.billDoneBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save bill amount"
                >
                  <Text style={styles.billDoneText}>Done</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Players Card */}
          <View style={styles.playersCard}>
            <Text style={styles.playersLabel}>PLAYER • {players.length}</Text>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={colors.ctaSolid}
                style={styles.loadingIndicator}
              />
            ) : (
              players.map((player) => (
                <View
                  key={player.id}
                  style={[
                    styles.rowWrapper,
                    isPlayerOffline.get(player.id) && styles.playerRowOffline,
                  ]}
                >
                  <View style={styles.playerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>
                        {player.player_name}
                      </Text>
                    </View>

                    {/* Offline badge — same style as Host badge */}
                    {isPlayerOffline.get(player.id) ? (
                      <View style={styles.offlineBadge}>
                        <Text style={styles.offlineBadgeText}>Offline</Text>
                      </View>
                    ) : null}

                    {/* Bot badge */}
                    {!player.user_id ? (
                      <View style={styles.botBadge}>
                        <Text style={styles.botBadgeText}>Bot</Text>
                      </View>
                    ) : null}

                    {/* Host badge */}
                    {player.is_host ? (
                      <View style={styles.hostBadge}>
                        <Text style={styles.hostBadgeText}>Host</Text>
                      </View>
                    ) : null}

                    {/* Trash icon — non-host rows only */}
                    {!player.is_host ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${player.player_name}`}
                        onPress={() =>
                          handleKickPlayer(player.id, player.player_name)
                        }
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={({ pressed }) => [pressed && { opacity: 0.5 }]}
                      >
                        <TrashIcon />
                      </Pressable>
                    ) : null}
                  </View>

                  {/* Toggle pill — floats outside right edge */}
                  {isHost && toggledIds.has(player.id) ? (
                    <TogglePill onPress={() => togglePlayer(player.id)} />
                  ) : null}
                </View>
              ))
            )}
          </View>

          {/* Waiting (non-host) */}
          {/* Waiting star — non-host only, sits above button */}
          {session && !isHost && !actionLoading ? (
            <View style={styles.waitingWrap}>
              <Image
                source={require('@/assets/images/success-star.gif')}
                style={styles.waitingStar}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* START GAME / WAITING button */}
          <Pressable
            disabled={!canStart}
            onPress={handleStartGame}
            style={({ pressed }) => [
              { width: '100%' },
              pressed &&
                canStart && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={
                canStart ? ['#F4736A', '#E8556A'] : ['#F4736A88', '#E8556A88']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.startBtnText}>
                  {!isHost
                    ? 'WAITING FOR HOST...'
                    : players.length < 2
                      ? 'NEED 2+ PLAYERS'
                      : anyOffline
                        ? 'WAITING FOR PLAYERS...'
                        : '+ START GAME'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* ADD MORE PLAYER — host only */}
          {isHost ? (
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
              ]}
              onPress={() =>
                sessionId &&
                router.push({
                  pathname: '/(private)/addPlayer/page',
                  params: { sessionId },
                } as never)
              }
            >
              <Text style={styles.addBtnText}>ADD MORE PLAYER</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
