import { PocketTTS, StreamingPlayer } from "pocket-tts-js";
import { speakableText } from "./speakableText";
import { insertFieldPauses, phraseForSynthesis, resolveNumericHyphens } from "./speechPhrasing";

/**
 * Read-aloud with a neural voice (Pocket TTS: an ONNX model in a Web Worker),
 * falling back to the operating system's `speechSynthesis` voice only where
 * that cannot run.
 *
 * Audio never leaves the device on either tier. The one thing that crosses
 * the network is the model download itself, cached (Cache Storage, not
 * localStorage/IndexedDB app data) so it happens once rather than per page
 * load.
 *
 * Ported from ../../../../couchbumming/lib/natural-speech.ts. That file's own
 * header explains why this deliberately does NOT gate on the browser's
 * on-device language model (window.LanguageModel / self.ai.languageModel,
 * see ../tutorial-ai/chrome-ai.ts): Safari never exposes it to the web at
 * all, so gating on it would mean the natural voice never runs on iOS —
 * exactly backwards from what read-aloud is for. canSpeakNaturally() checks
 * the actual primitives pocket-tts-js's worker needs instead.
 */

export type NaturalSpeechStatus = "preparing" | "generating" | "speaking" | "system-voice";

export type SpeechCallbacks = {
  lang?: string;
  onEnd?: () => void;
  onError?: () => void;
  /** `progress` is 0-1 while the model downloads, and undefined otherwise. */
  onStatus?: (status: NaturalSpeechStatus, progress?: number) => void;
};

type Engine = { tts: PocketTTS; voice: string };

const SAMPLE_RATE = 24_000;
// Cache Storage bucket for the model weights, voices, and tokenizer — not the
// app-data local storage this project otherwise avoids (see compat/no-local-store.ts).
// A cached model download is closer to a cached static asset than to persisted
// user content.
const CACHE_NAME = "trippy-pocket-tts-v1";
// Self-hosted by scripts/copy-ort-assets.mjs, served immutably (see server.js),
// injected at build time by scripts/build-react.cjs from the installed
// onnxruntime-web version so this URL can never drift from the runtime the
// patched worker imports.
const ORT_BASE_URL = `/ort/${process.env.NEXT_PUBLIC_ORT_VERSION}/`;
const PREFERRED_VOICE = "alba";
// Silence emitted between generated chunks (CHUNK_GAP_SEC in worker.js). It is
// played but deliberately excluded from the reported audioDuration, so the
// end-of-speech timer has to add it back.
const CHUNK_GAP_SECONDS = 0.25;

const NATURAL_VOICE = /natural|enhanced|premium|neural|samantha|ava|zira|aria|jenny|google|microsoft/i;
const AVOID_VOICE = /compact|novelty|robot/i;

let engine: Engine | null = null;
let enginePromise: Promise<Engine> | null = null;

// One AudioContext and one player for the whole document, not one per
// utterance — see natural-speech.ts's note on why a player per tap leaks a
// context per tap and eventually kills the neural voice for the rest of the
// session.
let audioContext: AudioContext | null = null;
let player: StreamingPlayer | null = null;

// The in-flight generate(), so a second tap waits for the first's cleanup to
// finish rather than racing it — see natural-speech.ts's note on
// PocketTTS._onChunk being a single field.
let generation: Promise<unknown> | null = null;
let finishTimer: number | null = null;
let activeRun = 0;

/**
 * Whether the neural tier can run at all — checks the primitives the worker
 * actually uses rather than any proxy for browser identity.
 */
export function canSpeakNaturally(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof Worker !== "undefined"
    && typeof WebAssembly === "object"
    && (typeof AudioContext !== "undefined" || "webkitAudioContext" in window)
    // Cache Storage needs a secure context, and the worker degrades *silently*
    // without it — every asset re-fetches on every page load, far worse than
    // the system voice.
    && window.isSecureContext
  );
}

function ensurePlayer(): StreamingPlayer | null {
  if (player) return player;
  const Ctx = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  try {
    audioContext = new Ctx({ sampleRate: SAMPLE_RATE });
    player = new StreamingPlayer({ sampleRate: SAMPLE_RATE, audioContext });
    return player;
  } catch {
    return null;
  }
}

function clearFinishTimer() {
  if (finishTimer !== null && typeof window !== "undefined") window.clearTimeout(finishTimer);
  finishTimer = null;
}

