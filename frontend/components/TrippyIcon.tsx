"use client";
/* eslint-disable @next/next/no-img-element */
import { useAgentIdentity } from "@/lib/agentIdentity";

const SIZE_MAP: Record<string, number> = {
  "h-3 w-3": 12, "h-3.5 w-3.5": 14, "h-4 w-4": 16,
  "h-5 w-5": 20, "h-6 w-6": 24, "h-8 w-8": 32,
  "h-10 w-10": 40, "h-12 w-12": 48,
};

type Props = Readonly<{ size?: number; sizeClass?: string; className?: string }>;

export function TrippyIcon({ size, sizeClass, className = "" }: Props) {
  const { name, icon } = useAgentIdentity();
  const px = size ?? (sizeClass ? (SIZE_MAP[sizeClass] ?? 40) : 40);

  return (
    <img
      src={icon ?? "/trippy-transparent.png"}
      alt={name}
      style={{ width: px, height: px, borderRadius: 4, flexShrink: 0 }}
      className={className}
    />
  );
}
