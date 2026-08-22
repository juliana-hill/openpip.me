"use client";

import { proxyFetch } from "@/lib/proxy";
import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, EyeOff, Eye, ExternalLink, Pencil, Check, X } from "lucide-react";
import dialogStyles from "@/components/ui/Dialog.module.css";
import btnStyles from "@/components/ui/Button.module.css";
import styles from "./CompaniesModal.module.css";

type Company = {
  name: string;
  domain?: string;
  careersUrl?: string;
  dead?: boolean;
  score?: number;
};

type CompaniesModalProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function CompaniesModal({ open, onOpenChange }: CompaniesModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newCareersUrl, setNewCareersUrl] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await proxyFetch("/agent/career/companies");
      if (!res.ok) return;
      const data = await res.json() as { companies?: Company[] };
      setCompanies(data.companies ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const patch = async (originalName: string, updates: Partial<Company> & { name?: string }) => {
    const { name: newNameVal, ...rest } = updates;
    const body: Record<string, unknown> = { name: originalName, ...rest };
    if (newNameVal && newNameVal !== originalName) body.newName = newNameVal;

    const res = await proxyFetch("/agent/career/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json() as { company?: Company };
      if (data.company) {
        setCompanies((prev) => prev.map((c) => c.name === originalName ? { ...c, ...data.company } : c));
      }
    }
  };

  const remove = async (name: string) => {
    await proxyFetch("/agent/career/companies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCompanies((prev) => prev.filter((c) => c.name !== name));
  };

  const add = async () => {
    if (!newName.trim()) return;
    const res = await proxyFetch("/agent/career/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), domain: newDomain.trim() || undefined, careersUrl: newCareersUrl.trim() || undefined }),
    });
    if (res.ok) {
      const data = await res.json() as { company?: Company };
      if (data.company) setCompanies((prev) => [...prev, data.company!]);
    }
    setNewName(""); setNewDomain(""); setNewCareersUrl(""); setAdding(false);
  };

  const handleEditSave = async (original: Company, updates: Partial<Company>) => {
    await patch(original.name, updates);
    setEditingCompany(null);
  };

  const filtered = companies.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.domain?.toLowerCase().includes(search.toLowerCase())
  );

  const byName = (a: Company, b: Company) => a.name.localeCompare(b.name);
  const active = filtered.filter((c) => !c.dead).sort(byName);
  const skipped = filtered.filter((c) => c.dead).sort(byName);

  if (!open) return null;

  return (
    <>
      <div className={dialogStyles.overlay} onClick={() => onOpenChange(false)} />
      <div className={dialogStyles.content}>
        <div className={dialogStyles.header}>
          <h2 className={dialogStyles.title}>Companies</h2>
          <p className={styles.subCount}>
            {companies.filter((c) => !c.dead).length} active · {companies.filter((c) => c.dead).length} skipped
          </p>
        </div>
        <button className={dialogStyles.closeBtn} onClick={() => onOpenChange(false)} aria-label="Close">
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* Search + Add */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} style={{ width: 14, height: 14 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies…"
              className={styles.searchInput}
            />
          </div>
          <button
            type="button"
            className={`${btnStyles.btn} ${btnStyles.secondary} ${btnStyles.sm}`}
            onClick={() => setAdding((v) => !v)}
          >
            <Plus style={{ width: 14, height: 14 }} /> Add
          </button>
        </div>

        {/* Add form */}
        {adding && (
          <div className={styles.addFormWrap}>
            <div className={styles.formFields}>
              <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Company name" className={styles.formInput} />
              <input type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="domain.com (optional)" className={styles.formInput} />
              <input type="url" value={newCareersUrl} onChange={(e) => setNewCareersUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }} placeholder="Careers URL (optional)" className={styles.formInput} />
            </div>
            <div className={styles.formBtns}>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={add} disabled={!newName.trim()}>Add Company</button>
              <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* List */}
        <div className={styles.scrollBody}>
          {loading && (
            <div className={styles.loadingCenter}>
              <span className={styles.spinner} />
            </div>
          )}

          {!loading && active.length === 0 && skipped.length === 0 && (
            <p className={styles.empty}>No companies yet — run a job search first.</p>
          )}

          {active.map((co) => (
            <CompanyRow
              key={co.name}
              co={co}
              onEdit={() => setEditingCompany(co)}
              onToggleDead={() => patch(co.name, { dead: true })}
              onRemove={() => remove(co.name)}
            />
          ))}

          {skipped.length > 0 && (
            <>
              <p className={styles.sectionLabel}>Skipped</p>
              {skipped.map((co) => (
                <CompanyRow
                  key={co.name}
                  co={co}
                  onEdit={() => setEditingCompany(co)}
                  onToggleDead={() => patch(co.name, { dead: false })}
                  onRemove={() => remove(co.name)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onSave={(updates) => handleEditSave(editingCompany, updates)}
          onClose={() => setEditingCompany(null)}
        />
      )}
    </>
  );
}

type CompanyRowProps = {
  co: Company;
  onEdit: () => void;
  onToggleDead: () => void;
  onRemove: () => void;
};

function scoreColor(score: number): string {
  // interpolate hue 0 (red) → 120 (green) across 0–10
  const hue = Math.round((score / 10) * 120);
  return `hsl(${hue}, 72%, 40%)`;
}

function CompanyRow({ co, onEdit, onToggleDead, onRemove }: CompanyRowProps) {
  return (
    <div className={`${styles.row} ${co.dead ? styles.rowDead : ""}`}>
      <div className={styles.rowContent}>
        <div className={styles.rowNameLine}>
          <p className={`${styles.rowName} ${co.dead ? styles.rowNameDead : ""}`}>{co.name}</p>
          {co.domain && <p className={styles.rowDomain}>{co.domain}</p>}
          {co.score != null && (
            <span className={styles.scoreBadge} style={{ color: scoreColor(co.score) }}>
              {co.score}/10
            </span>
          )}
        </div>
        {co.careersUrl && (
          <div className={styles.rowCareersLink}>
            <a href={co.careersUrl} target="_blank" rel="noopener noreferrer" className={styles.rowCareersUrl}>
              {co.careersUrl}
            </a>
            <ExternalLink style={{ width: 12, height: 12, color: "var(--color-text-muted)", opacity: 0.4, flexShrink: 0 }} />
          </div>
        )}
      </div>

      <div className={styles.rowActions}>
        <button type="button" title="Edit company" onClick={onEdit} className={styles.rowBtn}>
          <Pencil style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" title={co.dead ? "Restore company" : "Skip company"} onClick={onToggleDead} className={styles.rowBtn}>
          {co.dead ? <Eye style={{ width: 14, height: 14 }} /> : <EyeOff style={{ width: 14, height: 14 }} />}
        </button>
        <button type="button" title="Remove from list" onClick={onRemove} className={`${styles.rowBtn} ${styles.rowBtnDanger}`}>
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

type EditCompanyModalProps = {
  company: Company;
  onSave: (updates: Partial<Company>) => void;
  onClose: () => void;
};

function EditCompanyModal({ company, onSave, onClose }: EditCompanyModalProps) {
  const [name, setName] = useState(company.name);
  const [domain, setDomain] = useState(company.domain ?? "");
  const [careersUrl, setCareersUrl] = useState(company.careersUrl ?? "");
  const [dead, setDead] = useState(company.dead ?? false);

  const handleSave = () => {
    const trimmedName = name.trim() || company.name;
    onSave({
      ...(trimmedName !== company.name ? { name: trimmedName } : {}),
      domain: domain.trim() || undefined,
      careersUrl: careersUrl.trim() || undefined,
      dead,
    });
  };

  return (
    <>
      <div className={dialogStyles.overlay} onClick={onClose} style={{ zIndex: 52 }} />
      <div className={dialogStyles.content} style={{ zIndex: 53 }}>
        <div className={dialogStyles.header}>
          <h2 className={dialogStyles.title}>Edit Company</h2>
        </div>
        <button className={dialogStyles.closeBtn} onClick={onClose} aria-label="Close">
          <X style={{ width: 16, height: 16 }} />
        </button>

        <div className={styles.editFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Name</label>
            <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} className={styles.fieldInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Domain</label>
            <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="domain.com" className={styles.fieldInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Careers URL</label>
            <input type="url" value={careersUrl} onChange={(e) => setCareersUrl(e.target.value)} placeholder="https://company.com/careers" className={styles.fieldInput} />
          </div>
          <div className={styles.deadRow}>
            <button
              type="button"
              onClick={() => setDead((v) => !v)}
              className={`${styles.toggleBtn} ${dead ? styles.toggleBtnActive : ""}`}
            >
              {dead ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              {dead ? "Skipped" : "Active"}
            </button>
            <p className={styles.toggleHint}>Toggle to skip this company in future job searches.</p>
          </div>
        </div>
        <div className={styles.editBtns}>
          <button type="button" className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles.sm}`} onClick={handleSave} disabled={!name.trim()}>
            <Check style={{ width: 14, height: 14 }} /> Save
          </button>
          <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${btnStyles.sm}`} onClick={onClose}>
            <X style={{ width: 14, height: 14 }} /> Cancel
          </button>
        </div>
      </div>
    </>
  );
}
