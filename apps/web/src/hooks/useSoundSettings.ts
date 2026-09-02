'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { soundService, type SoundSettingsState } from '../lib/sound-service';

export interface SoundSettings {
  /** Whether sound is currently muted. */
  muted: boolean;
  /** Master volume, 0..1, shared by every effect. */
  volume: number;
  /** Flip the mute state; returns nothing (read the new value from `muted`). */
  toggleMute: () => void;
  /** Explicitly set the mute state. */
  setMuted: (muted: boolean) => void;
  /** Set the master volume (0..1). */
  setVolume: (volume: number) => void;
}

const subscribe = (callback: () => void) => soundService.subscribe(callback);

// Client snapshot must be a cached object — the service returns a stable one.
const getSnapshot = () => soundService.getState();

// Used during SSR / first render to avoid hydration mismatches with
// localStorage-backed state. useSyncExternalStore requires this snapshot to be
// referentially stable across reads.
const SERVER_SNAPSHOT: SoundSettingsState = { muted: true, volume: 0.6, consent: 'unknown' };
const getServerSnapshot = () => SERVER_SNAPSHOT;

/**
 * React binding for the central Sound Service. Re-renders whenever the mute /
 * volume state changes anywhere in the app, and kicks off SFX preloading once
 * the component mounts.
 */
export function useSoundSettings(): SoundSettings {
  const { muted, volume } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Warm the cache so effects are ready (and their sizes known) by game time.
    soundService.preload();
  }, []);

  const toggleMute = useCallback(() => {
    soundService.toggleMute();
  }, []);

  const setMuted = useCallback((next: boolean) => {
    soundService.setMuted(next);
  }, []);

  const setVolume = useCallback((next: number) => {
    soundService.setVolume(next);
  }, []);

  return { muted, volume, toggleMute, setMuted, setVolume };
}
