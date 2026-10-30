import { useCallback, useEffect } from 'react';
import { audio, type SoundName } from '../lib/audio';
import { useStore } from '../store/useStore';

/** Keeps the audio engine in sync with the store's sound toggle. Mount once. */
export function useSoundSync() {
  const sound = useStore((s) => s.sound);
  useEffect(() => {
    audio.setEnabled(sound);
  }, [sound]);
}

/** Returns a stable `play(name)` — a no-op while sound is off. */
export function useSound() {
  return useCallback((name: SoundName) => audio.play(name), []);
}

export const playSound = (name: SoundName) => audio.play(name);