async function getEngine(onProgress?: (fraction: number) => void): Promise<Engine> {
  if (engine) return engine;
  if (enginePromise) return enginePromise;

  enginePromise = (async () => {
    const tts = new PocketTTS({
      language: "english_2026-04",
      quantized: true,
      voiceCloning: false,
      ortBaseUrl: ORT_BASE_URL,
      cache: true,
      cacheName: CACHE_NAME,
    });
    try {
      const loaded = new Map<string, number>();
      const totals = new Map<string, number>();
      const bundle = await tts.load((info) => {
        if (!info.label || info.loaded == null) return;
        loaded.set(info.label, info.loaded);
        if (info.total) totals.set(info.label, info.total);
        const done = [...loaded.values()].reduce((a, b) => a + b, 0);
        const total = [...totals.values()].reduce((a, b) => a + b, 0);
        if (total > 0) onProgress?.(Math.min(0.99, done / total));
      });
      if (bundle && bundle.sampleRate !== SAMPLE_RATE) {
        console.warn(
          `[pocket-tts] Bundle sample rate ${bundle.sampleRate} does not match the player's ${SAMPLE_RATE}.`,
        );
      }
      const available = tts.predefinedVoices ?? [];
      const name = available.includes(PREFERRED_VOICE) ? PREFERRED_VOICE : available[0];
      if (!name) throw new Error("The voice bundle contains no predefined voices.");
      engine = { tts, voice: await tts.loadVoice(name) };
      return engine;
    } catch (error) {
      tts.destroy();
      enginePromise = null;
      throw error;
    }
  })();

  return enginePromise;
}

function preferredSystemVoice(voices: SpeechSynthesisVoice[], lang: string) {
  const language = lang.toLowerCase().split("-")[0];
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith(language))
    .sort((a, b) => {
      const score = (voice: SpeechSynthesisVoice) =>
        (voice.localService ? 8 : 0)
        + (NATURAL_VOICE.test(voice.name) ? 6 : 0)
        - (AVOID_VOICE.test(voice.name) ? 8 : 0);
      return score(b) - score(a);
    })[0];
}

function speakWithSystemVoice(spoken: string, callbacks: SpeechCallbacks, run: number): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = callbacks.lang ?? navigator.language ?? "en-US";
    utterance.rate = 0.96;
    utterance.onend = () => { if (run === activeRun) callbacks.onEnd?.(); };
    utterance.onerror = () => { if (run === activeRun) callbacks.onError?.(); };
    const voice = preferredSystemVoice(synth.getVoices(), utterance.lang);
    if (voice) utterance.voice = voice;
    callbacks.onStatus?.("system-voice");
    synth.speak(utterance);
    return true;
  } catch {
    callbacks.onError?.();
    return false;
  }
}

/**
 * Speaks `text` with the neural voice, falling back to the system voice only
 * where the neural tier cannot run or fails. Resolves true if audio started.
 *
 * Must be called directly from the click that requested it — the
 * AudioContext is created and resumed before the first `await` for that
 * reason (iOS only allows audio to start inside a user gesture).
 */
export async function speakNaturally(text: string, callbacks: SpeechCallbacks = {}): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Both of these need the raw hyphen/quote characters still in place, so
  // they must run before speakableText() strips them — see speechPhrasing's
  // insertFieldPauses() and resolveNumericHyphens() for why order matters.
  const spoken = speakableText(resolveNumericHyphens(insertFieldPauses(text)));
  if (!spoken) return false;

  stopSpeaking();
  const run = activeRun;

  if (!canSpeakNaturally()) return speakWithSystemVoice(spoken, callbacks, run);

  const active = ensurePlayer();
  if (!active) return speakWithSystemVoice(spoken, callbacks, run);
  const playerReady = active.resume();

  try {
    if (!engine) callbacks.onStatus?.("preparing", 0);
    const ready = await getEngine((fraction) => {
      if (run === activeRun) callbacks.onStatus?.("preparing", fraction);
    });
    await playerReady;
    if (run !== activeRun) return false;

    if (generation) {
      await generation.catch(() => undefined);
      if (run !== activeRun) return false;
    }

    active.reset();
    callbacks.onStatus?.("generating");
    let silences = 0;
    const pending = ready.tts.generate(phraseForSynthesis(spoken), {
      voice: ready.voice,
      onChunk: (audio, meta) => {
        if (run !== activeRun) return;
        if (meta.isSilence) silences++;
        callbacks.onStatus?.("speaking");
        active.play(audio, meta);
      },
    });
    generation = pending;
    let metrics;
    try {
      metrics = await pending;
    } finally {
      if (generation === pending) generation = null;
    }
    if (run !== activeRun) return false;

    active.flush();
    const tailMs = (metrics.audioDuration + silences * CHUNK_GAP_SECONDS) * 1000;
    finishTimer = window.setTimeout(() => {
      if (run !== activeRun) return;
      finishTimer = null;
      callbacks.onEnd?.();
    }, Math.max(150, Math.ceil(tailMs)));
    return true;
  } catch (error) {
    if (run !== activeRun) return false;
    active.stop();
    console.warn("[pocket-tts] The neural voice could not start; using the system voice.", error);
    return speakWithSystemVoice(spoken, callbacks, run);
  }
}

export function stopSpeaking(): void {
  activeRun += 1;
  clearFinishTimer();
  player?.stop();
  void engine?.tts.stop().catch(() => undefined);
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
