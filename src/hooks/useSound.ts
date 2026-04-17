import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'jc-sound-muted';

type OscType = OscillatorType;

interface BeepOptions {
  type?: OscType;
  volume?: number;
  attackMs?: number;
  releaseMs?: number;
}

interface UseSoundReturn {
  muted: boolean;
  toggleMuted: () => void;
  playCount: () => void;
  playCountdown: (n: 1 | 2 | 3) => void;
  playStart: () => void;
  playEnd: () => void;
  playTick: () => void;
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useSound(): UseSoundReturn {
  const [muted, setMuted] = useState<boolean>(readMuted);
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AC();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback(
    (frequency: number, durationMs: number, options: BeepOptions = {}, startOffsetMs = 0) => {
      if (muted) return;
      const ctx = ensureCtx();
      if (!ctx) return;
      const { type = 'sine', volume = 0.15, attackMs = 8, releaseMs = 40 } = options;

      const start = ctx.currentTime + startOffsetMs / 1000;
      const attack = attackMs / 1000;
      const release = releaseMs / 1000;
      const duration = durationMs / 1000;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + attack);
      gain.gain.setValueAtTime(volume, start + Math.max(attack, duration - release));
      gain.gain.linearRampToValueAtTime(0, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    },
    [muted, ensureCtx],
  );

  const playCount = useCallback(() => {
    beep(880, 60, { type: 'sine', volume: 0.15 });
  }, [beep]);

  const playCountdown = useCallback(
    (n: 1 | 2 | 3) => {
      const freq = n === 3 ? 660 : n === 2 ? 770 : 880;
      beep(freq, 150, { type: 'square', volume: 0.12 });
    },
    [beep],
  );

  const playStart = useCallback(() => {
    beep(880, 120, { type: 'triangle', volume: 0.18 }, 0);
    beep(1320, 160, { type: 'triangle', volume: 0.18 }, 120);
  }, [beep]);

  const playEnd = useCallback(() => {
    beep(880, 180, { type: 'sine', volume: 0.18 }, 0);
    beep(660, 180, { type: 'sine', volume: 0.18 }, 180);
    beep(440, 260, { type: 'sine', volume: 0.18 }, 360);
  }, [beep]);

  const playTick = useCallback(() => {
    beep(1320, 40, { type: 'sine', volume: 0.1 });
  }, [beep]);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        void ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, []);

  return { muted, toggleMuted, playCount, playCountdown, playStart, playEnd, playTick };
}
