export type TutorialChatProvider = "chrome-ai" | "browser-polyfill" | "static-guide" | "unavailable";

export type TutorialMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TutorialAction =
  | { type: "navigate"; route: string }
  | { type: "open-settings-section"; section: string }
  | { type: "highlight"; target: string }
  | { type: "request-api-key"; provider: "anthropic" | "gemini" };

export type TutorialChatResponse = {
  text: string;
  actions?: TutorialAction[];
  provider: TutorialChatProvider;
};
