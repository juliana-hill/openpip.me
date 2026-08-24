import {
  Markdown,
  remarkGfm,
  useAgentIdentity
} from "./chunk-GKLEY6TF.js";
import {
  ArrowRight,
  ArrowUp,
  Briefcase,
  Building2,
  Bus,
  BusFront,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Clock,
  ExternalLink,
  FileUp,
  House,
  MapPin,
  Mic,
  MicOff,
  Plane,
  Plus,
  RotateCcw,
  RotateCcwClock,
  Search,
  Smartphone,
  SquarePen,
  TramFront,
  Trash2,
  User,
  Volume2,
  VolumeOff,
  X,
  proxyFetch,
  require_jsx_runtime,
  require_react,
  useRouter
} from "./chunk-DONEC6XU.js";
import {
  __toESM
} from "./chunk-4VNS5WPM.js";

// compat/no-local-store.ts
var idbListSearches = async () => [];
var idbGetUserPrefs = async () => ({});
var idbSetUserPrefs = async (_prefs) => {
};
var idbAddNotification = async (_value) => {
};
var idbListChatSessions = async () => [];
var idbReadChatSession = async (_id) => null;
var idbWriteChatSession = async (_value) => {
};
var idbWriteChatMessage = async (_id, _value) => {
};
var idbDeleteChatSession = async (_id) => {
};

// compat/no-sync.ts
var pushUserData = async () => {
};
var loadAndRestoreUserData = async () => {
};
var loadAndRestorePlanningChat = async () => {
};
var loadAndRestoreTasksBackup = async () => {
};
var pushPlanningChatSessions = async () => {
};
var pushTasksBackup = async () => {
};

