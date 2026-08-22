// Browser requests stay same-origin; Express routes /agent and /api to this
// project's FastAPI backend. Only /auth uses the separate OAuth session
// service.
// The active Express runtime is same-origin. Do not allow a deployment value
// to redirect feature calls to the legacy travel-agent service.
const PROXY_URL = "";

export function proxyFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${PROXY_URL}${path}`, { ...init, credentials: "include" });
}

export function proxyLoginUrl(redirect = "/") {
  return `${PROXY_URL}/auth/login?redirect=${encodeURIComponent(redirect)}`;
}
