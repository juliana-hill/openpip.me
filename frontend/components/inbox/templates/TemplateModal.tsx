"use client";
import { proxyFetch } from "@/lib/proxy";
import { useState } from "react";
import styles from "./TemplateModal.module.css";

type Template = { id?: string; name: string; subject: string; type?: string; body?: string };

type Props = {
  template?: Template;
  onClose: () => void;
  onSaved: () => void;
};

export function TemplateModal({ template, onClose, onSaved }: Props) {
  const isEdit = !!template?.id;
  const [name, setName] = useState(template?.name ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [type, setType] = useState(template?.type ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [editorMode, setEditorMode] = useState<"visual" | "code">("code");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [convertedUrl, setConvertedUrl] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { name: name.trim(), subject: subject.trim(), body, type: type || undefined };
      const res = isEdit
        ? await proxyFetch(`/agent/templates/${template!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await proxyFetch("/agent/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        onSaved();
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Save failed.");
      }
    } catch {
      setError("Network error.");
    }
    setSaving(false);
  };

  const convertYoutube = () => {
    try {
      const url = new URL(youtubeUrl);
      const id = url.searchParams.get("v") ?? url.pathname.split("/").pop() ?? "";
      setConvertedUrl(`https://juliluna.com/yt/${id}`);
    } catch {
      setConvertedUrl("Invalid URL");
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? "Edit Template" : "New Template"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Subject</label>
              <input className={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <div className={styles.typeSelector}>
              {["welcome", "newsletter", "promotional", "transactional", "other"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`${styles.typeChip} ${type === opt ? styles.typeChipActive : ""}`}
                  onClick={() => setType(type === opt ? "" : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modeToggle}>
            <button className={`${styles.modeBtn} ${editorMode === "code" ? styles.modeActive : ""}`} onClick={() => setEditorMode("code")}>Code</button>
            <button className={`${styles.modeBtn} ${editorMode === "visual" ? styles.modeActive : ""}`} onClick={() => setEditorMode("visual")}>Visual</button>
          </div>

          {editorMode === "code" ? (
            <textarea
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste your HTML template here..."
              rows={14}
            />
          ) : (
            <div
              className={styles.visualEditor}
              contentEditable
              dangerouslySetInnerHTML={{ __html: body }}
              onInput={(e) => setBody((e.target as HTMLDivElement).innerHTML)}
            />
          )}

          {/* YouTube converter */}
          <div className={styles.ytCard}>
            <span className={styles.ytTitle}>YouTube → juliluna.com converter</span>
            <div className={styles.ytRow}>
              <input className={styles.input} value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              <button className={styles.ytBtn} onClick={convertYoutube}>Convert</button>
            </div>
            {convertedUrl && (
              <div className={styles.ytResult}>
                <span className={styles.ytUrl}>{convertedUrl}</span>
                <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(convertedUrl)}>Copy</button>
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          {isEdit && (
            <button className={styles.deleteBtn} onClick={async () => { await proxyFetch(`/agent/templates/${template!.id}`, { method: "DELETE" }); onSaved(); }}>
              Delete
            </button>
          )}
          {isEdit && (
            <button className={styles.duplicateBtn} onClick={async () => {
              await proxyFetch("/agent/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `Copy of ${name.trim()}`, subject, body, type: type || undefined }),
              });
              onSaved();
            }}>
              Duplicate
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