// lib/taskStorage.ts
async function getPersistedActiveTask() {
  const res = await proxyFetch("/agent/tasks/active");
  if (!res.ok) return null;
  const data = await res.json();
  return data.active ?? null;
}
async function setPersistedActiveTask(value) {
  await proxyFetch("/agent/tasks/active", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value)
  }).catch(() => {
  });
}
async function clearPersistedActiveTask() {
  await proxyFetch("/agent/tasks/active", { method: "DELETE" }).catch(() => {
  });
}
async function getAllTaskSchedules() {
  const res = await proxyFetch("/agent/tasks/schedules");
  if (!res.ok) return [];
  const data = await res.json();
  return Object.entries(data.schedules ?? {}).map(([taskId, entry]) => ({ taskId, ...entry }));
}
async function getTaskSchedule(taskId) {
  const res = await proxyFetch(`/agent/tasks/schedules/${encodeURIComponent(taskId)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.schedule ?? null;
}
async function patchTaskSchedule(taskId, patch) {
  await proxyFetch(`/agent/tasks/schedules/${encodeURIComponent(taskId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  }).catch(() => {
  });
}
async function saveTaskElapsed(taskId, elapsedMs) {
  return patchTaskSchedule(taskId, { elapsedMs });
}
async function deleteTaskSchedule(taskId) {
  await proxyFetch(`/agent/tasks/schedules/${encodeURIComponent(taskId)}`, { method: "DELETE" }).catch(() => {
  });
}

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
  return input.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\b(?:https?|ftp):\/\/[^\s<>'")]+/gi, "").replace(/\bwww\.[^\s<>'")]+/gi, "").replace(/\u00a0/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u034f\u061c\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, "").replace(/```[\s\S]*?```/g, " ").replace(/`/g, "").replace(/^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/gm, " ").replace(/^[ \t]*[#>]+[ \t]*/gm, "").replace(/^[ \t]*[-*+][ \t]+/gm, "").replace(/[*_~]/g, "").replace(/^[ \t]*\|?[ \t:|-]*\|[ \t:|-]*$/gm, "").replace(/\|/g, " ").replace(/-/g, " ").replace(/[ \t]{2,}/g, " ").split("\n").map((line) => line.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
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

// compat/no-sw.ts
var postToSW = async (_message) => {
};

// components/tasks/FloatingAssistant.tsx
var import_react8 = __toESM(require_react());

// lib/skills.ts
var SKILL_ALIASES = {
  "career-coach": "executive-assistant",
  "executive-coach": "executive-assistant",
  "travel-planner": "executive-assistant",
  "personal-assistant": "executive-assistant"
};
function normalizeSkill(skill) {
  if (!skill) return "executive-assistant";
  return SKILL_ALIASES[skill] ?? (skill === "general" || skill === "executive-assistant" ? skill : "executive-assistant");
}
var SKILL_LABELS = {
  general: "Tutorial",
  "executive-assistant": "Executive Assistant",
  // Legacy labels are retained for old persisted sessions only.
  "personal-assistant": "Executive Assistant",
  "career-coach": "Executive Assistant",
  "executive-coach": "Executive Assistant"
};

// components/routes/RouteCard.tsx
var import_react2 = __toESM(require_react());

// types/routes.ts
var modeIcons = {
  car: Car,
  flight: Plane,
  train: TramFront,
  bus: Bus,
  rideshare: Smartphone,
  local_bus: BusFront
};

// components/routes/RouteCard.module.css
var RouteCard_default = {
  card: "RouteCard_card",
  cardBody: "RouteCard_cardBody",
  header: "RouteCard_header",
  nameGroup: "RouteCard_nameGroup",
  modeIcons: "RouteCard_modeIcons",
  modeIcon: "RouteCard_modeIcon",
  routeName: "RouteCard_routeName",
  routeSubtitle: "RouteCard_routeSubtitle",
  stats: "RouteCard_stats",
  dateBadge: "RouteCard_dateBadge",
  dateBadgeLabel: "RouteCard_dateBadgeLabel",
  dateBadgeValue: "RouteCard_dateBadgeValue",
  stat: "RouteCard_stat",
  statLabel: "RouteCard_statLabel",
  statValue: "RouteCard_statValue",
  priceValue: "RouteCard_priceValue",
  priceBreakdown: "RouteCard_priceBreakdown",
  collapseGrid: "RouteCard_collapseGrid",
  closed: "RouteCard_closed",
  open: "RouteCard_open",
  collapseInner: "RouteCard_collapseInner",
  collapseContent: "RouteCard_collapseContent",
  barRow: "RouteCard_barRow",
  bar: "RouteCard_bar",
  barSegmentPrimary: "RouteCard_barSegmentPrimary",
  barSegmentTransit: "RouteCard_barSegmentTransit",
  workBadge: "RouteCard_workBadge",
  workBadgePositive: "RouteCard_workBadgePositive",
  workBadgeNeutral: "RouteCard_workBadgeNeutral",
  calendarNote: "RouteCard_calendarNote",
  legs: "RouteCard_legs",
  legRow: "RouteCard_legRow",
  legIconCol: "RouteCard_legIconCol",
  legIcon: "RouteCard_legIcon",
  legIconDefault: "RouteCard_legIconDefault",
  legIconLayover: "RouteCard_legIconLayover",
  legConnector: "RouteCard_legConnector",
  legConnectorDefault: "RouteCard_legConnectorDefault",
  legConnectorLayover: "RouteCard_legConnectorLayover",
  legContent: "RouteCard_legContent",
  legContentLast: "RouteCard_legContentLast",
  legContentDefault: "RouteCard_legContentDefault",
  legContentLayover: "RouteCard_legContentLayover",
  legHeader: "RouteCard_legHeader",
  legLabel: "RouteCard_legLabel",
  legLabelLayover: "RouteCard_legLabelLayover",
  legDuration: "RouteCard_legDuration",
  legDurationLayover: "RouteCard_legDurationLayover",
  legTimes: "RouteCard_legTimes",
  legStops: "RouteCard_legStops",
  legMeta: "RouteCard_legMeta",
  legLinks: "RouteCard_legLinks",
  legLink: "RouteCard_legLink",
  legAgencyLinks: "RouteCard_legAgencyLinks",
  legAgencyLink: "RouteCard_legAgencyLink"
};

// components/routes/RouteCard.tsx
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
function formatTravelDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1e3);
  const dateOnly = new Date(y, m - 1, d);
  const formatted = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (dateOnly.getTime() === today.getTime()) return `Today, ${formatted.replace(/^\w+,\s*/, "")}`;
  if (dateOnly.getTime() === tomorrow.getTime()) return `Tomorrow, ${formatted.replace(/^\w+,\s*/, "")}`;
  return formatted;
}
function parseCost(cost) {
  const m = cost.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, "")) : null;
}
function computeDisplayPrice(option) {
  if (option.totalPrice !== "N/A") return option.totalPrice;
  let sum = 0;
  let hasAny = false;
  for (const leg of option.legs) {
    const cost = parseCost(leg.cost);
    if (cost !== null) {
      sum += cost;
      hasAny = true;
    }
  }
  return hasAny ? `~$${sum.toLocaleString()}` : "N/A";
}
function computeDisplayDuration(option) {
  if (option.totalDuration !== "N/A") return option.totalDuration;
  const totalMins = option.legs.reduce((s, l) => s + l.durationMinutes, 0);
  if (totalMins <= 0) return "N/A";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const dur = h > 0 ? m > 0 ? `${h}h ${m}m` : `${h}h` : `${m}m`;
  return `~${dur}`;
}
function LegContent({ leg }) {
  if (leg.isLayover) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.legHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: RouteCard_default.legLabelLayover, children: [
        leg.isOvernightLayover ? "Overnight layover" : "Transfer",
        leg.layoverLocation ? ` at ${leg.layoverLocation}` : ""
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.legDurationLayover, children: leg.duration })
    ] }) });
  }
  const hasTimes = leg.departureTime || leg.arrivalTime;
  const hasStops = leg.from || leg.to;
  const showCost = leg.cost && leg.cost !== "$0";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.legHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.legLabel, children: leg.label }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: RouteCard_default.legDuration, children: [
        leg.duration,
        showCost ? ` \xB7 ${leg.cost}` : ""
      ] })
    ] }),
    hasTimes && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.legTimes, children: leg.departureTime && leg.arrivalTime ? `${leg.departureTime} \u2192 ${leg.arrivalTime}` : leg.departureTime ?? leg.arrivalTime }),
    hasStops && !hasTimes && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: RouteCard_default.legStops, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MapPin, { style: { display: "inline", width: 12, height: 12, marginRight: 2, verticalAlign: "-1px" } }),
      leg.from && leg.to ? `${leg.from} \u2192 ${leg.to}` : leg.from ?? leg.to
    ] }),
    (leg.headsign || leg.stopCount || leg.distanceLabel) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.legMeta, children: [
      leg.headsign ? `toward ${leg.headsign}` : null,
      leg.stopCount ? `${leg.stopCount} stop${leg.stopCount !== 1 ? "s" : ""}` : null,
      leg.distanceLabel ?? null
    ].filter(Boolean).join(" \xB7 ") }),
    leg.links && leg.links.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: RouteCard_default.legLinks, children: leg.links.map((link, j) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { href: link.url, target: "_blank", rel: "noopener noreferrer", className: RouteCard_default.legLink, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ExternalLink, { style: { width: 12, height: 12, flexShrink: 0 } }),
      link.title
    ] }, j)) }),
    (leg.agencyUri || leg.lineUri) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.legAgencyLinks, children: [
      leg.lineUri && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { href: leg.lineUri, target: "_blank", rel: "noopener noreferrer", className: RouteCard_default.legAgencyLink, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ExternalLink, { style: { width: 10, height: 10, flexShrink: 0 } }),
        "Route info"
      ] }),
      leg.agencyUri && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("a", { href: leg.agencyUri, target: "_blank", rel: "noopener noreferrer", className: RouteCard_default.legAgencyLink, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ExternalLink, { style: { width: 10, height: 10, flexShrink: 0 } }),
        "Agency website"
      ] })
    ] })
  ] });
}
function RouteCard({ option, travelDate }) {
  const [collapsed, setCollapsed] = (0, import_react2.useState)(true);
  const totalMinutes = option.legs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const displayPrice = computeDisplayPrice(option);
  const displayDuration = computeDisplayDuration(option);
  const priceParenIdx = displayPrice.indexOf(" (");
  const priceTotal = priceParenIdx !== -1 ? displayPrice.slice(0, priceParenIdx) : displayPrice;
  const priceBreakdown = priceParenIdx !== -1 ? displayPrice.slice(priceParenIdx) : null;
  const routeDate = option.travelDate;
  const showDateBadge = routeDate && routeDate !== travelDate;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: RouteCard_default.card, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.cardBody, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.header, onClick: () => setCollapsed((c) => !c), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.nameGroup, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: RouteCard_default.modeIcons, children: option.modes.map((mode, i) => {
          const Icon = modeIcons[mode];
          return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: RouteCard_default.modeIcon, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { style: { width: 20, height: 20 } }) }, `${mode}-${i}`);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { className: RouteCard_default.routeName, children: option.name }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.routeSubtitle, children: option.subtitle })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.stats, children: [
        showDateBadge && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.dateBadge, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.dateBadgeLabel, children: "Date" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.dateBadgeValue, children: formatTravelDate(routeDate) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.stat, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.statLabel, children: "Duration" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.statValue, children: displayDuration })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.stat, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.statLabel, children: "Price" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.priceValue, children: priceTotal }),
          priceBreakdown && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: RouteCard_default.priceBreakdown, children: priceBreakdown })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `${RouteCard_default.collapseGrid} ${collapsed ? RouteCard_default.closed : RouteCard_default.open}`, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: RouteCard_default.collapseInner, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.collapseContent, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.barRow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: RouteCard_default.bar, children: option.legs.map((leg, i) => {
          const pct = totalMinutes > 0 ? leg.durationMinutes / totalMinutes * 100 : 0;
          const isTransit = leg.mode === "train" || leg.mode === "bus" || leg.mode === "local_bus";
          return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              className: isTransit ? RouteCard_default.barSegmentTransit : RouteCard_default.barSegmentPrimary,
              style: { width: `${pct}%` }
            },
            i
          );
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `${RouteCard_default.workBadge} ${option.workableHours > 0 ? RouteCard_default.workBadgePositive : RouteCard_default.workBadgeNeutral}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Briefcase, { style: { display: "inline", width: 12, height: 12, marginRight: 4, verticalAlign: "-1px" } }),
          "Work: ",
          option.workableHours,
          "h"
        ] })
      ] }),
      option.calendarNote && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.calendarNote, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Calendar, { style: { width: 14, height: 14, marginTop: 2, flexShrink: 0 } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: option.calendarNote })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: RouteCard_default.legs, children: option.legs.map((leg, i) => {
        const isLast = i === option.legs.length - 1;
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.legRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: RouteCard_default.legIconCol, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `${RouteCard_default.legIcon} ${leg.isLayover ? RouteCard_default.legIconLayover : RouteCard_default.legIconDefault}`, children: leg.isLayover ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Clock, { style: { width: 16, height: 16 } }) : (() => {
              const Icon = modeIcons[leg.mode];
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { style: { width: 16, height: 16 } });
            })() }),
            !isLast && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `${RouteCard_default.legConnector} ${leg.isLayover ? RouteCard_default.legConnectorLayover : RouteCard_default.legConnectorDefault}` })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `${RouteCard_default.legContent} ${isLast ? RouteCard_default.legContentLast : ""} ${leg.isLayover ? RouteCard_default.legContentLayover : RouteCard_default.legContentDefault}`, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LegContent, { leg }) })
        ] }, i);
      }) })
    ] }) }) })
  ] }) });
}

// components/routes/RouteComparisonCard.module.css
var RouteComparisonCard_default = {
  cards: "RouteComparisonCard_cards",
  empty: "RouteComparisonCard_empty"
};

// components/routes/RouteComparisonCard.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime());
function parseDurationMinutes(dur) {
  const h = dur.match(/(\d+)h/);
  const m = dur.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}
function RouteComparisonCard({ result }) {
  if (!result?.routes?.length) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: RouteComparisonCard_default.empty, children: "No routes found." });
  }
  const sorted = [...result.routes].sort((a, b) => {
    const aMs = a.departureIso ? new Date(a.departureIso).getTime() : Infinity;
    const bMs = b.departureIso ? new Date(b.departureIso).getTime() : Infinity;
    if (aMs !== bMs) return aMs - bMs;
    return parseDurationMinutes(a.totalDuration) - parseDurationMinutes(b.totalDuration);
  });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: RouteComparisonCard_default.cards, children: sorted.map((route, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(RouteCard, { option: route }, i)) });
}

// components/calendar/CalendarSummaryCard.module.css
var CalendarSummaryCard_default = {
  card: "CalendarSummaryCard_card",
  calHeader: "CalendarSummaryCard_calHeader",
  dot: "CalendarSummaryCard_dot",
  calName: "CalendarSummaryCard_calName",
  count: "CalendarSummaryCard_count",
  events: "CalendarSummaryCard_events",
  event: "CalendarSummaryCard_event",
  eventTitle: "CalendarSummaryCard_eventTitle",
  eventTime: "CalendarSummaryCard_eventTime",
  empty: "CalendarSummaryCard_empty"
};

// components/calendar/CalendarSummaryCard.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime());
var CALENDAR_COLORS = [
  "#4285f4",
  "#0b8043",
  "#8e24aa",
  "#d50000",
  "#f4511e",
  "#039be5",
  "#7986cb",
  "#616161"
];
function formatTimeRange(start, end) {
  if (!start.includes("T")) {
    const dateStr2 = (/* @__PURE__ */ new Date(start + "T00:00:00")).toLocaleDateString(void 0, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    return `${dateStr2} \u2014 All day`;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateStr = startDate.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" });
  const startTime = startDate.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  const endTime = endDate.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  return `${dateStr}, ${startTime} \u2013 ${endTime}`;
}
function groupByCalendar(events) {
  const colorMap = /* @__PURE__ */ new Map();
  const grouped = /* @__PURE__ */ new Map();
  for (const event of events) {
    const name = event.calendarName;
    if (!grouped.has(name)) {
      grouped.set(name, []);
      colorMap.set(name, CALENDAR_COLORS[colorMap.size % CALENDAR_COLORS.length]);
    }
    grouped.get(name).push(event);
  }
  return Array.from(grouped.entries()).map(([name, events2]) => ({
    name,
    color: colorMap.get(name),
    events: events2
  }));
}
function CalendarSummaryCard({ result }) {
  let events = [];
  try {
    if (typeof result === "string") events = JSON.parse(result);
    else if (Array.isArray(result)) events = result;
  } catch {
  }
  const speechText = events.map((event) => `${event.title}, ${formatTimeRange(event.start, event.end)}`).join(". ");
  if (!events.length) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: CalendarSummaryCard_default.empty, children: "No calendar events found." });
  }
  const calendars = groupByCalendar(events);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CalendarSummaryCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 4 }, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ReadAloudButton, { text: speechText, style: { background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, display: "flex", alignItems: "center" }, iconSize: 14 }) }),
    calendars.map((cal, ci) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CalendarSummaryCard_default.calHeader, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: CalendarSummaryCard_default.dot, style: { backgroundColor: cal.color } }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: CalendarSummaryCard_default.calName, children: cal.name }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: CalendarSummaryCard_default.count, children: [
          cal.events.length,
          " event",
          cal.events.length !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: CalendarSummaryCard_default.events, children: cal.events.map((event, ei) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: CalendarSummaryCard_default.event, style: { borderLeftColor: cal.color }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: CalendarSummaryCard_default.eventTitle, children: event.title }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: CalendarSummaryCard_default.eventTime, children: formatTimeRange(event.start, event.end) })
      ] }, ei)) })
    ] }, ci))
  ] });
}

// components/routes/TransportHubsCard.module.css
var TransportHubsCard_default = {
  card: "TransportHubsCard_card",
  header: "TransportHubsCard_header",
  title: "TransportHubsCard_title",
  subtitle: "TransportHubsCard_subtitle",
  body: "TransportHubsCard_body",
  section: "TransportHubsCard_section",
  sectionHeader: "TransportHubsCard_sectionHeader",
  sectionIcon: "TransportHubsCard_sectionIcon",
  sectionLabel: "TransportHubsCard_sectionLabel",
  grid: "TransportHubsCard_grid",
  hub: "TransportHubsCard_hub",
  hubName: "TransportHubsCard_hubName",
  hubCode: "TransportHubsCard_hubCode",
  hubCity: "TransportHubsCard_hubCity",
  empty: "TransportHubsCard_empty"
};

// components/routes/TransportHubsCard.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
var hubSections = [
  { key: "airports", label: "Airports", Icon: Plane },
  { key: "trainStations", label: "Train Stations", Icon: TramFront },
  { key: "busStations", label: "Bus Stations", Icon: Bus },
  { key: "busStops", label: "Bus Stops", Icon: MapPin }
];
function TransportHubsCard({ result, location }) {
  let hubs = null;
  try {
    if (typeof result === "string") hubs = JSON.parse(result);
    else hubs = result;
  } catch {
  }
  if (!hubs) return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: TransportHubsCard_default.empty, children: "No transport hubs found." });
  const totalHubs = hubs.airports.length + hubs.trainStations.length + hubs.busStations.length + (hubs.busStops?.length ?? 0);
  if (totalHubs === 0) return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: TransportHubsCard_default.empty, children: [
    "No transport hubs found near ",
    location,
    "."
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: TransportHubsCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: TransportHubsCard_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: TransportHubsCard_default.title, children: "Transport Hubs" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: TransportHubsCard_default.subtitle, children: [
        "Near ",
        location
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: TransportHubsCard_default.body, children: hubSections.map(({ key, label, Icon }) => {
      const items = hubs[key] ?? [];
      if (items.length === 0) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: TransportHubsCard_default.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: TransportHubsCard_default.sectionHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { size: 14, className: TransportHubsCard_default.sectionIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: TransportHubsCard_default.sectionLabel, children: label })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: TransportHubsCard_default.grid, children: items.map((hub, i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: TransportHubsCard_default.hub, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: TransportHubsCard_default.hubName, children: [
            hub.name,
            hub.code && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: TransportHubsCard_default.hubCode, children: hub.code })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: TransportHubsCard_default.hubCity, children: hub.city })
        ] }, i)) })
      ] }, key);
    }) })
  ] });
}

// components/chat/WebSearchCard.module.css
var WebSearchCard_default = {
  card: "WebSearchCard_card",
  header: "WebSearchCard_header",
  searchIcon: "WebSearchCard_searchIcon",
  title: "WebSearchCard_title",
  count: "WebSearchCard_count",
  queryRow: "WebSearchCard_queryRow",
  query: "WebSearchCard_query",
  results: "WebSearchCard_results",
  result: "WebSearchCard_result",
  externalIcon: "WebSearchCard_externalIcon",
  resultBody: "WebSearchCard_resultBody",
  resultTitle: "WebSearchCard_resultTitle",
  resultDomain: "WebSearchCard_resultDomain",
  resultSnippet: "WebSearchCard_resultSnippet",
  empty: "WebSearchCard_empty"
};

// components/chat/WebSearchCard.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime());
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
function truncateSnippet(text, maxLen = 200) {
  const cleaned = text.replace(/Skip to content\n?/gi, "").replace(/Accessibility Feedback\n?/gi, "").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length <= maxLen) return cleaned;
  const cut = cleaned.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut) + "\u2026";
}
function WebSearchCard({ result, query, toolName }) {
  let results = [];
  if (toolName === "WebSearch") {
    if (typeof result === "string") {
      const match = result.match(/Links:\s*(\[[\s\S]*?\])/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          results = parsed.filter((r) => r.url).map((r) => ({ title: r.title ?? r.url, url: r.url, snippet: "" }));
        } catch {
        }
      }
    }
  } else {
    try {
      if (typeof result === "string") results = JSON.parse(result);
      else if (Array.isArray(result)) results = result;
    } catch {
    }
  }
  if (!Array.isArray(results) || results.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: WebSearchCard_default.empty, children: [
      "No results found for \u201C",
      query,
      "\u201D"
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: WebSearchCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: WebSearchCard_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Search, { size: 14, className: WebSearchCard_default.searchIcon }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: WebSearchCard_default.title, children: "Web Search" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: WebSearchCard_default.count, children: [
        results.length,
        " result",
        results.length !== 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: WebSearchCard_default.queryRow, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: WebSearchCard_default.query, children: query }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: WebSearchCard_default.results, children: results.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "a",
      {
        href: r.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: WebSearchCard_default.result,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ExternalLink, { size: 14, className: WebSearchCard_default.externalIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: WebSearchCard_default.resultBody, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: WebSearchCard_default.resultTitle, children: r.title }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: WebSearchCard_default.resultDomain, children: extractDomain(r.url) }),
            r.snippet && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: WebSearchCard_default.resultSnippet, children: truncateSnippet(r.snippet) })
          ] })
        ]
      },
      i
    )) })
  ] });
}

// components/chat/CollapsibleToolCard.tsx
var import_react3 = __toESM(require_react());

// components/chat/CollapsibleToolCard.module.css
var CollapsibleToolCard_default = {
  card: "CollapsibleToolCard_card",
  header: "CollapsibleToolCard_header",
  icon: "CollapsibleToolCard_icon",
  title: "CollapsibleToolCard_title",
  subtitle: "CollapsibleToolCard_subtitle",
  chevron: "CollapsibleToolCard_chevron",
  chevronOpen: "CollapsibleToolCard_chevronOpen",
  body: "CollapsibleToolCard_body"
};

// components/chat/CollapsibleToolCard.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime());
function CollapsibleToolCard({ icon, title, subtitle, defaultExpanded = false, children }) {
  const [expanded, setExpanded] = (0, import_react3.useState)(defaultExpanded);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: CollapsibleToolCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        className: CollapsibleToolCard_default.header,
        onClick: () => setExpanded(!expanded),
        role: "button",
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") setExpanded(!expanded);
        },
        children: [
          icon && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: CollapsibleToolCard_default.icon, children: icon }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: CollapsibleToolCard_default.title, children: title }),
          subtitle && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: CollapsibleToolCard_default.subtitle, children: subtitle }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ChevronRight, { size: 14, className: `${CollapsibleToolCard_default.chevron} ${expanded ? CollapsibleToolCard_default.chevronOpen : ""}` })
        ]
      }
    ),
    expanded && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: CollapsibleToolCard_default.body, children })
  ] });
}

// components/tasks/TaskCard.module.css
var TaskCard_default = {
  list: "TaskCard_list",
  row: "TaskCard_row",
  left: "TaskCard_left",
  topLine: "TaskCard_topLine",
  sourceBadge: "TaskCard_sourceBadge",
  source_google: "TaskCard_source_google",
  identifier: "TaskCard_identifier",
  title: "TaskCard_title",
  bottomLine: "TaskCard_bottomLine",
  project: "TaskCard_project",
  chip: "TaskCard_chip",
  scheduled: "TaskCard_scheduled",
  right: "TaskCard_right",
  status: "TaskCard_status",
  priorityBadge: "TaskCard_priorityBadge",
  priority_ASAP: "TaskCard_priority_ASAP",
  priority_HIGH: "TaskCard_priority_HIGH",
  priority_MEDIUM: "TaskCard_priority_MEDIUM",
  priority_LOW: "TaskCard_priority_LOW",
  empty: "TaskCard_empty"
};

// components/tasks/TaskCard.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime());
function parsePriority(raw) {
  if (typeof raw === "number") return ["LOW", "ASAP", "HIGH", "MEDIUM", "LOW"][raw] ?? "MEDIUM";
  if (typeof raw === "string") {
    const u = raw.toUpperCase();
    if (u === "ASAP" || u === "HIGH" || u === "MEDIUM" || u === "LOW") return u;
  }
  return "MEDIUM";
}
function parseStatus(raw) {
  if (!raw) return "Todo";
  return typeof raw === "string" ? raw : raw.name ?? "Todo";
}
function getDurationLabel(task) {
  let mins = null;
  if (task.scheduledStartTime && task.scheduledEndTime) {
    const [sh, sm] = task.scheduledStartTime.split(":").map(Number);
    const [eh, em] = task.scheduledEndTime.split(":").map(Number);
    const calc = eh * 60 + em - (sh * 60 + sm);
    if (calc > 0) mins = calc;
  }
  if (mins === null && task.duration) mins = task.duration;
  if (mins === null) return null;
  return mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}` : `${mins}m`;
}
function getScheduledLabel(task) {
  const date = task.scheduledFor ?? task.scheduledStart;
  if (!date) return null;
  const d = new Date(date.includes("T") ? date : date + "T12:00:00");
  const label = d.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" });
  if (task.scheduledStartTime && task.scheduledEndTime) {
    return `${label} \xB7 ${task.scheduledStartTime}\u2013${task.scheduledEndTime}`;
  }
  return label;
}
function resolveSource(task) {
  const s = task.source;
  return "google";
}
function TaskRow({ task }) {
  const title = task.title ?? task.name ?? "Untitled";
  const priority = parsePriority(task.priority);
  const status = parseStatus(task.state ?? task.status);
  const duration = getDurationLabel(task);
  const scheduled = getScheduledLabel(task);
  const source = resolveSource(task);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: TaskCard_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: TaskCard_default.left, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: TaskCard_default.topLine, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `${TaskCard_default.sourceBadge} ${TaskCard_default[`source_${source}`]}`, children: "Google Tasks" }),
        task.identifier && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: TaskCard_default.identifier, children: task.identifier }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: TaskCard_default.title, children: title })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: TaskCard_default.bottomLine, children: [
        task.project && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: TaskCard_default.project, children: task.project }),
        duration && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: TaskCard_default.chip, children: duration }),
        scheduled && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: TaskCard_default.scheduled, children: scheduled })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: TaskCard_default.right, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: TaskCard_default.status, children: status }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: `${TaskCard_default.priorityBadge} ${TaskCard_default[`priority_${priority}`]}`, children: priority })
    ] })
  ] });
}
function TaskCard({ result, toolName: _toolName }) {
  if (!result) return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: TaskCard_default.empty, children: "No tasks found." });
  let tasks = null;
  try {
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) tasks = parsed;
    else if (parsed && Array.isArray(parsed.tasks)) tasks = parsed.tasks;
  } catch {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: TaskCard_default.empty, children: result });
  }
  if (!tasks || tasks.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: TaskCard_default.empty, children: "No tasks found." });
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: TaskCard_default.list, children: tasks.map((task, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(TaskRow, { task }, task.id ?? i)) });
}

