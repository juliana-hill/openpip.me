"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import dialogStyles from "@/components/ui/Dialog.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import styles from "./TimelineModal.module.css";
import type { TimelineEntry, TimelineEntryType } from "@/types/career";

const ENTRY_TYPES: TimelineEntryType[] = ["work", "education", "certification", "award", "club", "project"];

type TimelineModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: TimelineEntry[];
  loading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, patch: Partial<TimelineEntry>) => void;
}>;

const DOT_CLASS: Record<TimelineEntryType, string> = {
  work: styles.dotWork,
  education: styles.dotEducation,
  certification: styles.dotCertification,
  award: styles.dotAward,
  club: styles.dotClub,
  project: styles.dotProject,
};

const META_CLASS: Record<TimelineEntryType, string> = {
  work: styles.metaWork,
  education: styles.metaEducation,
  certification: styles.metaCertification,
  award: styles.metaAward,
  club: styles.metaClub,
  project: styles.metaProject,
};

const CHIP_CLASS: Record<TimelineEntryType, string> = {
  work: styles.chipWork,
  education: styles.chipEducation,
  certification: styles.chipCertification,
  award: styles.chipAward,
  club: styles.chipClub,
  project: styles.chipProject,
};

function formatDate(date?: string): string {
  if (!date) return "";
  return date;
}

function groupByYear(entries: TimelineEntry[]): Map<string, TimelineEntry[]> {
  const sorted = [...entries].sort((a, b) => {
    const aSort = a.dateSort ?? "0000-00";
    const bSort = b.dateSort ?? "0000-00";
    return bSort.localeCompare(aSort);
  });

  const map = new Map<string, TimelineEntry[]>();
  for (const entry of sorted) {
    const year = (entry.dateSort ?? "0000").slice(0, 4);
    const label = year === "9999" ? "Present" : year === "0000" ? "Unknown" : year;
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(entry);
  }
  return map;
}

