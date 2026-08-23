// Copies the onnxruntime-web files the TTS worker fetches at runtime into
// public/ort/, so they are served from our own origin.
//
// pocket-tts-js defaults to jsdelivr for these. Self-hosting is not a
// preference: the patched worker imports the runtime from the pinned
// onnxruntime-web package, while `ort.env.wasm.wasmPaths` still resolves the
// .wasm binary over the network. Left on the CDN default those two are
// different versions (we pin 1.20.0; the default URL is whatever the library
// hardcodes), and mismatched glue and binary fail at session creation.
//
// Only the three files the wasm execution provider actually reaches are copied.
// The full dist is ~89 MB, most of it WebGPU and WebGL builds this never loads.
//
// Ported from ../couchbumming/scripts/copy-ort-assets.mjs, with the
// destination adjusted for this project's plain Express + esbuild layout
// (no Next.js `headers()` config — see server.js for the equivalent
// immutable-cache-control handling).
//
// The output is generated, gitignored, and rebuilt on every install and build.

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, "..", "node_modules", "onnxruntime-web", "package.json");
const from = join(here, "..", "node_modules", "onnxruntime-web", "dist");

// The version is in the served path so the files can be cached immutably (see
// server.js). The .wasm binary is 11 MB; without that, a public/ asset
// revalidates on every page load and the neural voice pays for it on every
// visit. A version bump changes the URL, so there is nothing to bust.
const version = existsSync(pkg) ? JSON.parse(readFileSync(pkg, "utf8")).version : null;
const to = version ? join(here, "..", "public", "ort", version) : null;

// The loader (ort.min.mjs) is bundled by the patched worker rather than fetched,
// but it is copied anyway: it costs 446 KB and keeps public/ort/ a complete,
// self-sufficient runtime if the patch is ever dropped.
const ASSETS = ["ort.min.mjs", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"];

if (!existsSync(from) || !to) {
  // Same reasoning as the patch script: a dev-free or partial install is not a
  // failure, and the runtime image copies public/ from the build stage.
  process.exit(0);
}

mkdirSync(to, { recursive: true });

for (const asset of ASSETS) {
  const source = join(from, asset);
  if (!existsSync(source)) {
    throw new Error(
      `onnxruntime-web/dist/${asset} is missing. The pinned version changed its dist layout; `
        + "read-aloud's natural voice cannot load without it.",
    );
  }
  const target = join(to, asset);
  // Skip unchanged files so repeated builds do not rewrite 11 MB each time.
  if (existsSync(target) && statSync(target).size === statSync(source).size) continue;
  copyFileSync(source, target);
}

// Write the version out so build-react.cjs can inject it as a build-time
// constant (ORT_VERSION) without itself needing to read node_modules — that
// keeps the client bundle's URL and this script's copy destination as the
// same single source of truth.
writeFileSync(join(here, "..", ".ort-version"), version ?? "", "utf8");
