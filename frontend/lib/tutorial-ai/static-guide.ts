import type { TutorialMessage, TutorialChatResponse, TutorialAction } from "./types";

type StaticEntry = { patterns: RegExp[]; text: string; actions?: TutorialAction[] };

const ENTRIES: StaticEntry[] = [
  {
    patterns: [/what.*(is|can|does).*(trippy|this|it)\b/i, /tell me about/i, /overview/i, /how does.*work/i],
    text: "Trippy is your personal AI for business travel and productivity. It connects to Google Calendar, Gmail, Linear, and Motion to help you plan trips, manage tasks, and stay on schedule. To unlock the full experience, add a Claude or Gemini API key in Settings.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/get.*(started|going|set up|setup)/i, /how.*(start|begin|use)/i, /first.*(step|thing)/i, /onboard/i, /new user/i],
    text: "Getting started takes two steps: (1) Add a Claude API key from Anthropic or a Gemini key from Google AI Studio in Settings. (2) Optionally connect your Google account for Calendar and Gmail. Once you have a key, the full assistant unlocks.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/claude.*key/i, /anthropic.*key/i, /api.*(key|token).*claude/i, /claude.*api/i, /anthropic/i],
    text: "Get a Claude API key at console.anthropic.com — create an account, go to API Keys, and generate a new key. New accounts include free credits. Paste the key into the Claude API Key field in Settings.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/gemini.*key/i, /google.*ai.*key/i, /api.*(key|token).*gemini/i, /gemini.*api/i, /aistudio/i, /ai studio/i],
    text: "Get a Gemini API key at aistudio.google.com — sign in with Google, click Get API Key, and create one. The free tier covers light usage. Paste it into the Gemini API Key field in Settings.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/setting(s)?/i, /where.*(config|configure)/i, /how.*(config|configure)/i, /configuration/i, /where.*go/i],
    text: "Settings is reachable from the gear icon in the app header. From there you can add your API keys, connect Google OAuth, and configure workspace integrations like Linear and Motion.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/google.*(key|oauth|api|account|connect)/i, /oauth/i, /calendar.*connect/i, /gmail.*connect/i, /google.*account/i],
    text: "The Google integration gives Trippy access to your Calendar and Gmail. It's optional but unlocks scheduling and email features. Connect it under Settings → Google and authorize the requested scopes.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/api.*key/i, /where.*(key|token)/i, /need.*(key|token)/i, /how.*(key|token)/i, /which.*key/i],
    text: "You need an API key from Anthropic (Claude) or Google (Gemini) to use the full AI features. Both have free tiers. Once you add one in Settings, the assistant unlocks. Which provider would you like to use?",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/travel|trip|flight|hotel|book/i],
    text: "Trippy can plan business trips, compare routes, estimate travel costs, and find gaps in your calendar for travel windows. These features unlock once you add an API key in Settings.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/task|linear|motion|todo|to.do|schedule/i],
    text: "Trippy integrates with Linear, Motion, and Google Tasks to surface and prioritize your work. These features require a provider API key — set one up in Settings to get started.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/cost|price|paid|free|cheap|afford|money/i],
    text: "Trippy itself is free to run. You need an API key from Anthropic or Google — both offer free tiers for light usage. Anthropic gives new accounts free credits; Google AI Studio has a generous free quota.",
    actions: [{ type: "navigate", route: "/settings" }],
  },
  {
    patterns: [/help|stuck|confused|lost|don.t know|unsure|what do i do/i],
    text: "No worries — setup just needs one thing: an API key. Go to Settings and add either a Claude key (Anthropic) or a Gemini key (Google). Once that's done, the full assistant opens up. What would you like to do?",
    actions: [{ type: "navigate", route: "/settings" }],
  },
];

const FALLBACK: Omit<StaticEntry, "patterns"> = {
  text: "I'm your setup guide for Trippy. To unlock the full assistant, you need a Claude or Gemini API key — go to Settings to add one. You can ask me how to get a key, what Trippy does, or how to connect Google.",
  actions: [{ type: "navigate", route: "/settings" }],
};

export function sendStaticGuide(messages: TutorialMessage[]): TutorialChatResponse {
  const last = messages[messages.length - 1];
  const input = last.content;

  for (const entry of ENTRIES) {
    if (entry.patterns.some((p) => p.test(input))) {
      return { text: entry.text, actions: entry.actions, provider: "static-guide" };
    }
  }

  return { text: FALLBACK.text, actions: FALLBACK.actions, provider: "static-guide" };
}
