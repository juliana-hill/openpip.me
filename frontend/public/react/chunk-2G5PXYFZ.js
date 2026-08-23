import {
  Volume2,
  VolumeOff,
  require_jsx_runtime,
  require_react
} from "./chunk-NPORSBBQ.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// components/ui/ReadAloudButton.tsx
var import_react = __toESM(require_react());

// node_modules/pocket-tts-js/src/player.js
var StreamingPlayer = class {
  /**
   * @param {object} [opts]
   * @param {number} [opts.sampleRate=24000]
   * @param {AudioContext} [opts.audioContext]  Reuse an existing context if provided.
   * @param {number} [opts.primeSeconds=0.4]  Audio to buffer before playback starts (jitter cushion). 0 = play immediately.
   * @param {number} [opts.leadSeconds=0.05]  Small scheduling lead applied when playback starts.
   * @param {(info:{gapSeconds:number,count:number}) => void} [opts.onUnderrun]  Called when a chunk arrives late.
   */
  constructor(opts = {}) {
    this.sampleRate = opts.sampleRate || 24e3;
    this.audioContext = opts.audioContext || null;
    this._ownsContext = !opts.audioContext;
    this._primeSeconds = opts.primeSeconds != null ? opts.primeSeconds : 0.4;
    this._leadSeconds = opts.leadSeconds != null ? opts.leadSeconds : 0.05;
    this._onUnderrun = opts.onUnderrun || null;
    this._nextStartTime = 0;
    this._sources = /* @__PURE__ */ new Set();
    this._gain = null;
    this.analyser = null;
    this._pending = [];
    this._pendingDuration = 0;
    this._primed = false;
    this.underruns = 0;
  }
  _ensureContext() {
    if (!this.audioContext) {
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      this.audioContext = new Ctx({ sampleRate: this.sampleRate });
    }
    if (!this._gain) {
      this._gain = this.audioContext.createGain();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this._gain.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
  }
  /** Resume the underlying context (call from a user gesture if suspended). */
  async resume() {
    this._ensureContext();
    if (this.audioContext.state === "suspended") await this.audioContext.resume();
  }
  /** Reset for a new generation. */
  reset() {
    this.stop();
    this._nextStartTime = 0;
    this._pending = [];
    this._pendingDuration = 0;
    this._primed = false;
    this.underruns = 0;
  }
  /**
   * Enqueue one mono Float32 chunk.
   * @param {Float32Array} float32
   * @param {{isLast?:boolean}} [meta]  When meta.isLast is set, any buffered audio is flushed immediately.
   */
  play(float32, meta) {
    this._ensureContext();
    if (!float32 || float32.length === 0) return;
    if (!this._primed) {
      this._pending.push(float32);
      this._pendingDuration += float32.length / this.sampleRate;
      if (this._pendingDuration >= this._primeSeconds || meta && meta.isLast) {
        this._flushPending();
      }
      return;
    }
    this._schedule(float32);
  }
  /** Release any buffered audio immediately (e.g. when generation ends). */
  flush() {
    if (!this._primed) this._flushPending();
  }
  _flushPending() {
    this._primed = true;
    this._ensureContext();
    this._nextStartTime = this.audioContext.currentTime + this._leadSeconds;
    const pending = this._pending;
    this._pending = [];
    this._pendingDuration = 0;
    for (const chunk of pending) this._schedule(chunk);
  }
  _schedule(float32) {
    const ctx = this.audioContext;
    const buffer = ctx.createBuffer(1, float32.length, this.sampleRate);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this._gain);
    const now = ctx.currentTime;
    if (this._nextStartTime < now) {
      this.underruns++;
      if (this._onUnderrun) this._onUnderrun({ gapSeconds: now - this._nextStartTime, count: this.underruns });
    }
    const startAt = Math.max(now, this._nextStartTime);
    source.start(startAt);
    this._nextStartTime = startAt + buffer.duration;
    this._sources.add(source);
    source.onended = () => this._sources.delete(source);
  }
  /** Stop all scheduled sources immediately and drop any buffered audio. */
  stop() {
    for (const source of this._sources) {
      try {
        source.stop();
      } catch {
      }
    }
    this._sources.clear();
    this._pending = [];
    this._pendingDuration = 0;
    this._primed = false;
    if (this.audioContext) this._nextStartTime = this.audioContext.currentTime;
  }
  /** Release the AudioContext if this player created it. */
  async destroy() {
    this.stop();
    if (this._ownsContext && this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
};

// node_modules/pocket-tts-js/src/index.js
var DEFAULT_MODEL_BASE_URL = "https://huggingface.co/vlapky/pocket-tts-onnx/resolve/main/onnx";
var DEFAULT_ORT_BASE_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/";
var CACHE_NAME = "pocket-tts-js-v1";
var PocketTTS = class {
  /**
   * @param {object} [options]
   * @param {string} [options.language="english_2026-04"]  Language bundle to load.
   * @param {boolean} [options.quantized=true]  Use INT8 models (smaller/faster) vs full precision.
   * @param {boolean} [options.voiceCloning=true]  Download the encoder so cloneVoice() works.
   * @param {string} [options.modelBaseUrl]  Base URL of the `onnx/` folder on Hugging Face.
   * @param {string} [options.ortBaseUrl]  Base URL for onnxruntime-web dist files.
   * @param {string} [options.voicesUrl]  Optional explicit URL to a voices.bin for built-in voices.
   * @param {number} [options.maxThreads=8]  Max WASM threads (needs cross-origin isolation).
   * @param {boolean} [options.cache=true]  Persist downloaded assets in Cache Storage so later loads are instant/offline.
   * @param {string} [options.cacheName]  Override the Cache Storage bucket name.
   */
  constructor(options = {}) {
    this.options = {
      language: options.language || "english_2026-04",
      quantized: options.quantized !== false,
      voiceCloning: options.voiceCloning !== false,
      modelBaseUrl: (options.modelBaseUrl || DEFAULT_MODEL_BASE_URL).replace(/\/$/, ""),
      ortBaseUrl: options.ortBaseUrl || DEFAULT_ORT_BASE_URL,
      voicesUrl: options.voicesUrl || null,
      maxThreads: options.maxThreads || 8,
      cache: options.cache !== false,
      cacheName: options.cacheName || CACHE_NAME
    };
    this.worker = null;
    this.bundle = null;
    this.ready = false;
    this._nextId = 1;
    this._pending = /* @__PURE__ */ new Map();
    this._onChunk = null;
    this._onProgress = null;
    this._cloneCounter = 0;
  }
  get sampleRate() {
    return this.bundle ? this.bundle.sampleRate : 24e3;
  }
  get predefinedVoices() {
    return this.bundle ? this.bundle.predefinedVoices : [];
  }
  _ensureWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    this.worker.onmessage = (e) => this._handleMessage(e.data);
    this.worker.onerror = (e) => {
      const err = new Error(e.message || "Worker error");
      for (const { reject } of this._pending.values()) reject(err);
      this._pending.clear();
    };
  }
  _handleMessage(msg) {
    switch (msg.type) {
      case "ready":
        this.bundle = msg.bundle;
        return;
      case "chunk":
        if (this._onChunk) this._onChunk(msg.audio, msg.meta);
        return;
      case "progress":
        if (this._onProgress) this._onProgress(msg);
        return;
      case "status":
        if (this._onProgress) this._onProgress(msg);
        return;
      case "result": {
        const p = this._pending.get(msg.id);
        if (p) {
          this._pending.delete(msg.id);
          p.resolve(msg.result);
        }
        return;
      }
      case "error": {
        const p = this._pending.get(msg.id);
        if (p) {
          this._pending.delete(msg.id);
          p.reject(new Error(msg.error));
        } else if (this._onChunk || this._onProgress) {
          const err = new Error(msg.error);
          for (const { reject } of this._pending.values()) reject(err);
          this._pending.clear();
        }
        return;
      }
      default:
        return;
    }
  }
  _request(type, payload, transfer) {
    this._ensureWorker();
    const id = this._nextId++;
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload }, transfer || []);
    });
  }
  /**
   * Download the runtime + selected models and initialise the engine.
   * @param {(info: {type:string,label?:string,loaded?:number,total?:number,status?:string}) => void} [onProgress]
   */
  async load(onProgress) {
    this._onProgress = onProgress || null;
    await this._request("init", this.options);
    this.ready = true;
    return this.bundle;
  }
  /**
   * Clone a voice from a mono reference clip.
   * @param {Float32Array} audio  Mono PCM. Resampled to the model rate if needed via `inputSampleRate`.
   * @param {object} [opts]
   * @param {number} [opts.inputSampleRate]  Sample rate of `audio` (defaults to model rate).
   * @param {string} [opts.name]  Optional id; auto-generated otherwise.
   * @returns {Promise<string>} A voice reference usable in generate().
   */
  async cloneVoice(audio, opts = {}) {
    if (!this.options.voiceCloning) throw new Error("voiceCloning is disabled in options.");
    let pcm = audio;
    const target = this.sampleRate;
    if (opts.inputSampleRate && opts.inputSampleRate !== target) {
      pcm = resampleLinear(audio, opts.inputSampleRate, target);
    }
    const maxSamples = target * 10;
    if (pcm.length > maxSamples) pcm = pcm.slice(0, maxSamples);
    const ref = opts.name || `clone:${++this._cloneCounter}`;
    const buf = pcm.buffer === audio.buffer ? pcm.slice() : pcm;
    const { ref: out } = await this._request("cloneVoice", { audio: buf, ref }, [buf.buffer]);
    return out;
  }
  /**
   * Prepare a built-in voice (requires voices.bin to be available).
   * @param {string} name
   * @returns {Promise<string>} A voice reference usable in generate().
   */
  async loadVoice(name) {
    const { ref } = await this._request("loadBuiltinVoice", { name });
    return ref;
  }
  /**
   * Synthesize speech, streaming audio chunks as they are produced.
   * @param {string} text
   * @param {object} opts
   * @param {string} opts.voice  A voice reference from cloneVoice()/loadVoice().
   * @param {(audio: Float32Array, meta: object) => void} [opts.onChunk]  Per-chunk callback (mono Float32 @ sampleRate).
   * @returns {Promise<{rtfx:number,genTime:number,audioDuration:number}>}
   */
  async generate(text, opts = {}) {
    if (!opts.voice) throw new Error("generate() requires a `voice` reference.");
    this._onChunk = opts.onChunk || null;
    try {
      const { metrics } = await this._request("generate", { text, voiceRef: opts.voice });
      return metrics;
    } finally {
      this._onChunk = null;
    }
  }
  /** Request the current generation to stop early. */
  async stop() {
    if (!this.worker) return;
    await this._request("stop", {});
  }
  /** Terminate the worker and free all resources. */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this._pending.clear();
    this.ready = false;
    this.bundle = null;
  }
  /**
   * Delete all assets persisted in Cache Storage (forces a fresh download next load).
   * @param {string} [cacheName]  Defaults to the library's bucket.
   */
  static async clearCache(cacheName = CACHE_NAME) {
    if (typeof caches === "undefined") return false;
    return caches.delete(cacheName);
  }
  /**
   * Estimate how much the library has persisted (and the browser's quota), via
   * the Storage Manager API. Returns `null` if unsupported.
   * @returns {Promise<{usage:number, quota:number} | null>}
   */
  static async storageEstimate() {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
    const { usage, quota } = await navigator.storage.estimate();
    return { usage, quota };
  }
};
function resampleLinear(data, sourceRate, targetRate) {
  if (sourceRate === targetRate) return data;
  const ratio = sourceRate / targetRate;
  const outLength = Math.floor(data.length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIndex = i * ratio;
    const floor = Math.floor(srcIndex);
    const ceil = Math.min(floor + 1, data.length - 1);
    const t = srcIndex - floor;
    out[i] = data[floor] * (1 - t) + data[ceil] * t;
  }
  return out;
}

