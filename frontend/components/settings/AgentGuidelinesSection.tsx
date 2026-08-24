"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Bot, Loader2 } from "lucide-react";
import { proxyFetch } from "@/lib/proxy";

type LinkState = "loading" | "ready" | "unavailable";

type GuidelineLink = {
  label: string;
  description: string;
  url: string | null;
  state: LinkState;
};

async function fetchDriveUrl(path: string): Promise<string | null> {
  const res = await proxyFetch(path);
  if (!res.ok) return null;
  const data = await res.json() as { driveUrl?: string | null };
  return data.driveUrl ?? null;
}

export function AgentGuidelinesSection() {
  const [links, setLinks] = useState<GuidelineLink[]>([
    { label: "Assistant Identity", description: "How your assistant talks to you — its personality and tone. Shared across everything it helps with.", url: null, state: "loading" },
    { label: "Travel Agent", description: "Your travel preferences — accommodations, cost trade-offs, and how you like to get around.", url: null, state: "loading" },
    { label: "Executive Assistant", description: "How you like to work — your priorities, working style, and standing rules for your assistant.", url: null, state: "loading" },
    { label: "Proactive Proposals", description: "What the workspace scan looks for, and how eager it should be to suggest things.", url: null, state: "loading" },
  ]);

  useEffect(() => {
    const fetches: Array<{ index: number; path: string }> = [
      { index: 0, path: "/agent/agent-file" },
      { index: 1, path: "/agent/goals-n-guidelines/travel-planner" },
      { index: 2, path: "/agent/goals-n-guidelines/executive-assistant" },
      { index: 3, path: "/agent/goals-n-guidelines/proactive-review" },
    ];

    fetches.forEach(({ index, path }) => {
      fetchDriveUrl(path)
        .then((url) => {
          setLinks((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], url, state: url ? "ready" : "unavailable" };
            return next;
          });
        })
        .catch(() => {
          setLinks((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], state: "unavailable" };
            return next;
          });
        });
    });
  }, []);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <Bot style={{ width: 20, height: 20, color: "var(--color-accent)" }} />
        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }}>Agent &amp; Guidelines</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((link) => (
          <div
            key={link.label}
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-md)",
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }}>{link.label}</p>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }}>{link.description}</p>
            </div>

            <div style={{ flexShrink: 0 }}>
              {link.state === "loading" && (
                <Loader2 style={{ width: 16, height: 16, color: "var(--color-text-muted)", animation: "spin 0.6s linear infinite" }} />
              )}
              {link.state === "ready" && link.url && (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 500,
                    color: "var(--color-accent)",
                    textDecoration: "none",
                  }}
                >
                  Edit in Drive
                  <ExternalLink style={{ width: 12, height: 12 }} />
                </a>
              )}
              {link.state === "unavailable" && (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>Sign in to Google to edit</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
