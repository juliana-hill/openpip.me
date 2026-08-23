// pocket-tts-js loads onnxruntime-web with a fully dynamic import:
//
//     const ortModule = await import(`${base}ort.min.mjs`);
//
// That shape is unresolvable at build time, so a bundler cannot turn it into a
// chunk -- esbuild (and webpack) emit "the request of a dependency is an
// expression" and the call rejects at runtime instead of loading anything. The
// library is written for Vite (note the `@vite-ignore` comment), which leaves
// it alone.
//
// Rewriting it to a static import binds the runtime we actually installed, at
// the version we pinned. The worker still reads `ort.env.wasm.wasmPaths` from
// `ortBaseUrl`, which lib/speech/localSpeech.ts points at the self-hosted copy
// that scripts/copy-ort-assets.mjs writes -- so the JS glue and the .wasm
// binary always come from the same onnxruntime-web version. Mixing those
// versions is the failure this pairing exists to prevent.
//
// Ported from ../couchbumming/scripts/patch-pocket-tts.mjs (same package, same
// bug — nothing here is project-specific).
//
// Idempotent, and deliberately loud: if a pocket-tts-js upgrade changes the
// import shape, this throws rather than silently leaving the CDN import in
// place for someone to discover in the browser.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const workerPath = join(here, "..", "node_modules", "pocket-tts-js", "src", "worker.js");

const DYNAMIC_IMPORT = "    const ortModule = await import(/* @vite-ignore */ `${base}ort.min.mjs`);\n";
const STATIC_IMPORT = 'import * as ortModule from "onnxruntime-web";';
const ANCHOR = 'import { parseNpyFloat32, parseVoiceStatesBin } from "./binary.js";';

// Not an error: `npm ci --omit=dev` or a partial install can run this before the
// package exists, and the runtime image never installs at all.
if (!existsSync(workerPath)) process.exit(0);

const source = readFileSync(workerPath, "utf8");
if (source.includes(STATIC_IMPORT)) process.exit(0);

if (!source.includes(DYNAMIC_IMPORT) || !source.includes(ANCHOR)) {
  throw new Error(
    "pocket-tts-js no longer matches the runtime-import shape this patch rewrites. "
      + "Re-read node_modules/pocket-tts-js/src/worker.js and update scripts/patch-pocket-tts.mjs.",
  );
}

writeFileSync(
  workerPath,
  source.replace(ANCHOR, `${ANCHOR}\n${STATIC_IMPORT}`).replace(DYNAMIC_IMPORT, ""),
);