// components/calendar/CalendarEventProposalCard.tsx
var import_react4 = __toESM(require_react());

// components/calendar/CalendarEventProposalCard.module.css
var CalendarEventProposalCard_default = {
  card: "CalendarEventProposalCard_card",
  titleRow: "CalendarEventProposalCard_titleRow",
  calIcon: "CalendarEventProposalCard_calIcon",
  eventTitle: "CalendarEventProposalCard_eventTitle",
  timeRange: "CalendarEventProposalCard_timeRange",
  locationRow: "CalendarEventProposalCard_locationRow",
  pinIcon: "CalendarEventProposalCard_pinIcon",
  location: "CalendarEventProposalCard_location",
  error: "CalendarEventProposalCard_error",
  actions: "CalendarEventProposalCard_actions",
  acceptBtn: "CalendarEventProposalCard_acceptBtn",
  dismissBtn: "CalendarEventProposalCard_dismissBtn",
  accepted: "CalendarEventProposalCard_accepted"
};

// components/calendar/CalendarEventProposalCard.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime());
function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" });
  const startTime = s.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  const endTime = e.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  return `${date}, ${startTime} \u2013 ${endTime}`;
}
function CalendarEventProposalCard({ args }) {
  const [state, setState] = (0, import_react4.useState)("pending");
  const [loading, setLoading] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)(null);
  if (state === "dismissed") return null;
  if (state === "accepted") {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: CalendarEventProposalCard_default.accepted, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(CircleCheckBig, { size: 16 }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("strong", { children: args.title }),
        " added to your calendar."
      ] })
    ] });
  }
  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await proxyFetch("/agent/calendars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: args.calendarId,
          title: args.title,
          start: args.start,
          end: args.end,
          description: args.description,
          location: args.location
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add event.");
      } else {
        setState("accepted");
      }
    } catch {
      setError("Network error \u2014 could not add event.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: CalendarEventProposalCard_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: CalendarEventProposalCard_default.titleRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Calendar, { size: 14, className: CalendarEventProposalCard_default.calIcon }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: CalendarEventProposalCard_default.eventTitle, children: args.title })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: CalendarEventProposalCard_default.timeRange, children: formatRange(args.start, args.end) }),
    args.location && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: CalendarEventProposalCard_default.locationRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(MapPin, { size: 12, className: CalendarEventProposalCard_default.pinIcon }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: CalendarEventProposalCard_default.location, children: args.location })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: CalendarEventProposalCard_default.error, children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: CalendarEventProposalCard_default.actions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: CalendarEventProposalCard_default.acceptBtn, onClick: handleAccept, disabled: loading, children: loading ? "Adding\u2026" : "Add to Calendar" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
        "button",
        {
          className: CalendarEventProposalCard_default.dismissBtn,
          onClick: () => setState("dismissed"),
          disabled: loading,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(X, { size: 12 }),
            "Dismiss"
          ]
        }
      )
    ] })
  ] });
}

