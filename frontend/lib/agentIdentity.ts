"use client";

import { useState, useEffect } from "react";
import { getAgentIcon, setAgentIcon } from "./agentIcon";
import { proxyFetch } from "./proxy";

const DEFAULT_NAME = "OpenPip";

// Shared state across all hook instances
let cachedName: string = DEFAULT_NAME;
let cachedIcon: string | null = null;
const listeners = new Set<() => void>();

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

/** Fetch name + icon from /agent/user/data and populate the shared cache. Called by DataSync on login. */
export async function initAgentIdentity(): Promise<void> {
  try {
    const res = await proxyFetch("/agent/user/data");
    if (!res.ok) return;
    const data = await res.json() as Record<string, unknown>;
    if (typeof data.agentName === "string" && data.agentName.trim()) {
      cachedName = data.agentName.trim();
    }
    if (typeof data.agentIcon === "string" && data.agentIcon) {
      setAgentIcon(data.agentIcon);
      cachedIcon = data.agentIcon;
    } else {
      cachedIcon = getAgentIcon();
    }
    if (typeof document !== "undefined") {
      document.title = cachedName;
      setFavicon(cachedIcon);
    }
    notify();
  } catch {
    cachedIcon = getAgentIcon();
  }
}

export function useAgentIdentity() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const refresh = () => forceUpdate((n) => n + 1);
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, []);

  return { name: cachedName, icon: cachedIcon };
}
