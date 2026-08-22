import { PocketTTS, StreamingPlayer } from "pocket-tts-js";
import { getBrowserLanguageModelAvailability } from "@/lib/tutorial-ai/chrome-ai";

export type SpeechCallbacks = {
  lang?: string;
  onEnd?: () => void;
  onError?: () => void;
  onStatus?: (status: "downloading" | "generating" | "playing" | "fallback") => void;
};

type NaturalSpeechEngine = {
  tts: PocketTTS;
  voice: string;
};

const NATURAL_VOICE = /natural|enhanced|premium|neural|samantha|ava|zira|aria|jenny|google|microsoft/i;
const AVOID_VOICE = /compact|novelty|robot/i;
const POCKET_TTS_SAMPLE_RATE = 24_000;

let naturalEnginePromise: Promise<NaturalSpeechEngine> | null = null;
let naturalEngine: NaturalSpeechEngine | null = null;
let activePlayer: StreamingPlayer | null = null;
let activeRun = 0;
let finishTimer: number | null = null;

function preferredVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
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

function clearFinishTimer() {
  if (finishTimer !== null && typeof window !== "undefined") window.clearTimeout(finishTimer);
  finishTimer = null;
}

function stopNaturalPlayback() {
  clearFinishTimer();
  activePlayer?.stop();
  activePlayer = null;
  void naturalEngine?.tts.stop().catch(() => undefined);
}

async function getNaturalEngine(callbacks: SpeechCallbacks): Promise<NaturalSpeechEngine> {
  if (naturalEngine) return naturalEngine;
  if (naturalEnginePromise) return naturalEnginePromise;

  naturalEnginePromise = (async () => {
    const tts = new PocketTTS({
      language: "english_2026-04",
      quantized: true,
      voiceCloning: false,
      cacheName: "trippy-pocket-tts-v1",
    });
    try {
      await tts.load(() => callbacks.onStatus?.("downloading"));
      const voice = await tts.loadVoice("alba");
      naturalEngine = { tts, voice };
      return naturalEngine;
    } catch (error) {
      tts.destroy();
      naturalEnginePromise = null;
      throw error;
    }
  })();

  return naturalEnginePromise;
}

async function speakWithSystemVoice(text: string, callbacks: SpeechCallbacks): Promise<boolean> {
  if (!("speechSynthesis" in window)) return false;
  try {
    const synth = window.speechSynthesis;
    callbacks.onStatus?.("fallback");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = callbacks.lang ?? navigator.language ?? "en-US";
    utterance.rate = 0.94;
    utterance.pitch = 1.02;
    utterance.onend = () => callbacks.onEnd?.();
    utterance.onerror = () => callbacks.onError?.();
    const voice = preferredVoice(synth.getVoices(), utterance.lang);
    if (voice) utterance.voice = voice;
    callbacks.onStatus?.("playing");
    synth.speak(utterance);
    return true;
  } catch {
    callbacks.onError?.();
    return false;
  }
}

/**
 * Uses a worker-isolated Pocket TTS voice after confirming the browser has a
 * usable LanguageModel. The operating-system voice is reserved for browsers
 * where that browser-managed model is unavailable.
 */
export async function speakNaturally(text: string, callbacks: SpeechCallbacks = {}): Promise<boolean> {
  if (typeof window === "undefined" || !text.trim()) return false;

  stopSpeaking();
  const run = activeRun;

  // Create and resume the audio context synchronously from the click that
  // initiated read-aloud, before any model availability or download awaits.
  const player = new StreamingPlayer({ sampleRate: POCKET_TTS_SAMPLE_RATE });
  const playerReady = player.resume();

  try {
    const availability = await getBrowserLanguageModelAvailability();
    if (run !== activeRun) {
      await player.destroy();
      return false;
    }

    if (availability === "unavailable") {
      await player.destroy();
      return speakWithSystemVoice(text, callbacks);
    }

    callbacks.onStatus?.("downloading");
    const engine = await getNaturalEngine(callbacks);
    await playerReady;
    if (run !== activeRun) {
      await player.destroy();
      return false;
    }

    activePlayer = player;
    player.reset();
    callbacks.onStatus?.("generating");
    const metrics = await engine.tts.generate(text, {
      voice: engine.voice,
      onChunk: (audio, meta) => {
        if (run !== activeRun) return;
        callbacks.onStatus?.("playing");
        player.play(audio, meta);
      },
    });
    if (run !== activeRun || metrics.stopped) return false;

    player.flush();
    // The worker has finished when generate resolves, but its final audio can
    // still be scheduled. Keep the existing button state accurate until that
    // tail has had time to play.
    finishTimer = window.setTimeout(() => {
      if (run !== activeRun) return;
      activePlayer = null;
      finishTimer = null;
      callbacks.onEnd?.();
    }, Math.max(150, Math.ceil(metrics.audioDuration * 1000)));
    return true;
  } catch (error) {
    if (run === activeRun) {
      activePlayer?.stop();
      activePlayer = null;
      callbacks.onError?.();
      console.warn("[pocket-tts] Browser-local natural speech could not start:", error);
    }
    return false;
  }
}

export function stopSpeaking(): void {
  activeRun += 1;
  clearFinishTimer();
  stopNaturalPlayback();
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}
