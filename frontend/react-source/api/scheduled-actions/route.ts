import { NextRequest } from "next/server";

const PROXY_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const upstream = await fetch(`${PROXY_URL}/agent/scheduled-actions`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  });
  return Response.json(await upstream.json(), { status: upstream.status });
}
