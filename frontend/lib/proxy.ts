// Browser requests stay same-origin; Express routes /agent and /api to this
// project's FastAPI backend. Only /auth uses the separate OAuth session
// service.
// The active Express runtime is same-origin. Do not allow a deployment value
// to redirect feature calls to the legacy travel-agent service.
//
// No cookies: every request attaches the session JWT (see ./session.ts) as
// the X-OpenPip-Session header instead of relying on the browser's automatic
// cookie transport.
import { clearSession, sessionHeaders } from "./session";

const PROXY_URL = "";
let loginRedirectStarted = false;

export function proxyFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${PROXY_URL}${path}`, {
    ...init,
    // Authenticated application data must never be served from a stale
    // browser response after the session has expired.
    cache: init?.cache ?? "no-store",
    headers: { ...sessionHeaders(), ...(init?.headers ?? {}) },
  }).then((response) => {
    if (response.status === 401) redirectToLogin();
    return response;
  });
}

export function proxyLoginUrl(next = "/") {
  return `${PROXY_URL}/auth/login?next=${encodeURIComponent(next)}`;
}

// server.js no longer gates protected routes server-side (it can't — no
// cookie exists for it to check). Each page bundle's own /auth/me check is
// now the only auth gate; on 401 it must send the browser to /login itself,
// carrying the current path as `next` so /auth/callback returns here after
// signing in.
export function redirectToLogin() {
  if (typeof window === "undefined" || loginRedirectStarted) return;
  loginRedirectStarted = true;
  clearSession();
  window.location.replace(proxyLoginUrl(`${window.location.pathname}${window.location.search}`));
}
