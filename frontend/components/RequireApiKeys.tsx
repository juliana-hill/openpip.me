"use client";

import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import Link from "next/link";

type Status = { claudeApi?: { connected: boolean }; googleApi?: { connected: boolean } };

export function RequireApiKeys({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    proxyFetch("/agent/connectors/status")
      .then((r) => r.json())
      .then((d) => setStatus(d as Status))
      .catch(() => setStatus({}));
  }, []);

  if (status === null) {
    return <div style={{ minHeight: "100vh", background: "var(--color-bg)" }} />;
  }

  const claudeReady = status.claudeApi?.connected ?? false;
  const googleReady = status.googleApi?.connected ?? false;

  // Google key is hard-blocked — app can't function without it
  if (!googleReady) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Settings size={24} color="var(--color-accent)" />
        </div>
        <h2 style={{ margin: 0, fontSize: "var(--font-size-xl)", fontWeight: 800, color: "var(--color-text)" }}>Google API key required</h2>
        <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", maxWidth: 280, lineHeight: 1.6 }}>
          Connect your Google API key in Settings before using this feature.
        </p>
        <Link href="/settings" style={{ background: "var(--color-accent)", color: "#fff", fontWeight: 700, fontSize: "var(--font-size-sm)", padding: "10px 24px", borderRadius: 999, textDecoration: "none" }}>
          Go to Settings
        </Link>
      </div>
    );
  }

  // Claude key missing but Google ready — allow through (tutorial chat handles setup)
  if (claudeReady && googleReady) return <>{children}</>;
  return <>{children}</>;
}
