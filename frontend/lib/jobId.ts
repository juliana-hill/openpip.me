/**
 * Derive a deterministic job ID from route search params.
 * Same query always produces the same 16-char hex ID — enables server-side dedup
 * and allows the client to reconnect to an in-progress job after navigation.
 */
export async function deriveJobId(origin: string, destination: string, date: string): Promise<string> {
  const input = `${origin}|${destination}|${date}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
