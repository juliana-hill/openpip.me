"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState } from "react";
import { BarChart2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import btnStyles from "@/components/ui/Button.module.css";

type RankState = "idle" | "loading" | "started" | "error";

function RankButton({ label, description, endpoint }: { label: string; description: string; endpoint: string }) {
  const [state, setState] = useState<RankState>("idle");

  const handle = async () => {
    setState("loading");
    try {
      const res = await proxyFetch(endpoint);
      if (!res.ok) throw new Error();
      setState("started");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--shadow-md)", padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }}>{label}</p>
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }}>{description}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {state === "started" && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-xs)", color: "#059669" }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Started
          </span>
        )}
        {state === "error" && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-xs)", color: "#e5383b" }}>
            <AlertCircle style={{ width: 16, height: 16 }} />
            Failed
          </span>
        )}
        <button
          className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
          onClick={handle}
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <>
              <Loader2 style={{ width: 16, height: 16, marginRight: 6, animation: "spin 0.6s linear infinite" }} />
              Starting…
            </>
          ) : (
            "Run Now"
          )}
        </button>
      </div>
    </div>
  );
}

function PruneButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [removed, setRemoved] = useState(0);

  const handle = async () => {
    setState("loading");
    try {
      const res = await proxyFetch("/agent/career/job-results/prune", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json() as { removed: number };
      setRemoved(data.removed);
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--shadow-md)", padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }}>Clean up job results</p>
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }}>Removes listings already on your board from discovered results.</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {state === "done" && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-xs)", color: "#059669" }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            {removed} removed
          </span>
        )}
        {state === "error" && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-xs)", color: "#e5383b" }}>
            <AlertCircle style={{ width: 16, height: 16 }} />
            Failed
          </span>
        )}
        <button
          className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
          onClick={handle}
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <><Loader2 style={{ width: 16, height: 16, marginRight: 6, animation: "spin 0.6s linear infinite" }} />Running…</>
          ) : "Run Now"}
        </button>
      </div>
    </div>
  );
}

export function CareerRankSection() {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <BarChart2 style={{ width: 20, height: 20, color: "var(--color-accent)" }} />
        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }}>Career Ranking</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <RankButton
          label="Rank companies"
          description="Scores and sorts your company list by match to your career goals and skills."
          endpoint="/agent/career/rank/companies"
        />
        <RankButton
          label="Rank job results"
          description="Scores and sorts scraped job listings by match to your career goals and skills."
          endpoint="/agent/career/rank/jobs"
        />
        <PruneButton />
      </div>
    </section>
  );
}
