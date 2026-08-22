"use client";

import { useState } from "react";
import { StickyNote } from "lucide-react";
import type { Job } from "@/types/career";
import { CollapsiblePanel } from "./CollapsiblePanel";
import styles from "./panel.module.css";

type JobNotesProps = Readonly<{ job: Job; onPatch: (update: Partial<Job>) => void }>;

export function JobNotes({ job, onPatch }: JobNotesProps) {
  const [notes, setNotes] = useState(job.notes ?? "");

  return (
    <CollapsiblePanel icon={<StickyNote size={16} style={{ color: "var(--color-accent)" }} />} title="Private Notes">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => { if (notes !== (job.notes ?? "")) onPatch({ notes }); }}
        placeholder="Add private notes about interview prep, salary discussions, or company research…"
        rows={6}
        className={styles.textarea}
      />
    </CollapsiblePanel>
  );
}
