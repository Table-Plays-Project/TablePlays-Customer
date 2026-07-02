import { supabase } from '@/lib/supabase';

export type GameHistoryError = { message: string; code: string | null };

export type GameHistoryEntry = {
  sessionId: string;
  gameType: string;
  endedAt: string | null;
  billAmount: number | null;
  payerName: string | null;
  payerAvatarId: string | null;
  payerIsBot: boolean;
  paymentMethod: string | null;
  tipPercent: number | null;
};

type SessionRow = {
  session_id: string;
  game_sessions: {
    id: string;
    game_type: string;
    status: string;
    bill_amount: number | null;
    ended_at: string | null;
  } | null;
};

type PayerRow = {
  session_id: string;
  player_name: string;
  avatar_id: string | null;
  user_id: string | null;
  payment_method: string | null;
  tip_percent: number | null;
};

export type GameHistoryParticipant = {
  id: string;
  name: string;
  avatarId: string | null;
  isPayer: boolean;
  isBot: boolean;
};

export type GameHistoryDetail = {
  sessionId: string;
  gameType: string;
  endedAt: string | null;
  billAmount: number | null;
  paymentMethod: string | null;
  tipPercent: number | null;
  location: string | null;
  payer: GameHistoryParticipant | null;
  participants: GameHistoryParticipant[];
};

type FullPlayerRow = {
  id: string;
  player_name: string;
  avatar_id: string | null;
  user_id: string | null;
  is_payer: boolean;
  payment_method: string | null;
  tip_percent: number | null;
};

export const GAME_HISTORY_PAGE_SIZE = 20;

export async function getGameHistory(
  offset = 0,
  limit = GAME_HISTORY_PAGE_SIZE,
): Promise<{
  entries: GameHistoryEntry[];
  hasMore: boolean;
  error: GameHistoryError | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return {
        entries: [],
        hasMore: false,
        error: { message: 'Not authenticated.', code: null },
      };

    // Server-side ordering + range: the DB does the sort and only the
    // requested page crosses the wire, so this stays fast no matter how
    // many games a user has played over time.
    const { data, error } = await supabase
      .from('session_players')
      .select(
        'session_id, game_sessions!inner(id, game_type, status, bill_amount, ended_at)',
      )
      .eq('user_id', user.id)
      .eq('game_sessions.status', 'finished')
      .eq('hidden_from_history', false)
      .order('ended_at', { foreignTable: 'game_sessions', ascending: false })
      .range(offset, offset + limit - 1)
      .returns<SessionRow[]>();

    if (error) {
      return {
        entries: [],
        hasMore: false,
        error: { message: error.message, code: error.code },
      };
    }

    const rows = (data ?? []).filter((r) => r.game_sessions !== null);
    const hasMore = rows.length === limit;

    if (rows.length === 0) {
      return { entries: [], hasMore: false, error: null };
    }

    // Bounded by the page size (max 20 ids), never by total history size.
    const sessionIds = rows.map((r) => r.session_id);
    const { data: payerRows } = await supabase
      .from('session_players')
      .select(
        'session_id, player_name, avatar_id, user_id, payment_method, tip_percent',
      )
      .in('session_id', sessionIds)
      .eq('is_payer', true)
      .returns<PayerRow[]>();

    const payerMap = new Map<string, PayerRow>();
    (payerRows ?? []).forEach((p) => payerMap.set(p.session_id, p));

    const entries: GameHistoryEntry[] = rows.map((r) => {
      const session = r.game_sessions!;
      const payer = payerMap.get(r.session_id);
      return {
        sessionId: session.id,
        gameType: session.game_type,
        endedAt: session.ended_at,
        billAmount: session.bill_amount,
        payerName: payer?.player_name ?? null,
        payerAvatarId: payer?.avatar_id ?? null,
        payerIsBot: !!payer && payer.user_id === null,
        paymentMethod: payer?.payment_method ?? null,
        tipPercent: payer?.tip_percent ?? null,
      };
    });

    return { entries, hasMore, error: null };
  } catch (e) {
    console.error('getGameHistory failed:', e);
    return {
      entries: [],
      hasMore: false,
      error: { message: 'Failed to load game history.', code: null },
    };
  }
}

export async function getGameHistoryDetail(sessionId: string): Promise<{
  detail: GameHistoryDetail | null;
  error: GameHistoryError | null;
}> {
  try {
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('id, game_type, bill_amount, ended_at')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError) {
      return {
        detail: null,
        error: { message: sessionError.message, code: sessionError.code },
      };
    }
    if (!session) {
      return {
        detail: null,
        error: { message: 'Game session not found.', code: null },
      };
    }

    const { data: playerRows, error: playersError } = await supabase
      .from('session_players')
      .select(
        'id, player_name, avatar_id, user_id, is_payer, payment_method, tip_percent',
      )
      .eq('session_id', sessionId)
      .returns<FullPlayerRow[]>();

    if (playersError) {
      return {
        detail: null,
        error: { message: playersError.message, code: playersError.code },
      };
    }

    const players = (playerRows ?? []).map((p) => ({
      id: p.id,
      name: p.player_name,
      avatarId: p.avatar_id,
      isPayer: p.is_payer,
      isBot: p.user_id === null,
    }));

    const payer = players.find((p) => p.isPayer) ?? null;
    const participants = players.filter((p) => !p.isPayer);
    const payerRow = (playerRows ?? []).find((p) => p.is_payer) ?? null;

    const detail: GameHistoryDetail = {
      sessionId: session.id,
      gameType: session.game_type,
      endedAt: session.ended_at,
      billAmount: session.bill_amount,
      paymentMethod: payerRow?.payment_method ?? null,
      tipPercent: payerRow?.tip_percent ?? null,
      // No restaurant/location table exists yet — left null intentionally
      // rather than fabricated, same approach as payment/tip above.
      location: null,
      payer,
      participants,
    };

    return { detail, error: null };
  } catch (e) {
    console.error('getGameHistoryDetail failed:', e);
    return {
      detail: null,
      error: { message: 'Failed to load game details.', code: null },
    };
  }
}

export async function clearGameHistory(): Promise<{
  error: GameHistoryError | null;
}> {
  try {
    // Single atomic server-side UPDATE — no client round-trip of row ids,
    // so this stays fast and reliable no matter how many games are in
    // the user's history.
    const { error } = await supabase.rpc('clear_my_game_history');
    if (error) {
      return { error: { message: error.message, code: error.code } };
    }
    return { error: null };
  } catch (e) {
    console.error('clearGameHistory failed:', e);
    return {
      error: { message: 'Failed to clear game history.', code: null },
    };
  }
}
