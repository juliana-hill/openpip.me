"use client";

import cardStyles from "@/components/ui/Card.module.css";
import dialogStyles from "@/components/ui/Dialog.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import { useState } from "react";

type ConnectorCardProps = Readonly<{
  name: string;
  description: string | React.ReactNode;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "connecting";
  workspaceName?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  /** When provided, replaces Connect/Disconnect with a single Manage button */
  onManage?: () => void;
  manageLabel?: string;
  /** When provided, shows an × delete button on disconnected cards */
  onDelete?: () => void;
}>;

export function ConnectorCard({
  name,
  description,
  icon,
  status,
  workspaceName,
  onConnect,
  onDisconnect,
  onManage,
  manageLabel = "Manage",
  onDelete,
}: ConnectorCardProps) {
  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleCardClick = () => {
    if (onManage) {
      onManage();
    }
  };

  return (
    <>
      <div
        className={cardStyles.card}
        style={{ position: "relative", overflow: "hidden", cursor: onManage ? "pointer" : undefined }}
        onClick={onManage ? handleCardClick : undefined}
      >
        {status === "connected" && (
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          </div>
        )}
        {status === "disconnected" && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, lineHeight: 1, fontSize: 16 }}
            aria-label={`Remove ${name}`}
          >
            ×
          </button>
        )}
        <div className={cardStyles.cardContent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <h3 className={cardStyles.cardTitle}>{name}</h3>
              <p className={cardStyles.cardDescription} style={{ marginTop: 2, fontSize: "var(--font-size-xs)" }}>{description}</p>
            </div>
          </div>
          <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {onManage ? (
              <>
                <div>
                  {status === "connected" ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      Connected
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {status === "connecting" ? "Connecting..." : "Disconnected"}
                    </span>
                  )}
                  {workspaceName && (
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{workspaceName}</p>
                  )}
                </div>
                <button
                  className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
                  onClick={(e) => { e.stopPropagation(); onManage(); }}
                  disabled={status === "connecting"}
                >
                  {manageLabel}
                </button>
              </>
            ) : status === "connected" ? (
              <>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Connected
                  </span>
                  {workspaceName && (
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{workspaceName}</p>
                  )}
                </div>
                <button
                  className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.sm}`}
                  onClick={(e) => { e.stopPropagation(); setShowDisconnect(true); }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {status === "connecting" ? "Connecting..." : "Disconnected"}
                </span>
                <button
                  className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
                  onClick={(e) => { e.stopPropagation(); onConnect(); }}
                  disabled={status === "connecting"}
                >
                  {status === "connecting" ? "Connecting..." : "Connect"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDisconnect && (
        <>
          <div className={dialogStyles.overlay} onClick={() => setShowDisconnect(false)} />
          <div className={dialogStyles.content}>
            <div className={dialogStyles.header}>
              <h2 className={dialogStyles.title}>Disconnect {name}?</h2>
              <p className={dialogStyles.description}>
                The agent will no longer be able to read your tasks from {name}.
              </p>
            </div>
            <div className={dialogStyles.footer}>
              <button
                className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.md}`}
                onClick={() => setShowDisconnect(false)}
              >
                Cancel
              </button>
              <button
                className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.md}`}
                onClick={() => {
                  onDisconnect();
                  setShowDisconnect(false);
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
