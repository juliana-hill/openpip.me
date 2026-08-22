"use client";
import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./SidebarCard.module.css";
import { TemplateModal } from "../templates/TemplateModal";

type Template = { id: string; name: string; subject: string };

export function TemplatesCard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    proxyFetch("/agent/templates")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.templates) setTemplates(d.templates.slice(0, 3)); })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h4 className={styles.label}>Templates</h4>
            {templates.length > 0 && <span className={styles.countBadge}>{templates.length} SAVED</span>}
          </div>
          <Link href="/inbox/templates" className={styles.viewAll}>View all →</Link>
        </div>
        {templates.length > 0 && (
          <div className={styles.itemList}>
            {templates.map((t) => (
              <div key={t.id} className={styles.item}>
                <span className={styles.templateIcon}>📄</span>
                <span className={styles.itemName}>{t.name}</span>
              </div>
            ))}
          </div>
        )}
        <button className={styles.dashedBtn} onClick={() => setNewOpen(true)}>
          + New Template
        </button>
      </div>
      {newOpen && <TemplateModal onClose={() => setNewOpen(false)} onSaved={() => setNewOpen(false)} />}
    </>
  );
}
