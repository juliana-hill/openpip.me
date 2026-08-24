"use client";

import { useState, useEffect } from "react";
import { proxyFetch } from "./proxy";

const DEFAULT_NAME = "OpenPip";

// Shared state across all hook instances. No local caching of any kind —
// the Drive-backed user_settings.json document (see google_drive_store.py)
// is the only source of truth. Every page fetches it fresh on load via
// initAgentIdentity below; there is nothing seeded ahead of that fetch, so
// pages briefly show the "OpenPip" project default until it resolves.
let cachedName: string = DEFAULT_NAME;
let cachedIcon: string | null = null;
let cachedLoaded = false;
const listeners = new Set<() => void>();
let initStarted = false;

function notify() {
  for (const fn of listeners) fn();
}

function setFavicon(icon: string | null) {
  const url = icon ?? "/trippy-transparent.png";
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

/** Re-apply the cached name and favicon to the DOM. Safe to call any time after init. */
export function reapplyAgentIdentityToDOM() {
  if (typeof document === "undefined") return;
  document.title = cachedName;
  setFavicon(cachedIcon);
}

/** Push updated name/icon to all mounted hooks. Call after a confirmed successful save. */
export function notifyAgentIdentityChanged(name?: string, icon?: string | null) {
  if (name !== undefined) cachedName = name || DEFAULT_NAME;
  if (icon !== undefined) cachedIcon = icon;
  if (typeof document !== "undefined") {
    if (name !== undefined) document.title = cachedName;
    if (icon !== undefined) setFavicon(cachedIcon);
  }
  notify();
}

/** Fetch name + icon from /agent/user/data (Drive) and populate the shared cache. Triggered once per page load by useAgentIdentity below. */
export async function initAgentIdentity(): Promise<void> {
  try {
    const res = await proxyFetch("/agent/user/data");
    if (!res.ok) return;
    const data = await res.json() as Record<string, unknown>;
    if (typeof data.agentName === "string" && data.agentName.trim()) {
      cachedName = data.agentName.trim();
    }
    cachedIcon = typeof data.agentIcon === "string" && data.agentIcon ? data.agentIcon : null;
    if (typeof document !== "undefined") {
      document.title = cachedName;
      setFavicon(cachedIcon);
    }
  } catch {
    /* no custom settings found (or the request failed) — cachedName/cachedIcon
     * stay at the "OpenPip" defaults declared above, which is exactly what
     * should render once loading below goes false. */
  } finally {
    cachedLoaded = true;
    notify();
  }
}

export function useAgentIdentity() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const refresh = () => forceUpdate((n) => n + 1);
    listeners.add(refresh);
    // Every page must resolve the real name/icon from Drive itself — run at
    // most once per page load (not once per component that uses the hook).
    if (!initStarted) {
      initStarted = true;
      void initAgentIdentity();
    }
    return () => { listeners.delete(refresh); };
  }, []);

  return { name: cachedName, icon: cachedIcon, loading: !cachedLoaded };
}
