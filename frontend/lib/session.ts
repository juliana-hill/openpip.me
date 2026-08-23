// Client-side session handling — no cookies anywhere in this project.
//
// The backend hands off its own signed session JWT via a URL fragment after
// /auth/callback (fragments never reach the server, so this never appears in
// server access logs or Referer headers). This module captures that fragment
// once, stores the JWT in sessionStorage (cleared automatically when the tab
// or browser closes — that's the actual "session" boundary), and attaches it
// as the X-OpenPip-Session header on every request via proxyFetch (see
// ./proxy.ts). The JWT itself is opaque to this code — it's never decoded
// client-side, only stored and resent verbatim. The backend is the only
// party that ever verifies it (backend/src/openpip_backend/google_oauth.py).

const SESSION_KEY = "openpip_session";
export const SESSION_HEADER = "X-OpenPip-Session";

function captureSessionFromUrlFragment(): void {
  if (typeof window === "undefined") return;
  const match = window.location.hash.match(/(?:^#|&)openpip_session=([^&]+)/);
  if (!match) return;
  try {
    sessionStorage.setItem(SESSION_KEY, decodeURIComponent(match[1]));
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — nothing more to do.
  } finally {
    // Strip the fragment immediately so the JWT never lingers in the visible
    // URL, browser history, or gets shared if the user copies the link.
    const remaining = window.location.hash.replace(/(?:^#|&)openpip_session=[^&]+/, "");
    const cleanHash = remaining === "#" ? "" : remaining;
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}${cleanHash}`);
  }
}

// Runs once, as soon as this module is first imported anywhere — guarantees
// the fragment is captured before any authenticated fetch call happens.
if (typeof window !== "undefined") {
  captureSessionFromUrlFragment();
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function sessionHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { [SESSION_HEADER]: token } : {};
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
