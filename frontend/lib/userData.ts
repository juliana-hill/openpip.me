import { proxyFetch } from "@/lib/proxy";

export type SavedAddress = { id: string; label: string; address: string };

/** Read the OpenPip-owned settings document backed by the user's Drive app
 * data (/agent/user/data on the backend — see google_drive_store.py). */
export async function getUserData(): Promise<Record<string, unknown>> {
  const res = await proxyFetch("/agent/user/data");
  return res.ok ? (await res.json() as Record<string, unknown>) : {};
}

/** Read-modify-write a patch into the same document. Every Settings section
 * that persists to Drive goes through this — there is no separate local
 * cache or "back up now" step, each change saves itself immediately. */
export async function patchUserData(patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const current = await getUserData();
  const body = { ...current, ...patch };
  const res = await proxyFetch("/agent/user/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return body;
}

/** Saved addresses live in the same Drive document (see AddressSection.tsx) —
 * this is the read-only accessor for pickers elsewhere in the app. */
export async function listSavedAddresses(): Promise<SavedAddress[]> {
  const data = await getUserData();
  return Array.isArray(data.addresses) ? data.addresses as SavedAddress[] : [];
}
