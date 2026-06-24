import { useEffect, useRef, useState } from 'react';
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
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/AppBackground';
import BubbleHeading from '@/components/BubbleHeading';
import { NavigationButton } from '@/components/buttons';
import AuthContext from '@/contexts/auth';
import useGameSession from '@/hooks/game/useGameSession';
import {
  cancelGameSession,
  leaveGameSession,
  startGame,
} from '@/services/game';
import { colors, fontSize } from '@/constants/theme';

import styles from './styles';

function initialsFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function navigateToWheel(sid: string): void {
  router.replace({
    pathname: '/(private)/spinWheel/page',
    params: { sessionId: sid },
  } as never);
}

function navigateToDashboard(): void {
  router.replace('/(private)/dashboard/page');
}

export default function LobbyPage(): JSX.Element {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user } = AuthContext.useAuth();
  const accountName =
    user?.user_metadata?.first_name ??
    user?.user_metadata?.name ??
    'Player';

  const { session, players, onlineUserIds, loading, error, refetch } =
    useGameSession(
      sessionId ?? null,
      user?.id ?? null,
      accountName,
    );
  const [actionLoading, setActionLoading] = useState(false);
  const isHost = session?.host_id === user?.id;
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (__DEV__) console.log('[Screen] LobbyPage MOUNTED');
    return () => {
      if (__DEV__) console.log('[Screen] LobbyPage UNMOUNTED');
      if (!navigatedRef.current && sessionId) {
        if (isHost) {
          cancelGameSession(sessionId).catch(() => {});
        } else {
          leaveGameSession(sessionId).catch(() => {});
        }
      }
    };
  }, [sessionId, isHost]);

  const bgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHost || !sessionId) return;
    const sub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
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
      },
    );
    return () => {
      sub.remove();
      if (bgTimerRef.current) clearTimeout(bgTimerRef.current);
    };
  }, [isHost, sessionId]);

  // Detect host disconnect via presence — if host leaves, redirect
  const hostId = session?.host_id;
  useEffect(() => {
    if (navigatedRef.current || !hostId || isHost) return;
    if (onlineUserIds.length > 0 && !onlineUserIds.includes(hostId)) {
      if (__DEV__) console.log('[Presence] Host disconnected — leaving');
      navigatedRef.current = true;
      navigateToDashboard();
    }
  }, [onlineUserIds, hostId, isHost]);

  useEffect(() => {
    if (navigatedRef.current || !sessionId) return;
    const status = session?.status;
    if ((status === 'active' || status === 'spinning') && players.length >= 2) {
      navigatedRef.current = true;
      if (__DEV__) console.log('[Screen] LobbyPage → navigating to SpinWheel');
      navigateToWheel(sessionId);
    }
    if (status === 'abandoned' || status === 'finished') {
      navigatedRef.current = true;
      if (__DEV__) console.log('[Screen] LobbyPage → navigating to Dashboard (session ended)');
      navigateToDashboard();
    }
  }, [session?.status, sessionId, players.length]);

  async function doHostExit(): Promise<void> {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (sessionId) await cancelGameSession(sessionId);
    } catch {
      // Best-effort
    }
    navigateToDashboard();
  }

  async function doPlayerLeave(): Promise<void> {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (sessionId) await leaveGameSession(sessionId);
    } catch {
      // Best-effort
    }
    navigateToDashboard();
  }

  function handleExit(): void {
    if (isHost) {
      doHostExit();
      return;
    }
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: doPlayerLeave },
      ],
    );
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });
    return () => sub.remove();
  });

  async function handleStartGame(): Promise<void> {
    if (!sessionId || actionLoading) return;
    setActionLoading(true);
    try {
      const { error: startError } = await startGame(sessionId);
      if (startError) {
        setActionLoading(false);
        if (Platform.OS === 'web') {
          alert(startError.message);
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
    isHost && players.length >= 2 && !actionLoading;

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
              onPress={handleExit}
              arrow="arrow-back"
            />
            <BubbleHeading
              text="GAME LOBBY"
              fontSize={fontSize['2xl']}
              align="center"
            />
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.roomCodeCard}>
            <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
            <Text style={styles.roomCodeValue}>{roomCode}</Text>
            <Text style={styles.roomCodeHint}>
              Share this code with friends to join
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.textInverse}
              />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={refetch} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>PLAYERS ({players.length})</Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.textInverse}
              style={styles.loadingIndicator}
            />
          ) : (
            <View style={styles.playersList}>
              {players.map((player) => (
                <View key={player.id} style={styles.playerRow}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {initialsFor(player.player_name)}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>{player.player_name}</Text>
                  {player.is_host ? (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>HOST</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {session && !isHost && !actionLoading ? (
            <View style={styles.waitingWrap}>
              <Image
                source={require('@/assets/images/success-star.gif')}
                style={styles.waitingStar}
                resizeMode="contain"
              />
              <Text style={styles.waitingText}>
                Waiting for host to start...
              </Text>
            </View>
          ) : null}

          <Pressable
            disabled={!canStart}
            onPress={handleStartGame}
            style={({ pressed }) => [
              styles.startButton,
              !canStart && styles.startButtonDisabled,
              pressed && canStart && styles.startButtonPressed,
            ]}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.startButtonText}>
                {!isHost
                  ? 'WAITING FOR HOST...'
                  : players.length < 2
                    ? 'NEED 2+ PLAYERS'
                    : 'START GAME'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
