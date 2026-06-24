import { supabase } from '@/lib/supabase';

import type { GameSessionError } from './types';
import { safeErrorMessage } from './types';

export async function finishSession(
  sessionId: string,
): Promise<{ error: GameSessionError | null }> {
  try {
    const { error } = await supabase.rpc('finish_session', {
      p_session_id: sessionId,
    });
    if (error) {
      return { error: safeErrorMessage(error, 'Failed to finish session.') };
    }
    return { error: null };
  } catch (e) {
    console.error('finishSession failed:', e);
    return { error: { message: 'Failed to finish session.', code: null } };
  }
}

export async function spinWheel(
  sessionId: string,
): Promise<{
  payerIndex: number | null;
  spinStartedAt: string | null;
  playerCount: number | null;
  error: GameSessionError | null;
}> {
  try {
    const { data, error } = await supabase.rpc('spin_wheel', {
      p_session_id: sessionId,
    });
    if (error) {
      return {
        payerIndex: null,
        spinStartedAt: null,
        playerCount: null,
        error: safeErrorMessage(error, 'Failed to start the spin.'),
      };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      payerIndex: row?.payer_index ?? null,
      spinStartedAt: row?.spin_started_at ?? null,
      playerCount: row?.player_count ?? null,
      error: null,
    };
  } catch (e) {
    console.error('spinWheel failed:', e);
    return {
      payerIndex: null,
      spinStartedAt: null,
      playerCount: null,
      error: { message: 'Failed to start the spin.', code: null },
    };
  }
}
