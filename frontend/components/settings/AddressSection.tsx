"use client";

import { proxyFetch } from "@/lib/proxy";
import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Home, Building2, User, Pencil, Trash2, Plus, Search, Loader2 } from "lucide-react";
import cardStyles from "@/components/ui/Card.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import inputStyles from "@/components/ui/Input.module.css";
import dialogStyles from "@/components/ui/Dialog.module.css";
import { getUserData, patchUserData, type SavedAddress } from "@/lib/userData";

function iconForLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("home") || lower.includes("house")) return Home;
  if (lower.includes("office") || lower.includes("work") || lower.includes("hq")) return Building2;
  if (lower.includes("'s") || lower.includes("place") || lower.includes("mom") || lower.includes("dad")) return User;
  return MapPin;
}

type Prediction = { description: string; placeId: string };

function useAddressAutocomplete() {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      setPredictions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      console.log("[places] Fetching autocomplete for:", query);
      try {
        const res = await proxyFetch(`/agent/places/autocomplete?input=${encodeURIComponent(query)}`);
        const data = await res.json() as { predictions: Prediction[] };
        console.log("[places] Got predictions:", data.predictions.length, data.predictions);
        setPredictions(data.predictions ?? []);
      } catch (err) {
        console.error("[places] Autocomplete fetch failed:", err);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return { query, setQuery, predictions, setPredictions, loading };
}

type AddressFormProps = Readonly<{
  initial?: { label: string; address: string };
  onSave: (label: string, address: string) => void;
  onCancel: () => void;
  saving: boolean;
}>;

function AddressForm({ initial, onSave, onCancel, saving }: AddressFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const { query, setQuery, predictions, setPredictions, loading: autocompleteLoading } = useAddressAutocomplete();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleSelectPrediction = (prediction: Prediction) => {
    console.log("[places] Selected:", prediction.description);
    setAddress(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);
  };

  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.cardContent} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Label
          </label>
          <input
            className={inputStyles.input}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Home, Office"
            autoFocus
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Address
          </label>
          <div style={{ position: "relative" }}>
            {autocompleteLoading ? (
              <Loader2 style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-muted)", animation: "spin 0.6s linear infinite" }} />
            ) : (
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--color-text-muted)" }} />
            )}
            <input
              className={inputStyles.input}
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for an address..."
              style={{ paddingLeft: 40 }}
            />
            {showSuggestions && predictions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    style={{ width: "100%", textAlign: "left", padding: "12px 16px", fontSize: "var(--font-size-sm)", background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text)", transition: "background 150ms ease" }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectPrediction(p)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <MapPin style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
          <button className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.md}`} onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.md}`}
            onClick={() => onSave(label.trim(), address.trim())}
            disabled={!label.trim() || !address.trim() || saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AddressSection() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const data = await getUserData();
    setAddresses(Array.isArray(data.addresses) ? data.addresses as SavedAddress[] : []);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const handleAdd = async (label: string, address: string) => {
    setSaving(true);
    const next = [...addresses, { id: crypto.randomUUID(), label, address }];
    await patchUserData({ addresses: next });
    setAddresses(next);
    setShowForm(false);
    setSaving(false);
  };

  const handleEdit = async (label: string, address: string) => {
    if (!editingId) return;
    setSaving(true);
    const next = addresses.map((a) => a.id === editingId ? { ...a, label, address } : a);
    await patchUserData({ addresses: next });
    setAddresses(next);
    setEditingId(null);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const next = addresses.filter((a) => a.id !== deleteTarget.id);
    await patchUserData({ addresses: next });
    setAddresses(next);
    setDeleteTarget(null);
  };

  return (
    <section style={{ position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <MapPin style={{ width: 20, height: 20, color: "var(--color-accent)" }} />
        <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text)" }}>Saved Addresses</h2>
      </div>

      {loading ? (
        <div className={cardStyles.card} style={{ padding: 0 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--color-bg)", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 16, width: 96, borderRadius: 4, background: "var(--color-bg)" }} />
                <div style={{ height: 12, width: 192, borderRadius: 4, background: "var(--color-bg)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className={cardStyles.card} style={{ border: "1px dashed var(--color-border)" }}>
          <div style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 80, height: 80, background: "var(--color-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <MapPin style={{ width: 40, height: 40, color: "var(--color-text-muted)", opacity: 0.4 }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "var(--font-size-lg)", margin: 0 }}>No saved addresses yet</h3>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", marginTop: 8, maxWidth: 240, lineHeight: 1.6 }}>
              Add your frequent locations for faster trip planning.
            </p>
          </div>
        </div>
      ) : addresses.length > 0 ? (
        <div className={cardStyles.card} style={{ padding: 0 }}>
          {addresses.map((addr, idx) => {
            if (editingId === addr.id) {
              return (
                <div key={addr.id} style={{ padding: 16, borderBottom: idx < addresses.length - 1 ? "1px solid var(--color-border)" : undefined }}>
                  <AddressForm
                    initial={{ label: addr.label, address: addr.address }}
                    onSave={handleEdit}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              );
            }
            const Icon = iconForLabel(addr.label);
            return (
              <div
                key={addr.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottom: idx < addresses.length - 1 ? "1px solid var(--color-border)" : undefined, transition: "background 150ms ease" }}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon style={{ width: 20, height: 20, color: "var(--color-accent)" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: "var(--color-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr.label}</p>
                    <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr.address}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button
                    className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`}
                    style={{ width: 32, height: 32, padding: 0 }}
                    onClick={() => setEditingId(addr.id)}
                  >
                    <Pencil style={{ width: 16, height: 16 }} />
                  </button>
                  <button
                    className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`}
                    style={{ width: 32, height: 32, padding: 0, color: "#e5383b" }}
                    onClick={() => setDeleteTarget(addr)}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {showForm ? (
        <div style={{ marginTop: 24 }}>
          <AddressForm onSave={handleAdd} onCancel={() => setShowForm(false)} saving={saving} />
        </div>
      ) : (
        <button
          className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.md}`}
          style={{ marginTop: 24, width: "100%", borderRadius: "var(--radius-lg)" }}
          onClick={() => setShowForm(true)}
        >
          <Plus style={{ width: 16, height: 16, marginRight: 8 }} />
          Add Address
        </button>
      )}

      {!!deleteTarget && (
        <>
          <div className={dialogStyles.overlay} onClick={() => setDeleteTarget(null)} />
          <div className={dialogStyles.content}>
            <div className={dialogStyles.header}>
              <h2 className={dialogStyles.title}>Delete {deleteTarget?.label}?</h2>
              <p className={dialogStyles.description}>
                This can&apos;t be undone. The address will be removed from your saved locations.
              </p>
            </div>
            <div className={dialogStyles.footer}>
              <button className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.md}`} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className={`${btnStyles.btn} ${btnStyles.danger} ${btnStyles.md}`} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
