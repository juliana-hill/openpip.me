"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Accent = "coral" | "blue" | "green" | "red" | "lilac";
export type Preferences = { agent_name: string; agent_icon: string | null; theme: ThemeMode; accent: Accent };

type PreferencesContextValue = Preferences & { savePreferences: (preferences: Preferences) => Promise<void>; ready: boolean };

const defaults: Preferences = { agent_name: "OpenPip", agent_icon: null, theme: "system", accent: "coral" };
const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const storageKey = "openpip-preferences";

function validPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Preferences>;
  return typeof item.agent_name === "string" && ["light", "dark", "system"].includes(item.theme ?? "") && ["coral", "blue", "green", "red", "lilac"].includes(item.accent ?? "");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);

  const applyAppearance = useCallback((next: Preferences) => {
    const root = document.documentElement;
    const resolvedTheme = next.theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : next.theme;
    root.dataset.theme = resolvedTheme;
    root.dataset.accent = next.accent;
    document.title = next.agent_name;
    let icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = next.agent_icon || "/favicon.ico";
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (validPreferences(parsed)) setPreferences(parsed);
      } catch { /* Ignore corrupted local preferences. */ }
    }
    fetch(`${apiBaseUrl}/api/settings/preferences`)
      .then(async (response) => response.ok ? response.json() as Promise<Preferences> : null)
      .then((remote) => { if (validPreferences(remote)) setPreferences(remote); })
      .catch(() => { /* The local preference copy keeps the interface responsive offline. */ })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    applyAppearance(preferences);
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = () => preferences.theme === "system" && applyAppearance(preferences);
    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, [applyAppearance, preferences]);

  const savePreferences = useCallback(async (next: Preferences) => {
    setPreferences(next);
    const response = await fetch(`${apiBaseUrl}/api/settings/preferences`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next),
    });
    if (!response.ok) throw new Error("Unable to save preferences");
    const saved = await response.json() as Preferences;
    if (validPreferences(saved)) setPreferences(saved);
  }, []);

  const value = useMemo(() => ({ ...preferences, savePreferences, ready }), [preferences, ready, savePreferences]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within ThemeProvider");
  return context;
}
