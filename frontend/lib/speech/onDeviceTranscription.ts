import { getBrowserLanguageModel, getBrowserLanguageModelAvailability } from "@/lib/tutorial-ai/chrome-ai";

export type OnDeviceTranscriptionStatus = "idle" | "downloading" | "ready" | "failed";

type StatusListener = (status: OnDeviceTranscriptionStatus, progress?: number) => void;
type Transcriber = (audio: Blob) => Promise<string>;

let transcriber: Transcriber | null = null;
let initPromise: Promise<Transcriber | null> | null = null;
let currentStatus: OnDeviceTranscriptionStatus = "idle";
const listeners = new Set<StatusListener>();

function notify(status: OnDeviceTranscriptionStatus, progress?: number) {
  currentStatus = status;
  listeners.forEach((listener) => listener(status, progress));
}

export function subscribeOnDeviceTranscription(listener: StatusListener): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => listeners.delete(listener);
}

export function hasNativeSpeechRecognition(): boolean {
  if (typeof window === "undefined") return false;
  const browser = window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(browser.SpeechRecognition ?? browser.webkitSpeechRecognition);
}

async function getTranscriber(): Promise<Transcriber | null> {
  if (transcriber) return transcriber;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    notify("downloading", 0);
    try {
      const options = {
        expectedInputs: [
          { type: "text", languages: ["en"] },
          { type: "audio" },
        ],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      };
      const availability = await getBrowserLanguageModelAvailability(options);
      if (availability === "unavailable") return null;
      const model = getBrowserLanguageModel();
      if (!model) return null;
      const session = await model.create(options);
      transcriber = async (audio: Blob) => session.prompt([
        {
          role: "user",
          content: [
            { type: "text", value: "Transcribe this audio faithfully. Return only the spoken words." },
            { type: "audio", value: audio },
          ],
        },
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

export function prepareOnDeviceTranscription(): Promise<Transcriber | null> {
  return getTranscriber();
}

export type LocalRecording = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export async function startLocalRecording(): Promise<LocalRecording> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot record audio for local transcription.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const release = () => stream.getTracks().forEach((track) => track.stop());
  const supportsMimeType = typeof MediaRecorder.isTypeSupported === "function";
  const mimeType = supportsMimeType
    ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type))
    : undefined;
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  } catch (error) {
    release();
    throw error;
  }
  const chunks: BlobPart[] = [];
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
    stop: () => new Promise<Blob>((resolve, reject) => {
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
    },
  };
}

export async function transcribeLocally(recording: Blob): Promise<string> {
  const model = await getTranscriber();
  if (!model) throw new Error("The browser language model could not be prepared for dictation.");
  return (await model(recording)).trim();
}