// components/chat/ComposerPlusMenu.tsx
var import_react5 = __toESM(require_react());

// components/ui/dropdown-menu.tsx
var React = __toESM(require_react());
var import_jsx_runtime10 = __toESM(require_jsx_runtime());
var DropdownContext = React.createContext({ open: false, setOpen: () => {
} });
function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(DropdownContext.Provider, { value: { open, setOpen }, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { ref, style: { position: "relative", display: "inline-block" }, children }) });
}
function DropdownMenuTrigger({ children, asChild, ...props }) {
  const { setOpen, open } = React.useContext(DropdownContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(!open);
      }
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { type: "button", onClick: () => setOpen(!open), ...props, children });
}
function DropdownMenuContent({ className, align: _align, alignOffset: _alignOffset, side, sideOffset: _sideOffset, children, ...props }) {
  const { open } = React.useContext(DropdownContext);
  if (!open) return null;
  const isTop = side === "top";
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    "div",
    {
      style: {
        position: "absolute",
        ...isTop ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" },
        left: 0,
        zIndex: 60
      },
      className,
      ...props,
      children
    }
  );
}
function DropdownMenuItem({ className, inset: _inset, variant: _variant, children, onClick, ...props }) {
  const { setOpen } = React.useContext(DropdownContext);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    "button",
    {
      type: "button",
      onClick: (e) => {
        onClick?.(e);
        setOpen(false);
      },
      className,
      ...props,
      children
    }
  );
}

// components/chat/ComposerPlusMenu.module.css
var ComposerPlusMenu_default = {
  trigger: "ComposerPlusMenu_trigger",
  menu: "ComposerPlusMenu_menu",
  item: "ComposerPlusMenu_item",
  itemIcon: "ComposerPlusMenu_itemIcon",
  itemLabel: "ComposerPlusMenu_itemLabel",
  itemDesc: "ComposerPlusMenu_itemDesc"
};

// components/chat/ComposerPlusMenu.tsx
var import_jsx_runtime11 = __toESM(require_jsx_runtime());
function ComposerPlusMenu({
  onSelectCalendarEvent,
  onSelectSavedAddress,
  onFileSelected
}) {
  const fileInputRef = (0, import_react5.useRef)(null);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: ".pdf,.png,.jpg,.jpeg",
        style: { display: "none" },
        onChange: (e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected?.(file);
          e.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(DropdownMenu, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DropdownMenuTrigger, { suppressHydrationWarning: true, className: ComposerPlusMenu_default.trigger, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Plus, { size: 18 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(DropdownMenuContent, { align: "start", side: "top", className: ComposerPlusMenu_default.menu, children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(DropdownMenuItem, { className: ComposerPlusMenu_default.item, onClick: onSelectCalendarEvent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Calendar, { size: 15, className: ComposerPlusMenu_default.itemIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: ComposerPlusMenu_default.itemLabel, children: "Calendar Event" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: ComposerPlusMenu_default.itemDesc, children: "Search your Google Calendar" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(DropdownMenuItem, { className: ComposerPlusMenu_default.item, onClick: onSelectSavedAddress, children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(MapPin, { size: 15, className: ComposerPlusMenu_default.itemIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: ComposerPlusMenu_default.itemLabel, children: "Saved Address" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: ComposerPlusMenu_default.itemDesc, children: "Attach a saved location" })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(DropdownMenuItem, { className: ComposerPlusMenu_default.item, onClick: () => fileInputRef.current?.click(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(FileUp, { size: 15, className: ComposerPlusMenu_default.itemIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: ComposerPlusMenu_default.itemLabel, children: "Upload File" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: ComposerPlusMenu_default.itemDesc, children: "Attach a PDF or image" })
          ] })
        ] })
      ] })
    ] })
  ] });
}

// components/chat/ContextChip.tsx
var import_jsx_runtime12 = __toESM(require_jsx_runtime());
function ContextChip({ chip, onRemove }) {
  const label = chip.kind === "event" ? chip.title : chip.label;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--color-accent-light)", borderRadius: 999, padding: "4px 10px", fontSize: "var(--font-size-xs)", color: "var(--color-accent)", whiteSpace: "nowrap", flexShrink: 0 }, children: [
    chip.kind === "event" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Calendar, { style: { width: 12, height: 12, flexShrink: 0 } }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(MapPin, { style: { width: 12, height: 12, flexShrink: 0 } }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { style: { maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      "button",
      {
        type: "button",
        "aria-label": `Remove ${label}`,
        onClick: onRemove,
        style: { background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "var(--color-accent)", marginLeft: 2, flexShrink: 0 },
        children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(X, { style: { width: 12, height: 12 } })
      }
    )
  ] });
}

// components/chat/CalendarEventPickerSheet.tsx
var import_react6 = __toESM(require_react());

// components/chat/CalendarEventPickerSheet.module.css
var CalendarEventPickerSheet_default = {
  backdrop: "CalendarEventPickerSheet_backdrop",
  fadeIn: "CalendarEventPickerSheet_fadeIn",
  modal: "CalendarEventPickerSheet_modal",
  slideUp: "CalendarEventPickerSheet_slideUp",
  header: "CalendarEventPickerSheet_header",
  title: "CalendarEventPickerSheet_title",
  closeBtn: "CalendarEventPickerSheet_closeBtn",
  searchRow: "CalendarEventPickerSheet_searchRow",
  searchIcon: "CalendarEventPickerSheet_searchIcon",
  searchInput: "CalendarEventPickerSheet_searchInput",
  list: "CalendarEventPickerSheet_list",
  group: "CalendarEventPickerSheet_group",
  groupLabel: "CalendarEventPickerSheet_groupLabel",
  eventRow: "CalendarEventPickerSheet_eventRow",
  eventRowChecked: "CalendarEventPickerSheet_eventRowChecked",
  checkbox: "CalendarEventPickerSheet_checkbox",
  checkboxChecked: "CalendarEventPickerSheet_checkboxChecked",
  calDot: "CalendarEventPickerSheet_calDot",
  eventBody: "CalendarEventPickerSheet_eventBody",
  eventTitle: "CalendarEventPickerSheet_eventTitle",
  eventMeta: "CalendarEventPickerSheet_eventMeta",
  skeleton: "CalendarEventPickerSheet_skeleton",
  pulse: "CalendarEventPickerSheet_pulse",
  empty: "CalendarEventPickerSheet_empty",
  footer: "CalendarEventPickerSheet_footer",
  confirmBtn: "CalendarEventPickerSheet_confirmBtn"
};

// components/chat/CalendarEventPickerSheet.tsx
var import_jsx_runtime13 = __toESM(require_jsx_runtime());
function formatEventTime(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  if (!start.includes("T")) return "All day";
  const fmt = (d) => d.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" });
  return `${fmt(s)} \u2013 ${fmt(e)}`;
}
function groupEventsByDate(events) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const groups = /* @__PURE__ */ new Map();
  for (const ev of events) {
    const d = new Date(ev.start);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    if (!groups.has(key)) groups.set(key, { date: d, events: [] });
    groups.get(key).events.push(ev);
  }
  return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime()).map(({ date, events: events2 }) => {
    const short = date.toLocaleDateString(void 0, { month: "short", day: "numeric" });
    const label = date.getTime() === today.getTime() ? `Today, ${short}` : date.getTime() === tomorrow.getTime() ? `Tomorrow, ${short}` : date.toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" });
    return { label, events: events2 };
  });
}
function CalendarEventPickerSheet({ open, onClose, onConfirm }) {
  const [events, setEvents] = (0, import_react6.useState)([]);
  const [loading, setLoading] = (0, import_react6.useState)(false);
  const [selectedIds, setSelectedIds] = (0, import_react6.useState)(/* @__PURE__ */ new Set());
  const [query, setQuery] = (0, import_react6.useState)("");
  (0, import_react6.useEffect)(() => {
    if (!open) return;
    setSelectedIds(/* @__PURE__ */ new Set());
    setQuery("");
    setLoading(true);
    const from = (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
    proxyFetch(`/agent/calendars?days=7&from=${from}`).then((r) => r.json()).then((data) => {
      const seen = /* @__PURE__ */ new Set();
      const flat = [];
      for (const cal of data.calendars ?? []) {
        for (const ev of cal.events ?? []) {
          const id = `${cal.id}:${ev.start}:${ev.title}`;
          if (seen.has(id)) continue;
          seen.add(id);
          flat.push({ id, title: ev.title, start: ev.start, end: ev.end, location: ev.location, calendarColor: cal.color });
        }
      }
      flat.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setEvents(flat);
    }).catch(() => setEvents([])).finally(() => setLoading(false));
  }, [open]);
  const filtered = (0, import_react6.useMemo)(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter((e) => e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q));
  }, [events, query]);
  const groups = (0, import_react6.useMemo)(() => groupEventsByDate(filtered), [filtered]);
  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function handleConfirm() {
    const selected = events.filter((e) => selectedIds.has(e.id)).map((e) => ({ kind: "event", id: e.id, title: e.title, start: e.start, end: e.end }));
    onConfirm(selected);
    onClose();
  }
  if (!open) return null;
  const count = selectedIds.size;
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: CalendarEventPickerSheet_default.backdrop, onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CalendarEventPickerSheet_default.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CalendarEventPickerSheet_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { className: CalendarEventPickerSheet_default.title, children: "Add Calendar Events" }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("button", { type: "button", "aria-label": "Close", onClick: onClose, className: CalendarEventPickerSheet_default.closeBtn, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(X, { size: 16 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CalendarEventPickerSheet_default.searchRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Search, { size: 15, className: CalendarEventPickerSheet_default.searchIcon }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        "input",
        {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Search events\u2026",
          className: CalendarEventPickerSheet_default.searchInput
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: CalendarEventPickerSheet_default.list, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_jsx_runtime13.Fragment, { children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: CalendarEventPickerSheet_default.skeleton }, i)) }) : groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: CalendarEventPickerSheet_default.empty, children: "No events found" }) : groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CalendarEventPickerSheet_default.group, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: CalendarEventPickerSheet_default.groupLabel, children: group.label }),
      group.events.map((ev) => {
        const checked = selectedIds.has(ev.id);
        return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("label", { className: `${CalendarEventPickerSheet_default.eventRow} ${checked ? CalendarEventPickerSheet_default.eventRowChecked : ""}`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: `${CalendarEventPickerSheet_default.checkbox} ${checked ? CalendarEventPickerSheet_default.checkboxChecked : ""}`, children: checked ? "\u2713" : "" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: CalendarEventPickerSheet_default.calDot, style: { backgroundColor: ev.calendarColor } }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: CalendarEventPickerSheet_default.eventBody, children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { className: CalendarEventPickerSheet_default.eventTitle, children: ev.title }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { className: CalendarEventPickerSheet_default.eventMeta, children: [
              formatEventTime(ev.start, ev.end),
              ev.location && ` \xB7 ${ev.location}`
            ] })
          ] })
        ] }, ev.id);
      })
    ] }, group.label)) }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: CalendarEventPickerSheet_default.footer, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("button", { type: "button", onClick: handleConfirm, disabled: count === 0, className: CalendarEventPickerSheet_default.confirmBtn, children: [
      count === 0 ? "Select events" : `Add ${count} event${count === 1 ? "" : "s"}`,
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ArrowRight, { size: 15 })
    ] }) })
  ] }) });
}

