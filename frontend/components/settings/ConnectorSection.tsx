"use client";

import { useEffect, useState } from "react";
import { GoogleAccountConnectorCard, AddGoogleAccountButton, type GoogleSubAccount } from "./GoogleAccountConnectorCard";
import { proxyFetch } from "@/lib/proxy";

/** One connected workspace account: Google Workspace only. */
export function ConnectorSection() {
  const [account, setAccount] = useState<GoogleSubAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    proxyFetch("/auth/me")
      .then(async (response) => response.ok ? response.json() as Promise<{ email?: string; name?: string; picture?: string; subAccounts?: GoogleSubAccount[] }> : null)
      .then((data) => {
        if (!active || !data) return;
        const connected = data.subAccounts?.[0];
        setAccount(connected ?? (data.email ? {
          email: data.email,
          name: data.name ?? data.email,
          picture: data.picture ?? "",
        } : null));
      })
      .catch(() => { if (active) setAccount(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <GoogleIcon />
        <div>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }}>
            Google Workspace
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
            One Google account for Gmail, Calendar, Tasks, and Drive.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ minHeight: 140, borderRadius: "var(--radius-6)", background: "var(--color-bg-muted)", opacity: 0.65 }} aria-label="Loading Google Workspace connection" />
      ) : account ? (
        <div style={{ maxWidth: 420 }}>
          <GoogleAccountConnectorCard account={account} onRemoved={() => setAccount(null)} />
        </div>
      ) : (
        <div style={{ maxWidth: 420 }}>
          <AddGoogleAccountButton />
        </div>
      )}
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" style={{ width: 20, height: 20 }} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
