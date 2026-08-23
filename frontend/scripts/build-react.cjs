const path = require("node:path");
const fs = require("node:fs");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const aliases = {
  "@": root,
  "next/link": path.join(root, "compat/Link.tsx"),
  "next/image": path.join(root, "compat/Image.tsx"),
  "next/navigation": path.join(root, "compat/navigation.ts"),
  "pocket-tts-js": path.join(root, "compat/pocket-tts.ts"),
  "@/lib/idb": path.join(root, "compat/no-local-store.ts"),
  "@/lib/sync": path.join(root, "compat/no-sync.ts"),
  "@/lib/sw": path.join(root, "compat/no-sw.ts"),
};

const entries = Object.fromEntries([
  "index", "today", "review", "inbox", "calendar", "tasks", "settings", "network", "notebook", "routes", "career",
].map((name) => [name, path.join(root, "react-entries", `${name}.tsx`)]));

const outdir = path.join(root, "public/react");
fs.rmSync(outdir, { recursive: true, force: true });

esbuild.build({
  entryPoints: entries,
  outdir,
  entryNames: "[name]",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  // Keep the generated browser bundle self-contained; do not leak the source
  // path of the copied legacy dependency tree into production assets.
  sourcemap: false,
  legalComments: "none",
  splitting: true,
  jsx: "automatic",
  absWorkingDir: root,
  alias: aliases,
  define: { "process.env.NEXT_PUBLIC_PROXY_URL": "\"\"" },
  loader: { ".css": "local-css", ".svg": "file" },
  logLevel: "info",
}).catch(() => process.exit(1));
