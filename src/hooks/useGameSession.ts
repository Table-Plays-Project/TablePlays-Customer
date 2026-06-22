import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
  fetchGameSession,
  fetchSessionPlayers,
  subscribeToSessionChannel,
  type GameSession,
  type SessionPlayer,
} from '@/services/gameSessions';

type UseGameSessionReturn = {
  session: GameSession | null;
  players: SessionPlayer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export default function useGameSession(
  sessionId: string | null,
): UseGameSessionReturn {
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    try {
      const [sessionResult, playersResult] = await Promise.all([
        fetchGameSession(sessionId),
        fetchSessionPlayers(sessionId),
      ]);
      if (sessionResult.error) {
        setError(sessionResult.error.message);
      } else {
        setSession(sessionResult.session);
        setError(null);
      }
      if (!playersResult.error) {
        setPlayers(playersResult.players);
      }
    } catch (e) {
      console.error('useGameSession refetch failed:', e);
      setError('Failed to load session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    refetch();

    subscribeToSessionChannel(sessionId, () => {
      if (mounted) refetch();
    }).then((sub) => {
      if (mounted) {
        unsubscribeRef.current = sub.unsubscribe;
      } else {
        sub.unsubscribe();
      }
    });

    // Reconnect reconciliation (decision #4) — Realtime/Presence is never
    // trusted as the source of truth on its own. Every time the app comes
    // back to the foreground, do a real REST refetch, since iOS/Android
    // aggressively kill websockets while backgrounded and a missed
    // broadcast must never silently desync this screen.
    const appStateSub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          refetch();
        }
      },
    );

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      appStateSub.remove();
    };
  }, [sessionId, refetch]);

  return { session, players, loading, error, refetch };
}
