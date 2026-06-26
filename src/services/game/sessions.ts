import { supabase } from '@/lib/supabase';

import type {
  BroadcastPayload,
  GameSession,
  GameSessionError,
  HostType,
  SessionChannelSubscription,
  SessionPlayer,
} from './types';
import { safeErrorMessage } from './types';

export async function createGameSession(
  hostType: HostType,
  gameType: string,
  playerName: string,
  restaurantId: string | null = null,
  avatarId: string | null = null,
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
      p_avatar_id: avatarId,
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
  avatarId: string | null = null,
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
      p_avatar_id: avatarId,
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

export async function leaveGameSession(
  sessionId: string,
): Promise<{ error: GameSessionError | null }> {
  try {
    const { error } = await supabase.rpc('leave_game_session', {
      p_session_id: sessionId,
    });
    if (error) {
      return { error: safeErrorMessage(error, 'Failed to leave session.') };
    }
    return { error: null };
  } catch (e) {
    console.error('leaveGameSession failed:', e);
    return { error: { message: 'Failed to leave session.', code: null } };
  }
}

export async function cancelGameSession(
  sessionId: string,
): Promise<{ error: GameSessionError | null }> {
  try {
    const { error } = await supabase.rpc('cancel_game_session', {
      p_session_id: sessionId,
    });
    if (error) {
      return { error: safeErrorMessage(error, 'Failed to end session.') };
    }
    return { error: null };
  } catch (e) {
    console.error('cancelGameSession failed:', e);
    return { error: { message: 'Failed to end session.', code: null } };
  }
}

export async function resetSessionToWaiting(
  sessionId: string,
): Promise<{ error: GameSessionError | null }> {
  try {
    const { error } = await supabase.rpc('reset_session_to_waiting', {
      p_session_id: sessionId,
    });
    if (error) {
      return { error: safeErrorMessage(error, 'Failed to reset session.') };
    }
    return { error: null };
  } catch (e) {
    console.error('resetSessionToWaiting failed:', e);
    return { error: { message: 'Failed to reset session.', code: null } };
  }
}

export async function kickOfflinePlayer(
  sessionId: string,
  playerId: string,
): Promise<{ error: GameSessionError | null }> {
  try {
    const { error } = await supabase.rpc('kick_offline_player', {
      p_session_id: sessionId,
      p_player_id: playerId,
    });
    if (error) {
      return { error: safeErrorMessage(error, 'Failed to remove player.') };
    }
    return { error: null };
  } catch (e) {
    console.error('kickOfflinePlayer failed:', e);
    return { error: { message: 'Failed to remove player.', code: null } };
  }
}

export async function startGame(
  sessionId: string,
): Promise<{ error: GameSessionError | null }> {
  try {
    const { error } = await supabase.rpc('start_game', {
      p_session_id: sessionId,
    });
    if (error) {
      return { error: safeErrorMessage(error, 'Failed to start the game.') };
    }
    return { error: null };
  } catch (e) {
    console.error('startGame failed:', e);
    return { error: { message: 'Failed to start the game.', code: null } };
  }
}

export async function leaveAllActiveSessions(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('session_players')
      .select('session_id, is_host, game_sessions!inner(id, status, host_id)')
      .eq('user_id', user.id)
      .in('game_sessions.status', ['waiting', 'active', 'spinning']);

    if (!data || data.length === 0) return;

    for (const row of data) {
      const r = row as unknown as {
        session_id: string;
        is_host: boolean;
        game_sessions: { id: string; status: string; host_id: string };
      };
      try {
        if (r.game_sessions.host_id === user.id) {
          await supabase.rpc('cancel_game_session', { p_session_id: r.session_id });
        } else {
          await supabase.rpc('leave_game_session', { p_session_id: r.session_id });
        }
      } catch {
        // Best-effort per session
      }
    }
  } catch (e) {
    console.error('leaveAllActiveSessions failed:', e);
  }
}

