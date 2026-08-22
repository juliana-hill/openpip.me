"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Home, Building2, User, MapPin, X } from "lucide-react";
import { idbListAddresses, type SavedAddress } from "@/lib/idb";
import styles from "./RouteAddressPickerSheet.module.css";

function iconForLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("home") || lower.includes("house")) return Home;
  if (lower.includes("office") || lower.includes("work") || lower.includes("hq")) return Building2;
  if (lower.includes("'s") || lower.includes("place") || lower.includes("mom") || lower.includes("dad") || lower.includes("cameron")) return User;
  return MapPin;
}

type Props = Readonly<{
  open: boolean;
  title: string;
  onClose: () => void;
  onSelect: (address: string) => void;
}>;

export function RouteAddressPickerSheet({ open, title, onClose, onSelect }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setLoading(true);
    idbListAddresses().then(setAddresses).finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return addresses;
    const q = query.toLowerCase();
    return addresses.filter((a) => a.label.toLowerCase().includes(q) || a.address.toLowerCase().includes(q));
  }, [addresses, query]);

  function handleSelect(addr: SavedAddress) {
    onSelect(addr.address);
    onClose();
  }

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.searchRow}>
          <Search size={15} className={styles.searchIcon} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search addresses…"
            className={styles.searchInput}
            autoFocus
          />
        </div>

        <div className={styles.list}>
          {loading ? (
            <>{[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}</>
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>
              {addresses.length === 0 ? "No saved addresses — add them in Settings" : "No addresses match your search"}
            </p>
          ) : (
            filtered.map((addr) => {
              const Icon = iconForLabel(addr.label);
              return (
                <button key={addr.id} type="button" className={styles.addrRow} onClick={() => handleSelect(addr)}>
                  <div className={styles.iconWrap}>
                    <Icon size={16} />
                  </div>
                  <div className={styles.addrBody}>
                    <p className={styles.addrLabel}>{addr.label}</p>
                    <p className={styles.addrText}>{addr.address}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
