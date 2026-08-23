const path = require("node:path");
const express = require("express");
const hjs = require("hjs");

const app = express();
const port = Number(process.env.PORT || 4444);
// Keep OAuth separate from this project's API, while allowing the OAuth
// boundary to inject the signed-in Google token before forwarding /agent calls.
// Port 4000 is the travel-agent Next.js frontend, not an API. The OpenPip
// backend is the FastAPI + Strands service on port 8000. All application and
// provider requests stay on this project's backend.
// The OAuth callback/session service is the only non-Python dependency. It may
// forward authenticated /agent requests to the Python backend when
// AUTH_AGENT_UPSTREAM is configured; it must never target the legacy agent.
const authUpstream = process.env.AUTH_PROXY_URL || "http://localhost:4001";
const backendUpstream = process.env.BACKEND_URL || "http://localhost:8000";
const authAgentUpstream = process.env.AUTH_AGENT_UPSTREAM || authUpstream;

const layoutPath = path.join(__dirname, "views", "layout.hjs");
app.engine("hjs", (filePath, options, callback) => {
  hjs.__express(filePath, options, (viewError, body) => {
    if (viewError) return callback(viewError);
    hjs.__express(layoutPath, { ...options, body }, callback);
  });
});
app.set("view engine", "hjs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

async function proxy(req, res, upstream) {
  const target = new URL(req.originalUrl, upstream);
  const headers = { ...req.headers };
  delete headers.host;
  const init = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.body !== undefined && req.body !== null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      init.body = Object.keys(req.body).length ? JSON.stringify(req.body) : undefined;
      if (init.body) init.headers["content-type"] = "application/json";
    } else if (Buffer.isBuffer(req.body)) {
      init.body = req.body;
    } else if (req.readable && !req.readableEnded) {
      // Preserve multipart/form-data and other streams that Express does not
      // parse. This keeps compose, upload, and campaign features intact while
      // forwarding them to FastAPI instead of silently dropping their body.
      const chunks = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      init.body = Buffer.concat(chunks);
    }
  }
  try {
    const response = await fetch(target, init);
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-length") res.setHeader(key, value);
    });
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.status(502).json({ error: "Upstream unavailable", detail: error.message });
  }
}

async function authStatus(req) {
  try {
    const response = await fetch(new URL("/auth/me", authUpstream), {
      method: "GET",
      headers: req.headers.cookie ? { cookie: req.headers.cookie } : {},
    });
    return response.status;
  } catch {
    return 0;
  }
}

async function renderProtected(view, route, req, res) {
  const status = await authStatus(req);
  if (status === 401 || status === 403) {
    const next = `${route}${req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : ""}`;
    res.setHeader("Set-Cookie", `openpip_return=${encodeURIComponent(next)}; Path=/login; Max-Age=600; SameSite=Lax`);
    return res.redirect("/login");
  }
  return res.render(view, { view, path: route, next: "/" });
}

function readLoginReturn(req) {
  const match = req.headers.cookie?.match(/(?:^|;\s*)openpip_return=([^;]+)/);
  if (!match) return "/";
  try {
    const value = decodeURIComponent(match[1]);
    return value.startsWith("/") && !value.startsWith("//") ? value : "/";
  } catch {
    return "/";
  }
}

app.use("/auth", (req, res) => proxy(req, res, authUpstream));
// Briefings belong to this OpenPip backend. Provider reads may use the OAuth
// session only for authentication; never send the briefing request to the
// legacy travel-agent service (which can poll connectors outside this project).
app.use("/agent/briefing", (req, res) => proxy(req, res, authAgentUpstream));
// Google provider reads and Drive-backed app-data operations are application
// routes too: they must always terminate at this project's FastAPI backend.
// The configured auth boundary injects x-google-token, then forwards these
// requests to FastAPI. It must be started with AGENT_URL=http://localhost:8000/agent
// (or the equivalent Python service URL); the legacy travel-agent service is
// not a valid target.
for (const providerPath of [
  "/agent/google/tasks",
  "/agent/calendars",
  "/agent/notebook/pages",
  "/agent/drive/files",
  "/agent/inbox/messages",
  "/agent/inbox/count",
  "/agent/inbox/tags",
  "/api/google/tasks",
  "/api/google/calendars",
  "/api/google/notebook/pages",
  "/api/google/drive/files",
  "/api/google/gmail/messages",
  "/api/google/gmail/count",
]) {
  app.use(providerPath, (req, res) => proxy(req, res, authAgentUpstream));
}
// Review, chat, and provider operations use the auth boundary so Python gets
// the per-user token; the auth boundary must forward them to this backend.
app.use("/agent", (req, res) => proxy(req, res, authAgentUpstream));
app.use("/api", (req, res) => proxy(req, res, backendUpstream));

const views = {
  "/": "index",
  "/today": "today",
  "/review": "review",
  "/inbox": "inbox",
  "/calendar": "calendar",
  "/tasks": "tasks",
  "/settings": "settings",
  "/network": "network",
  "/notebook": "notebook",
  "/trips": "routes",
  "/career": "career",
  "/login": "login",
};

// Keep existing bookmarks and notifications working while making /trips the
// canonical URL for the redesigned trip-planning placeholder.
app.get("/routes", (req, res) => {
  const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  res.redirect(`/trips${query}`);
});

for (const [route, view] of Object.entries(views)) {
  app.get(route, (req, res) => {
    if (view === "login") {
      if (typeof req.query.next === "string" && req.query.next.startsWith("/") && !req.query.next.startsWith("//")) {
        res.setHeader("Set-Cookie", `openpip_return=${encodeURIComponent(req.query.next)}; Path=/login; Max-Age=600; SameSite=Lax`);
        return res.redirect("/login");
      }
      const requested = readLoginReturn(req);
      res.setHeader("Set-Cookie", "openpip_return=; Path=/login; Max-Age=0; SameSite=Lax");
      return res.render(view, { view, path: route, next: requested });
    }
    return renderProtected(view, route, req, res);
  });
}

app.use((req, res) => res.status(404).render("not-found", { view: "not-found", path: req.path }));

app.listen(port, () => {
  console.log(`OpenPip Express frontend listening on http://localhost:${port}`);
  console.log(`OpenPip backend upstream: ${backendUpstream}`);
  console.log(`OAuth session upstream (auth + token boundary): ${authUpstream}`);
});
