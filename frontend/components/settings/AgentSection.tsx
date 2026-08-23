"use client";
import { useState, useEffect, useRef } from "react";
import { clearAgentIcon, setAgentIcon, saveAgentIcon } from "@/lib/agentIcon";
import { proxyFetch } from "@/lib/proxy";
import { getUserData, patchUserData } from "@/lib/userData";
import { notifyAgentIdentityChanged } from "@/lib/agentIdentity";
import styles from "./AgentSection.module.css";

const DEFAULT_AGENT_NAME = "OpenPip";

export function AgentSection() {
  const [icon, setIcon] = useState<string | null>(null);
  const [agentName, setAgentName] = useState(DEFAULT_AGENT_NAME);
  const [savedName, setSavedName] = useState(DEFAULT_AGENT_NAME);
  const [nameSaving, setNameSaving] = useState(false);
  const [iconSaving, setIconSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUserData().then((data) => {
      if (typeof data.agentName === "string" && data.agentName.trim()) {
        setAgentName(data.agentName.trim());
        setSavedName(data.agentName.trim());
      }
      if (typeof data.agentIcon === "string" && data.agentIcon) {
        setIcon(data.agentIcon);
      }
    }).catch(() => {});
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await saveAgentIcon(file);
    setIconSaving(true);
    try {
      await patchUserData({ agentIcon: dataUrl });
      setAgentIcon(dataUrl);
      setIcon(dataUrl);
      notifyAgentIdentityChanged(undefined, dataUrl);
    } catch (err) {
      console.error("[AgentSection] icon save failed:", err);
    } finally {
      setIconSaving(false);
    }
  }

  async function handleClear() {
    setIconSaving(true);
    try {
      const current = await getUserData();
      delete current.agentIcon;
      const putRes = await proxyFetch("/agent/user/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });
      if (!putRes.ok) throw new Error("Clear failed");
      clearAgentIcon();
      setIcon(null);
      if (inputRef.current) inputRef.current.value = "";
      notifyAgentIdentityChanged(undefined, null);
    } catch { /* leave existing icon unchanged */ } finally {
      setIconSaving(false);
    }
  }

  async function handleSaveName() {
    const name = agentName.trim() || DEFAULT_AGENT_NAME;
    if (name !== agentName) setAgentName(name);
    setNameSaving(true);
    try {
      await patchUserData({ agentName: name });
      setSavedName(name);
      notifyAgentIdentityChanged(name);
    } catch { /* leave savedName unchanged so button stays active */ } finally {
      setNameSaving(false);
    }
  }

  const nameChanged = agentName.trim() !== savedName;

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Your Assistant</h2>

      <div className={styles.nameField}>
        <label className={styles.nameLabel}>Name</label>
        <div className={styles.nameRow}>
          <input
            className={styles.nameInput}
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder={DEFAULT_AGENT_NAME}
            maxLength={40}
            spellCheck={false}
          />
          <button
            className={styles.saveBtn}
            onClick={handleSaveName}
            disabled={nameSaving || !nameChanged}
          >
            {nameSaving ? "Saving…" : "Save"}
          </button>
        </div>
        <span className={styles.nameHint}>The name your assistant uses when referring to itself.</span>
      </div>

      <div className={styles.iconRow}>
        <div className={styles.iconPreview} onClick={() => !iconSaving && inputRef.current?.click()}>
          {icon
            ? <img src={icon} alt="Agent icon" className={styles.iconImg} />
            : <img src="/trippy-transparent.png" alt="Assistant" className={styles.iconImg} />}
          <div className={styles.iconOverlay}>{iconSaving ? "Saving…" : "Upload"}</div>
        </div>
        <div className={styles.iconActions}>
          <button className={styles.uploadBtn} onClick={() => inputRef.current?.click()} disabled={iconSaving}>
            {icon ? "Change icon" : "Upload icon"}
          </button>
          {icon && <button className={styles.clearBtn} onClick={handleClear} disabled={iconSaving}>Remove</button>}
          <p className={styles.hint}>Square image recommended. JPG, PNG, GIF, WebP.</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFile} />
    </section>
  );
}
