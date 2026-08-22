export type SoundName = "chime" | "ping" | "ding" | "bell" | "doorbell" | "pop" | "blip" | "swoosh" | "none";

export const SOUND_NAMES: SoundName[] = [
  "chime", "ping", "ding", "bell", "doorbell", "pop", "blip", "swoosh", "none",
];

export const SOUND_LABELS: Record<SoundName, string> = {
  chime:    "Chime",
  ping:     "Ping",
  ding:     "Ding",
  bell:     "Bell",
  doorbell: "Doorbell",
  pop:      "Pop",
  blip:     "Blip",
  swoosh:   "Swoosh",
  none:     "None",
};

export const SOUND_DESCRIPTIONS: Record<SoundName, string> = {
  chime:    "Three-note ascending",
  ping:     "Single clean high tone",
  ding:     "Single warm tone, long sustain",
  bell:     "Rich bell with harmonics",
  doorbell: "Two-note descending",
  pop:      "Soft percussive pop",
  blip:     "Short electronic blip",
  swoosh:   "Rising frequency sweep",
  none:     "Silent",
};

export type PitchOctave = -1 | 0 | 1;

export const PITCH_LABELS: Record<PitchOctave, string> = {
  "-1": "Low",
  "0":  "Normal",
  "1":  "High",
};

export interface SoundOptions {
  /** 0–1, scales all gain values. Default 1. */
  volume?: number;
  /** Octave shift: -1 = half freq, 0 = normal, 1 = double freq. Default 0. */
  pitch?: PitchOctave;
}

type SoundFn = (ctx: AudioContext, volume: number, pitchMult: number) => void;

const SOUND_FNS: Record<Exclude<SoundName, "none">, SoundFn> = {
  chime: (ctx, vol, p) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    [[880, 0], [1320, 0.13], [1760, 0.26]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p;
      osc.connect(gain);
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4 * vol, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);
      osc.start(start);
      osc.stop(start + 0.8);
    });
  },
  ping: (ctx, vol, p) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 1760 * p;
    osc.connect(gain);
    const start = ctx.currentTime;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.5 * vol, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
    osc.start(start);
    osc.stop(start + 0.4);
  },
  ding: (ctx, vol, p) => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 660 * p;
    osc.connect(gain);
    const start = ctx.currentTime;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.4 * vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.5);
    osc.start(start);
    osc.stop(start + 1.5);
  },
  bell: (ctx, vol, p) => {
    [[440, 0.3], [880, 0.2], [1318, 0.12], [2200, 0.06]].forEach(([freq, amp]) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p;
      osc.connect(g);
      const start = ctx.currentTime;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(amp * vol, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 2.0);
      osc.start(start);
      osc.stop(start + 2.0);
    });
  },
  doorbell: (ctx, vol, p) => {
    [[587, 0], [494, 0.35]].forEach(([freq, delay]) => {
      const g = ctx.createGain();
      g.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * p;
      osc.connect(g);
      const start = ctx.currentTime + delay;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.4 * vol, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  },
  pop: (ctx, vol, p) => {
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200 * p, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60 * p, ctx.currentTime + 0.08);
    osc.connect(g);
    g.gain.setValueAtTime(0.5 * vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  },
  blip: (ctx, vol, p) => {
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 880 * p;
    osc.connect(g);
    const start = ctx.currentTime;
    g.gain.setValueAtTime(0.2 * vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
    osc.start(start);
    osc.stop(start + 0.08);
  },
  swoosh: (ctx, vol, p) => {
    const g = ctx.createGain();
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300 * p, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400 * p, ctx.currentTime + 0.4);
    osc.connect(g);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.3 * vol, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  },
};

export function playSound(name: SoundName, options?: SoundOptions): void {
  if (name === "none") return;
  try {
    const ctx = new AudioContext();
    const vol = options?.volume ?? 1.0;
    const pitchMult = options?.pitch === -1 ? 0.5 : options?.pitch === 1 ? 2.0 : 1.0;
    SOUND_FNS[name](ctx, vol, pitchMult);
    setTimeout(() => ctx.close(), 3000);
  } catch {
    // AudioContext not available — silent fail
  }
}

/** Normalize legacy boolean IDB values to a SoundName. */
export function normalizeSound(val: string | null | undefined): SoundName {
  if (!val || val === "true") return "chime";
  if (val === "false") return "none";
  if ((SOUND_NAMES as string[]).includes(val)) return val as SoundName;
  return "chime";
}
