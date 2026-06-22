import { supabase } from '@/lib/supabase';

export type GameSessionError = { message: string; code: string | null };

export type HostType = 'restaurant' | 'customer';

export type GameSessionStatus =
  | 'waiting'
  | 'active'
  | 'spinning'
  | 'finished'
  | 'abandoned';

export type GameSession = {
  id: string;
  room_code: string;
  host_id: string | null;
  host_type: HostType;
  restaurant_id: string | null;
  game_type: string;
  bill_amount: number | null;
  status: GameSessionStatus;
  game_state: { phase: string; round: number } & Record<string, unknown>;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
};

export type SessionPlayer = {
  id: string;
  session_id: string;
  player_name: string;
  user_id: string | null;
  score: number;
  rank: number | null;
  is_payer: boolean;
  is_host: boolean;
  tip_percent: number | null;
  payment_method: string | null;
  created_at: string;
};

function safeErrorMessage(error: unknown, fallback: string): GameSessionError {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: unknown }).message;
    const code =
      'code' in error && typeof (error as { code: unknown }).code === 'string'
        ? (error as { code: string }).code
        : null;
    if (typeof msg === 'string' && msg.length < 200) {
      return { message: msg, code };
    }
  }
  return { message: fallback, code: null };
}

export async function createGameSession(
  hostType: HostType,
  gameType: string,
  playerName: string,
  restaurantId: string | null = null,
): Promise<{
  sessionId: string | null;
  roomCode: string | null;
  playerId: string | null;
  error: GameSessionError | null;
}> {
  try {
    const { data, error } = await supabase.rpc('create_game_session', {
      p_host_type: hostType,
      p_game_type: gameType,
      p_player_name: playerName,
      p_restaurant_id: restaurantId,
    });
    if (error) {
      return {
        sessionId: null,
        roomCode: null,
        playerId: null,
        error: safeErrorMessage(error, 'Failed to create game session.'),
      };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      sessionId: row?.session_id ?? null,
      roomCode: row?.room_code ?? null,
      playerId: row?.player_id ?? null,
      error: null,
    };
  } catch (e) {
    console.error('createGameSession failed:', e);
    return {
      sessionId: null,
      roomCode: null,
      playerId: null,
      error: { message: 'Failed to create game session.', code: null },
    };
  }
}

export async function joinGameSession(
  roomCode: string,
  playerName: string,
): Promise<{
  sessionId: string | null;
  playerId: string | null;
  isHost: boolean;
  error: GameSessionError | null;
}> {
  try {
    const { data, error } = await supabase.rpc('join_game_session', {
      p_room_code: roomCode,
      p_player_name: playerName,
    });
    if (error) {
      return {
        sessionId: null,
        playerId: null,
        isHost: false,
        error: safeErrorMessage(error, 'Failed to join game session.'),
      };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      sessionId: row?.session_id ?? null,
      playerId: row?.player_id ?? null,
      isHost: row?.is_host ?? false,
      error: null,
    };
  } catch (e) {
    console.error('joinGameSession failed:', e);
    return {
      sessionId: null,
      playerId: null,
      isHost: false,
      error: { message: 'Failed to join game session.', code: null },
    };
  }
}

export async function fetchGameSession(
  sessionId: string,
): Promise<{ session: GameSession | null; error: GameSessionError | null }> {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (error) {
      return {
        session: null,
        error: safeErrorMessage(error, 'Failed to load game session.'),
      };
    }
    return { session: data as GameSession | null, error: null };
  } catch (e) {
    console.error('fetchGameSession failed:', e);
    return {
      session: null,
      error: { message: 'Failed to load game session.', code: null },
    };
  }
}

export async function fetchSessionPlayers(
  sessionId: string,
): Promise<{ players: SessionPlayer[]; error: GameSessionError | null }> {
  try {
    const { data, error } = await supabase
      .from('session_players')
      .select(
        'id, session_id, player_name, user_id, score, rank, is_payer, is_host, tip_percent, payment_method, created_at',
      )
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) {
      return {
        players: [],
        error: safeErrorMessage(error, 'Failed to load players.'),
      };
    }
    return { players: (data ?? []) as SessionPlayer[], error: null };
  } catch (e) {
    console.error('fetchSessionPlayers failed:', e);
    return {
      players: [],
      error: { message: 'Failed to load players.', code: null },
    };
  }
}

export type SessionChannelSubscription = {
  unsubscribe: () => void;
};

/**
 * Subscribes to the Broadcast-from-Database channel for a session
 * (`session:{id}`), per GAME_SESSION_MODEL.md decision #3. The broadcast
 * payload shape from realtime.broadcast_changes() is not fully documented,
 * so it is never parsed directly here — every event, regardless of which
 * table or operation triggered it, is treated purely as a "something
 * changed, go refetch" signal. This extends the same reconciliation
 * principle already required for reconnects (decision #4) to live updates.
 */
export async function subscribeToSessionChannel(
  sessionId: string,
  onChange: () => void,
): Promise<SessionChannelSubscription> {
  await supabase.realtime.setAuth();
  // Channels receiving Broadcast-from-Database messages (authorized via the
  // RLS policy on realtime.messages) must be subscribed as private — the
  // default public broadcast namespace never receives them, per Supabase's
  // Broadcast-from-Database docs. Confirmed via integration test: without
  // `private: true`, the subscriber received zero broadcasts despite the
  // DB trigger and RLS policy both being correctly in place.
  const channel = supabase.channel(`session:${sessionId}`, {
    config: { private: true },
  });
  channel
    .on('broadcast', { event: 'INSERT' }, onChange)
    .on('broadcast', { event: 'UPDATE' }, onChange)
    .on('broadcast', { event: 'DELETE' }, onChange)
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