export async function sendHeartbeat(sessionId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('session_players')
      .update({ last_active_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', user.id);
  } catch {
    // Non-critical — next tick retries
  }
}

export async function findActiveSession(): Promise<{
  sessionId: string | null;
  roomCode: string | null;
  status: string | null;
  isHost: boolean;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { sessionId: null, roomCode: null, status: null, isHost: false };

    const { data, error } = await supabase
      .from('session_players')
      .select('session_id, game_sessions!inner(id, room_code, status, host_id)')
      .eq('user_id', user.id)
      .in('game_sessions.status', ['waiting', 'active', 'spinning'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return { sessionId: null, roomCode: null, status: null, isHost: false };
    }

    const row = data[0] as unknown as {
      session_id: string;
      game_sessions: { id: string; room_code: string; status: string; host_id: string };
    };
    return {
      sessionId: row.session_id,
      roomCode: row.game_sessions.room_code,
      status: row.game_sessions.status,
      isHost: row.game_sessions.host_id === user.id,
    };
  } catch {
    return { sessionId: null, roomCode: null, status: null, isHost: false };
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
        'id, session_id, player_name, user_id, score, rank, is_payer, is_host, tip_percent, payment_method, avatar_id, last_active_at, created_at',
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

export type PresenceState = {
  userId: string;
  playerName: string;
  lastActive: number;
};

export type SessionChannelCallbacks = {
  onBroadcast: (payload: BroadcastPayload) => void;
  onPresenceSync?: (online: PresenceState[]) => void;
};

export async function subscribeToSessionChannel(
  sessionId: string,
  callbacks: SessionChannelCallbacks,
  trackAs?: PresenceState,
): Promise<SessionChannelSubscription> {
  await supabase.realtime.setAuth();

  const channel = supabase.channel(`session:${sessionId}`, {
    config: { private: true },
  });

  function handleBroadcast(raw: unknown): void {
    const p = raw as { payload?: Record<string, unknown> };
    const payload: BroadcastPayload = {
      table:
        typeof p?.payload?.table === 'string' ? p.payload.table : undefined,
      record:
        p?.payload?.record && typeof p.payload.record === 'object'
          ? (p.payload.record as Record<string, unknown>)
          : undefined,
    };
    if (__DEV__) {
      console.log(
        `[Broadcast] ${payload.table ?? '?'} event, status=${payload.record?.status ?? '?'}`,
      );
    }
    callbacks.onBroadcast(payload);
  }

  function handlePresenceSync(): void {
    if (!callbacks.onPresenceSync) return;
    const state = channel.presenceState<PresenceState>();
    const online: PresenceState[] = [];
    Object.values(state).forEach((presences) => {
      (presences as PresenceState[]).forEach((p) => {
        if (p.userId) online.push(p);
      });
    });
    if (__DEV__) {
      console.log(
        `[Presence] sync — ${online.length} online: ${online.map((p) => p.playerName).join(', ')}`,
      );
    }
    callbacks.onPresenceSync(online);
  }

  channel
    .on('broadcast', { event: 'INSERT' }, handleBroadcast)
    .on('broadcast', { event: 'UPDATE' }, handleBroadcast)
    .on('broadcast', { event: 'DELETE' }, handleBroadcast)
    .on('presence', { event: 'sync' }, handlePresenceSync)
    .subscribe(async (status, err) => {
      if (__DEV__) {
        console.log(
          `[Channel] subscribe: ${status}${err ? ` — ${err.message}` : ''}`,
        );
      }
      if (status === 'SUBSCRIBED' && trackAs) {
        await channel.track({ ...trackAs, lastActive: Date.now() });
        if (__DEV__) {
          console.log(`[Presence] tracking as ${trackAs.playerName}`);
        }
      }
    });

  return {
    unsubscribe: () => {
      channel.untrack();
      supabase.removeChannel(channel);
    },
    untrack: () => {
      channel.untrack();
    },
    retrack: () => {
      if (trackAs) channel.track({ ...trackAs, lastActive: Date.now() });
    },
    getPresenceState: (): PresenceState[] => {
      const state = channel.presenceState<PresenceState>();
      const result: PresenceState[] = [];
      Object.values(state).forEach((presences) => {
        (presences as PresenceState[]).forEach((p) => {
          if (p.userId) result.push(p);
        });
      });
      return result;
    },
  };
}
