"use client";

import { useEffect, useState } from "react";
import { proxyFetch } from "./proxy";

export type AccentColor = "coral" | "blue" | "green" | "red" | "lilac";
export type ThemeMode = "light" | "dark" | "system";

let systemMediaQuery: MediaQueryList | null = null;
let systemMediaHandler: (() => void) | null = null;

// No localStorage: theme/accent are Drive-backed only (see user_settings.json
// via lib/userData.ts). views/layout.hjs applies the system light/dark
// preference and the "coral" default before this runs.
export function applyTheme(mode: ThemeMode, accent: AccentColor) {
  const root = document.documentElement;
  const isDark = mode === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : mode === "dark";
  root.setAttribute("data-theme", isDark ? "dark" : "light");
  root.setAttribute("data-accent", accent);
  root.style.colorScheme = isDark ? "dark" : "light";

  if (systemMediaQuery && systemMediaHandler) {
    systemMediaQuery.removeEventListener("change", systemMediaHandler);
    systemMediaQuery = null;
    systemMediaHandler = null;
  }
  if (mode === "system") {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const nextIsDark = media.matches;
      root.setAttribute("data-theme", nextIsDark ? "dark" : "light");
      root.style.colorScheme = nextIsDark ? "dark" : "light";
    };
    media.addEventListener("change", handler);
    systemMediaQuery = media;
    systemMediaHandler = handler;
  }
}

// Same pattern as lib/agentIdentity.ts's useAgentIdentity: a module-level
// cache (no localStorage) populated by fetching the Drive document once per
// page load, shared across every component that mounts the hook. Without
// this, only the Settings page (via AppearanceSection's own fetch) ever
// learned the saved theme/accent — every other page had nothing to apply
// them from and just sat on the system/"coral" shell default.
let cachedMode: ThemeMode = "system";
let cachedAccent: AccentColor = "coral";
const listeners = new Set<() => void>();
let themeInitStarted = false;

function notify() {
  for (const fn of listeners) fn();
}

/** Push a confirmed successful save to all mounted hooks — mirrors
 * notifyAgentIdentityChanged in lib/agentIdentity.ts. */
export function notifyThemeChanged(mode: ThemeMode, accent: AccentColor) {
  cachedMode = mode;
  cachedAccent = accent;
  applyTheme(mode, accent);
  notify();
}

export async function initThemeSync(): Promise<void> {
  try {
    const res = await proxyFetch("/agent/user/data");
    if (!res.ok) return;
    const data = await res.json() as Record<string, unknown>;
    const mode = data.theme as ThemeMode | undefined;
    const accent = data.accent as AccentColor | undefined;
    if (!mode && !accent) return;
    cachedMode = mode ?? cachedMode;
    cachedAccent = accent ?? cachedAccent;
    applyTheme(cachedMode, cachedAccent);
    notify();
  } catch {
    /* leave the system/"coral" default applied by views/layout.hjs in place */
  }
}

export function useThemeSync() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const refresh = () => forceUpdate((n) => n + 1);
    listeners.add(refresh);
    if (!themeInitStarted) {
      themeInitStarted = true;
      void initThemeSync();
    }
    return () => { listeners.delete(refresh); };
  }, []);

  return { mode: cachedMode, accent: cachedAccent };
}
