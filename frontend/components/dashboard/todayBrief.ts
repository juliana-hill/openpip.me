import { proxyFetch } from "@/lib/proxy";

export type TodayBriefTask = Readonly<{ title: string }>;
export type TodayBriefEvent = Readonly<{ title: string }>;

type BuildTodayBriefingInput = Readonly<{
  tasks: readonly TodayBriefTask[];
  events: readonly TodayBriefEvent[];
  openCount: number;
  taskCount: number;
  eventCount: number;
  unreadCount: number;
  quote: string | null;
}>;

export async function fetchDailyQuote(): Promise<string | null> {
  // Prefer the normal agent route, but keep a direct backend fallback for the
  // quote-only request. Both routes use the same SQLite quote pool; the
  // fallback avoids losing the quote when the auth-boundary proxy rejects a
  // request that does not need a Google token.
  for (const path of ["/agent/briefing/quote", "/api/briefing/quote"]) {
    try {
      const response = await proxyFetch(path);
      if (!response.ok) continue;
      const data = await response.json() as { quote?: unknown };
      if (typeof data.quote === "string" && data.quote.trim()) return data.quote.trim();
    } catch {
      // Try the direct backend route before giving up on the quote.
    }
  }
  return null;
}

export function buildTodayBriefing({
  tasks,
  events,
  openCount,
  taskCount,
  eventCount,
  unreadCount,
  quote,
}: BuildTodayBriefingInput): string {
  const bullets = [
    ...events.map((event) => event.title.trim()).filter(Boolean),
    ...tasks.map((task) => task.title.trim()).filter(Boolean),
  ].slice(0, 3);

  // The card always keeps its three-bullet shape. Padding is conditional and
  // describes the absence of another item returned by the Today data; it is
  // never a standing productivity instruction.
  while (bullets.length < 3) bullets.push("No additional priority returned");

  const lines = [
    quote?.trim() || `Today: ${openCount} open`,
    "",
    `${taskCount} Google task${taskCount === 1 ? "" : "s"} · ${eventCount} calendar event${eventCount === 1 ? "" : "s"} today · ${unreadCount} unread email${unreadCount === 1 ? "" : "s"}`,
    "",
    ...bullets.map((item) => `- ${item}`),
  ];
  return lines.join("\n");
}
