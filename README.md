# OpenPip.me

OpenPip is an approval-gated professional agent for solo professionals,
consultants, founders, and small-business owners. It produces a daily briefing
and source-cited proposals; it never sends, schedules, modifies, or calls
without an explicit human decision.

## First onboarding step: Study Me

After signing in and connecting Google, the first onboarding step is **Study
Me**. From the dashboard, you can ask OpenPip to review your existing Gmail,
Calendar, Tasks, Contacts, and Drive history so it can understand the context
that makes its help useful to you.

Study Me processes one date at a time during a fast deterministic indexing
phase. For each date it finds the current records and stores only source
metadata plus the record title in a compact, recoverable manifest; it makes no
LLM calls and does not save raw messages or documents. After the full date
range is indexed, a separate Strands agentic phase crawls that manifest and
uses read tools to fetch complete source contents as it builds a coherent,
cross-date evidence model. That phase extracts durable memories such as
preferences, routines, work history, and other documented personal context.
You can resume the review if it pauses, and the resulting memories are used by
chat, inbox triage, proposals, and the daily briefing.

## How context works

OpenPip keeps its safety policy, tool inventory, and orchestration instructions
private. In Settings, each user can edit their **working context**: priorities,
work style, standing rules, communication preferences, and what to avoid. That
context guides what OpenPip recommends and how it communicates; it can never
grant permission to take an external action.

## Local development

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest -q
uvicorn openpip_backend.app:app --reload --app-dir src
```

```bash
cd frontend
npm install
npm run dev
```

The frontend is an Express.js server using HJS view templates. It serves one
compiled browser entry per view and sends `/api` plus application requests to
the FastAPI + Strands backend on `localhost:5501`. The separate OAuth callback
proxy is used only for `/auth`; `localhost:4000` is the travel-agent frontend
and is never used as this app's API. There is no Next.js runtime, IndexedDB
cache, or service worker.

Use `.env.example` only as a names-only template. Never commit OAuth tokens,
credentials, or real workspace data.

See [the project plan](docs/PLAN.md) and [OAuth setup reference](docs/OAUTH_SETUP.md).

## Deployment decision

The connected application is planned as two Cloud Run services in the
`travel-agent-cam-julie` Google Cloud project: the Express frontend and the
FastAPI backend that hosts the Strands agent. Amazon Bedrock remains the model
provider, accessed from Cloud Run with short-lived federated credentials when
that cross-cloud connection is retained. Firebase continues to host the
marketing landing page and the static walkthrough.

We evaluated Amazon Bedrock AgentCore and decided not to use it for this
application. OpenPip's workflow is a hybrid pipeline: deterministic daily
record crawling and recovery, followed by agentic memory synthesis, all tied
to the same user's Google authorization, proposal state, and approval-gated
actions. AgentCore's separate runtime boundary is not a suitable place to
express that entire custom control flow. It would require extra token and
state handoffs, add latency, and make the pipeline less customizable. This is
an application-fit and efficiency decision, not a limitation of Google Cloud.

## Cloud Run deployment

The connected application runs as two Cloud Run services, `openpip-backend`
and `openpip-frontend`, in `travel-agent-cam-julie` (`us-west1`). Their
runtime settings are enforced by `configure_cloud_run` in `deploy.sh` on every
deploy and must not be changed in the console, because console changes are
not visible in this repository and some of them survive deploys.

| Setting | Value | Why |
| --- | --- | --- |
| CPU allocation | Only during requests (`--cpu-throttling`) | Billing stops when the request ends. "CPU always allocated" bills the whole instance lifetime, including the roughly 15 idle minutes an instance stays warm after each request. |
| Min instances | `0` | No idle instance is kept alive, so a quiet month costs nothing. |
| Max instances | `5` | Hard cost ceiling if traffic spikes or a crawler loops. |
| CPU / memory | `2` vCPU / `2Gi` | Per-instance size. Only billed while a request is running. |
| Concurrency | `80` | Requests per instance before Cloud Run scales out. |

Why this matters: in September 2026 both services were set to "CPU always
allocated" (a console-side setting the deploy script did not override) with
min instances at 0. Each service handled about 95,000 requests spread across
the day, so an instance was warm almost continuously, and Cloud Run billed
roughly 270 instance-hours for the month. That setting alone produced a bill
that is normally under a dollar. Request-based CPU allocation with min 0 is
the intended schema for every OpenPip service.

Two consequences for application code:

- Nothing may rely on CPU after the response is sent. Background work has to
  run inside a request (for example a Cloud Scheduler call to an authenticated
  endpoint) or be moved to a Cloud Run job.
- The first request after an idle period pays a cold start. That is accepted
  in exchange for scale-to-zero.

To verify the live configuration matches this table:

```sh
gcloud run services describe openpip-backend --project=travel-agent-cam-julie --region=us-west1 \
  --format="yaml(spec.template.metadata.annotations, spec.template.spec.containers[0].resources)"
```

`run.googleapis.com/cpu-throttling` must be `'true'` and
`autoscaling.knative.dev/minScale` must be absent or `'0'`.

To check how many billable instance-hours the services used this month, open
Cloud Run in the console, pick the service, and read **Billable container
instance time** on the Metrics tab. Anything above a few hours per day with
min instances at 0 means something is calling the service continuously or CPU
allocation has drifted back to "always allocated".

## Firebase deployments

The marketing site and the fictional walkthrough are deployed as separate
Firebase Hosting sites:

- `landing/deploy.sh` publishes `openpip.me` through the `openpip-landing` site.
- `demo/deploy.sh` publishes `demo.openpip.me` through the `openpip-demo` site.

Run `./deploy.sh` from the repository root to publish both sites. The demo is
static and uses fictional data only. It does not connect to Google OAuth or a
real workspace.
