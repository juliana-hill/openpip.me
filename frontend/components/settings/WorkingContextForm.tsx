"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ContextResponse = { content: string; updated_at: string };

export function WorkingContextForm() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">("loading");

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/settings/working-context`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load working context");
        return response.json() as Promise<ContextResponse>;
      })
      .then((data) => {
        setContent(data.content);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function save() {
    setStatus("saving");
    try {
      const response = await fetch(`${apiBaseUrl}/api/settings/working-context`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Unable to save working context");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="working-context-card" aria-labelledby="working-context-title">
      <div>
        <p className="eyebrow">Personalization</p>
        <h2 id="working-context-title">How OpenPip should work for you</h2>
        <p className="muted">Share priorities, work style, communication preferences, standing rules, and what to avoid. OpenPip applies this context quietly when it prepares briefings and proposals.</p>
      </div>
      <label className="working-context-label" htmlFor="working-context">Your working context</label>
      <textarea
        id="working-context"
        className="working-context-input"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={12000}
        placeholder={"For example:\n- Protect weekday mornings for deep work.\n- Prioritize client commitments over internal admin.\n- Keep proposed replies concise and warm.\n- Avoid meetings before 9am."}
        rows={14}
        disabled={status === "loading" || status === "saving"}
      />
      <div className="working-context-footer">
        <p className="muted">This changes recommendations and communication—not permissions. OpenPip will still ask before any external action.</p>
        <Button onClick={save} loading={status === "saving"} disabled={status === "loading"}>Save context</Button>
      </div>
      {status === "saved" && <p className="working-context-success" role="status">Saved. Your next briefing will use this context.</p>}
      {status === "error" && <p className="working-context-error" role="alert">Couldn’t reach OpenPip. Start the backend and try again.</p>}
    </section>
  );
}