// components/chat/SavedAddressPickerSheet.tsx
var import_react7 = __toESM(require_react());

// lib/userData.ts
async function getUserData() {
  const res = await proxyFetch("/agent/user/data");
  return res.ok ? await res.json() : {};
}
async function patchUserData(patch) {
  const current = await getUserData();
  const body = { ...current, ...patch };
  const res = await proxyFetch("/agent/user/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return body;
}
async function listSavedAddresses() {
  const data = await getUserData();
  return Array.isArray(data.addresses) ? data.addresses : [];
}

// components/chat/SavedAddressPickerSheet.module.css
var SavedAddressPickerSheet_default = {
  backdrop: "SavedAddressPickerSheet_backdrop",
  fadeIn: "SavedAddressPickerSheet_fadeIn",
  modal: "SavedAddressPickerSheet_modal",
  slideUp: "SavedAddressPickerSheet_slideUp",
  header: "SavedAddressPickerSheet_header",
  title: "SavedAddressPickerSheet_title",
  closeBtn: "SavedAddressPickerSheet_closeBtn",
  searchRow: "SavedAddressPickerSheet_searchRow",
  searchIcon: "SavedAddressPickerSheet_searchIcon",
  searchInput: "SavedAddressPickerSheet_searchInput",
  list: "SavedAddressPickerSheet_list",
  addrRow: "SavedAddressPickerSheet_addrRow",
  addrRowChecked: "SavedAddressPickerSheet_addrRowChecked",
  checkbox: "SavedAddressPickerSheet_checkbox",
  checkboxChecked: "SavedAddressPickerSheet_checkboxChecked",
  iconWrap: "SavedAddressPickerSheet_iconWrap",
  iconWrapChecked: "SavedAddressPickerSheet_iconWrapChecked",
  addrBody: "SavedAddressPickerSheet_addrBody",
  addrLabel: "SavedAddressPickerSheet_addrLabel",
  addrText: "SavedAddressPickerSheet_addrText",
  skeleton: "SavedAddressPickerSheet_skeleton",
  pulse: "SavedAddressPickerSheet_pulse",
  empty: "SavedAddressPickerSheet_empty",
  footer: "SavedAddressPickerSheet_footer",
  confirmBtn: "SavedAddressPickerSheet_confirmBtn"
};

// components/chat/SavedAddressPickerSheet.tsx
var import_jsx_runtime14 = __toESM(require_jsx_runtime());
function iconForLabel(label) {
  const lower = label.toLowerCase();
  if (lower.includes("home") || lower.includes("house")) return House;
  if (lower.includes("office") || lower.includes("work") || lower.includes("hq")) return Building2;
  if (lower.includes("'s") || lower.includes("place") || lower.includes("mom") || lower.includes("dad") || lower.includes("cameron")) return User;
  return MapPin;
}
function SavedAddressPickerSheet({ open, onClose, onConfirm }) {
  const [addresses, setAddresses] = (0, import_react7.useState)([]);
  const [loading, setLoading] = (0, import_react7.useState)(false);
  const [selectedIds, setSelectedIds] = (0, import_react7.useState)(/* @__PURE__ */ new Set());
  const [query, setQuery] = (0, import_react7.useState)("");
  (0, import_react7.useEffect)(() => {
    if (!open) return;
    setSelectedIds(/* @__PURE__ */ new Set());
    setQuery("");
    setLoading(true);
    listSavedAddresses().then(setAddresses).finally(() => setLoading(false));
  }, [open]);
  const filtered = (0, import_react7.useMemo)(() => {
    if (!query.trim()) return addresses;
    const q = query.toLowerCase();
    return addresses.filter((a) => a.label.toLowerCase().includes(q) || a.address.toLowerCase().includes(q));
  }, [addresses, query]);
  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function handleConfirm() {
    const selected = addresses.filter((a) => selectedIds.has(a.id)).map((a) => ({ kind: "address", id: a.id, label: a.label, address: a.address }));
    onConfirm(selected);
    onClose();
  }
  if (!open) return null;
  const count = selectedIds.size;
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: SavedAddressPickerSheet_default.backdrop, onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: SavedAddressPickerSheet_default.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: SavedAddressPickerSheet_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h2", { className: SavedAddressPickerSheet_default.title, children: "Add Saved Address" }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("button", { type: "button", "aria-label": "Close", onClick: onClose, className: SavedAddressPickerSheet_default.closeBtn, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(X, { size: 16 }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: SavedAddressPickerSheet_default.searchRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Search, { size: 15, className: SavedAddressPickerSheet_default.searchIcon }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search addresses\u2026", className: SavedAddressPickerSheet_default.searchInput })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: SavedAddressPickerSheet_default.list, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(import_jsx_runtime14.Fragment, { children: [1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: SavedAddressPickerSheet_default.skeleton }, i)) }) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: SavedAddressPickerSheet_default.empty, children: addresses.length === 0 ? "No saved addresses yet" : "No addresses match your search" }) : filtered.map((addr) => {
      const checked = selectedIds.has(addr.id);
      const Icon = iconForLabel(addr.label);
      return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("label", { className: `${SavedAddressPickerSheet_default.addrRow} ${checked ? SavedAddressPickerSheet_default.addrRowChecked : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: `${SavedAddressPickerSheet_default.checkbox} ${checked ? SavedAddressPickerSheet_default.checkboxChecked : ""}`, children: checked ? "\u2713" : "" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: `${SavedAddressPickerSheet_default.iconWrap} ${checked ? SavedAddressPickerSheet_default.iconWrapChecked : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Icon, { size: 16 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: SavedAddressPickerSheet_default.addrBody, children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: SavedAddressPickerSheet_default.addrLabel, children: addr.label }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { className: SavedAddressPickerSheet_default.addrText, children: addr.address })
        ] })
      ] }, addr.id);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: SavedAddressPickerSheet_default.footer, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("button", { type: "button", onClick: handleConfirm, disabled: count === 0, className: SavedAddressPickerSheet_default.confirmBtn, children: [
      count === 0 ? "Select addresses" : `Add ${count} address${count === 1 ? "" : "es"}`,
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ArrowRight, { size: 15 })
    ] }) })
  ] }) });
}

// components/ui/FloatingPanel.module.css
var FloatingPanel_default = {
  fab: "FloatingPanel_fab",
  overlay: "FloatingPanel_overlay",
  panel: "FloatingPanel_panel",
  slideUp: "FloatingPanel_slideUp",
  header: "FloatingPanel_header",
  headerIcon: "FloatingPanel_headerIcon",
  headerIconFallback: "FloatingPanel_headerIconFallback",
  headerTitle: "FloatingPanel_headerTitle",
  headerActions: "FloatingPanel_headerActions",
  iconBtn: "FloatingPanel_iconBtn",
  body: "FloatingPanel_body",
  userBubble: "FloatingPanel_userBubble",
  fadeSlideUp: "FloatingPanel_fadeSlideUp",
  responseBubble: "FloatingPanel_responseBubble",
  assistantActions: "FloatingPanel_assistantActions",
  messageActionButtons: "FloatingPanel_messageActionButtons",
  userMessageActions: "FloatingPanel_userMessageActions",
  ttsBtn: "FloatingPanel_ttsBtn",
  retryBtn: "FloatingPanel_retryBtn",
  chipRow: "FloatingPanel_chipRow",
  messageGroup: "FloatingPanel_messageGroup",
  responseTime: "FloatingPanel_responseTime",
  thinking: "FloatingPanel_thinking",
  dot: "FloatingPanel_dot",
  bounce: "FloatingPanel_bounce",
  composer: "FloatingPanel_composer",
  inputWrap: "FloatingPanel_inputWrap",
  input: "FloatingPanel_input",
  inlineIconBtn: "FloatingPanel_inlineIconBtn",
  speechStatus: "FloatingPanel_speechStatus",
  sendBtn: "FloatingPanel_sendBtn",
  sessionList: "FloatingPanel_sessionList",
  sessionGroupLabel: "FloatingPanel_sessionGroupLabel",
  sessionRow: "FloatingPanel_sessionRow",
  sessionRowActive: "FloatingPanel_sessionRowActive",
  sessionTitle: "FloatingPanel_sessionTitle",
  msgTs: "FloatingPanel_msgTs",
  msgTsUser: "FloatingPanel_msgTsUser",
  sessionDate: "FloatingPanel_sessionDate",
  emptyState: "FloatingPanel_emptyState",
  emptyHint: "FloatingPanel_emptyHint",
  skillPicker: "FloatingPanel_skillPicker",
  skillBtn: "FloatingPanel_skillBtn",
  skillBtnActive: "FloatingPanel_skillBtnActive",
  skillEmoji: "FloatingPanel_skillEmoji",
  skillDivider: "FloatingPanel_skillDivider"
};

