"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DailyBriefingCard } from "./DailyBriefingCard";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function DemoBriefingCard() {
  const [briefing, setBriefing] = useState("Your agent will summarize the work that changed overnight here.");
  const [generatedAt, setGeneratedAt] = useState<string | undefined>();
  const [status, setStatus] = useState<"ready" | "loading" | "error">("ready");
  const [proposals, setProposals] = useState<number | null>(null);

  async function scan() {
    setStatus("loading");
    try {
      const response = await fetch(`${apiBaseUrl}/api/demo/briefing`, { method: "POST" });
      if (!response.ok) throw new Error("Scan failed");
      const result = await response.json() as { briefing: string; proposals_created: number };
      setBriefing(result.briefing);
      setProposals(result.proposals_created);
      setGeneratedAt(`Generated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
      setStatus("ready");
    } catch { setStatus("error"); }
  }

  return (
    <div className="demo-briefing-wrap">
      <DailyBriefingCard briefing={briefing} generatedAt={generatedAt} />
      <div className="demo-briefing-actions"><Button onClick={scan} loading={status === "loading"}>{status === "loading" ? "Scanning…" : "Run demo scan"}</Button>{proposals !== null && <span className="muted">{proposals} source-cited proposal{proposals === 1 ? "" : "s"} added to Review.</span>}{status === "error" && <span className="working-context-error" role="alert">Start the backend to run a scan.</span>}</div>
    </div>
  );
}
