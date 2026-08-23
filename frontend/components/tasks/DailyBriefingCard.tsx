"use client";

import { TrippyIcon } from "@/components/TrippyIcon";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./DailyBriefingCard.module.css";

type Props = Readonly<{ briefing: string | null; loading: boolean; generatedAt: string | null }>;

export function DailyBriefingCard({ briefing, loading, generatedAt }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.accentBar} />
      <div className={styles.header}>
        <TrippyIcon size={40} />
        <div style={{ flex: 1 }}>
          <h3 className={styles.title}>Daily Briefing</h3>
          <p className={styles.subtitle}>
            {loading ? "Generating briefing…" : generatedAt ? `Generated ${generatedAt}` : ""}
          </p>
        </div>
        {briefing && !loading && (
          <ReadAloudButton text={briefing ?? ""} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, display: "flex", alignItems: "center" }} iconSize={16} />
        )}
      </div>

      {loading ? (
        <div className={styles.skeletons}>
          <div className={styles.skeleton} style={{ width: "100%" }} />
          <div className={styles.skeleton} style={{ width: "85%" }} />
          <div className={styles.skeleton} style={{ width: "70%" }} />
        </div>
      ) : briefing ? (
        <div className={styles.body}>
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className={styles.mdP}>{children}</p>,
              ul: ({ children }) => <ul className={styles.mdUl}>{children}</ul>,
              li: ({ children }) => <li className={styles.mdLi}>{children}</li>,
              blockquote: ({ children }) => <blockquote className={styles.mdBlockquote}>{children}</blockquote>,
              strong: ({ children }) => <strong style={{ color: "var(--color-text)", fontWeight: 700 }}>{children}</strong>,
            }}
          >
            {briefing}
          </Markdown>
        </div>
      ) : (
        <p className={styles.empty}>No briefing available yet.</p>
      )}
    </div>
  );
}