// lib/speech/speakableText.ts
function speakableText(input) {
  return input.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/```[\s\S]*?```/g, " ").replace(/`/g, "").replace(/^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/gm, " ").replace(/^[ \t]*[#>]+[ \t]*/gm, "").replace(/^[ \t]*[-*+][ \t]+/gm, "").replace(/[*_~]/g, "").replace(/^[ \t]*\|?[ \t:|-]*\|[ \t:|-]*$/gm, "").replace(/\|/g, " ").replace(/-/g, " ").replace(/[ \t]{2,}/g, " ").split("\n").map((line) => line.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// lib/speech/speechPhrasing.ts
var MAX_WORDS_PER_SENTENCE = 28;
var ABBREVIATIONS = [
  [/\bsq\.?\s*ft\.?/gi, "square feet"],
  [/\bapt\./gi, "apartment"],
  [/\bste\./gi, "suite"],
  [/\bblvd\./gi, "boulevard"],
  [/\bave\./gi, "avenue"],
  [/\bst\.(?=\s|$)/gi, "street"],
  [/\brd\./gi, "road"],
  [/\bapprox\./gi, "approximately"],
  [/\bincl\./gi, "including"],
  [/\bmin\./gi, "minimum"],
  [/\bmax\./gi, "maximum"],
  [/\bmo\./gi, "month"],
  [/\byr\./gi, "year"]
];
var FIELD_LABEL = /"([A-Za-z][A-Za-z0-9_ ]*)"\s*:\s*/g;
function humanizeFieldLabel(rawKey) {
  const words = rawKey.replace(/_/g, " ").trim().split(/\s+/);
  return words.map((word, index) => index === 0 ? word[0].toUpperCase() + word.slice(1) : word).join(" ");
}
function insertFieldPauses(text) {
  return text.replace(FIELD_LABEL, (_match, rawKey) => `
${humanizeFieldLabel(rawKey)}.
`);
}
function resolveNumericHyphens(text) {
  return text.replace(/,\s*-(\d)/g, ", negative $1").replace(/(\d)\s*-\s*(\$?\d)/g, "$1 to $2");
}
function expandNumbers(text) {
  return text.replace(/\$(\d[\d,]*)\.00\b/g, "$1 dollars").replace(/\$(\d[\d,]*)\.(\d{2})\b/g, "$1 dollars $2 cents").replace(/\$(\d[\d,]*)/g, "$1 dollars").replace(/(\d)\.(\d)/g, "$1 point $2").replace(/\s*\/\s*(month|mo|week|wk|night|day|yr|year)\b/gi, " per $1");
}
function sentencesOf(line) {
  return (line.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((s) => s.trim()).filter(Boolean);
}
function breakLongSentence(sentence) {
  const words = sentence.split(/\s+/);
  if (words.length <= MAX_WORDS_PER_SENTENCE) return [sentence];
  const clauses = sentence.split(/(?<=[,;:])\s+/);
  const out = [];
  let current = [];
  const flush = () => {
    if (!current.length) return;
    out.push(current.join(" ").replace(/[,;:]\s*$/, ""));
    current = [];
  };
  for (const clause of clauses) {
    const clauseWords = clause.split(/\s+/).filter(Boolean);
    const pending = current.reduce((n, c) => n + c.split(/\s+/).length, 0);
    if (pending && pending + clauseWords.length > MAX_WORDS_PER_SENTENCE) flush();
    if (clauseWords.length > MAX_WORDS_PER_SENTENCE) {
      flush();
      for (let i = 0; i < clauseWords.length; i += MAX_WORDS_PER_SENTENCE) {
        out.push(clauseWords.slice(i, i + MAX_WORDS_PER_SENTENCE).join(" ").replace(/[,;:]\s*$/, ""));
      }
      continue;
    }
    current.push(clause);
  }
  flush();
  return out.filter(Boolean);
}
function phraseForSynthesis(text) {
  const expanded = ABBREVIATIONS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
  const sentences = [];
  for (const line of expandNumbers(expanded).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const sentence of sentencesOf(trimmed)) {
      for (const part of breakLongSentence(sentence)) {
        sentences.push(/[.!?]$/.test(part) ? part : `${part}.`);
      }
    }
  }
  return sentences.join(" ");
}

// lib/speech/localSpeech.ts
var SAMPLE_RATE = 24e3;
var CACHE_NAME2 = "trippy-pocket-tts-v1";
var ORT_BASE_URL = `/ort/${"1.20.0"}/`;
var PREFERRED_VOICE = "alba";
var CHUNK_GAP_SECONDS = 0.25;
var NATURAL_VOICE = /natural|enhanced|premium|neural|samantha|ava|zira|aria|jenny|google|microsoft/i;
var AVOID_VOICE = /compact|novelty|robot/i;
var engine = null;
var enginePromise = null;
var audioContext = null;
var player = null;
var generation = null;
var finishTimer = null;
var activeRun = 0;
function canSpeakNaturally() {
  if (typeof window === "undefined") return false;
  return typeof Worker !== "undefined" && typeof WebAssembly === "object" && (typeof AudioContext !== "undefined" || "webkitAudioContext" in window) && window.isSecureContext;
}
function ensurePlayer() {
  if (player) return player;
  const Ctx = window.AudioContext ?? window.webkitAudioContext;
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
async function getEngine(onProgress) {
  if (engine) return engine;
  if (enginePromise) return enginePromise;
  enginePromise = (async () => {
    const tts = new PocketTTS({
      language: "english_2026-04",
      quantized: true,
      voiceCloning: false,
      ortBaseUrl: ORT_BASE_URL,
      cache: true,
      cacheName: CACHE_NAME2
    });
    try {
      const loaded = /* @__PURE__ */ new Map();
      const totals = /* @__PURE__ */ new Map();
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
          `[pocket-tts] Bundle sample rate ${bundle.sampleRate} does not match the player's ${SAMPLE_RATE}.`
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
function preferredSystemVoice(voices, lang) {
  const language = lang.toLowerCase().split("-")[0];
  return voices.filter((voice) => voice.lang.toLowerCase().startsWith(language)).sort((a, b) => {
    const score = (voice) => (voice.localService ? 8 : 0) + (NATURAL_VOICE.test(voice.name) ? 6 : 0) - (AVOID_VOICE.test(voice.name) ? 8 : 0);
    return score(b) - score(a);
  })[0];
}
function speakWithSystemVoice(spoken, callbacks, run) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = callbacks.lang ?? navigator.language ?? "en-US";
    utterance.rate = 0.96;
    utterance.onend = () => {
      if (run === activeRun) callbacks.onEnd?.();
    };
    utterance.onerror = () => {
      if (run === activeRun) callbacks.onError?.();
    };
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
async function speakNaturally(text, callbacks = {}) {
  if (typeof window === "undefined") return false;
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
      await generation.catch(() => void 0);
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
      }
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
    const tailMs = (metrics.audioDuration + silences * CHUNK_GAP_SECONDS) * 1e3;
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
function stopSpeaking() {
  activeRun += 1;
  clearFinishTimer();
  player?.stop();
  void engine?.tts.stop().catch(() => void 0);
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

// components/ui/ReadAloudButton.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime());
var nextButtonId = 1;
var activeButtonId = null;
var listeners = /* @__PURE__ */ new Set();
function setActiveButton(activeId) {
  activeButtonId = activeId;
  listeners.forEach((listener) => listener(activeId));
}
function stopReadAloud() {
  stopSpeaking();
  setActiveButton(null);
}
var STATUS_LABEL = {
  preparing: "Loading natural voice\u2026",
  generating: "Generating speech\u2026",
  "system-voice": "Using system voice"
};
var SYSTEM_VOICE_TOAST_MS = 2500;
function ReadAloudButton({ text, className, style, iconSize = 15 }) {
  const idRef = (0, import_react.useRef)(null);
  if (idRef.current === null) idRef.current = nextButtonId++;
  const id = idRef.current;
  const [speaking, setSpeaking] = (0, import_react.useState)(() => activeButtonId === id);
  const [status, setStatus] = (0, import_react.useState)(null);
  const systemVoiceTimerRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const listener = (activeId) => setSpeaking(activeId === id);
    listeners.add(listener);
    listener(activeButtonId);
    return () => {
      listeners.delete(listener);
      if (activeButtonId === id) setActiveButton(null);
    };
  }, [id]);
  const clearSystemVoiceTimer = (0, import_react.useCallback)(() => {
    if (systemVoiceTimerRef.current !== null) {
      window.clearTimeout(systemVoiceTimerRef.current);
      systemVoiceTimerRef.current = null;
    }
  }, []);
  (0, import_react.useEffect)(() => () => clearSystemVoiceTimer(), [clearSystemVoiceTimer]);
  const handleSpeak = (0, import_react.useCallback)(() => {
    if (speaking) {
      stopReadAloud();
      setStatus(null);
      clearSystemVoiceTimer();
      return;
    }
    const readableText = text.trim();
    if (!readableText) return;
    setActiveButton(id);
    void speakNaturally(readableText, {
      onStatus: (nextStatus, progress) => {
        if (activeButtonId !== id) return;
        clearSystemVoiceTimer();
        if (nextStatus === "speaking") {
          setStatus(null);
          return;
        }
        const label = STATUS_LABEL[nextStatus];
        if (!label) return;
        setStatus({ label, progress });
        if (nextStatus === "system-voice") {
          systemVoiceTimerRef.current = window.setTimeout(() => {
            if (activeButtonId === id) setStatus(null);
          }, SYSTEM_VOICE_TOAST_MS);
        }
      },
      onEnd: () => {
        if (activeButtonId === id) setActiveButton(null);
        setStatus(null);
        clearSystemVoiceTimer();
      },
      onError: () => {
        if (activeButtonId === id) setActiveButton(null);
        setStatus(null);
        clearSystemVoiceTimer();
      }
    }).then((started) => {
      if (!started && activeButtonId === id) {
        setActiveButton(null);
        setStatus(null);
      }
    });
  }, [clearSystemVoiceTimer, id, speaking, text]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        "aria-label": speaking ? "Stop reading" : "Read aloud",
        onClick: handleSpeak,
        className,
        style,
        children: speaking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeOff, { size: iconSize }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: iconSize })
      }
    ),
    status && // Fixed to the viewport corner, not anchored to the button: only one
    // instance can ever be active at a time (activeButtonId is a single
    // module-level value shared by every ReadAloudButton), and a
    // button-relative tooltip gets clipped or overlapped in narrow
    // viewports and inside modals. A corner toast is never in the way of
    // whatever the button itself sits on top of.
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "span",
      {
        role: "status",
        style: {
          position: "fixed",
          top: "calc(env(safe-area-inset-top, 0px) + 16px)",
          right: "calc(env(safe-area-inset-right, 0px) + 16px)",
          padding: "8px 14px",
          borderRadius: 8,
          background: "#1f1f1f",
          color: "#fff",
          fontSize: 13,
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          zIndex: 2147483647,
          pointerEvents: "none"
        },
        children: [
          status.label,
          typeof status.progress === "number" ? ` ${Math.round(status.progress * 100)}%` : ""
        ]
      }
    )
  ] });
}

export {
  stopReadAloud,
  ReadAloudButton
};
