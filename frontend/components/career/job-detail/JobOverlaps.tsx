"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TrippyIcon } from "@/components/TrippyIcon";
import { BarChart2 } from "lucide-react";
import type { Job } from "@/types/career";
import { CollapsiblePanel } from "./CollapsiblePanel";
import styles from "./panel.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import modalStyles from "@/components/career/JobDetailModal.module.css";

type Tab = "overlaps" | "gaps" | "positioning";

// Matches any heading format the AI might use:
//   ## Overlaps  |  **Overlaps**  |  **Overlaps:**  |  Overlaps:  (at line start)
const SECTION_PATTERN: [Tab, RegExp][] = [
  ["overlaps",    /^#{1,3}\s*\*{0,2}overlaps?\*{0,2}:?\s*$/i],
  ["gaps",        /^#{1,3}\s*\*{0,2}gaps?\*{0,2}:?\s*$/i],
  ["positioning", /^#{1,3}\s*\*{0,2}positioning\*{0,2}:?\s*$/i],
];


function matchSection(line: string): Tab | null {
  for (const [tab, re] of SECTION_PATTERN) {
    if (re.test(line.trim())) return tab;
  }
  // Inline bold that takes up the whole meaningful content of the line
  const stripped = line.replace(/[*#\s:]/g, "");
  if (/^overlaps?$/i.test(stripped)) return "overlaps";
  if (/^gaps?$/i.test(stripped)) return "gaps";
  if (/^positioning$/i.test(stripped)) return "positioning";
  return null;
}

function parseOverlaps(text: string): Record<Tab, string> {
  const sections: Record<Tab, string> = { overlaps: "", gaps: "", positioning: "" };
  const lines = text.split("\n");
  let current: Tab | null = null;
  const buckets: Record<Tab, string[]> = { overlaps: [], gaps: [], positioning: [] };

  for (const line of lines) {
    const tab = matchSection(line);
    if (tab) {
      current = tab;
      // Check if there's trailing content after the heading on the same line
      const inlineContent = line
        .replace(/^#{1,3}\s*/, "")
        .replace(/\*\*(overlaps?|gaps?|positioning)\*\*:?/i, "")
        .trim();
      if (inlineContent) buckets[current].push(inlineContent);
    } else if (current) {
      buckets[current].push(line);
    }
  }

  for (const tab of ["overlaps", "gaps", "positioning"] as Tab[]) {
    sections[tab] = buckets[tab].join("\n").trim();
  }
  return sections;
}

type JobOverlapsProps = Readonly<{ job: Job; onPatch: (update: Partial<Job>) => void }>;

export function JobOverlaps({ job, onPatch }: JobOverlapsProps) {
  const [overlapsText, setOverlapsText] = useState(job.overlaps ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overlaps");

  const handleFindOverlaps = useCallback(async () => {
    if (!job.jd) return;
    setLoading(true);
    setError(false);
    setOverlapsText(null);
    try {
      const res = await proxyFetch("/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I'm applying for a ${job.role} role at ${job.company}. Here is the job description:\n\n${job.jd}\n\nUsing my full career history (start from my earliest full-time position when calculating experience — full-time co-ops count), produce an overlap analysis using the required output format from the depth-positioning rule: **Overlaps** bullet points, **Gaps** bullet points each with sub-bullets on how to address them, and **Positioning** bullet points with first-person lift-and-use language. Nothing else.`,
          skill: "executive-coach",
        }),
      });
      const { jobId } = (await res.json()) as { jobId: string };
      while (true) {
        await new Promise((r) => setTimeout(r, 800));
        const statusRes = await proxyFetch(`/agent/chat/status/${jobId}`);
        if (!statusRes.ok) continue;
        const agentJob = (await statusRes.json()) as { status: string; result?: string };
        if (agentJob.status === "completed") {
          const result = agentJob.result ?? "No overlaps found.";
          setOverlapsText(result);
          onPatch({ overlaps: result });
          break;
        }
        if (agentJob.status === "failed") { setError(true); break; }
      }
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [job, onPatch]);

  const analyzeBtn = (
    <button
      type="button"
      className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
      onClick={handleFindOverlaps}
      disabled={loading}
    >
      <TrippyIcon sizeClass="h-3.5 w-3.5" />
      {loading ? "Analyzing…" : overlapsText ? "Re-analyze" : "Find Overlaps"}
    </button>
  );

  const tabBar = !loading && overlapsText ? (
    <div className={styles.tabs}>
      {(["overlaps", "gaps", "positioning"] as Tab[]).map((tab) => (
        <button
          key={tab}
          type="button"
          className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
          onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); setActiveTab(tab); }}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <CollapsiblePanel
      icon={<BarChart2 size={16} style={{ color: "var(--color-accent)" }} />}
      title="Overlap Analysis"
      actions={analyzeBtn}
      subheader={tabBar}
    >
      {loading && (
        <div className={styles.skeletonList}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeleton} style={{ width: i === 4 ? "60%" : "100%" }} />
          ))}
        </div>
      )}
      {!loading && error && <p className={styles.errorText}>Couldn&apos;t analyze overlaps — try again.</p>}
      {!loading && overlapsText && (() => {
        const sections = parseOverlaps(overlapsText);
        const content = sections[activeTab];
        return (
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
              <ReadAloudButton text={content.replace(/[#*`_~>\-]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim()} className={modalStyles.iconBtn} iconSize={14} />
            </div>
            <Markdown remarkPlugins={[remarkGfm]} components={{
              p: ({ children }) => <p style={{ marginBottom: 8, lineHeight: 1.6 }}>{children}</p>,
              ul: ({ children }) => <ul style={{ margin: "6px 0", paddingLeft: 20 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: "6px 0", paddingLeft: 20 }}>{children}</ol>,
              li: ({ children }) => <li style={{ marginBottom: 2, lineHeight: 1.5 }}>{children}</li>,
              strong: ({ children }) => <strong style={{ color: "var(--color-text)", fontWeight: 700 }}>{children}</strong>,
            }}>
              {content || "_No content parsed for this section._"}
            </Markdown>
          </div>
        );
      })()}
      {!loading && !error && !overlapsText && (
        <p className={styles.emptyText}>Click &quot;Find Overlaps&quot; to see how your background aligns with this role.</p>
      )}
    </CollapsiblePanel>
  );
}
