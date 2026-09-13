#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="travel-agent-cam-julie"
REGION="us-west1"
SERVICES=("openpip-backend" "openpip-frontend")

# Keep these limits explicit: Cloud Run defaults must never decide the cost
# ceiling for either application service.
CLOUD_RUN_CPU="2"
CLOUD_RUN_MEMORY="1Gi"
CLOUD_RUN_CONCURRENCY="80"
CLOUD_RUN_MIN_INSTANCES="0"
CLOUD_RUN_MAX_INSTANCES="5"

configure_cloud_run() {
  for service in "${SERVICES[@]}"; do
    gcloud run services update "$service" \
      --project="$PROJECT" \
      --region="$REGION" \
      --cpu="$CLOUD_RUN_CPU" \
      --memory="$CLOUD_RUN_MEMORY" \
      --concurrency="$CLOUD_RUN_CONCURRENCY" \
      --min="$CLOUD_RUN_MIN_INSTANCES" \
      --max="$CLOUD_RUN_MAX_INSTANCES" \
      --min-instances="$CLOUD_RUN_MIN_INSTANCES" \
      --max-instances="$CLOUD_RUN_MAX_INSTANCES"
  done
}

echo "→ Deploying landing page to openpip.me..."
(cd "$ROOT_DIR/landing" && ./deploy.sh)

echo "→ Deploying demo to demo.openpip.me..."
(cd "$ROOT_DIR/demo" && ./deploy.sh)

echo "→ Enforcing Cloud Run limits for backend and frontend..."
configure_cloud_run

echo "✓ Landing page and demo deployed."
