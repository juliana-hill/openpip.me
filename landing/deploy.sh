#!/usr/bin/env bash
set -euo pipefail

SITE="openpip-landing"
PROJECT="travel-agent-cam-julie"
DIR="$(cd "$(dirname "$0")" && pwd)"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

FILES=(
  "index.html"
  "404.html"
  "docs/index.html"
  "open-source/index.html"
  "assets/css/main.css"
  "assets/css/tokens.css"
  "assets/js/main.js"
  "assets/js/firebase.js"
  "assets/js/consent.js"
  "assets/img/logo.png"
  "assets/img/stop-filing-in-input-forms.png"
)

echo "→ Getting access token..."
TOKEN=$(gcloud auth print-access-token --project="${PROJECT}")

echo "→ Creating new version..."
VERSION_RESP=$(curl -s -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/sites/${SITE}/versions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "cleanUrls": true,
      "trailingSlashBehavior": "REMOVE",
      "rewrites": [{ "glob": "**", "path": "/404.html" }]
    }
  }')

VERSION_NAME=$(echo "$VERSION_RESP" | jq -r '.name')
if [ "$VERSION_NAME" = "null" ] || [ -z "$VERSION_NAME" ]; then
  echo "ERROR: Failed to create version"
  echo "$VERSION_RESP" | jq .
  exit 1
fi
echo "  version: ${VERSION_NAME}"

echo "→ Hashing files..."
FILES_JSON="{}"
for f in "${FILES[@]}"; do
  HASH=$(gzip -c "${DIR}/${f}" | openssl dgst -sha256 | awk '{print $NF}')
  echo "$HASH" > "${TMP}/$(echo "$f" | tr '/' '_').hash"
  FILES_JSON=$(echo "$FILES_JSON" | jq --arg k "/${f}" --arg v "$HASH" '. + {($k): $v}')
done
FILE_MAP=$(echo '{}' | jq --argjson files "$FILES_JSON" '{files: $files}')

echo "→ Populating file manifest..."
POPULATE_RESP=$(curl -s -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/${VERSION_NAME}:populateFiles" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d "$FILE_MAP")

NEEDED=$(echo "$POPULATE_RESP" | jq -r '.uploadRequiredHashes // [] | .[]')
UPLOAD_URL=$(echo "$POPULATE_RESP" | jq -r '.uploadUrl')

echo "→ Uploading files..."
for f in "${FILES[@]}"; do
  HASH=$(cat "${TMP}/$(echo "$f" | tr '/' '_').hash")
  if echo "$NEEDED" | grep -q "$HASH"; then
    echo "  uploading /${f}..."
    gzip -c "${DIR}/${f}" | curl -s -X POST \
      "${UPLOAD_URL}/${HASH}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "x-goog-user-project: ${PROJECT}" \
      -H "Content-Type: application/octet-stream" \
      --data-binary @- > /dev/null
  else
    echo "  cached   /${f}"
  fi
done

echo "→ Finalizing version..."
FINAL_STATUS=$(curl -s -X PATCH \
  "https://firebasehosting.googleapis.com/v1beta1/${VERSION_NAME}?updateMask=status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d '{"status":"FINALIZED"}' | jq -r '.status')
echo "  status: ${FINAL_STATUS}"

echo "→ Creating release..."
RELEASE_TYPE=$(curl -s -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/sites/${SITE}/releases?versionName=${VERSION_NAME}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.type')
echo "  release: ${RELEASE_TYPE}"

echo "✓ Deployed to https://${SITE}.web.app"
