import type React from "react";
import styles from "./Badge.module.css";

type Variant = "accent" | "muted" | "success" | "warning" | "danger" | "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";

function resolveVariant(v: Variant): "accent" | "muted" | "success" | "warning" | "danger" {
  if (v === "default") return "accent";
  if (v === "secondary" || v === "outline" || v === "ghost" || v === "link") return "muted";
  if (v === "destructive") return "danger";
  if (v === "accent" || v === "muted" || v === "success" || v === "warning" || v === "danger") return v;
  return "accent";
}

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

function Badge({ className, variant = "accent", children, ...props }: BadgeProps) {
  const resolved = resolveVariant(variant as Variant);
  return (
    <span
      className={[styles.badge, styles[resolved], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
