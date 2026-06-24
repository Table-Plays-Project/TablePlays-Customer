import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, BackHandler } from 'react-native';
import { Asset } from 'expo-asset';
import { router, useLocalSearchParams } from 'expo-router';

import { SpinWheelScreen } from '@/components/games/SpinWheel';
import type { WheelPlayer } from '@/components/games/SpinWheel';
import AuthContext from '@/contexts/auth';
import ProfileContext from '@/contexts/profile';
import AVATARS, { getAvatarById } from '@/constants/avatars';
import useGameSession from '@/hooks/game/useGameSession';
import {
  cancelGameSession,
  finishSession,
  leaveGameSession,
  resetSessionToWaiting,
  spinWheel,
} from '@/services/game';

const avatarAssetMap = new Map<string, number>();
AVATARS.forEach((a) => {
  avatarAssetMap.set(a.id, a.source as number);
});

function useAvatarUris(avatarIds: string[]): Map<string, string> {
  const [uriMap, setUriMap] = useState<Map<string, string>>(new Map());
  const loadedRef = useRef(new Set<string>());

  useEffect(() => {
    const toLoad = avatarIds.filter(
      (id) => !loadedRef.current.has(id) && avatarAssetMap.has(id),
    );
    if (toLoad.length === 0) return;

    Promise.all(
      toLoad.map(async (id) => {
        const source = avatarAssetMap.get(id)!;
        const asset = Asset.fromModule(source);
        await asset.downloadAsync();
        return { id, uri: asset.localUri ?? asset.uri };
      }),
    ).then((results) => {
      setUriMap((prev) => {
        const next = new Map(prev);
        results.forEach((r) => {
          if (r.uri) {
            next.set(r.id, r.uri);
            loadedRef.current.add(r.id);
          }
        });
        return next;
      });
    });
  }, [avatarIds.join(',')]);

  return uriMap;
}

