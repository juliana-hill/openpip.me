"use client";

import { useEffect, useRef, useState } from "react";
import type { Accent, Preferences, ThemeMode } from "@/components/theme-provider";
import { usePreferences } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const themeOptions: ThemeMode[] = ["system", "light", "dark"];
const accentOptions: Accent[] = ["coral", "blue", "green", "lilac", "red"];

async function normalizeIcon(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Unable to read icon"));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const side = Math.min(image.width, image.height);
      const sx = (image.width - side) / 2;
      const sy = (image.height - side) / 2;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Unable to prepare icon"));
      context.drawImage(image, sx, sy, side, side, 0, 0, 128, 128);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Unsupported image"));
    image.src = source;
  });
}

export function AssistantPreferencesForm() {
  const current = usePreferences();
  const [draft, setDraft] = useState<Preferences>({ agent_name: current.agent_name, agent_icon: current.agent_icon, theme: current.theme, accent: current.accent });
  const [initialized, setInitialized] = useState(false);
  const [status, setStatus] = useState<"ready" | "saving" | "saved" | "error">("ready");
  const inputRef = useRef<HTMLInputElement>(null);
  const changed = JSON.stringify(draft) !== JSON.stringify({ agent_name: current.agent_name, agent_icon: current.agent_icon, theme: current.theme, accent: current.accent });

  useEffect(() => {
    if (!current.ready || initialized) return;
    setDraft({ agent_name: current.agent_name, agent_icon: current.agent_icon, theme: current.theme, accent: current.accent });
    setInitialized(true);
  }, [current.accent, current.agent_icon, current.agent_name, current.ready, current.theme, initialized]);

  async function chooseIcon(file: File | undefined) {
    if (!file) return;
    try {
      const agentIcon = await normalizeIcon(file);
      setDraft((value) => ({ ...value, agent_icon: agentIcon }));
    } catch {
      setStatus("error");
    }
  }

  async function save() {
    setStatus("saving");
    try {
      await current.savePreferences({ ...draft, agent_name: draft.agent_name.trim() || "OpenPip" });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="appearance-card" aria-labelledby="assistant-settings-title">
      <div><p className="eyebrow">Assistant & appearance</p><h2 id="assistant-settings-title">Make OpenPip yours</h2><p className="muted">Your assistant identity and display preferences are separate from its private instructions and tools.</p></div>
      <label className="working-context-label" htmlFor="agent-name">Assistant name</label>
      <div className="identity-row">
        <button type="button" className="icon-picker" onClick={() => inputRef.current?.click()} aria-label="Choose assistant icon">
          {draft.agent_icon ? <img src={draft.agent_icon} alt="" /> : <span>OP</span>}
        </button>
        <div><Button variant="secondary" onClick={() => inputRef.current?.click()}>Upload icon</Button>{draft.agent_icon && <Button variant="ghost" onClick={() => setDraft((value) => ({ ...value, agent_icon: null }))}>Remove</Button>}<p className="muted">Square images work best. Your icon also becomes the browser favicon.</p></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void chooseIcon(event.target.files?.[0])} />
      </div>
      <input id="agent-name" className="working-context-input" value={draft.agent_name} maxLength={40} onChange={(event) => setDraft((value) => ({ ...value, agent_name: event.target.value }))} />
      <fieldset className="appearance-fieldset"><legend>Color mode</legend><div className="appearance-options">{themeOptions.map((theme) => <label className="appearance-option" key={theme}><input type="radio" name="theme" checked={draft.theme === theme} onChange={() => setDraft((value) => ({ ...value, theme }))} /><span><strong>{theme[0].toUpperCase() + theme.slice(1)}</strong><small>{theme === "system" ? "Match this device" : `Always ${theme}`}</small></span></label>)}</div></fieldset>
      <fieldset className="appearance-fieldset"><legend>Accent color</legend><div className="accent-options">{accentOptions.map((accent) => <button type="button" className={`accent-option ${draft.accent === accent ? "accent-option-selected" : ""}`} aria-pressed={draft.accent === accent} key={accent} onClick={() => setDraft((value) => ({ ...value, accent }))}><span className={`accent-swatch accent-swatch-${accent}`} aria-hidden="true" />{accent[0].toUpperCase() + accent.slice(1)}</button>)}</div></fieldset>
      <div className="working-context-footer"><p className="muted">Changes apply across OpenPip. They never change approval requirements.</p><Button onClick={save} loading={status === "saving"} disabled={!changed || status === "saving"}>Save preferences</Button></div>
      {status === "saved" && <p className="working-context-success" role="status">Preferences saved.</p>}
      {status === "error" && <p className="working-context-error" role="alert">Couldn’t save preferences. Try a different image or start the backend.</p>}
    </section>
  );
}
