import { NextRequest } from "next/server";

const PROXY_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${PROXY_URL}/agent/career/find-people`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: req.headers.get("cookie") ?? "", "x-user-email": req.headers.get("x-user-email") ?? "" },
    body,
  });
  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return Response.json({ error: "jobId required" }, { status: 400 });
  const upstream = await fetch(`${PROXY_URL}/agent/career/find-people/status/${jobId}`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}
