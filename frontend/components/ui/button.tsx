"use client";
import styles from "./Button.module.css";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "default" | "outline" | "destructive" | "link";
type Size = "sm" | "md" | "lg" | "default" | "xs" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

// Map old shadcn variants to new ones
function resolveVariant(v: Variant): "primary" | "secondary" | "ghost" | "danger" {
  if (v === "default") return "primary";
  if (v === "outline") return "secondary";
  if (v === "destructive") return "danger";
  if (v === "link") return "ghost";
  if (v === "primary" || v === "secondary" || v === "ghost" || v === "danger") return v;
  return "primary";
}

// Map old shadcn sizes to new ones
function resolveSize(s: Size): "sm" | "md" | "lg" {
  if (s === "default" || s === "icon" || s === "icon-sm") return "md";
  if (s === "xs" || s === "icon-xs") return "sm";
  if (s === "lg" || s === "icon-lg") return "lg";
  if (s === "sm" || s === "md" || s === "lg") return s;
  return "md";
}

export function Button({ variant = "primary", size = "md", loading, children, className, disabled, ...rest }: Props) {
  const resolvedVariant = resolveVariant(variant as Variant);
  const resolvedSize = resolveSize(size as Size);
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={[styles.btn, styles[resolvedVariant], styles[resolvedSize], className].filter(Boolean).join(" ")}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}

// Named export alias for backwards compat
export { Button as default };
