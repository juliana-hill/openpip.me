import type { TutorialMessage, TutorialChatResponse } from "./types";

declare global {
  interface Window {
    LanguageModel?: {
      availability: (options?: unknown) => Promise<"available" | "downloadable" | "downloading" | "unavailable" | { available: "readily" | "after-download" | "no" }>;
      create: (options?: unknown) => Promise<{
        prompt: (input: unknown) => Promise<string>;
        destroy: () => void;
      }>;
    };
  }
}

export type BrowserLanguageModel = NonNullable<Window["LanguageModel"]>;
export type BrowserLanguageModelAvailability = "available" | "downloadable" | "downloading" | "unavailable";

const SYSTEM_PROMPT = `You are a concise setup guide for Trippy, a personal AI for business travel and productivity.

Help new users with:
- What Trippy does (AI-powered travel planning, task management, calendar and email integration)
- How to get a Claude API key from Anthropic at console.anthropic.com
- How to get a Gemini API key from Google AI Studio at aistudio.google.com
- How to connect Google OAuth for Calendar and Gmail access
- Where to find the Settings page to configure these

Keep answers to 2–4 sentences. You cannot access the user's calendar, email, or tasks until a provider key is configured. For anything beyond setup, let them know those features unlock after adding a key.`;

let session: { prompt: (text: string) => Promise<string>; destroy: () => void } | null = null;

export function getBrowserLanguageModel(): BrowserLanguageModel | undefined {
  if (typeof window === "undefined") return undefined;
  return window.LanguageModel;
}

export async function getBrowserLanguageModelAvailability(options?: unknown): Promise<BrowserLanguageModelAvailability> {
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

export async function isChromeAiAvailable(): Promise<boolean> {
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

export async function sendChromeAi(messages: TutorialMessage[]): Promise<TutorialChatResponse> {
  const s = await ensureSession();
  const last = messages[messages.length - 1];
  const text = await s.prompt(last.content);
  return { text: text.trim(), provider: "chrome-ai" };
}

export function resetChromeAiSession(): void {
  try { session?.destroy(); } catch { /* ignore */ }
  session = null;
}
