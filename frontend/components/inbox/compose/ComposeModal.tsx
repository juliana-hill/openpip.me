"use client";
import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect } from "react";
import { BLANK_EMAIL_TEMPLATE } from "./blankTemplate";
import styles from "./ComposeModal.module.css";

type Props = { onClose: () => void };
type Recipient = { name: string; email: string };
type Template = { id: string; name: string; subject: string; body: string };

export function ComposeModal({ onClose }: Props) {
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: "", email: "" }]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(BLANK_EMAIL_TEMPLATE);
  const [mode, setMode] = useState<"custom" | "template">("custom");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");

  useEffect(() => {
    proxyFetch("/agent/templates")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { templates: Template[] } | null) => { if (d?.templates) setTemplates(d.templates); })
      .catch(() => {});
    proxyFetch("/auth/me")
      .then((r) => r.ok ? r.json() as Promise<{ email?: string }> : null)
      .then((user) => { if (user?.email) setGoogleEmail(user.email); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const updateRecipient = (i: number, field: keyof Recipient, val: string) =>
    setRecipients((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addRecipient = () => setRecipients((prev) => [...prev, { name: "", email: "" }]);
  const removeRecipient = (i: number) => setRecipients((prev) => prev.filter((_, idx) => idx !== i));

  const getContent = () => {
    if (mode === "template" && selectedTemplate) {
      const tpl = templates.find((t) => t.id === selectedTemplate);
      if (tpl) return { subject: tpl.subject, body: tpl.body };
    }
    return { subject, body };
  };

  const handleSend = async () => {
    const valid = recipients.filter((r) => r.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()));
    if (!valid.length) { setError("Add at least one valid recipient."); return; }
    const content = getContent();
    if (!content.subject.trim() || !content.body.trim()) { setError("Subject and body are required."); return; }

    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("recipients", JSON.stringify(valid));
      fd.append("subject", content.subject);
      fd.append("body", content.body);
      if (googleEmail) fd.append("accountId", `google:${googleEmail}`);
      attachments.forEach((f) => fd.append("attachments", f));
      const res = await proxyFetch("/agent/compose/send", { method: "POST", body: fd });
      if (res.ok) { onClose(); return; }
      const d = await res.json() as { error?: string };
      setError(d.error ?? "Send failed.");
    } catch {
      setError("Network error.");
    }
    setSending(false);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Compose</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div className={styles.body}>
          {/* Recipients */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>To</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recipients.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className={styles.input}
                    style={{ flex: 1 }}
                    placeholder="Name"
                    value={r.name}
                    onChange={(e) => updateRecipient(i, "name", e.target.value)}
                  />
                  <input
                    className={styles.input}
                    style={{ flex: 1 }}
                    type="email"
                    placeholder="email@example.com"
                    value={r.email}
                    onChange={(e) => updateRecipient(i, "email", e.target.value)}
                  />
                  {recipients.length > 1 && (
                    <button className={styles.closeBtn} onClick={() => removeRecipient(i)} title="Remove">✕</button>
                  )}
                </div>
              ))}
              <button
                style={{ alignSelf: "flex-start", background: "none", border: "none", color: "var(--color-accent)", fontSize: "var(--font-size-xs)", fontWeight: 600, cursor: "pointer", padding: 0 }}
                onClick={addRecipient}
              >
                + Add recipient
              </button>
            </div>
          </div>

          {/* Mode toggle */}
          <div className={styles.modeToggle}>
            <button className={`${styles.modeBtn} ${mode === "custom" ? styles.modeActive : ""}`} onClick={() => setMode("custom")}>
              Custom
            </button>
            <button className={`${styles.modeBtn} ${mode === "template" ? styles.modeActive : ""}`} onClick={() => setMode("template")}>
              Use Template
            </button>
          </div>

          {mode === "template" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Template</label>
              <select
                className={styles.input}
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Choose a template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {selectedTemplate && (
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                  Subject: {templates.find((t) => t.id === selectedTemplate)?.subject}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Subject</label>
                <input
                  className={styles.input}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line (use {{name}} for personalization)"
                />
              </div>
              <div className={styles.field}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <label className={styles.fieldLabel}>Body (HTML)</label>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-accent)", cursor: "pointer", padding: 0 }}
                    onClick={() => setShowPreview((p) => !p)}
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>
                <textarea
                  className={styles.textarea}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                />
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                  Use {"{{name}}"} and {"{{email}}"} for personalization
                </p>
                {showPreview && (
                  <iframe
                    srcDoc={body}
                    sandbox="allow-same-origin"
                    title="Preview"
                    style={{ width: "100%", minHeight: 300, border: "1px solid var(--color-border)", borderRadius: 8, marginTop: 8, background: "#fff" }}
                  />
                )}
              </div>
            </>
          )}

          {/* Attachments */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Attachments</label>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", border: "2px dashed var(--color-border)", borderRadius: 12, cursor: "pointer", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)", fontWeight: 600, transition: "border-color 0.15s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              {attachments.length ? `${attachments.length} file${attachments.length === 1 ? "" : "s"} attached` : "+ Attach files"}
              <input
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
              />
            </label>
            {attachments.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {attachments.map((f, i) => (
                  <span key={i} style={{ fontSize: "var(--font-size-xs)", padding: "4px 10px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 999 }}>
                    📎 {f.name}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 4, color: "var(--color-text-muted)", fontSize: 11 }}
                    >✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={sending}>Cancel</button>
          <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}
