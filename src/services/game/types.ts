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
  avatar_id: string | null;
  created_at: string;
};

export type BroadcastPayload = {
  table?: string;
  record?: Record<string, unknown>;
};

export type SessionChannelSubscription = {
  unsubscribe: () => void;
};

export function safeErrorMessage(
  error: unknown,
  fallback: string,
): GameSessionError {
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
