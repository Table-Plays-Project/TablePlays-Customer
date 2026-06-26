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

export async function submitEscapeAnswer(
  sessionId: string,
  answer: number,
): Promise<{
  correct: boolean;
  newPayerIndex: number | null;
  timedOut: boolean;
  error: GameSessionError | null;
}> {
  try {
    const { data, error } = await supabase.rpc('submit_escape_answer', {
      p_session_id: sessionId,
      p_answer: answer,
    });
    if (error) {
      return {
        correct: false,
        newPayerIndex: null,
        timedOut: false,
        error: safeErrorMessage(error, 'Failed to submit answer.'),
      };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      correct: row?.correct ?? false,
      newPayerIndex: row?.new_payer_index ?? null,
      timedOut: row?.timed_out ?? false,
      error: null,
    };
  } catch (e) {
    console.error('submitEscapeAnswer failed:', e);
    return {
      correct: false,
      newPayerIndex: null,
      timedOut: false,
      error: { message: 'Failed to submit answer.', code: null },
    };
  }
}

export async function resolveExpiredChallenge(
  sessionId: string,
): Promise<{ error: GameSessionError | null }> {
  try {
    const { error } = await supabase.rpc('resolve_expired_challenge', {
      p_session_id: sessionId,
    });
    if (error) {
      return { error: safeErrorMessage(error, 'Failed to resolve challenge.') };
    }
    return { error: null };
  } catch (e) {
    console.error('resolveExpiredChallenge failed:', e);
    return { error: { message: 'Failed to resolve challenge.', code: null } };
  }
}
