const path = require("node:path");
const fs = require("node:fs");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const aliases = {
  "@": root,
  "next/link": path.join(root, "compat/Link.tsx"),
  "next/image": path.join(root, "compat/Image.tsx"),
  "next/navigation": path.join(root, "compat/navigation.ts"),
  "@/lib/idb": path.join(root, "compat/no-local-store.ts"),
  "@/lib/sync": path.join(root, "compat/no-sync.ts"),
  "@/lib/sw": path.join(root, "compat/no-sw.ts"),
};

const entries = Object.fromEntries([
  "index", "today", "review", "inbox", "calendar", "tasks", "settings", "network", "notebook", "routes", "career",
].map((name) => [name, path.join(root, "react-entries", `${name}.tsx`)]));

// pocket-tts-js's real Worker (`new Worker(new URL("./worker.js", import.meta.url))`)
// resolves relative to wherever the *bundled* code importing PocketTTS ends up,
// so it must be built as its own entry point named exactly "worker", landing
// at public/react/worker.js. Its own bare `onnxruntime-web` import only
// resolves after scripts/patch-pocket-tts.mjs has rewritten worker.js's
// original Vite-only dynamic import to a static one (see that script's
// comment for why the dynamic form can't be bundled at all).
const workerEntry = path.join(root, "node_modules", "pocket-tts-js", "src", "worker.js");
if (fs.existsSync(workerEntry)) {
  entries.worker = workerEntry;
}

// Written by scripts/copy-ort-assets.mjs (same postinstall step that patches
// the worker above) from the installed onnxruntime-web version, so the client
// bundle's self-hosted asset URL and that script's copy destination can never
// drift apart. Empty until the first postinstall has run.
const ortVersionPath = path.join(root, ".ort-version");
const ortVersion = fs.existsSync(ortVersionPath) ? fs.readFileSync(ortVersionPath, "utf8").trim() : "";

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
  define: {
    "process.env.NEXT_PUBLIC_PROXY_URL": "\"\"",
    "process.env.NEXT_PUBLIC_ORT_VERSION": JSON.stringify(ortVersion),
  },
  loader: { ".css": "local-css", ".svg": "file" },
  logLevel: "info",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
