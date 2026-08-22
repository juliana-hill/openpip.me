import { NextRequest } from "next/server";

const PROXY_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return Response.json({ error: "jobId required" }, { status: 400 });

  const createdAt_local = req.nextUrl.searchParams.get("createdAt_local");
  const qs = createdAt_local ? `?createdAt_local=${encodeURIComponent(createdAt_local)}` : "";

  const upstream = await fetch(`${PROXY_URL}/agent/chat/status/${jobId}${qs}`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });

  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}
