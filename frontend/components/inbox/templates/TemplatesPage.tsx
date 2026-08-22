"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { TemplateModal } from "./TemplateModal";
import styles from "./TemplatesPage.module.css";
import { FloatingAssistant } from "@/components/tasks/FloatingAssistant";

type Template = { id: string; name: string; subject: string; type: string; createdAt: string; body?: string };

export function TemplatesPage({ userName, userImage }: { userName: string; userImage: string }) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await proxyFetch("/agent/templates");
      if (res.ok) {
        const d = await res.json() as { templates: Template[] };
        setTemplates(d.templates ?? []);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    await proxyFetch(`/agent/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDuplicate = async (e: React.MouseEvent, t: Template) => {
    e.stopPropagation();
    const res = await proxyFetch("/agent/templates");
    if (!res.ok) return;
    const { templates: all } = await res.json() as { templates: (Template & { body?: string })[] };
    const full = all.find((x) => x.id === t.id);
    if (!full) return;
    await proxyFetch("/agent/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Copy of ${full.name}`, subject: full.subject, body: full.body ?? "", type: full.type }),
    });
    load();
  };

  return (
    <div className={styles.shell}>
      <AppHeader userImage={userImage} userName={userName} initials={initials} pageTitle="Templates" backHref="/inbox" backLabel="Inbox" />
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Templates</h2>
        <button className={styles.newBtn} onClick={() => setNewOpen(true)}>+ New Template</button>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[0, 1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className={styles.empty}>
          <p>No templates yet.</p>
          <button className={styles.newBtn} onClick={() => setNewOpen(true)}>Create your first template</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {templates.map((t) => (
            <div key={t.id} className={styles.card} onClick={() => setEditing(t)}>
              <div className={styles.cardActions}>
                <button className={styles.editIcon} onClick={(e) => { e.stopPropagation(); setEditing(t); }} title="Edit">✏</button>
                <button className={styles.duplicateIcon} onClick={(e) => handleDuplicate(e, t)} title="Duplicate">⧉</button>
                <button className={styles.deleteIcon} onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} title="Delete">🗑</button>
              </div>
              {t.body ? (
                <div className={styles.previewWrap}>
                  <iframe
                    srcDoc={t.body}
                    className={styles.previewFrame}
                    scrolling="no"
                    sandbox="allow-same-origin"
                    title={t.name}
                  />
                </div>
              ) : (
                <div className={styles.previewEmpty} />
              )}
              <div className={styles.cardInfo}>
                <h3 className={styles.templateName}>{t.name}</h3>
                {t.subject && <p className={styles.subject}>{t.subject}</p>}
                <div className={styles.meta}>
                  {t.type && <span className={styles.typeChip}>{t.type}</span>}
                  {t.createdAt && <span className={styles.date}>{new Date(t.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {newOpen && <TemplateModal onClose={() => setNewOpen(false)} onSaved={() => { setNewOpen(false); load(); }} />}
      {editing && <TemplateModal template={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      <FloatingAssistant />
    </div>
    </div>
  );
}
