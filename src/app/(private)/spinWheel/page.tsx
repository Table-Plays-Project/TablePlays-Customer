import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, BackHandler, View } from 'react-native';
import { Asset } from 'expo-asset';
import { router, useLocalSearchParams } from 'expo-router';

import { SpinWheelScreen } from '@/components/games/SpinWheel';
import EscapeChallenge from '@/components/games/SpinWheel/EscapeChallenge';
import type { WheelPlayer } from '@/components/games/SpinWheel';
import AuthContext from '@/contexts/auth';
import ProfileContext from '@/contexts/profile';
import AVATARS, { getAvatarById } from '@/constants/avatars';
import useGameSession from '@/hooks/game/useGameSession';
import {
  cancelGameSession,
  finishSession,
  kickOfflinePlayer,
  leaveGameSession,
  resetSessionToWaiting,
  resolveExpiredChallenge,
  spinWheel,
  submitEscapeAnswer,
} from '@/services/game';
import { ESCAPE_CHALLENGE } from '@/components/games/SpinWheel/wheelConfig';

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

  const { session, players, loading, error, refetch } =
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

  // Escape-challenge derived state. excluded_payer_ids being non-empty
  // means the current payer_index was reached via an internal escape
  // re-spin, not a fresh top-level spin_wheel call — so EVERY device
  // (host included) should passively animate to it rather than trigger
  // a brand new round, which would wipe the exclusion list.
  const excludedPayerIds = useMemo(
    () =>
      Array.isArray(session?.game_state?.excluded_payer_ids)
        ? (session.game_state.excluded_payer_ids as string[])
        : [],
    [session?.game_state?.excluded_payer_ids],
  );
  const isEscapeContinuation = excludedPayerIds.length > 0;
  const rawChallengeStatus = session?.game_state?.challenge_status;
  const rawChallengeDeadline = session?.game_state?.challenge_deadline;

  const prevRawStatusRef = useRef(rawChallengeStatus);
  if (__DEV__ && rawChallengeStatus && rawChallengeStatus !== prevRawStatusRef.current) {
    const secsLeft = rawChallengeDeadline
      ? Math.round((new Date(String(rawChallengeDeadline)).getTime() - Date.now()) / 1000)
      : 'N/A';
    console.log(
      `[Challenge] PAGE: status=${rawChallengeStatus} deadline=${String(rawChallengeDeadline)} secsLeft=${secsLeft}`,
    );
  }
  prevRawStatusRef.current = rawChallengeStatus;

  const challengeStatus =
    rawChallengeStatus === 'pending' || rawChallengeStatus === 'failed'
      ? rawChallengeStatus
      : null;
  const challengePlayerId =
    typeof session?.game_state?.challenge_player_id === 'string'
      ? session.game_state.challenge_player_id
      : null;
  const challengeStart =
    typeof session?.game_state?.challenge_start === 'number'
      ? session.game_state.challenge_start
      : null;
  const challengeStep =
    typeof session?.game_state?.challenge_step === 'number'
      ? session.game_state.challenge_step
      : null;
  const challengeDeadline =
    typeof session?.game_state?.challenge_deadline === 'string'
      ? session.game_state.challenge_deadline
      : null;

  const myPlayer = players.find((p) => p.user_id === user?.id) ?? null;
  const isChallengedPlayer =
    !!myPlayer && !!challengePlayerId && myPlayer.id === challengePlayerId;
  const challengedPlayer = challengePlayerId
    ? players.find((p) => p.id === challengePlayerId) ?? null
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

  // Background > 10 seconds → auto-redirect.
  // Host: cancel session + go to lobby. Player: leave + go to dashboard.
  const bgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!sessionId) return;

    const sub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'background' || state === 'inactive') {
          bgTimerRef.current = setTimeout(() => {
            if (navigatedAway.current) return;
            navigatedAway.current = true;
            if (isHost) {
              resetSessionToWaiting(sessionId)
                .catch(() => cancelGameSession(sessionId).catch(() => {}))
                .finally(() => {
                  router.replace({
                    pathname: '/(private)/lobby/page',
                    params: { sessionId },
                  } as never);
                });
            } else {
              leaveGameSession(sessionId).catch(() => {});
              router.replace('/(private)/dashboard/page');
            }
          }, 10_000);
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

  // Stable key that only changes when actual player IDs change (join/leave),
  // NOT on every poll that returns the same data with a new array reference.
  const playerKey = useMemo(
    () => players.map((p) => p.id).join(','),
    [players],
  );

  const prevPlayerCountRef = useRef(players.length);
  const prevPlayerNamesRef = useRef<string[]>([]);
  useEffect(() => {
    if (navigatedAway.current || !sessionId) return;

    const prevCount = prevPlayerCountRef.current;
    const prevNames = prevPlayerNamesRef.current;
    const currentNames = players.map((p) => p.player_name);

    if (prevCount > 0 && players.length < prevCount) {
      const left = prevNames.filter((n) => !currentNames.includes(n));
      if (left.length > 0 && isHost) {
        Alert.alert('Player Left', `${left.join(', ')} left the game.`);
      }
    }

    prevPlayerCountRef.current = players.length;
    prevPlayerNamesRef.current = currentNames;

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
  }, [playerKey, sessionId, isHost, session?.status]);

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
    //
    // Escape continuation (host included): the current payer_index was
    // produced by submit_escape_answer's internal re-spin, not a fresh
    // top-level spin. Calling spin_wheel here would start an unrelated
    // brand new round and wipe the exclusion list — every device must
    // just animate to the already-known cached index instead.
    if (
      (!isHost || isEscapeContinuation) &&
      payerIndex !== null &&
      payerIndex < players.length
    ) {
      return payerIndex;
    }

    // Host, fresh top-level spin: always call the RPC.
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
  }, [sessionId, payerIndex, players.length, isHost, isEscapeContinuation]);

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

  const handleSubmitEscapeAnswer = useCallback(
    async (answer: number): Promise<void> => {
      if (!sessionId) return;
      try {
        await submitEscapeAnswer(sessionId, answer);
      } catch (e) {
        // Best-effort — the next poll/broadcast will reconcile state
        // regardless of whether this specific call succeeded.
        console.error('submitEscapeAnswer failed:', e);
      }
    },
    [sessionId],
  );

  // Safety net: if the challenged player's device dies mid-countdown,
  // every OTHER device polling the session notices the deadline has
  // passed and finalizes it. Safe for multiple devices to race on this
  // — resolve_expired_challenge's atomic UPDATE...WHERE gate means only
  // the first call actually changes anything.
  const resolvedDeadlineRef = useRef<string | null>(null);
  useEffect(() => {
    if (challengeStatus !== 'pending' || !challengeDeadline || !sessionId) return;
    if (resolvedDeadlineRef.current === challengeDeadline) return;

    const msUntilCheck =
      new Date(challengeDeadline).getTime() - Date.now() + ESCAPE_CHALLENGE.GRACE_MS;

    const timer = setTimeout(() => {
      resolvedDeadlineRef.current = challengeDeadline;
      resolveExpiredChallenge(sessionId).catch((e) => {
        console.error('resolveExpiredChallenge failed:', e);
      });
    }, Math.max(0, msUntilCheck));

    return () => clearTimeout(timer);
  }, [challengeStatus, challengeDeadline, sessionId]);

  // Challenge screen — shown as a FULL PAGE REPLACEMENT, not an overlay
  const [showChallengeScreen, setShowChallengeScreen] = useState(false);

  const handleChallengeReady = useCallback((): void => {
    setShowChallengeScreen(true);
  }, []);

  // Reset challenge screen when challenge resolves
  useEffect(() => {
    if (challengeStatus !== 'pending') {
      setShowChallengeScreen(false);
    }
  }, [challengeStatus]);

  // Reset challenge screen when a new spin starts
  useEffect(() => {
    setShowChallengeScreen(false);
  }, [spinStartedAt]);

  // Database heartbeat detection. Each player updates last_active_at
  // via REST on every poll tick. When their app dies, updates stop,
  // the timestamp freezes, and we detect staleness from the polled
  // player data. No Presence dependency — pure database.
  const OFFLINE_THRESHOLD_MS = 10_000;
  const [offlineTick, setOfflineTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setOfflineTick((v) => v + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const offlinePlayers = useMemo(() => {
    const now = Date.now();
    return players.filter((p) => {
      if (p.user_id === user?.id) return false;
      if (!p.user_id) return false;
      if (!p.last_active_at) return false;
      return now - new Date(p.last_active_at).getTime() > OFFLINE_THRESHOLD_MS;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, user?.id, offlineTick]);

  const allPlayersOnline = offlinePlayers.length === 0;

  // Auto-kick offline players after 15 seconds (host only).
  // Handles force-close where the player's own cleanup never ran.
  const kickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHost || !sessionId || allPlayersOnline) {
      if (kickTimerRef.current) {
        clearTimeout(kickTimerRef.current);
        kickTimerRef.current = null;
      }
      return;
    }
    kickTimerRef.current = setTimeout(() => {
      offlinePlayers.forEach((p) => {
        kickOfflinePlayer(sessionId, p.id).catch((e) => {
          console.error('kickOfflinePlayer failed:', e);
        });
      });
    }, 15_000);
    return () => {
      if (kickTimerRef.current) clearTimeout(kickTimerRef.current);
    };
  }, [isHost, sessionId, allPlayersOnline, offlinePlayers]);

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
    <View style={{ flex: 1 }}>
    <SpinWheelScreen
      players={wheelPlayers}
      loading={loading}
      error={!!error}
      requestWinner={requestWinner}
      onBack={handleBack}
      onRetry={refetch}
      autoSpin={
        !!session &&
        isSpinning &&
        payerIndex !== null &&
        (!isHost || isEscapeContinuation)
      }
      canSpin={isHost && allPlayersOnline}
      spinKey={spinStartedAt}
      onResult={handleResult}
      onGameEnd={handleGameEnd}
      challengeStatus={challengeStatus}
      isChallengedPlayer={isChallengedPlayer}
      challengedPlayerName={challengedPlayer?.player_name ?? null}
      challengeStart={challengeStart}
      challengeStep={challengeStep}
      challengeDeadline={challengeDeadline}
      onSubmitEscapeAnswer={handleSubmitEscapeAnswer}
      onChallengeReady={handleChallengeReady}
      statusMessage={
        !allPlayersOnline && isHost
          ? `${offlinePlayers.map((p) => p.player_name).join(', ')} is not here`
          : null
      }
    />
    {showChallengeScreen &&
    challengeStatus === 'pending' &&
    isChallengedPlayer &&
    challengeStart !== null &&
    challengeStep !== null &&
    challengeDeadline ? (
      <EscapeChallenge
        start={challengeStart}
        step={challengeStep}
        deadline={challengeDeadline}
        playerName={challengedPlayer?.player_name ?? accountName}
        onAnswer={(value) => {
          void handleSubmitEscapeAnswer(value);
        }}
      />
    ) : null}
    </View>
  );
}
