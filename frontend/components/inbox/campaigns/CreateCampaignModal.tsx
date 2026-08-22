"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import styles from "./CreateCampaignModal.module.css";

type Template = { id: string; name: string; subject: string };

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export function CreateCampaignModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    proxyFetch("/agent/templates")
      .then((r) => r.json())
      .then((d: { templates?: Template[] }) => setTemplates(d.templates ?? []))
      .catch(() => {});
  }, []);

  const handleFile = async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    const lines = text.trim().split("\n").filter(Boolean);
    setRecipientCount(Math.max(0, lines.length - 1));
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError("Campaign name is required."); return; }
    if (!templateId) { setError("Please select a template."); return; }
    setCreating(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("templateId", templateId);
      if (csvFile) formData.append("csv", csvFile);

      const res = await proxyFetch("/agent/campaigns", { method: "POST", body: formData });
      if (res.ok) {
        onCreated();
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "Failed to create campaign.");
      }
    } catch {
      setError("Network error.");
    }
    setCreating(false);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Create Campaign</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Campaign Name</label>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 Beta Launch" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Template <span className={styles.required}>*</span></label>
            {templates.length === 0 ? (
              <p className={styles.noTemplates}>No templates yet — <a href="/inbox/templates">create one first</a></p>
            ) : (
              <select className={styles.select} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>
                ))}
              </select>
            )}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Recipients CSV</label>
            <div
              className={styles.dropZone}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              {csvFile ? (
                <span className={styles.fileName}>{csvFile.name}</span>
              ) : (
                <span className={styles.dropHint}>Drop a CSV here or</span>
              )}
              <label className={styles.browseBtn}>
                Browse
                <input type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </label>
            </div>
            {recipientCount != null && (
              <p className={styles.recipientHint}>{recipientCount} recipient{recipientCount !== 1 ? "s" : ""} after merge & dedup</p>
            )}
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={creating}>Cancel</button>
          <button className={styles.createBtn} onClick={handleCreate} disabled={creating || !name.trim() || !templateId}>
            {creating ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </>
  );
}
