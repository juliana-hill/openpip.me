import type { TutorialMessage, TutorialChatResponse } from "./types";

const SYSTEM_PROMPT = `You are a concise setup guide for Trippy, a personal AI for business travel and productivity.
Answer in 2-3 sentences. Help users understand what Trippy does, how to get API keys (Claude from console.anthropic.com, Gemini from aistudio.google.com), and how to navigate to Settings.
Do not access the user's data or pretend to be the full agent.`;

export type PolyfillStatus = "idle" | "loading" | "ready" | "failed";

type StatusCallback = (status: PolyfillStatus, progress?: number) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipe: ((messages: object[], opts: object) => Promise<any>) | null = null;
let currentStatus: PolyfillStatus = "idle";
const subscribers: StatusCallback[] = [];
let initPromise: Promise<boolean> | null = null;

function broadcast(s: PolyfillStatus, p?: number) {
  currentStatus = s;
  for (const cb of subscribers) cb(s, p);
}

export function getPolyfillStatus(): PolyfillStatus {
  return currentStatus;
}

export function subscribePolyfill(cb: StatusCallback): () => void {
  subscribers.push(cb);
  return () => {
    const i = subscribers.indexOf(cb);
    if (i >= 0) subscribers.splice(i, 1);
  };
}

export async function initPolyfill(): Promise<boolean> {
  if (currentStatus === "ready") return true;
  if (currentStatus === "failed") return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window === "undefined") return false;
    broadcast("loading", 0);
    try {
      const { pipeline } = await import("@huggingface/transformers");
      const generator = await pipeline(
        "text-generation",
        "onnx-community/Qwen2.5-0.5B-Instruct",
        {
          dtype: "q4f16",
          progress_callback: (data: { status: string; progress?: number }) => {
            if (data.status === "progress" || data.status === "download") {
              broadcast("loading", Math.round(data.progress ?? 0));
            }
          },
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pipe = (msgs, opts) => (generator as any)(msgs, opts);
      broadcast("ready", 100);
      return true;
    } catch (err) {
      console.error("[tutorial-polyfill] model load failed:", err);
      broadcast("failed");
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

export async function sendPolyfill(messages: TutorialMessage[]): Promise<TutorialChatResponse> {
  if (!pipe) throw new Error("Polyfill not ready");

  const chatMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const output = await pipe(chatMessages, { max_new_tokens: 200, do_sample: false });

  const generated = output?.[0]?.generated_text;
  let text = "";
  if (Array.isArray(generated)) {
    text = generated[generated.length - 1]?.content ?? "";
  } else if (typeof generated === "string") {
    text = generated;
  }

  return { text: text.trim(), provider: "browser-polyfill" };
}
