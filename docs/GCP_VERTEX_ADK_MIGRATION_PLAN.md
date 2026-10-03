# GCP model and agent-framework migration plan

**Status:** Plan only. No application, infrastructure, or production changes have been made.

## Goal

Move model inference off AWS Bedrock to Google's managed generative-AI platform, then decide whether to replace Strands with Google's Agent Development Kit (ADK). Reduce AWS credit use without combining two high-impact changes into one hard-to-diagnose cutover.

Google now presents Vertex AI as part of the **Gemini Enterprise Agent Platform**; the current Google Gen AI SDK is `google-genai`. This plan uses “Vertex” as shorthand for that Google-hosted model API. Confirm the exact API names and supported SDK configuration when implementation begins, since the product and SDK naming are evolving. [Platform naming](https://docs.cloud.google.com/gemini-enterprise-agent-platform/vertex-ai-name-changes) · [Google Gen AI SDK](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/sdks/overview)

## Current shape

- The backend and frontend already run on Cloud Run in GCP (`travel-agent-cam-julie`, `us-west1`). This is primarily an **inference and agent-framework migration**, not a move of the whole application from AWS to GCP.
- Both services run with min instances `0` and CPU allocated only during requests, enforced by `deploy.sh` (see "Cloud Run deployment" in the README). Any new revision, canary, or ADK slice must keep those settings; a revision created from the console or with a different `gcloud run deploy` invocation can silently flip CPU allocation to "always allocated", which bills the full instance lifetime.
- The backend's shared Strands assistant builds a Bedrock model in `backend/src/openpip_backend/agent.py`. That shared path serves multiple assistant workflows.
- Bedrock is also called directly for grounding in `agent.py` and `trip_pipeline.py`; trip planning has its own Strands/Bedrock model setup in `trip_pipeline.py`.
- Backend dependencies include `strands-agents` and `boto3` (`backend/pyproject.toml`). These cannot be removed until all Bedrock call sites and other AWS uses are accounted for.
- Google user OAuth and access to the user's Drive/Gmail/Calendar data are separate from model hosting. Moving inference must not change those integrations or their permissions.

## Recommended sequence

### 1. Inventory and migration baseline

Before editing code, enumerate every Bedrock and Strands call site, model ID, workflow, grounding path, streaming path, retry, and AWS credential reference. Capture current representative behavior, latency/error rates, usage where available, and AWS spend. Verify the target GCP project, model availability in the chosen region, quotas, billing, and current pricing—including any search-grounding charges—before choosing model IDs. Set an explicit spend ceiling and budget alerts. Do not rely on a stale price estimate. [Current pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)

**Exit:** there is a complete call-site list, a named GCP service identity, a chosen project/region, and a cost/quality baseline. No production behavior changes yet.

### 2. Move inference to Vertex while retaining Strands

Add one small provider boundary for model construction and invocation. Keep Strands and existing agent/tool flow in place for this phase. Route the shared assistant and trip-planning model through Google's supported Gen AI SDK, and replace the two direct Bedrock grounding paths with a Google-supported grounding approach. Preserve grounding/citation information where the current workflow displays or relies on it. Select model IDs only after comparing current Google availability, quality, latency, and cost against the baseline.

Use Application Default Credentials from a dedicated, least-privilege Cloud Run service account; do not place a service-account JSON key in environment variables. Google documents Cloud Run service identity as the way for code to obtain credentials for Google APIs. [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity)

Keep configuration explicit (provider, model, project, location) and avoid silently falling back to Bedrock. Retain AWS configuration only while a verified call site still needs it. Do not change Google OAuth scopes or the Drive data layout as part of this provider swap.

**Exit:** the same representative workflows complete on Google inference, tool calls and grounding remain useful, and logs/usage identify provider, model, workflow, latency, errors, and token usage without logging user content unnecessarily.

### 3. Validate the provider change in a limited rollout

Deploy a no-traffic Cloud Run revision first, then use a deliberately small canary before shifting production traffic. Compare user-visible results and operational behavior with the baseline for:

- assistant chat and its tools;
- trip planning, including grounded results/citations;
- inbox/proposal workflows that use the shared assistant;
- historical insight gathering, including a page read, question updates, evidence filenames, progress/status reporting, and a resume after interruption.

Treat these as behavior-based acceptance checks using representative workflows, not a mandate to add a broad automated test suite. Keep the existing API contracts and durable Drive artifacts intact. If the canary regresses, route traffic back to the prior Cloud Run revision and retain its configuration.

**Exit:** agreed quality and latency are acceptable, grounding works, the spend forecast is within the ceiling, and rollback has been verified.

### 4. Evaluate and incrementally adopt Google ADK

Do this only after the Google model provider is stable. First port one bounded workflow as a vertical slice; keep the production Strands path available until the slice demonstrates equivalent behavior. ADK supports Python agents and deployment to Cloud Run; initially keep it **inside the existing backend service** rather than introducing a separate agent-hosting product or service. [ADK on Cloud Run](https://docs.cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-python-adk-service)

Separate business tools from framework wrappers: make reusable application operations ordinary Python functions, then expose thin ADK tools. Map ADK runner events into the backend's existing streaming/status response instead of changing the frontend contract. Check tool schemas, async behavior, cancellation, retries, errors, streaming, and session semantics explicitly.

For the historical insight workflow, preserve its existing durable state and semantics during this port:

- the manifest remains the source of indexed dates and records;
- `building_insights.json` remains the question queue, with answers as arrays of strings and `evidence` as the relevant dated manifest filenames;
- preserve existing checkpoint/resume behavior and user-facing status messages;
- history progress is computed from the history date range/current pointer, while aggregate progress is `processed / total`; starting history resets aggregate to pending with zeroed counts as already specified.

ADK session memory must not become a second source of truth for those durable artifacts. In-memory session state must not be relied on to resume work after a Cloud Run instance stops. Preserve the agent's ability to explore indexed data; the migration is not an instruction to replace that agentic behavior with a fixed deterministic scan.

**Go/no-go:** if ADK does not preserve the required tool behavior, observable status, and restart/resume guarantees without adding operational fragility, keep Strands and complete the provider migration first. Replacing the framework is a separate decision, not a prerequisite for leaving Bedrock.

### 5. Roll out ADK by workflow, then retire AWS

After the first ADK slice is accepted, migrate other Strands workflows one at a time, each behind a Cloud Run revision/configuration boundary with a rollback path. Do not switch the historical pipeline's history and aggregation behavior in the same release as the framework change.

Remove AWS only after production evidence shows that no Bedrock calls remain for an agreed observation window. Then remove unused AWS secrets/environment variables, Bedrock-specific code, and dependencies only if no other feature uses them. Verify AWS usage/billing has stopped and GCP costs remain within the agreed budget. Keep the last known-good Cloud Run revisions until the migration is accepted.

## Operational and data safeguards

- Use Cloud Run revisions and gradual traffic movement; avoid an all-at-once cutover.
- Attribute model usage to workflow/run and stage so an unexpectedly expensive or stuck stage can be isolated. Bound retries and output size; set provider timeouts and visible failure status.
- Review Google's current data-use, retention, abuse-monitoring, and regional processing terms for the selected model before sending user data. Do not describe the service as zero-retention without verifying the exact product configuration and applicable terms. [Data retention guidance](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention)
- Keep user-data OAuth permissions and existing Drive artifacts unchanged unless separately approved.
- Preserve the previous Cloud Run revision and provider configuration until post-cutover behavior and spend are confirmed.
- After each rollout, confirm `run.googleapis.com/cpu-throttling` is still `'true'` and `minScale` is absent or `'0'` on the serving revision, and check billable container instance time in Cloud Run metrics. Vertex model spend and Cloud Run instance spend are separate line items; a jump in either should block further traffic shifts.

## Decisions needed when implementation starts

1. Target GCP project and model-serving region (confirm that the required models and grounding features are available there).
2. Model choice per workflow, based on current quality, latency, quota, and cost—not a single assumed model for every agent.
3. The spend ceiling and canary scope.
4. Whether ADK's operational value justifies a framework migration after the provider move; recommendation: decide from the first vertical slice, not in advance.

## Completion criteria

The migration is complete only when production workflows use the approved Google model configuration, insight evidence/status/resume behavior is preserved, no Bedrock traffic remains, spend is within the agreed ceiling, and rollback or recovery remains available. The ADK portion is complete only if it separately meets those behavior and operational criteria; otherwise the supported end state may be Google inference with Strands retained.
