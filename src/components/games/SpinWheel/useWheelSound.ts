import { useCallback, useEffect, useRef, useState } from 'react';

const POOL_SIZE = 6;

interface SoundInstance {
  replayAsync: () => Promise<unknown>;
  setVolumeAsync: (volume: number) => Promise<unknown>;
  setPositionAsync: (position: number) => Promise<unknown>;
  stopAsync: () => Promise<unknown>;
  unloadAsync: () => Promise<unknown>;
}

export interface WheelSound {
  playTick: () => void;
  playWin: () => void;
  startTicking: () => void;
  stopAll: () => void;
  muted: boolean;
  toggleMute: () => void;
  soundError: string | null;
  ready: boolean;
}

export function useWheelSound(): WheelSound {
  const tickPoolRef = useRef<SoundInstance[]>([]);
  const tickIndexRef = useRef(0);
  const winRef = useRef<SoundInstance | null>(null);
  const mutedRef = useRef(false);
  const activeRef = useRef(false);

  const [muted, setMuted] = useState(false);
  const [soundError, setSoundError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async (): Promise<void> => {
      try {
        const { Audio } = await import('expo-av');
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

        const sounds = await Promise.all(
          Array.from({ length: POOL_SIZE }, () =>
            Audio.Sound.createAsync(require('@/assets/sounds/spin-tick.mp3'), {
              shouldPlay: false,
              volume: 1.0,
            }),
          ),
        );

        const { sound: win } = await Audio.Sound.createAsync(
          require('@/assets/sounds/spin-result.mp3'),
          { shouldPlay: false, volume: 1.0 },
        );

        if (mounted) {
          tickPoolRef.current = sounds.map((s) => s.sound);
          winRef.current = win;
          setReady(true);
        }
      } catch (_e) {
        if (mounted) setSoundError('Sound requires a development build.');
      }
    })();

    return (): void => {
      mounted = false;
      activeRef.current = false;
      tickPoolRef.current.forEach((s) => {
        s.stopAsync().catch(() => {});
        s.unloadAsync().catch(() => {});
      });
      tickPoolRef.current = [];
      if (winRef.current) {
        winRef.current.stopAsync().catch(() => {});
        winRef.current.unloadAsync().catch(() => {});
        winRef.current = null;
      }
    };
  }, []);

  const startTicking = useCallback((): void => {
    activeRef.current = true;
    tickPoolRef.current.forEach((s) => {
      s.setVolumeAsync(1.0).catch(() => {});
    });
  }, []);

  const playTick = useCallback((): void => {
    if (mutedRef.current || !activeRef.current) return;
    const pool = tickPoolRef.current;
    if (!pool.length) return;
    const sound = pool[tickIndexRef.current];
    tickIndexRef.current = (tickIndexRef.current + 1) % pool.length;
    sound.replayAsync().catch(() => {});
  }, []);

  const stopAll = useCallback((): void => {
    activeRef.current = false;
    tickPoolRef.current.forEach((s) => {
      s.setVolumeAsync(0).catch(() => {});
    });
  }, []);

  const playWin = useCallback((): void => {
    if (mutedRef.current || !winRef.current) return;
    winRef.current.replayAsync().catch(() => {});
  }, []);

  const toggleMute = useCallback((): void => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      return next;
    });
  }, []);

  return {
    playTick,
    playWin,
    startTicking,
    stopAll,
    muted,
    toggleMute,
    soundError,
    ready,
  };
}
