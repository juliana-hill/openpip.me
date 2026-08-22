"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import styles from "./CollapsibleToolCard.module.css";

type Props = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
};

export function CollapsibleToolCard({ icon, title, subtitle, defaultExpanded = false, children }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={styles.card}>
      <div
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(!expanded); }}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        <ChevronRight size={14} className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`} />
      </div>
      {expanded && <div className={styles.body}>{children}</div>}
    </div>
  );
}
