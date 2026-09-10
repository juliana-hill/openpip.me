#!/usr/bin/env bash
set -euo pipefail

# Deploys only the fictional, static OpenPip walkthrough. It never includes
# the real product, a server, OAuth credentials, or personal account data.
SITE="openpip-demo"
PROJECT="travel-agent-cam-julie"
DIR="$(cd "$(dirname "$0")" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

FILES=(
  "index.html"
  "tokens.css"
  "app-header.css"
  "dashboard.css"
  "assets/logo.png"
  "favicon.ico"
)

source_for() {
  printf '%s' "$DIR/$1"
}

TOKEN="$(gcloud auth print-access-token --project="$PROJECT")"

VERSION_RESPONSE="$(curl -fsS -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/sites/${SITE}/versions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d '{"config":{"cleanUrls":true,"trailingSlashBehavior":"REMOVE","rewrites":[{"glob":"**","path":"/index.html"}]}}')"

VERSION_NAME="$(printf '%s' "$VERSION_RESPONSE" | jq -r '.name')"
if [ "$VERSION_NAME" = "null" ] || [ -z "$VERSION_NAME" ]; then
  printf '%s\n' "$VERSION_RESPONSE" >&2
  exit 1
fi

FILES_JSON='{}'
for file in "${FILES[@]}"; do
  source="$(source_for "$file")"
  hash="$(gzip -c "$source" | openssl dgst -sha256 | awk '{print $NF}')"
  printf '%s' "$hash" > "$TMP_DIR/$(printf '%s' "$file" | tr '/' '_').hash"
  FILES_JSON="$(printf '%s' "$FILES_JSON" | jq --arg key "/${file}" --arg value "$hash" '. + {($key): $value}')"
done

POPULATE_RESPONSE="$(curl -fsS -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/${VERSION_NAME}:populateFiles" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --argjson files "$FILES_JSON" '{files:$files}')")"

UPLOAD_URL="$(printf '%s' "$POPULATE_RESPONSE" | jq -r '.uploadUrl')"
printf '%s' "$POPULATE_RESPONSE" | jq -r '.uploadRequiredHashes[]?' > "$TMP_DIR/required-hashes"

for file in "${FILES[@]}"; do
  source="$(source_for "$file")"
  hash="$(cat "$TMP_DIR/$(printf '%s' "$file" | tr '/' '_').hash")"
  if grep -Fxq "$hash" "$TMP_DIR/required-hashes"; then
    gzip -c "$source" | curl -fsS -X POST "${UPLOAD_URL}/${hash}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "x-goog-user-project: ${PROJECT}" \
      -H "Content-Type: application/octet-stream" \
      --data-binary @- > /dev/null
  fi
done

curl -fsS -X PATCH \
  "https://firebasehosting.googleapis.com/v1beta1/${VERSION_NAME}?updateMask=status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d '{"status":"FINALIZED"}' > /dev/null

curl -fsS -X POST \
  "https://firebasehosting.googleapis.com/v1beta1/sites/${SITE}/releases?versionName=${VERSION_NAME}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT}" \
  -H "Content-Type: application/json" \
  -d '{}' > /dev/null

echo "Deployed safe static demo to https://${SITE}.web.app"
