import { useEffect, useState } from 'react';

/**
 * Visual-only countdown derived from an absolute server deadline.
 * The server (submit_escape_answer / resolve_expired_challenge) is the
 * sole authority on timing — this hook never enforces anything, it only
 * renders what's left so the UI doesn't look frozen.
 */
export function useCountdownSeconds(deadline: string | null): number {
  const [seconds, setSeconds] = useState<number>(() =>
    deadline
      ? Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000))
      : 0,
  );

  useEffect(() => {
    if (!deadline) {
      setSeconds(0);
      return;
    }
    const deadlineMs = new Date(deadline).getTime();
    function tick(): void {
      const remaining = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
      setSeconds(remaining);
    }
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [deadline]);

  return seconds;
}
