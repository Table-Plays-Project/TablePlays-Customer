import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  fetchGameSession,
  fetchSessionPlayers,
  sendHeartbeat,
  subscribeToSessionChannel,
  type BroadcastPayload,
  type GameSession,
  type PresenceState,
  type SessionPlayer,
} from '@/services/game';

type PlayerPresence = { userId: string; lastActive: number };

type UseGameSessionReturn = {
  session: GameSession | null;
  players: SessionPlayer[];
  onlineUserIds: string[];
  playerPresence: PlayerPresence[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const POLL_NORMAL_MS = 1500;
const POLL_FAST_MS = 500;
const PLAYER_LIST_POLL_MS = 3000;
const MAX_CONSECUTIVE_ERRORS = 3;

export default function useGameSession(
  sessionId: string | null,
  trackUserId?: string | null,
  trackPlayerName?: string | null,
): UseGameSessionReturn {
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [playerPresence, setPlayerPresence] = useState<PlayerPresence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const untrackRef = useRef<(() => void) | null>(null);
  const retrackRef = useRef<(() => void) | null>(null);
  const getPresenceRef = useRef<(() => PresenceState[]) | null>(null);
  const errorCountRef = useRef(0);
  const lastStatusRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySession = useCallback(
    (next: GameSession | null, source: string): void => {
      if (!next) return;
      const newStatus = next.status ?? null;
      if (newStatus !== lastStatusRef.current) {
        if (__DEV__) {
          console.log(`[GameSession] status ${lastStatusRef.current} → ${newStatus} via ${source}`);
        }
        lastStatusRef.current = newStatus;
      }
      errorCountRef.current = 0;
      setSession(next);
      setError(null);
    },
    [],
  );

  const refetchSession = useCallback(
    async (source: string): Promise<void> => {
      if (!sessionId) return;
      try {
        const result = await fetchGameSession(sessionId);
        if (result.error) {
          errorCountRef.current += 1;
          if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
            setError(result.error.message);
          }
        } else if (result.session) {
          applySession(result.session, source);
        }
      } catch {
        errorCountRef.current += 1;
        if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
          setError('Connection lost. Please check your network.');
        }
      }
    },
    [sessionId, applySession],
  );

  const refetchPlayers = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    try {
      const result = await fetchSessionPlayers(sessionId);
      if (!result.error) {
        if (__DEV__) {
          console.log(`[GameSession] refetchPlayers: ${result.players.length} players`);
        }
        setPlayers(result.players);
      }
    } catch {
      // non-critical
    }
  }, [sessionId]);

  const refetchAll = useCallback(
    async (source: string): Promise<void> => {
      await Promise.all([refetchSession(source), refetchPlayers()]);
      setLoading(false);
    },
    [refetchSession, refetchPlayers],
  );

  // Store callbacks in refs to keep the main effect stable
  const applySessionRef = useRef(applySession);
  applySessionRef.current = applySession;
  const refetchPlayersRef = useRef(refetchPlayers);
  refetchPlayersRef.current = refetchPlayers;
  const refetchAllRef = useRef(refetchAll);
  refetchAllRef.current = refetchAll;

  // Adaptive polling
  const currentStatus = session?.status;
  useEffect(() => {
    if (!sessionId) return;
    const isFastPhase = currentStatus === 'active' || currentStatus === 'spinning';
    const interval = isFastPhase ? POLL_FAST_MS : POLL_NORMAL_MS;

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      refetchSession('poll');
      retrackRef.current?.();
      sendHeartbeat(sessionId);
    }, interval);

    if (__DEV__) {
      console.log(`[GameSession] polling at ${interval}ms (status=${currentStatus ?? 'null'})`);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [sessionId, currentStatus, refetchSession]);

  // Main subscription — deps are only primitives (no objects/callbacks)
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    if (__DEV__) console.log(`[GameSession] hook effect START (session=${sessionId})`);
    refetchAllRef.current('initial');

    const presenceTrack: PresenceState | undefined =
      trackUserId && trackPlayerName
        ? { userId: trackUserId, playerName: trackPlayerName, lastActive: Date.now() }
        : undefined;

    subscribeToSessionChannel(
      sessionId,
      {
        onBroadcast: (payload: BroadcastPayload) => {
          if (!mounted) return;
          if (payload.table === 'game_sessions' && payload.record) {
            if (typeof payload.record.status === 'string') {
              applySessionRef.current(
                payload.record as unknown as GameSession,
                'broadcast',
              );
            }
          } else if (payload.table === 'session_players') {
            refetchPlayersRef.current();
          } else {
            refetchAllRef.current('broadcast');
          }
        },
        onPresenceSync: (online: PresenceState[]) => {
          if (!mounted) return;
          setOnlineUserIds(online.map((p) => p.userId));
          setPlayerPresence(
            online.map((p) => ({
              userId: p.userId,
              lastActive: p.lastActive ?? Date.now(),
            })),
          );
        },
      },
      presenceTrack,
    ).then((sub) => {
      if (mounted) {
        unsubscribeRef.current = sub.unsubscribe;
        untrackRef.current = sub.untrack;
        retrackRef.current = sub.retrack;
        getPresenceRef.current = sub.getPresenceState;
      } else {
        sub.unsubscribe();
      }
    });

    const playerListPoll = setInterval(() => {
      if (mounted) refetchPlayersRef.current();
    }, PLAYER_LIST_POLL_MS);

    const appStateSub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          retrackRef.current?.();
          refetchAllRef.current('foreground');
        } else if (state === 'background' || state === 'inactive') {
          untrackRef.current?.();
        }
      },
    );

    return () => {
      if (__DEV__) console.log(`[GameSession] hook effect CLEANUP (session=${sessionId})`);
      mounted = false;
      clearInterval(playerListPoll);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      untrackRef.current = null;
      retrackRef.current = null;
      getPresenceRef.current = null;
      appStateSub.remove();
    };
  }, [sessionId, trackUserId, trackPlayerName]);

  return {
    session,
    players,
    onlineUserIds,
    playerPresence,
    loading,
    error,
    refetch: () => refetchAll('manual'),
  };
}
