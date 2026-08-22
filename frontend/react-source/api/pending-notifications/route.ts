import { NextRequest } from "next/server";

const PROXY_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const upstream = await fetch(`${PROXY_URL}/agent/pending-notifications`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}
