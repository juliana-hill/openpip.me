"use client";

import { Calendar, MapPin, X } from "lucide-react";

export type EventChip = {
  kind: "event";
  id: string;
  title: string;
  start: string;
  end: string;
};

export type AddressChip = {
  kind: "address";
  id: string;
  label: string;
  address: string;
};

export type ContextChipData = EventChip | AddressChip;

type Props = Readonly<{
  chip: ContextChipData;
  onRemove: () => void;
}>;

export function ContextChip({ chip, onRemove }: Props) {
  const label =
    chip.kind === "event" ? chip.title : chip.label;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--color-accent-light)", borderRadius: 999, padding: "4px 10px", fontSize: "var(--font-size-xs)", color: "var(--color-accent)", whiteSpace: "nowrap", flexShrink: 0 }}>
      {chip.kind === "event" ? (
        <Calendar style={{ width: 12, height: 12, flexShrink: 0 }} />
      ) : (
        <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />
      )}
      <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "var(--color-accent)", marginLeft: 2, flexShrink: 0 }}
      >
        <X style={{ width: 12, height: 12 }} />
      </button>
    </span>
  );
}
