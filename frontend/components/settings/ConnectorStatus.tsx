"use client";

import { useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
type Connector = { name: string; label: string; connected: boolean; mode: string; scopes: string[] };

export function ConnectorStatus() {
  const [items, setItems] = useState<Connector[]>([]);
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/connectors`).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load connectors");
      setItems((await response.json()).items as Connector[]);
    }).catch(() => setItems([]));
  }, []);
  return (
    <section className="appearance-card" aria-labelledby="connector-title">
      <div><p className="eyebrow">Connections</p><h2 id="connector-title">Workspace connectors</h2><p className="muted">Local demo mode uses sanitized fixtures. OAuth connections will be added without putting tokens in the browser.</p></div>
      <div className="connector-list">{items.map((item) => <div className="connector-row" key={item.name}><div><strong>{item.label}</strong><small>{item.scopes.join(" · ")}</small></div><span className="connector-badge">{item.connected ? "Connected" : "Demo mode"}</span></div>)}</div>
    </section>
  );
}
