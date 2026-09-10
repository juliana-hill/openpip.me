#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "→ Deploying landing page to openpip.me..."
(cd "$ROOT_DIR/landing" && ./deploy.sh)

echo "→ Deploying demo to demo.openpip.me..."
(cd "$ROOT_DIR/demo" && ./deploy.sh)

echo "✓ Landing page and demo deployed."