export function TimelineModal({ open, onOpenChange, entries, loading, onDelete, onEdit }: TimelineModalProps) {
  const grouped = groupByYear(entries);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingEntry = entries.find((e) => e.id === pendingDeleteId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<TimelineEntry & { location: string }>>({});
  const [skillsRaw, setSkillsRaw] = useState("");

  function startEdit(entry: TimelineEntry) {
    setEditingId(entry.id);
    setEditDraft({
      title: entry.title,
      organization: entry.organization,
      location: (entry as Record<string, unknown>).location as string ?? "",
      type: entry.type,
      startDate: entry.startDate ?? "",
      endDate: entry.endDate ?? "",
      description: entry.description ?? "",
      skills: entry.skills ?? [],
    });
    setSkillsRaw((entry.skills ?? []).join(", "));
  }

  function saveEdit(id: string) {
    const patch: Partial<TimelineEntry> & { location?: string } = {};
    if (editDraft.title !== undefined) patch.title = editDraft.title;
    if (editDraft.organization !== undefined) patch.organization = editDraft.organization;
    if (editDraft.location !== undefined) (patch as Record<string, unknown>).location = editDraft.location;
    if (editDraft.type !== undefined) patch.type = editDraft.type as TimelineEntryType;
    if (editDraft.startDate !== undefined) patch.startDate = editDraft.startDate;
    if (editDraft.endDate !== undefined) patch.endDate = editDraft.endDate;
    if (editDraft.description !== undefined) patch.description = editDraft.description;
    patch.skills = skillsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    onEdit?.(id, patch);
    setEditingId(null);
  }

  function handleDeleteConfirm() {
    if (pendingDeleteId) onDelete?.(pendingDeleteId);
    setPendingDeleteId(null);
  }

  if (!open) return null;

  return (
    <>
      <div className={dialogStyles.overlay} onClick={() => onOpenChange(false)} />
      <div className={dialogStyles.content}>
        <div className={dialogStyles.header}>
          <div className={styles.titleRow}>
            <h2 className={dialogStyles.title}>Career Timeline</h2>
            <div style={{ color: "transparent", width: 10 }}>s</div>
            {entries.length > 0 && (
              <span className={styles.entryCount}>
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>
        </div>
        <button className={dialogStyles.closeBtn} onClick={() => onOpenChange(false)} aria-label="Close">
          <X style={{ width: 16, height: 16 }} />
        </button>

        <div className={styles.scrollBody}>
          {loading ? (
            <div className={styles.skeletonList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonRow}>
                  <div className={styles.skel} style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 4 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <div className={styles.skel} style={{ height: 12, width: 96 }} />
                    <div className={styles.skel} style={{ height: 20, width: 192 }} />
                    <div className={styles.skel} style={{ height: 16, width: 144 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className={styles.emptyMsg}>Upload a resume to build your timeline.</p>
          ) : (
            <div className={styles.timeline}>
              {Array.from(grouped.entries()).map(([year, yearEntries]) => (
                <div key={year} className={styles.yearGroup}>
                  <p className={styles.yearLabel}>
                    {year === "Unknown" ? "Unknown year" : year}
                  </p>
                  <div className={styles.yearEntries}>
                    {yearEntries.map((entry) => (
                      <div key={entry.id} className={styles.entry}>
                        {/* Dot */}
                        <div className={`${styles.entryDot} ${DOT_CLASS[entry.type]}`} />

                        {/* Delete button */}
                        {onDelete && editingId !== entry.id && (
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={(e) => { e.stopPropagation(); setPendingDeleteId(entry.id); }}
                            aria-label="Remove entry"
                          >
                            <X style={{ width: 12, height: 12 }} />
                          </button>
                        )}

                        {editingId === entry.id ? (
                          <div className={styles.editForm}>
                            <div className={styles.editGrid}>
                              <input className={`${styles.editInput} ${styles.editInputFull}`} placeholder="Title" value={editDraft.title ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} />
                              <input className={styles.editInput} placeholder="Organization" value={editDraft.organization ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, organization: e.target.value }))} />
                              <input className={styles.editInput} placeholder="Location (City, ST)" value={(editDraft as Record<string, unknown>).location as string ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, location: e.target.value }))} />
                              <input className={styles.editInput} placeholder="Start date" value={editDraft.startDate ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, startDate: e.target.value }))} />
                              <input className={styles.editInput} placeholder="End date (or Present)" value={editDraft.endDate ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, endDate: e.target.value }))} />
                              <select className={styles.editSelect} value={editDraft.type ?? entry.type} onChange={(e) => setEditDraft((d) => ({ ...d, type: e.target.value as TimelineEntryType }))}>
                                {ENTRY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                              </select>
                            </div>
                            <textarea className={styles.editTextarea} rows={4} placeholder="Description / bullet points" value={editDraft.description ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} />
                            <input className={styles.editInput} style={{ width: "100%" }} placeholder="Skills (comma-separated)" value={skillsRaw} onChange={(e) => setSkillsRaw(e.target.value)} />
                            <div className={styles.editBtns}>
                              <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={() => saveEdit(entry.id)}>
                                <Check style={{ width: 12, height: 12 }} /> Save
                              </button>
                              <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`${styles.readView} ${onEdit ? styles.readViewClickable : ""}`}
                            onClick={() => onEdit && startEdit(entry)}
                          >
                            <p className={`${styles.entryMeta} ${META_CLASS[entry.type]}`}>
                              {entry.endDate === undefined || entry.endDate === null ? "Present" : formatDate(entry.endDate)}
                              {" · "}{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                              {entry.startDate && ` · ${formatDate(entry.startDate)}`}
                            </p>
                            <p className={styles.entryTitle}>{entry.title}</p>
                            <p className={styles.entryOrg}>{entry.organization}{(entry as Record<string, unknown>).location ? ` · ${(entry as Record<string, unknown>).location as string}` : ""}</p>
                            {entry.type === "education" && entry.description && (() => {
                              const gpaMatch = entry.description.match(/(?:Cumulative )?GPA:\s*[\d.]+/i);
                              return gpaMatch ? <p className={styles.entryGpa}>{gpaMatch[0]}</p> : null;
                            })()}
                            {entry.skills && entry.skills.length > 0 && (
                              <div className={styles.skills}>
                                {entry.skills.map((skill) => (
                                  <span key={skill} className={`${styles.skillChip} ${CHIP_CLASS[entry.type]}`}>{skill}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {pendingDeleteId && (
        <>
          <div className={dialogStyles.overlay} onClick={() => setPendingDeleteId(null)} style={{ zIndex: 52 }} />
          <div className={dialogStyles.content} style={{ zIndex: 53 }}>
            <div className={dialogStyles.header}>
              <h2 className={dialogStyles.title}>Remove entry?</h2>
              <p className={dialogStyles.description}>
                {pendingEntry ? (
                  <>Remove <strong>{pendingEntry.title}</strong>{pendingEntry.organization ? ` at ${pendingEntry.organization}` : ""}?</>
                ) : "This cannot be undone."}
              </p>
            </div>
            <div className={dialogStyles.footer}>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`} onClick={() => setPendingDeleteId(null)}>Cancel</button>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.sm}`} onClick={handleDeleteConfirm}>Remove</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