// lib/tutorial-ai/chrome-ai.ts
var SYSTEM_PROMPT = `You are a concise setup guide for Trippy, a personal AI for business travel and productivity.

Help new users with:
- What Trippy does (AI-powered travel planning, task management, calendar and email integration)
- How to get a Claude API key from Anthropic at console.anthropic.com
- How to get a Gemini API key from Google AI Studio at aistudio.google.com
- How to connect Google OAuth for Calendar and Gmail access
- Where to find the Settings page to configure these

Keep answers to 2\u20134 sentences. You cannot access the user's calendar, email, or tasks until a provider key is configured. For anything beyond setup, let them know those features unlock after adding a key.`;
var session = null;
function getBrowserLanguageModel() {
  if (typeof window === "undefined") return void 0;
  return self.ai?.languageModel ?? window.LanguageModel;
}
async function getBrowserLanguageModelAvailability(options) {
  try {
    const LM = getBrowserLanguageModel();
    if (!LM) return "unavailable";
    const availability = await LM.availability(options);
    if (typeof availability === "string") return availability;
    if (availability.available === "readily") return "available";
    if (availability.available === "after-download") return "downloadable";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
async function isChromeAiAvailable() {
  const availability = await getBrowserLanguageModelAvailability();
  return availability === "available" || availability === "downloadable";
}
async function ensureSession() {
  if (session) return session;
  const LM = getBrowserLanguageModel();
  if (!LM) throw new Error("Browser language model is not available");
  session = await LM.create({ systemPrompt: SYSTEM_PROMPT });
  return session;
}
async function sendChromeAi(messages) {
  const s = await ensureSession();
  const last = messages[messages.length - 1];
  const text = await s.prompt(last.content);
  return { text: text.trim(), provider: "chrome-ai" };
}
function resetChromeAiSession() {
  try {
    session?.destroy();
  } catch {
  }
  session = null;
}

// lib/tutorial-ai/static-guide.ts
var ENTRIES = [
  {
    patterns: [/what.*(is|can|does).*(trippy|this|it)\b/i, /tell me about/i, /overview/i, /how does.*work/i],
    text: "Trippy is your personal AI for business travel and productivity. It connects to Google Calendar, Gmail, Linear, and Motion to help you plan trips, manage tasks, and stay on schedule. To unlock the full experience, add a Claude or Gemini API key in Settings.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/get.*(started|going|set up|setup)/i, /how.*(start|begin|use)/i, /first.*(step|thing)/i, /onboard/i, /new user/i],
    text: "Getting started takes two steps: (1) Add a Claude API key from Anthropic or a Gemini key from Google AI Studio in Settings. (2) Optionally connect your Google account for Calendar and Gmail. Once you have a key, the full assistant unlocks.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/claude.*key/i, /anthropic.*key/i, /api.*(key|token).*claude/i, /claude.*api/i, /anthropic/i],
    text: "Get a Claude API key at console.anthropic.com \u2014 create an account, go to API Keys, and generate a new key. New accounts include free credits. Paste the key into the Claude API Key field in Settings.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/gemini.*key/i, /google.*ai.*key/i, /api.*(key|token).*gemini/i, /gemini.*api/i, /aistudio/i, /ai studio/i],
    text: "Get a Gemini API key at aistudio.google.com \u2014 sign in with Google, click Get API Key, and create one. The free tier covers light usage. Paste it into the Gemini API Key field in Settings.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/setting(s)?/i, /where.*(config|configure)/i, /how.*(config|configure)/i, /configuration/i, /where.*go/i],
    text: "Settings is reachable from the gear icon in the app header. From there you can add your API keys, connect Google OAuth, and configure workspace integrations like Linear and Motion.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/google.*(key|oauth|api|account|connect)/i, /oauth/i, /calendar.*connect/i, /gmail.*connect/i, /google.*account/i],
    text: "The Google integration gives Trippy access to your Calendar and Gmail. It's optional but unlocks scheduling and email features. Connect it under Settings \u2192 Google and authorize the requested scopes.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/api.*key/i, /where.*(key|token)/i, /need.*(key|token)/i, /how.*(key|token)/i, /which.*key/i],
    text: "You need an API key from Anthropic (Claude) or Google (Gemini) to use the full AI features. Both have free tiers. Once you add one in Settings, the assistant unlocks. Which provider would you like to use?",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/travel|trip|flight|hotel|book/i],
    text: "Trippy can plan business trips, compare routes, estimate travel costs, and find gaps in your calendar for travel windows. These features unlock once you add an API key in Settings.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/task|linear|motion|todo|to.do|schedule/i],
    text: "Trippy integrates with Linear, Motion, and Google Tasks to surface and prioritize your work. These features require a provider API key \u2014 set one up in Settings to get started.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/cost|price|paid|free|cheap|afford|money/i],
    text: "Trippy itself is free to run. You need an API key from Anthropic or Google \u2014 both offer free tiers for light usage. Anthropic gives new accounts free credits; Google AI Studio has a generous free quota.",
    actions: [{ type: "navigate", route: "/settings" }]
  },
  {
    patterns: [/help|stuck|confused|lost|don.t know|unsure|what do i do/i],
    text: "No worries \u2014 setup just needs one thing: an API key. Go to Settings and add either a Claude key (Anthropic) or a Gemini key (Google). Once that's done, the full assistant opens up. What would you like to do?",
    actions: [{ type: "navigate", route: "/settings" }]
  }
];
var FALLBACK = {
  text: "I'm your setup guide for Trippy. To unlock the full assistant, you need a Claude or Gemini API key \u2014 go to Settings to add one. You can ask me how to get a key, what Trippy does, or how to connect Google.",
  actions: [{ type: "navigate", route: "/settings" }]
};
function sendStaticGuide(messages) {
  const last = messages[messages.length - 1];
  const input = last.content;
  for (const entry of ENTRIES) {
    if (entry.patterns.some((p) => p.test(input))) {
      return { text: entry.text, actions: entry.actions, provider: "static-guide" };
    }
  }
  return { text: FALLBACK.text, actions: FALLBACK.actions, provider: "static-guide" };
}

// lib/tutorial-ai/provider.ts
var chromeAiChecked = false;
var chromeAiReady = false;
async function resolveChromeAi() {
  if (chromeAiChecked) return chromeAiReady;
  chromeAiChecked = true;
  chromeAiReady = await isChromeAiAvailable();
  return chromeAiReady;
}
async function sendTutorialMessage(messages) {
  const canUseChrome = await resolveChromeAi();
  if (canUseChrome) {
    try {
      return await sendChromeAi(messages);
    } catch {
      chromeAiReady = false;
      resetChromeAiSession();
    }
  }
  return sendStaticGuide(messages);
}

// lib/speech/onDeviceTranscription.ts
var transcriber = null;
var initPromise = null;
var currentStatus = "idle";
var listeners2 = /* @__PURE__ */ new Set();
function notify(status, progress) {
  currentStatus = status;
  listeners2.forEach((listener) => listener(status, progress));
}
function subscribeOnDeviceTranscription(listener) {
  listeners2.add(listener);
  listener(currentStatus);
  return () => listeners2.delete(listener);
}
function hasNativeSpeechRecognition() {
  if (typeof window === "undefined") return false;
  const browser = window;
  return Boolean(browser.SpeechRecognition ?? browser.webkitSpeechRecognition);
}
async function getTranscriber() {
  if (transcriber) return transcriber;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    notify("downloading", 0);
    try {
      const options = {
        expectedInputs: [
          { type: "text", languages: ["en"] },
          { type: "audio" }
        ],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
      };
      const availability = await getBrowserLanguageModelAvailability(options);
      if (availability === "unavailable") return null;
      const model = getBrowserLanguageModel();
      if (!model) return null;
      const session2 = await model.create(options);
      transcriber = async (audio) => session2.prompt([
        {
          role: "user",
          content: [
            { type: "text", value: "Transcribe this audio faithfully. Return only the spoken words." },
            { type: "audio", value: audio }
          ]
        }
      ]);
      notify("ready", 100);
      return transcriber;
    } catch (error) {
      console.warn("[browser-language-model] Unable to prepare audio transcription:", error);
      notify("failed");
      initPromise = null;
      return null;
    }
  })();
  return initPromise;
}
function prepareOnDeviceTranscription() {
  return getTranscriber();
}
async function startLocalRecording() {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot record audio for local transcription.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const release = () => stream.getTracks().forEach((track) => track.stop());
  const supportsMimeType = typeof MediaRecorder.isTypeSupported === "function";
  const mimeType = supportsMimeType ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type)) : void 0;
  let recorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : void 0);
  } catch (error) {
    release();
    throw error;
  }
  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  try {
    recorder.start();
  } catch (error) {
    release();
    throw error;
  }
  return {
    stop: () => new Promise((resolve, reject) => {
      recorder.addEventListener("stop", () => {
        release();
        resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      }, { once: true });
      recorder.addEventListener("error", () => {
        release();
        reject(new Error("Unable to record audio."));
      }, { once: true });
      recorder.stop();
    }),
    cancel: () => {
      if (recorder.state !== "inactive") recorder.stop();
      release();
    }
  };
}
async function transcribeLocally(recording) {
  const model = await getTranscriber();
  if (!model) throw new Error("The browser language model could not be prepared for dictation.");
  return (await model(recording)).trim();
}

