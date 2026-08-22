"use client";

import { useState } from "react";
import { HardDriveDownload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import btnStyles from "@/components/ui/Button.module.css";
import { pushUserDataOrThrow, pushTasksBackup, pushPlanningChatSessions } from "@/lib/sync";

type BackupState = "idle" | "loading" | "success" | "error";

export function DataBackupSection() {
  const [state, setState] = useState<BackupState>("idle");

  const handleBackup = async () => {
    setState("loading");
    try {
      await Promise.all([pushUserDataOrThrow(), pushTasksBackup(), pushPlanningChatSessions()]);
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <HardDriveDownload style={{ width: 20, height: 20, color: "var(--color-accent)" }} />
        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }}>Data &amp; Backup</h2>
      </div>

      <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--shadow-md)", padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", margin: 0 }}>Back up to server</p>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2, marginBottom: 0 }}>
            Saves your addresses and chat history to the agent so they reload on any device.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {state === "success" && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-size-xs)", color: "#059669" }}>
              <CheckCircle2 style={{ width: 16, height: 16 }} />
              Backed up
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
            onClick={handleBackup}
            disabled={state === "loading"}
          >
            {state === "loading" ? (
              <>
                <Loader2 style={{ width: 16, height: 16, marginRight: 6, animation: "spin 0.6s linear infinite" }} />
                Backing up…
              </>
            ) : (
              "Back Up Now"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
