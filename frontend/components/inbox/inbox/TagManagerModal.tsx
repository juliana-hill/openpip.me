"use client";
import { useState } from "react";
import { proxyFetch } from "@/lib/proxy";
import type { Tag } from "./InboxTab";
import styles from "./TagManagerModal.module.css";

const PRESET_COLORS = [
  "#f47560", "#45dfa4", "#1877f2", "#9b72cf",
  "#efbab0", "#6b9e6b", "#e5383b", "#f4a261",
];

type Props = {
  tags: Tag[];
  onClose: (updatedTags: Tag[]) => void;
};

export function TagManagerModal({ tags: initialTags, onClose }: Props) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await proxyFetch("/agent/inbox/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      const tag = await res.json() as Tag;
      setTags((prev) => [...prev, tag]);
      setNewName(""); setNewColor(PRESET_COLORS[0]);
    } catch { setError("Failed to create tag"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (tag: Tag, name: string, color: string) => {
    setSaving(true); setError("");
    try {
      const res = await proxyFetch(`/agent/inbox/tags/${tag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      const updated = await res.json() as Tag;
      setTags((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      setEditingId(null);
    } catch { setError("Failed to update tag"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setSaving(true); setError("");
    try {
      const res = await proxyFetch(`/agent/inbox/tags/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch { setError("Failed to delete tag"); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay} onClick={() => onClose(tags)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Manage Tags</h3>
          <button className={styles.closeBtn} onClick={() => onClose(tags)}>×</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <ul className={styles.list}>
          {tags.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              editing={editingId === tag.id}
              presetColors={PRESET_COLORS}
              onEdit={() => setEditingId(tag.id)}
              onSave={(name, color) => handleUpdate(tag, name, color)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(tag.id)}
              disabled={saving}
            />
          ))}
          {tags.length === 0 && (
            <li className={styles.empty}>No tags yet — create one below.</li>
          )}
        </ul>

        <div className={styles.create}>
          <input
            className={styles.input}
            placeholder="New tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={saving}
          />
          <div className={styles.swatches}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`${styles.swatch} ${newColor === c ? styles.swatchActive : ""}`}
                style={{ background: c }}
                onClick={() => setNewColor(c)}
                aria-label={c}
              />
            ))}
          </div>
          <button className={styles.createBtn} onClick={handleCreate} disabled={saving || !newName.trim()}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function TagRow({
  tag, editing, presetColors, onEdit, onSave, onCancel, onDelete, disabled,
}: {
  tag: Tag; editing: boolean; presetColors: string[];
  onEdit: () => void; onSave: (n: string, c: string) => void;
  onCancel: () => void; onDelete: () => void; disabled: boolean;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  if (editing) {
    return (
      <li className={styles.row}>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSave(name, color)}
          disabled={disabled}
          autoFocus
        />
        <div className={styles.swatches}>
          {presetColors.map((c) => (
            <button
              key={c}
              className={`${styles.swatch} ${color === c ? styles.swatchActive : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button className={styles.saveBtn} onClick={() => onSave(name, color)} disabled={disabled}>Save</button>
        <button className={styles.cancelBtn} onClick={onCancel} disabled={disabled}>Cancel</button>
      </li>
    );
  }

  return (
    <li className={styles.row}>
      <span className={styles.colorDot} style={{ background: tag.color }} />
      <span className={styles.tagName}>{tag.name}</span>
      <button className={styles.editBtn} onClick={onEdit} disabled={disabled}>Edit</button>
      <button className={styles.deleteBtn} onClick={onDelete} disabled={disabled}>Delete</button>
    </li>
  );
}