// components/tasks/FloatingAssistant.tsx
var import_jsx_runtime15 = __toESM(require_jsx_runtime());
var TASK_TOOL_NAMES = /* @__PURE__ */ new Set([
  "get_all_tasks",
  "get_google_tasks"
]);
var mdComponents = {
  p: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { children }),
  h1: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { style: { fontWeight: 700, fontSize: "1.1em", margin: "8px 0 4px" }, children }),
  h2: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { style: { fontWeight: 700, fontSize: "1.05em", margin: "8px 0 4px" }, children }),
  h3: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { style: { fontWeight: 600, margin: "6px 0 2px" }, children }),
  h4: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { style: { fontWeight: 600, margin: "4px 0 2px" }, children }),
  hr: () => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("hr", { style: { border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" } }),
  ul: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ul", { style: { margin: "6px 0", paddingLeft: 18 }, children }),
  ol: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ol", { style: { margin: "6px 0", paddingLeft: 18 }, children }),
  li: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("li", { children }),
  strong: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("strong", { children }),
  code: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("code", { style: { padding: "1px 4px", borderRadius: 4, fontSize: "0.8em", overflowWrap: "break-word", whiteSpace: "pre-wrap", wordBreak: "break-word" }, children }),
  pre: ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("pre", { style: { margin: "6px 0", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "100%", background: "#000", color: "#fff" }, children }),
  a: ({ href, children }) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("a", { href, target: "_blank", rel: "noopener noreferrer", style: { color: "var(--color-accent)", textDecoration: "underline", cursor: "pointer" }, children })
};
function ToolCallCards({ toolCalls }) {
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_jsx_runtime15.Fragment, { children: toolCalls.map((tc) => {
    if (!tc.result) return null;
    if (tc.toolName.endsWith("compare_routes")) {
      try {
        return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(RouteComparisonCard, { result: JSON.parse(tc.result) }, tc.toolCallId);
      } catch {
        return null;
      }
    }
    if (tc.toolName.endsWith("get_calendar_events")) {
      return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(CalendarSummaryCard, { result: tc.result }, tc.toolCallId);
    }
    if (tc.toolName.endsWith("find_nearby_transport_hubs")) {
      const args = tc.args;
      return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(TransportHubsCard, { result: tc.result, location: args.location ?? "" }, tc.toolCallId);
    }
    if (tc.toolName.endsWith("search_web") || tc.toolName === "WebSearch") {
      const args = tc.args;
      return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(CollapsibleToolCard, { icon: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: "\u{1F50D}" }), title: "Web Search", subtitle: args.query ?? "", children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(WebSearchCard, { result: tc.result, query: args.query ?? "", toolName: tc.toolName }) }, tc.toolCallId);
    }
    if ([...TASK_TOOL_NAMES].some((n) => tc.toolName.endsWith(n))) {
      return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(TaskCard, { result: tc.result, toolName: tc.toolName }, tc.toolCallId);
    }
    if (tc.toolName.endsWith("propose_calendar_event")) {
      const args = tc.args;
      if (!args.title || !args.start || !args.end) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(CalendarEventProposalCard, { args }, tc.toolCallId);
    }
    return null;
  }) });
}
function FloatingAssistant({ onFlagTask, onUnflagTask, onScheduleTask, onAgentAction }) {
  const router = useRouter();
  const [open, setOpen] = (0, import_react8.useState)(false);
  const [text, setText] = (0, import_react8.useState)("");
  const [sending, setSending] = (0, import_react8.useState)(false);
  const [messages, setMessages] = (0, import_react8.useState)([]);
  const { name: agentName, icon: agentIcon } = useAgentIdentity();
  const [showHistory, setShowHistory] = (0, import_react8.useState)(false);
  const [sessions, setSessions] = (0, import_react8.useState)([]);
  const [activeSessionId, setActiveSessionId] = (0, import_react8.useState)(null);
  const [chips, setChips] = (0, import_react8.useState)([]);
  const [skill, setSkill] = (0, import_react8.useState)("general");
  const [showEventPicker, setShowEventPicker] = (0, import_react8.useState)(false);
  const [showAddressPicker, setShowAddressPicker] = (0, import_react8.useState)(false);
  const inputRef = (0, import_react8.useRef)(null);
  const bodyRef = (0, import_react8.useRef)(null);
  const sessionIdRef = (0, import_react8.useRef)(null);
  const msgIndexRef = (0, import_react8.useRef)(0);
  const pendingChatRef = (0, import_react8.useRef)(/* @__PURE__ */ new Map());
  const loadSession = (0, import_react8.useCallback)(async (sessionId) => {
    const data = await idbReadChatSession(sessionId);
    if (!data) return false;
    const failedUserIndexes = /* @__PURE__ */ new Set();
    let mostRecentUser = null;
    for (const message of data.messages) {
      if (message.role === "user") mostRecentUser = message;
      if (message.role === "assistant" && message.status === "failed" && mostRecentUser) {
        failedUserIndexes.add(mostRecentUser.index);
      }
    }
    const lastStoredMessage = data.messages.at(-1);
    if (lastStoredMessage?.role === "user") failedUserIndexes.add(lastStoredMessage.index);
    const sessionSkill = normalizeSkill(data.session.skill);
    const display = data.messages.filter((m) => m.role === "user" || m.role === "assistant").map((m) => ({
      role: m.role,
      content: m.message,
      ts: m.createdAt,
      toolCalls: m.toolCalls,
      retryRequest: m.role === "user" && failedUserIndexes.has(m.index) ? { message: m.message, skill: sessionSkill } : void 0
    }));
    setMessages(display);
    setActiveSessionId(sessionId);
    sessionIdRef.current = sessionId;
    msgIndexRef.current = data.messages.length;
    if (data.session.skill) setSkill(sessionSkill);
    return true;
  }, []);
  (0, import_react8.useEffect)(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 100);
    loadAndRestorePlanningChat().then(() => idbListChatSessions()).then(async (all) => {
      setSessions(all);
      if (all.length === 0) return;
      await loadSession(all[0].id);
    }).catch(() => {
    });
  }, [open, loadSession]);
  (0, import_react8.useEffect)(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, sending]);
  (0, import_react8.useEffect)(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);
  (0, import_react8.useEffect)(() => {
    const channel = new BroadcastChannel("route-jobs");
    const onMessage = (event) => {
      const update = event.data;
      if (update.type !== "CHAT_UPDATE" && update.type !== "CHAT_404" || !update.jobId) return;
      const pending = pendingChatRef.current.get(update.jobId);
      if (!pending) return;
      const updateAssistant = (content, toolCalls) => {
        setMessages((previous) => {
          const index = previous.findIndex((message) => message.ts === pending.sendTs + 1);
          if (index < 0) return [...previous, { role: "assistant", content, ts: pending.sendTs + 1, toolCalls }];
          const next = [...previous];
          next[index] = { ...next[index], content, toolCalls: toolCalls ?? next[index].toolCalls };
          return next;
        });
      };
      if (update.type === "CHAT_UPDATE" && update.status === "running") {
        if (update.partial || update.toolCalls?.length) updateAssistant(update.partial ?? "", update.toolCalls);
        return;
      }
      if (update.type === "CHAT_UPDATE" && update.status === "completed") {
        pendingChatRef.current.delete(update.jobId);
        const result = update.partial ?? "";
        updateAssistant(result, update.toolCalls ?? []);
        for (const action of update.actions ?? []) {
          if (action.action === "navigate" && typeof action.route === "string") router.push(action.route);
          else window.dispatchEvent(new CustomEvent("agent-action", { detail: action }));
        }
        if (update.uiAction?.type === "flag_task") {
          onFlagTask?.(update.uiAction.taskId, update.uiAction.source);
        } else if (update.uiAction?.type === "unflag_task") {
          onUnflagTask?.();
        } else if (update.uiAction?.type === "schedule_task") {
          const { taskId, scheduledFor } = update.uiAction;
          void patchTaskSchedule(taskId, { scheduledFor }).then(() => onScheduleTask?.(taskId, scheduledFor));
        }
        pushPlanningChatSessions().catch((error) => console.warn("[assistant] failed to push chat history:", error));
        void Promise.all([loadAndRestoreUserData(), loadAndRestoreTasksBackup(), loadAndRestorePlanningChat()]);
        onAgentAction?.();
        setChips([]);
        setSending(false);
        inputRef.current?.focus();
        return;
      }
      if (update.type === "CHAT_404" || update.type === "CHAT_UPDATE" && update.status === "failed") {
        pendingChatRef.current.delete(update.jobId);
        const failure = "Couldn't reach the assistant \u2014 try again.";
        updateAssistant(failure);
        setMessages((previous) => previous.map(
          (message) => message.ts === pending.sendTs ? { ...message, retryRequest: pending.request } : message
        ));
        if (update.type === "CHAT_404") {
          void idbWriteChatMessage(pending.sessionId, pending.messageIndex, "assistant", failure, void 0, "failed");
        }
        setSending(false);
        inputRef.current?.focus();
      }
    };
    channel.addEventListener("message", onMessage);
    return () => channel.close();
  }, [onAgentAction, onFlagTask, onScheduleTask, onUnflagTask, router]);
  const handleSend = async (retryRequest) => {
    const msg = (retryRequest?.message ?? text).trim();
    if (!msg || sending) return;
    const selectedSkill = retryRequest?.skill ?? skill;
    setSending(true);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    const sendTs = Date.now();
    const userMsg = { role: "user", content: msg, ts: sendTs };
    setMessages((prev) => [...prev, userMsg]);
    if (!sessionIdRef.current) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sendTs.toString()));
      sessionIdRef.current = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
      msgIndexRef.current = 0;
      await idbWriteChatSession(sessionIdRef.current, sendTs, void 0, msg.slice(0, 80), selectedSkill);
      setActiveSessionId(sessionIdRef.current);
      idbListChatSessions().then(setSessions).catch(() => {
      });
    }
    const userIndex = msgIndexRef.current;
    msgIndexRef.current += 1;
    await idbWriteChatMessage(sessionIdRef.current, userIndex, "user", msg);
    const request = { message: msg, skill: selectedSkill };
    const markRequestRetryable = () => {
      setMessages((prev) => prev.map((message) => message.ts === sendTs ? { ...message, retryRequest: request } : message));
    };
    const recordFailure = async (content) => {
      markRequestRetryable();
      const failedAt = Date.now();
      if (sessionIdRef.current) {
        const assistantIndex = msgIndexRef.current;
        msgIndexRef.current += 1;
        try {
          await idbWriteChatMessage(sessionIdRef.current, assistantIndex, "assistant", content, void 0, "failed");
        } catch {
        }
      }
      setMessages((prev) => [...prev, { role: "assistant", content, ts: failedAt }]);
    };
    if (selectedSkill === "general") {
      try {
        const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        const response = await sendTutorialMessage(history);
        for (const action of response.actions ?? []) {
          if (action.type === "navigate") router.push(action.route);
        }
        const asstIdx = msgIndexRef.current;
        msgIndexRef.current += 1;
        await idbWriteChatMessage(sessionIdRef.current, asstIdx, "assistant", response.text, void 0, "completed");
        setMessages((prev) => [...prev, { role: "assistant", content: response.text, ts: Date.now() }]);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: "Setup guide encountered an error \u2014 please try again.", ts: Date.now() }]);
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
      return;
    }
    let handedToServiceWorker = false;
    try {
      await Promise.all([pushUserData(), pushTasksBackup(), pushPlanningChatSessions()]);
      const now = (/* @__PURE__ */ new Date()).toLocaleString(void 0, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      });
      let chipContext = "";
      if (chips.length > 0) {
        const lines = chips.map((c) => {
          if (c.kind === "event") {
            const s = new Date(c.start);
            const e = new Date(c.end);
            const fmt = (d) => d.toLocaleString(void 0, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
            return `- Calendar event "${c.title}" (${fmt(s)} \u2013 ${e.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" })})`;
          }
          return `- Address "${c.label}": ${c.address}`;
        });
        chipContext = `

[Attached context:
${lines.join("\n")}]`;
      }
      const startRes = await proxyFetch("/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Today: ${now} - ${msg}${chipContext}`, skill: selectedSkill, agentName, sessionId: sessionIdRef.current })
      });
      const startData = await startRes.json();
      if (!startRes.ok || !startData.jobId) {
        const rawErr = startData.error ?? "";
        const errMsg = rawErr.toLowerCase().includes("no claude backend") ? "The Executive Assistant service is not available yet. Please try again later." : rawErr || "Something went wrong. Please try again.";
        await recordFailure(errMsg);
        setSending(false);
        return;
      }
      const { jobId } = startData;
      const assistantIndex = msgIndexRef.current;
      msgIndexRef.current += 1;
      pendingChatRef.current.set(jobId, {
        sendTs,
        request,
        sessionId: sessionIdRef.current,
        messageIndex: assistantIndex
      });
      await postToSW({
        type: "START_CHAT_POLL",
        jobId,
        sessionId: sessionIdRef.current,
        messageIndex: assistantIndex,
        message: msg
      });
      setChips([]);
      handedToServiceWorker = true;
    } catch {
      await recordFailure("Couldn't reach the assistant \u2014 try again.");
    } finally {
      if (!handedToServiceWorker) {
        setSending(false);
        inputRef.current?.focus();
      }
    }
  };
  const [listening, setListening] = (0, import_react8.useState)(false);
  const [transcribing, setTranscribing] = (0, import_react8.useState)(false);
  const [micStatus, setMicStatus] = (0, import_react8.useState)(null);
  const recognitionRef = (0, import_react8.useRef)(null);
  const localRecordingRef = (0, import_react8.useRef)(null);
  const transcriptRef = (0, import_react8.useRef)("");
  (0, import_react8.useEffect)(() => {
    return subscribeOnDeviceTranscription((status, progress) => {
      if (status === "downloading") setMicStatus(`Downloading local dictation model\u2026 ${progress ?? 0}%`);
      if (status === "ready") setMicStatus("Local dictation is ready");
      if (status === "failed") setMicStatus("Local dictation could not start. Please type instead.");
    });
  }, []);
  (0, import_react8.useEffect)(() => {
    return () => {
      recognitionRef.current?.stop();
      localRecordingRef.current?.cancel();
      stopReadAloud();
    };
  }, []);
  const appendTranscript = (0, import_react8.useCallback)((transcript) => {
    if (transcript) setText((prev) => prev ? `${prev} ${transcript}` : transcript);
  }, []);
  const stopLocalDictation = (0, import_react8.useCallback)(async () => {
    const recording = localRecordingRef.current;
    if (!recording) return;
    localRecordingRef.current = null;
    setListening(false);
    setTranscribing(true);
    setMicStatus("Transcribing on this device\u2026");
    try {
      const audio = await recording.stop();
      appendTranscript(await transcribeLocally(audio));
      setMicStatus(null);
    } catch {
      setMicStatus("Local dictation could not finish. Please try again.");
    } finally {
      setTranscribing(false);
    }
  }, [appendTranscript]);
  const startLocalDictation = (0, import_react8.useCallback)(async () => {
    try {
      const recording = await startLocalRecording();
      localRecordingRef.current = recording;
      setListening(true);
      setMicStatus("Listening on this device\u2026");
    } catch {
      setMicStatus("Microphone access is needed for local dictation.");
    }
  }, []);
  const startNativeDictation = (0, import_react8.useCallback)(() => {
    const w = window;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR || !hasNativeSpeechRecognition()) {
      setMicStatus("Browser dictation is not available on this device.");
      return;
    }
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      transcriptRef.current = "";
      rec.onresult = (e) => {
        transcriptRef.current = e.results[e.results.length - 1]?.[0]?.transcript ?? "";
      };
      rec.onend = () => {
        const t = transcriptRef.current;
        appendTranscript(t);
        transcriptRef.current = "";
        setListening(false);
        setMicStatus(null);
      };
      rec.onerror = () => {
        transcriptRef.current = "";
        setListening(false);
        setMicStatus("Voice input could not hear that. Please try again.");
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      setMicStatus("Listening\u2026");
    } catch {
      recognitionRef.current = null;
      setMicStatus("Browser dictation could not start. Please try again.");
    }
  }, [appendTranscript]);
  const handleMic = (0, import_react8.useCallback)(() => {
    if (transcribing) return;
    if (localRecordingRef.current) {
      void stopLocalDictation();
      return;
    }
    if (listening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setListening(false);
        setMicStatus(null);
      } catch {
        recognitionRef.current = null;
        setListening(false);
        setMicStatus("Voice input stopped unexpectedly. Please try again.");
      }
      return;
    }
    void (async () => {
      setMicStatus("Preparing browser dictation\u2026");
      const browserModel = await prepareOnDeviceTranscription();
      if (browserModel) {
        await startLocalDictation();
      } else {
        startNativeDictation();
      }
    })();
  }, [listening, startLocalDictation, startNativeDictation, stopLocalDictation, transcribing]);
  (0, import_react8.useEffect)(() => {
    const openFromDashboard = (event) => {
      setOpen(true);
      if (!(event instanceof CustomEvent) || event.detail?.voice !== true) return;
      window.setTimeout(() => handleMic(), 0);
    };
    window.addEventListener("open-agent-assistant", openFromDashboard);
    return () => window.removeEventListener("open-agent-assistant", openFromDashboard);
  }, [handleMic]);
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      CalendarEventPickerSheet,
      {
        open: showEventPicker,
        onClose: () => setShowEventPicker(false),
        onConfirm: (events) => {
          setChips((prev) => [...prev, ...events.filter((e) => !prev.some((p) => p.id === e.id))]);
          setShowEventPicker(false);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      SavedAddressPickerSheet,
      {
        open: showAddressPicker,
        onClose: () => setShowAddressPicker(false),
        onConfirm: (addrs) => {
          setChips((prev) => [...prev, ...addrs.filter((a) => !prev.some((p) => p.id === a.id))]);
          setShowAddressPicker(false);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { type: "button", "aria-label": `Open ${agentName} assistant`, onClick: () => {
      setOpen((v) => {
        if (v) {
          sessionIdRef.current = null;
          msgIndexRef.current = 0;
        }
        return !v;
      });
    }, className: FloatingPanel_default.fab, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("img", { src: agentIcon ?? "/trippy-transparent.png", alt: agentName, className: FloatingPanel_default.headerIcon }) }),
    open && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: FloatingPanel_default.overlay, onClick: () => setOpen(false) }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.panel, children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.header, children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { type: "button", "aria-label": showHistory ? "Back to chat" : "Chat history", onClick: () => setShowHistory((v) => !v), className: FloatingPanel_default.iconBtn, children: showHistory ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(ChevronLeft, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(RotateCcwClock, { size: 16 }) }),
          !showHistory && /* eslint-disable-next-line @next/next/no-img-element */
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("img", { src: agentIcon ?? "/trippy-transparent.png", alt: agentName, className: FloatingPanel_default.headerIcon }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.headerTitle, children: showHistory ? "Past conversations" : agentName }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.headerActions, children: [
            !showHistory && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { type: "button", "aria-label": "New chat", onClick: () => {
              setMessages([]);
              setChips([]);
              sessionIdRef.current = null;
              msgIndexRef.current = 0;
              setActiveSessionId(null);
            }, className: FloatingPanel_default.iconBtn, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(SquarePen, { size: 16 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { type: "button", "aria-label": "Close", onClick: () => setOpen(false), className: FloatingPanel_default.iconBtn, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(X, { size: 16 }) })
          ] })
        ] }),
        showHistory ? /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.sessionList, children: [
          sessions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { style: { fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", textAlign: "center", marginTop: 16 }, children: "No past conversations yet." }),
          sessions.length > 0 && (() => {
            const groups = sessions.reduce((acc, s) => {
              const key = normalizeSkill(s.skill);
              (acc[key] ?? (acc[key] = [])).push(s);
              return acc;
            }, {});
            return Object.entries(groups).map(([skillKey, group]) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_react8.default.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.sessionGroupLabel, children: SKILL_LABELS[skillKey] ?? skillKey }),
              group.map((s) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 4, width: "100%", minWidth: 0 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("button", { type: "button", className: `${FloatingPanel_default.sessionRow} ${s.id === activeSessionId ? FloatingPanel_default.sessionRowActive : ""}`, style: { flex: 1, minWidth: 0 }, onClick: async () => {
                  const ok = await loadSession(s.id);
                  if (ok) setShowHistory(false);
                }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.sessionTitle, children: s.title ? s.title.length > 60 ? s.title.slice(0, 60) + "\u2026" : s.title : "Untitled conversation" }),
                  /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.sessionDate, children: new Date(s.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" }) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                  "button",
                  {
                    type: "button",
                    "aria-label": "Delete conversation",
                    className: FloatingPanel_default.iconBtn,
                    style: { flexShrink: 0, color: "var(--color-text-muted)" },
                    onClick: async (e) => {
                      e.stopPropagation();
                      await Promise.all([
                        idbDeleteChatSession(s.id),
                        proxyFetch(`/agent/chat/sessions/${s.id}`, { method: "DELETE" }).catch(() => {
                        })
                      ]);
                      setSessions((prev) => prev.filter((x) => x.id !== s.id));
                      if (s.id === activeSessionId) {
                        setMessages([]);
                        sessionIdRef.current = null;
                        msgIndexRef.current = 0;
                        setActiveSessionId(null);
                      }
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Trash2, { size: 13 })
                  }
                )
              ] }, s.id))
            ] }, skillKey));
          })()
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.body, ref: bodyRef, children: [
            messages.length === 0 && !sending && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: FloatingPanel_default.emptyState, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.skillPicker, children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setSkill("general"),
                  className: `${FloatingPanel_default.skillBtn} ${skill === "general" ? FloatingPanel_default.skillBtnActive : ""}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.skillEmoji, children: "\u{1F4AC}" }),
                    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: "Tutorial" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: FloatingPanel_default.skillDivider, children: "choose an agent" }),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setSkill("executive-assistant"),
                  className: `${FloatingPanel_default.skillBtn} ${skill === "executive-assistant" ? FloatingPanel_default.skillBtnActive : ""}`,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.skillEmoji, children: "\u{1F4CB}" }),
                    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: "Executive Assistant" })
                  ]
                }
              )
            ] }) }),
            messages.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.messageGroup, children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: m.role === "user" ? FloatingPanel_default.userBubble : FloatingPanel_default.responseBubble, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Markdown, { remarkPlugins: [remarkGfm], components: mdComponents, children: m.content }) }),
              m.role === "assistant" && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.assistantActions, children: [
                /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: FloatingPanel_default.messageActionButtons, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                  ReadAloudButton,
                  {
                    text: m.content,
                    className: FloatingPanel_default.ttsBtn,
                    iconSize: 14
                  }
                ) }),
                m.ts && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.msgTs, children: new Date(m.ts).toLocaleString(void 0, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) })
              ] }),
              m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(ToolCallCards, { toolCalls: m.toolCalls }),
              m.role === "user" && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.userMessageActions, children: [
                m.retryRequest && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("button", { type: "button", onClick: () => void handleSend(m.retryRequest), disabled: sending, className: FloatingPanel_default.retryBtn, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(RotateCcw, { size: 13 }),
                  " Retry"
                ] }),
                m.ts && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.msgTsUser, children: new Date(m.ts).toLocaleString(void 0, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) })
              ] })
            ] }, i)),
            sending && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.thinking, children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: FloatingPanel_default.dot }),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: FloatingPanel_default.dot }),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: FloatingPanel_default.dot })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.composer, children: [
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.inputWrap, children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: FloatingPanel_default.chipRow, children: [
                /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                  ComposerPlusMenu,
                  {
                    onSelectCalendarEvent: () => setShowEventPicker(true),
                    onSelectSavedAddress: () => setShowAddressPicker(true)
                  }
                ),
                chips.map((c) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(ContextChip, { chip: c, onRemove: () => setChips((prev) => prev.filter((p) => p.id !== c.id)) }, c.id))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
                "textarea",
                {
                  ref: inputRef,
                  rows: 1,
                  value: text,
                  onChange: (e) => {
                    const val = skill === "general" ? e.target.value.slice(0, 200) : e.target.value;
                    setText(val);
                    const el = e.target;
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                  },
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  },
                  placeholder: `Ask ${agentName}\u2026`,
                  className: FloatingPanel_default.input,
                  disabled: sending
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { type: "button", "aria-label": transcribing ? "Transcribing voice input" : listening ? "Stop listening" : "Voice input", onClick: handleMic, disabled: transcribing, className: FloatingPanel_default.inlineIconBtn, children: transcribing || listening ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(MicOff, { size: 24 }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Mic, { size: 24 }) }),
              micStatus && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: FloatingPanel_default.speechStatus, role: "status", children: micStatus })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("button", { type: "button", "aria-label": "Send", onClick: handleSend, disabled: !text.trim() || sending, className: FloatingPanel_default.sendBtn, children: sending ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { style: { width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.6s linear infinite", display: "block" } }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(ArrowUp, { size: 16 }) }),
              skill === "general" && text.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { style: { fontSize: "0.65rem", color: text.length >= 180 ? "var(--color-error, #e55)" : "var(--color-text-muted)" }, children: [
                text.length,
                "/200"
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}

export {
  idbListSearches,
  idbGetUserPrefs,
  idbSetUserPrefs,
  idbAddNotification,
  pushUserData,
  getPersistedActiveTask,
  setPersistedActiveTask,
  clearPersistedActiveTask,
  getAllTaskSchedules,
  getTaskSchedule,
  saveTaskElapsed,
  deleteTaskSchedule,
  ReadAloudButton,
  getUserData,
  patchUserData,
  subscribeOnDeviceTranscription,
  hasNativeSpeechRecognition,
  prepareOnDeviceTranscription,
  startLocalRecording,
  transcribeLocally,
  postToSW,
  FloatingAssistant
};
