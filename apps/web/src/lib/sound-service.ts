/**
 * Central Sound Service.
 *
 * A singleton that owns every HTMLAudioElement used for game sound effects,
 * preloads them from `/assets/sounds/*.mp3`, and holds the app-wide mute /
 * volume state (persisted to localStorage).
 *
 * Resilience: if an asset file is missing, fails to load, or is blocked by
 * autoplay policy, the service transparently falls back to a small Web-Audio
 * synth that mirrors the asset's character — so the pipeline never goes
 * silent because of a broken asset.
 */

export type SoundName =
  | 'move'
  | 'capture'
  | 'dice'
  | 'game-start'
  | 'your-turn'
  | 'turn-warning'
  | 'win'
  | 'loss'
  | 'draw'
  | 'reconnected';

export interface SoundSettingsState {
  muted: boolean;
  volume: number;
  consent: 'unknown' | 'enabled' | 'silent';
}

const SOUND_SOURCES: Partial<Record<SoundName, string>> = {
  move: '/assets/sounds/move.mp3',
  capture: '/assets/sounds/capture.mp3',
  dice: '/assets/sounds/dice.mp3',
};

const STORAGE_MUTED_KEY = 'bazigb:sound:muted';
const STORAGE_VOLUME_KEY = 'bazigb:sound:volume';
const STORAGE_CONSENT_KEY = 'bazigb:sound:consent';
const STORAGE_CONSENT_VERSION_KEY = 'bazigb:sound:consent-version';
const SOUND_CONSENT_VERSION = 'shared-game-entry-v2';

const DEFAULT_VOLUME = 0.6;

type Listener = () => void;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null; // storage disabled (private mode, blocked cookies…)
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — state still applies for this session.
  }
}

class SoundService {
  private audios = new Map<SoundName, HTMLAudioElement>();
  private failed = new Set<SoundName>();
  private listeners = new Set<Listener>();
  private state: SoundSettingsState = { muted: true, volume: DEFAULT_VOLUME, consent: 'unknown' };
  private synthCtx: AudioContext | null = null;