export default function SpinWheelPage(): JSX.Element {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user } = AuthContext.useAuth();
  const { profileImage, avatarSource } = ProfileContext.useProfile();
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
  const navigatedAway = useRef(false);

  const isHost = session?.host_id === user?.id;
  const isSpinning = session?.status === 'spinning';
  const payerIndex =
    typeof session?.game_state?.payer_index === 'number'
      ? session.game_state.payer_index
      : null;
  const spinStartedAt =
    typeof session?.game_state?.spin_started_at === 'string'
      ? session.game_state.spin_started_at
      : null;

  useEffect(() => {
    if (__DEV__) console.log('[Screen] SpinWheelPage MOUNTED');
    return () => {
      if (__DEV__) console.log('[Screen] SpinWheelPage UNMOUNTED');
      if (!navigatedAway.current && sessionId) {
        if (isHost) {
          cancelGameSession(sessionId).catch(() => {});
        } else {
          leaveGameSession(sessionId).catch(() => {});
        }
      }
    };
  }, [sessionId, isHost]);

  // Host background cleanup — if the host's app goes to background
  // for more than 15 seconds, auto-cancel the session so other
  // players aren't stuck waiting forever. Handles the common case
  // of host switching apps and forgetting. Force-kill (swiping away)
  // requires server-side cleanup (pg_cron, documented as unbuilt).
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

  // Detect host disconnect via presence
  const hostId = session?.host_id;
  useEffect(() => {
    if (navigatedAway.current || !hostId || isHost) return;
    if (onlineUserIds.length > 0 && !onlineUserIds.includes(hostId)) {
      if (__DEV__) console.log('[Presence] Host disconnected — leaving');
      navigatedAway.current = true;
      router.replace('/(private)/dashboard/page');
    }
  }, [onlineUserIds, hostId, isHost]);

  // When host presses "Back to Lobby", status resets to 'waiting'.
  // Non-host players should follow back to lobby too.
  useEffect(() => {
    if (navigatedAway.current || !sessionId || isHost) return;
    if (session?.status === 'waiting') {
      navigatedAway.current = true;
      if (__DEV__) console.log('[Screen] SpinWheelPage → Lobby (host went back to lobby)');
      router.replace({
        pathname: '/(private)/lobby/page',
        params: { sessionId },
      } as never);
    }
  }, [session?.status, sessionId, isHost]);

  useEffect(() => {
    if (navigatedAway.current) return;
    if (session?.status === 'abandoned' || session?.status === 'finished') {
      navigatedAway.current = true;
      if (__DEV__) console.log(`[Screen] SpinWheelPage → Dashboard (${session.status})`);
      router.replace('/(private)/dashboard/page');
    }
  }, [session?.status]);

  // Track player changes — notify host when someone leaves, and
  // redirect host to lobby if count drops below 2.
  const prevPlayerCountRef = useRef(players.length);
  const prevPlayerNamesRef = useRef<string[]>([]);
  useEffect(() => {
    if (navigatedAway.current || !sessionId) return;

    const prevCount = prevPlayerCountRef.current;
    const prevNames = prevPlayerNamesRef.current;
    const currentNames = players.map((p) => p.player_name);

    // Detect who left
    if (prevCount > 0 && players.length < prevCount) {
      const left = prevNames.filter((n) => !currentNames.includes(n));
      if (left.length > 0 && isHost) {
        Alert.alert('Player Left', `${left.join(', ')} left the game.`);
      }
    }

    prevPlayerCountRef.current = players.length;
    prevPlayerNamesRef.current = currentNames;

    // Host goes back to lobby if not enough players — reset status
    // to 'waiting' first so the lobby can accept new joins.
    if (players.length > 0 && players.length < 2 && isHost && session?.status !== 'finished') {
      navigatedAway.current = true;
      if (__DEV__) console.log('[Screen] SpinWheelPage → Lobby (not enough players)');
      resetSessionToWaiting(sessionId).then(() => {
        router.replace({
          pathname: '/(private)/lobby/page',
          params: { sessionId },
        } as never);
      });
    }
  }, [players.length, players, sessionId, isHost, session?.status]);

  const avatarIds = useMemo(
    () =>
      players
        .map((p) => p.avatar_id)
        .filter((id): id is string => id !== null),
    [players],
  );
  const avatarUris = useAvatarUris(avatarIds);

  // Resolve the current user's avatar from ProfileContext (local)
  // since their own asset might not be in the avatarUris map yet.
  const myLocalAvatarUri = useMemo((): string | null => {
    if (profileImage) return profileImage;
    if (avatarSource) {
      try {
        const asset = Asset.fromModule(avatarSource as number);
        return asset.localUri ?? asset.uri ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }, [profileImage, avatarSource]);

  const wheelPlayers: WheelPlayer[] = useMemo(() => {
    const result = players.map((p) => {
      let uri: string | null = null;

      if (p.user_id === user?.id) {
        uri = myLocalAvatarUri;
      } else if (p.avatar_id) {
        uri = avatarUris.get(p.avatar_id) ?? null;
      }

      return {
        id: p.id,
        name: p.player_name,
        avatarUri: uri,
        avatarSource: null,
      };
    });
    if (__DEV__ && result.length > 0) {
      console.log(
        `[WheelPlayers] ${result.length} players: ${result.map((p) => `${p.name}=${p.avatarUri ? 'HAS_AVATAR' : 'NO_AVATAR'}`).join(', ')}`,
      );
    }
    return result;
  }, [players, user?.id, profileImage, avatarUris]);

  const requestWinner = useCallback(async (): Promise<number> => {
    // Joiner: use the server-determined index already in game_state.
    // Never call the RPC from the joiner — it would pick a DIFFERENT
    // winner than what the host triggered.
    if (!isHost && payerIndex !== null && payerIndex < players.length) {
      return payerIndex;
    }

    // Host: always call the RPC (first spin AND re-spin).
    // The cached payerIndex is the PREVIOUS winner — re-spin needs a
    // fresh server call to determine a new one.
    if (!sessionId) throw new Error('No session');
    const result = await spinWheel(sessionId);
    if (result.error || result.payerIndex === null) {
      throw new Error(result.error?.message ?? 'Spin failed');
    }
    if (result.payerIndex >= players.length) {
      throw new Error('Player list out of sync. Please retry.');
    }
    return result.payerIndex;
  }, [sessionId, payerIndex, players.length, isHost]);

  async function doLeave(): Promise<void> {
    if (navigatedAway.current) return;
    navigatedAway.current = true;
    try {
      if (sessionId) await leaveGameSession(sessionId);
    } catch {
      // Best-effort
    }
    router.replace('/(private)/dashboard/page');
  }

  async function doHostExit(): Promise<void> {
    if (navigatedAway.current) return;
    navigatedAway.current = true;
    try {
      if (sessionId) {
        if (session?.status === 'spinning') {
          await finishSession(sessionId);
        } else {
          await cancelGameSession(sessionId);
        }
      }
    } catch {
      // Best-effort
    }
    router.replace('/(private)/dashboard/page');
  }

  async function doBackToLobby(): Promise<void> {
    if (navigatedAway.current || !sessionId) return;
    navigatedAway.current = true;
    try {
      await resetSessionToWaiting(sessionId);
    } catch {
      // Best-effort
    }
    router.replace({
      pathname: '/(private)/lobby/page',
      params: { sessionId },
    } as never);
  }

  function handleBack(): void {
    if (isHost) {
      Alert.alert(
        'Game Options',
        'What would you like to do?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Back to Lobby', onPress: doBackToLobby },
          { text: 'End Game', style: 'destructive', onPress: doHostExit },
        ],
      );
      return;
    }
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: doLeave },
      ],
    );
  }

  // Intercept Android hardware back button — route through our
  // cleanup handler instead of letting Expo Router pop the screen
  // without calling cancelGameSession/finishSession.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  });

  const handleResult = useCallback(
    (_payerIdx: number): void => {
      // Don't auto-finish here — status stays 'spinning' so host
      // can tap "Spin Again" for another round. The host finishes
      // the game explicitly via the back button or "Done" in the modal.
    },
    [],
  );

  function handleGameEnd(): void {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: doLeave },
      ],
    );
  }

  return (
    <SpinWheelScreen
      players={wheelPlayers}
      loading={loading}
      error={!!error}
      requestWinner={requestWinner}
      onBack={handleBack}
      onRetry={refetch}
      autoSpin={!!session && isSpinning && payerIndex !== null && !isHost}
      canSpin={isHost}
      spinKey={spinStartedAt}
      onResult={handleResult}
      onGameEnd={handleGameEnd}
    />
  );
}
