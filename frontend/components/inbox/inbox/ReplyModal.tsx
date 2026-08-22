"use client";
import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useRef } from "react";
import { BLANK_EMAIL_TEMPLATE } from "../compose/blankTemplate";
import styles from "../compose/ComposeModal.module.css";
import type { Email } from "./InboxTab";

type Props = {
  email: Email;
  onClose: () => void;
  initialBody?: string;
};

type Template = { id: string; name: string; subject: string; body: string };

function buildQuotedBlock(original: Email): string {
  const date = new Date(original.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return original.body
    ? `<blockquote style="margin:16px 0 0;padding:12px 16px;border-left:3px solid #ccc;color:#666;font-size:14px;">
        <p style="margin:0 0 8px;font-size:12px;color:#999;">
          On ${date}, ${original.from} &lt;${original.fromEmail}&gt; wrote:
        </p>
        ${original.body}
      </blockquote>`
    : `<blockquote style="margin:16px 0 0;padding:12px 16px;border-left:3px solid #ccc;color:#666;font-size:14px;">
        <p style="margin:0 0 8px;font-size:12px;color:#999;">
          On ${date}, ${original.from} &lt;${original.fromEmail}&gt; wrote:
        </p>
        <p>${original.snippet}</p>
      </blockquote>`;
}

function buildReplyBody(original: Email): string {
  return BLANK_EMAIL_TEMPLATE + "\n" + buildQuotedBlock(original);
}

function wrapInTemplate(content: string, recipientName: string): string {
  return BLANK_EMAIL_TEMPLATE
    .replace("{{name}}", recipientName)
    .replace("Thank you for reaching out!", "")
    .replace("[details in response]", content)
    .replace("Appreciate your understanding.<br>\n          <br>\n          Warmly,<br>\n          Julie", "Best,<br>\n          Julie");
}

export function ReplyModal({ email, onClose, initialBody }: Props) {
  const [name, setName] = useState(email.from);
  const [toEmail, setToEmail] = useState(email.fromEmail);
  const [subject, setSubject] = useState(`Re: ${email.subject}`);
  const [body, setBody] = useState(() => {
    if (initialBody) {
      // Wrap agent-drafted text in the HTML email template
      return wrapInTemplate(initialBody, email.from.split(" ")[0]) + "\n" + buildQuotedBlock(email);
    }
    return buildReplyBody(email);
  });
  const [mode, setMode] = useState<"custom" | "template">("custom");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    proxyFetch("/agent/templates")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { templates: Template[] } | null) => { if (d?.templates) setTemplates(d.templates); })
      .catch(() => {});
    proxyFetch("/auth/me")
      .then((r) => r.ok ? r.json() as Promise<{ email?: string }> : null)
      .then((user) => { if (user?.email) setGoogleEmail(user.email); })
      .catch(() => {});
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.querySelectorAll("a").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
    }
  }, [body]);

  const getContent = () => {
    if (mode === "template" && selectedTemplate) {
      const tpl = templates.find((t) => t.id === selectedTemplate);
      if (tpl) return { subject: tpl.subject, body: buildReplyBody({ ...email, body: tpl.body }) };
    }
    return { subject, body };
  };

  const handleSend = async () => {
    if (!toEmail.trim()) { setError("Recipient email is required."); return; }
    const content = getContent();
    if (!content.subject.trim() || !content.body.trim()) { setError("Subject and body are required."); return; }

    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("recipients", JSON.stringify([{ name, email: toEmail }]));
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
          <h2 className={styles.title}>Reply</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>{sending ? "Sending..." : "Send"}</button>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>To</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className={styles.input} style={{ flex: 1 }} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={styles.input} style={{ flex: 1 }} type="email" placeholder="email@example.com" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
            </div>
          </div>

          <div className={styles.modeToggle}>
            <button className={`${styles.modeBtn} ${mode === "custom" ? styles.modeActive : ""}`} onClick={() => setMode("custom")}>Custom</button>
            <button className={`${styles.modeBtn} ${mode === "template" ? styles.modeActive : ""}`} onClick={() => setMode("template")}>Use Template</button>
          </div>

          {mode === "template" ? (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Template</label>
              <select className={styles.input} value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                <option value="">Choose a template...</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Subject</label>
                <input className={styles.input} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Body (HTML)</label>
                <textarea className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                  Use {"{{name}}"} and {"{{email}}"} for personalization
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Preview</label>
                <div
                  ref={previewRef}
                  style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: 16, background: "var(--color-bg)", maxHeight: 300, overflowY: "auto", fontSize: "var(--font-size-sm)", lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            </>
          )}

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
          <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>{sending ? "Sending..." : "Send"}</button>
        </div>
      </div>
    </>
  );
}
