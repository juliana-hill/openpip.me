"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Home, Building2, User, MapPin, ArrowRight, X } from "lucide-react";
import { idbListAddresses, type SavedAddress } from "@/lib/idb";
import type { AddressChip } from "@/components/chat/ContextChip";
import styles from "./SavedAddressPickerSheet.module.css";

function iconForLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("home") || lower.includes("house")) return Home;
  if (lower.includes("office") || lower.includes("work") || lower.includes("hq")) return Building2;
  if (lower.includes("'s") || lower.includes("place") || lower.includes("mom") || lower.includes("dad") || lower.includes("cameron")) return User;
  return MapPin;
}

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  onConfirm: (addresses: AddressChip[]) => void;
}>;

export function SavedAddressPickerSheet({ open, onClose, onConfirm }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    setQuery("");
    setLoading(true);
    idbListAddresses().then(setAddresses).finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return addresses;
    const q = query.toLowerCase();
    return addresses.filter((a) => a.label.toLowerCase().includes(q) || a.address.toLowerCase().includes(q));
  }, [addresses, query]);

  function toggle(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function handleConfirm() {
    const selected = addresses.filter((a) => selectedIds.has(a.id)).map<AddressChip>((a) => ({ kind: "address", id: a.id, label: a.label, address: a.address }));
    onConfirm(selected);
    onClose();
  }

  if (!open) return null;

  const count = selectedIds.size;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Saved Address</h2>
          <button type="button" aria-label="Close" onClick={onClose} className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.searchRow}>
          <Search size={15} className={styles.searchIcon} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search addresses…" className={styles.searchInput} />
        </div>

        <div className={styles.list}>
          {loading ? (
            <>{[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}</>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>{addresses.length === 0 ? "No saved addresses yet" : "No addresses match your search"}</p>
          ) : (
            filtered.map((addr) => {
              const checked = selectedIds.has(addr.id);
              const Icon = iconForLabel(addr.label);
              return (
                <label key={addr.id} className={`${styles.addrRow} ${checked ? styles.addrRowChecked : ""}`}>
                  <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}>{checked ? "✓" : ""}</span>
                  <div className={`${styles.iconWrap} ${checked ? styles.iconWrapChecked : ""}`}>
                    <Icon size={16} />
                  </div>
                  <div className={styles.addrBody}>
                    <p className={styles.addrLabel}>{addr.label}</p>
                    <p className={styles.addrText}>{addr.address}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={handleConfirm} disabled={count === 0} className={styles.confirmBtn}>
            {count === 0 ? "Select addresses" : `Add ${count} address${count === 1 ? "" : "es"}`}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