  constructor() {
    const storedConsent = readStorage(STORAGE_CONSENT_KEY);
    this.state.consent = storedConsent === 'enabled' || storedConsent === 'silent' ? storedConsent : 'unknown';
    this.state.muted = this.state.consent !== 'enabled' || readStorage(STORAGE_MUTED_KEY) === '1';
    const storedVolume = Number(readStorage(STORAGE_VOLUME_KEY));
    if (Number.isFinite(storedVolume) && storedVolume > 0) {
      this.state.volume = clamp(storedVolume, 0.05, 1);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Audio element management                                            */
  /* ------------------------------------------------------------------ */

  /** Lazily create (and remember) the Audio element for a sound. */
  private getAudio(name: SoundName): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    const source = SOUND_SOURCES[name];
    if (!source) return null;
    const existing = this.audios.get(name);
    if (existing) return existing;

    let audio: HTMLAudioElement;
    try {
      audio = new Audio(source);
    } catch {
      this.failed.add(name);
      return null;
    }

    audio.preload = 'auto';
    audio.volume = this.state.volume;
    audio.muted = this.state.muted;
    audio.addEventListener('error', () => {
      // Asset is unreachable — mark it and rely on the synth fallback.
      this.failed.add(name);
    });

    this.audios.set(name, audio);
    return audio;
  }

  /** Start fetching every effect now so they're ready by game time. */
  preload(): void {
    for (const name of Object.keys(SOUND_SOURCES) as SoundName[]) {
      const audio = this.getAudio(name);
      if (!audio) continue;
      try {
        audio.load();
      } catch {
        this.failed.add(name);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Playback                                                            */
  /* ------------------------------------------------------------------ */

  /** Play an effect. Falls back to the synth when the asset is unusable. */
  play(name: SoundName): void {
    if (this.state.muted || this.state.consent !== 'enabled' || !this.hasSoundChoice()) return;

    const audio = this.failed.has(name) ? null : this.getAudio(name);
    if (!audio) {
      this.playSynth(name);
      return;
    }

    try {
      audio.currentTime = 0; // restart so rapid clicks retrigger cleanly
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err: unknown) => {
          // AbortError = a newer play() interrupted this one — not a failure.
          if (err instanceof DOMException && err.name === 'AbortError') return;
          this.playSynth(name);
        });
      }
    } catch {
      this.playSynth(name);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Mute / volume                                                       */
  /* ------------------------------------------------------------------ */

  setMuted(muted: boolean): void {
    let consent = this.state.consent;
    if (consent === 'unknown') {
      consent = muted ? 'silent' : 'enabled';
      writeStorage(STORAGE_CONSENT_KEY, consent);
    } else if (!muted && consent === 'silent') {
      consent = 'enabled';
      writeStorage(STORAGE_CONSENT_KEY, consent);
    }
    this.state = { ...this.state, muted, consent };
    this.audios.forEach((audio) => {
      audio.muted = muted;
    });
    writeStorage(STORAGE_MUTED_KEY, muted ? '1' : '0');
    this.notify();
  }

  toggleMute(): boolean {
    this.setMuted(!this.state.muted);
    return this.state.muted;
  }

  isMuted(): boolean {
    return this.state.muted;
  }

  hasSoundChoice(): boolean {
    return this.state.consent !== 'unknown'
      && readStorage(STORAGE_CONSENT_VERSION_KEY) === SOUND_CONSENT_VERSION;
  }

  chooseSound(enabled: boolean): void {
    const consent = enabled ? 'enabled' : 'silent';
    this.state = { ...this.state, consent };
    writeStorage(STORAGE_CONSENT_KEY, consent);
    writeStorage(STORAGE_CONSENT_VERSION_KEY, SOUND_CONSENT_VERSION);
    this.setMuted(!enabled);
  }

  setVolume(volume: number): void {
    this.state = { ...this.state, volume: clamp(volume, 0, 1) };
    this.audios.forEach((audio) => {
      audio.volume = this.state.volume;
    });
    writeStorage(STORAGE_VOLUME_KEY, String(this.state.volume));
    this.notify();
  }

  getVolume(): number {
    return this.state.volume;
  }

  /**
   * Stable snapshot for React's useSyncExternalStore — a new object is only
   * produced when the underlying state changes.
   */
  getState(): SoundSettingsState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  /* ------------------------------------------------------------------ */
  /* Web-Audio synth fallback (mirrors the asset character)              */
  /* ------------------------------------------------------------------ */

  private getSynthContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.synthCtx) this.synthCtx = new Ctor();
    return this.synthCtx;
  }

  private playSynth(name: SoundName): void {
    try {
      const ctx = this.getSynthContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();

      const now = ctx.currentTime;
      const level = this.state.volume * 0.12; // synth is louder per-sample; scale down

      switch (name) {
        case 'move':
          this.tone(ctx, now, 880, 0.06, level, 'sine');
          this.tone(ctx, now + 0.06, 1174.66, 0.07, level * 0.8, 'sine');
          break;
        case 'capture':
          this.tone(ctx, now, 185, 0.16, level, 'triangle');
          this.tone(ctx, now, 92.5, 0.18, level * 0.5, 'sine');
          break;
        case 'dice':
          [0, 0.09, 0.18, 0.27].forEach((delay) => {
            this.noiseBurst(ctx, now + delay, 0.045, level * 0.5);
          });
          break;
        case 'game-start':
          this.tone(ctx, now, 523.25, 0.08, level, 'sine');
          this.tone(ctx, now + 0.08, 659.25, 0.08, level, 'sine');
          this.tone(ctx, now + 0.16, 783.99, 0.12, level, 'sine');
          break;
        case 'your-turn':
          this.tone(ctx, now, 659.25, 0.07, level * 0.8, 'sine');
          this.tone(ctx, now + 0.08, 880, 0.1, level, 'sine');
          break;
        case 'turn-warning':
          this.tone(ctx, now, 440, 0.08, level * 0.8, 'triangle');
          this.tone(ctx, now + 0.16, 440, 0.08, level * 0.8, 'triangle');
          break;
        case 'win':
          this.tone(ctx, now, 523.25, 0.09, level, 'sine');
          this.tone(ctx, now + 0.09, 659.25, 0.09, level, 'sine');
          this.tone(ctx, now + 0.18, 1046.5, 0.18, level, 'sine');
          break;
        case 'loss':
          this.tone(ctx, now, 392, 0.12, level * 0.75, 'triangle');
          this.tone(ctx, now + 0.12, 293.66, 0.18, level * 0.7, 'triangle');
          break;
        case 'draw':
          this.tone(ctx, now, 440, 0.09, level * 0.7, 'sine');
          this.tone(ctx, now + 0.1, 440, 0.12, level * 0.55, 'triangle');
          break;
        case 'reconnected':
          this.tone(ctx, now, 587.33, 0.07, level * 0.7, 'sine');
          this.tone(ctx, now + 0.08, 783.99, 0.1, level * 0.8, 'sine');
          break;
      }
    } catch {
      // Audio genuinely unavailable (headless browser, permissions…) — stay silent.
    }
  }

  private tone(
    ctx: AudioContext,
    start: number,
    freq: number,
    dur: number,
    gain: number,
    type: OscillatorType,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    const end = start + dur;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  private noiseBurst(ctx: AudioContext, start: number, dur: number, gain: number): void {
    const frameCount = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const g = ctx.createGain();
    const end = start + dur;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, end);

    src.connect(g);
    g.connect(ctx.destination);
    src.start(start);
    src.stop(end + 0.02);
  }
}

/** App-wide singleton. */
export const soundService = new SoundService();

export default soundService;
