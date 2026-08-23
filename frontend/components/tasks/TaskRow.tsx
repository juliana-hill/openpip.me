"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, Play, X } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PriorityBadge } from "./PriorityBadge";
import { SourceBadge } from "./SourceBadge";
import { OverdueBadge, isTaskOverdue, DueDateBadge } from "./OverdueBadge";
import type { Task } from "@/types/tasks";
import { proxyFetch } from "@/lib/proxy";
import dialogStyles from "@/components/ui/Dialog.module.css";
import buttonStyles from "@/components/ui/Button.module.css";

type TaskDetail = {
  description?: string | null;
  assignee?: string | null;
  url?: string | null;
  comments?: Array<{ id: string; author: string; body: string; createdAt: string }>;
};

type TaskRowProps = Readonly<{
  task: Task;
  isActive: boolean;
  onFlag: (task: Task) => void;
  onComplete: (taskId: string) => Promise<void>;
}>;

export function TaskRow({ task, isActive, onFlag, onComplete }: TaskRowProps) {
  const [open, setOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleComplete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setCompleting(true);
    try { await onComplete(task.id); } finally { setCompleting(false); }
  };

  const handleOpen = async () => {
    setOpen(true);
    if (detail || !task.listId) return;
    setDetailLoading(true);
    try {
      const response = await proxyFetch(`/agent/notebook/pages/${task.listId}/tasks/${task.id}`);
      if (response.ok) setDetail(await response.json() as TaskDetail);
    } catch {
      // Details are optional; the task remains usable when unavailable.
    } finally {
      setDetailLoading(false);
    }
  };

  const durationMinutes = task.scheduledStartTime && task.scheduledEndTime
    ? Math.max(0, (Number(task.scheduledEndTime.slice(0, 2)) * 60 + Number(task.scheduledEndTime.slice(3, 5))) - (Number(task.scheduledStartTime.slice(0, 2)) * 60 + Number(task.scheduledStartTime.slice(3, 5))))
    : task.duration ?? null;
  const durationLabel = durationMinutes
    ? durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ""}` : `${durationMinutes}m`
    : null;
  const overdue = isTaskOverdue(task.dueDate);

  return (
    <>
      <div
        style={{ background: "color-mix(in srgb, var(--color-surface) 40%, transparent)", borderRadius: "var(--radius-lg)", border: "1px solid transparent", cursor: "pointer", opacity: isActive ? 0.6 : 1 }}
        onClick={() => void handleOpen()}
        onMouseEnter={(event) => { if (!isActive) { event.currentTarget.style.background = "color-mix(in srgb, var(--color-border) 40%, transparent)"; event.currentTarget.style.borderColor = "var(--color-border)"; } }}
        onMouseLeave={(event) => { event.currentTarget.style.background = "color-mix(in srgb, var(--color-surface) 40%, transparent)"; event.currentTarget.style.borderColor = "transparent"; }}
      >
        <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button type="button" aria-label="Mark Google task complete" onClick={handleComplete} disabled={completing} style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", border: "2px solid var(--color-border)", background: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: completing ? "not-allowed" : "pointer", opacity: completing ? 0.5 : 1 }}>
            {completing ? <Loader2 size={12} style={{ animation: "spin 0.6s linear infinite" }} /> : <Check size={12} style={{ color: "var(--color-text-muted)" }} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <SourceBadge source="google" />
              <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
              {isActive && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fb7185", flexShrink: 0, animation: "pulse 2s infinite" }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
              {task.dueDate && <DueDateBadge dueDate={task.dueDate} />}
              {durationLabel && <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: "var(--radius-pill)", background: "var(--color-border)", color: "var(--color-text-muted)" }}>{durationLabel}</span>}
              {task.labels?.map((label) => <span key={label} style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: "var(--radius-pill)", background: "color-mix(in srgb, var(--color-accent) 12%, transparent)", color: "var(--color-accent)" }}>{label}</span>)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {overdue && <OverdueBadge />}
            <PriorityBadge priority={task.priority} />
            <button type="button" aria-label="Flag as active" onClick={(event) => { event.stopPropagation(); onFlag(task); }} style={{ color: "var(--color-text-muted)", background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex" }}>
              <Play size={16} />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <>
          <div className={dialogStyles.overlay} onClick={() => setOpen(false)} />
          <div className={dialogStyles.content}>
            <button className={dialogStyles.closeBtn} onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
            <div className={dialogStyles.header}><h2 className={dialogStyles.title}>{task.title}</h2></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><SourceBadge source="google" /><PriorityBadge priority={task.priority} />{overdue && <OverdueBadge />}{task.dueDate && <DueDateBadge dueDate={task.dueDate} />}</div>
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {detailLoading ? <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", padding: "8px 0" }}><Loader2 size={14} style={{ animation: "spin 0.6s linear infinite" }} />Loading details…</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "var(--font-size-sm)" }}>
                  {detail?.description && <Markdown remarkPlugins={[remarkGfm]}>{detail.description}</Markdown>}
                  {detail?.comments?.map((comment) => <div key={comment.id} style={{ borderLeft: "2px solid var(--color-border)", paddingLeft: 12 }}><b>{comment.author}</b><p>{comment.body}</p></div>)}
                  {detail?.url && <a href={detail.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}>Open in Google Tasks <ExternalLink size={12} /></a>}
                </div>
              )}
            </div>
            <div className={dialogStyles.footer}><button className={`${buttonStyles.btn} ${buttonStyles.ghost} ${buttonStyles.sm}`} onClick={() => setOpen(false)}>Close</button></div>
          </div>
        </>
      )}
    </>
  );
}
