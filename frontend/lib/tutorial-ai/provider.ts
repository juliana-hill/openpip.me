import { isChromeAiAvailable, sendChromeAi, resetChromeAiSession } from "./chrome-ai";
import { sendStaticGuide } from "./static-guide";
import type { TutorialMessage, TutorialChatResponse } from "./types";

export type { TutorialChatProvider, TutorialMessage, TutorialAction, TutorialChatResponse } from "./types";

let chromeAiChecked = false;
let chromeAiReady = false;

async function resolveChromeAi(): Promise<boolean> {
  if (chromeAiChecked) return chromeAiReady;
  chromeAiChecked = true;
  chromeAiReady = await isChromeAiAvailable();
  return chromeAiReady;
}

export async function sendTutorialMessage(messages: TutorialMessage[]): Promise<TutorialChatResponse> {
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

export async function getTutorialProvider(): Promise<"chrome-ai" | "static-guide"> {
  if (await resolveChromeAi()) return "chrome-ai";
  return "static-guide";
}
