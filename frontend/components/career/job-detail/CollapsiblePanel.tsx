"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./panel.module.css";

type CollapsiblePanelProps = Readonly<{
  icon: ReactNode;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  /** Rendered between header and collapsible body (e.g. tabs row) — always visible */
  subheader?: ReactNode;
}>;

export function CollapsiblePanel({
  icon,
  title,
  actions,
  children,
  defaultCollapsed = false,
  subheader,
}: CollapsiblePanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={styles.panel}>
      <div
        className={styles.panelHeader}
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className={styles.panelTitle}>
          {icon}
          <h2 className={styles.panelHeading}>{title}</h2>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
          <ChevronDown
            size={15}
            color="var(--color-text-muted)"
            className={`${styles.chevronIcon} ${collapsed ? styles.chevronCollapsed : ""}`}
          />
        </div>
      </div>

      {subheader && !collapsed && subheader}

      <div className={`${styles.collapseWrapper} ${collapsed ? styles.collapseWrapperClosed : ""}`}>
        <div className={styles.collapseInner}>
          <div className={styles.panelBody}>{children}</div>
        </div>
      </div>
    </div>
  );
}
