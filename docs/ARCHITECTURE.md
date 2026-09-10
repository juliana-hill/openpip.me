# OpenPip architecture

## Frontend source-of-truth and data rule

The travel-agent frontend and its marketing landing-page directory are copied verbatim and are the UI source of truth. Do not author a replacement frontend, navbar, view, or demo implementation. The production `frontend/` directory must never use demo data, mock data, fixtures, seeded records, or fake API responses; it renders connected provider data or an honest empty/error state only. Demo walkthroughs use a dedicated real account.

```mermaid
flowchart LR
  UI[Express + HJS Today / Review / Settings / Contacts] --> API[FastAPI web API :5501]
  API --> Store[(SQLite proposal queue\npreferences + audit events)]
  API --> Invoker[Agent invocation boundary]
  Invoker -. local development .-> Local[Strands agent in FastAPI]
  Invoker -. production option .-> Runtime[Amazon Bedrock AgentCore Runtime]
  Local --> Bedrock[Amazon Bedrock\nNova Pro]
  Runtime --> Bedrock
  Local --> Context[User working context]
  Runtime --> Context
  Local --> Providers[Provider interfaces]
  Runtime --> Providers
  Providers --> GoogleRead[Google OAuth reads\nGmail / Calendar / Tasks / Drive]
  API --> Gate[Approval-only executor]
  Gate -. approved only .-> GoogleWrite[Google writes]
  Gate -. approved only .-> Calle[CALL-E SDK / API]
  Calle -. structured result .-> API
  Chat --> ChMem[Drive channel memory]
  Scan --> ChMem
  ChMem -. matched preferences .-> Invoker
  Dashboard --> Study[One-time historical insight pipeline]
  Study --> Timeline[Drive manifest: bounded, paginated chronology]
  Study --> Memories[Drive durable insights]
  Memories -. assistant context .-> Invoker
  Deploy[OpenPip deploy credentials] -. deploys .-> Runtime
```

In local development, the Express server on `:5500` sends `/api` requests to
FastAPI and sends `/agent` requests through the OAuth session boundary on
`:4001`, which injects the signed-in token before forwarding to FastAPI on
`:5501`. Configure that boundary with `AGENT_URL=http://localhost:5501/agent`;
the legacy travel-agent service is never a valid target. Google provider reads
and Drive-backed app data remain owned by FastAPI.

The immutable system instructions define the agent’s tools and safety policy.
User-authored working context is a separate, editable input used to prioritize
work and match communication style. It cannot authorize an external action.

AgentCore Runtime is a production hosting option for the Strands agent, not a
replacement for the web API or frontend. The web API remains responsible for
sessions, Google OAuth, polling, proposals, review, and execution. In local
development, the agent runs inside FastAPI; in an AgentCore deployment, the
invocation boundary can route agent work to the AgentCore runtime instead.

Every proposed action includes a source reference. The review lifecycle is:

`pending → approved/rejected → executing → executed/failed`

The executor is approval-gated and produces external side effects only after an
explicit approval. A CALL-E request follows the same path as a Google write:
the agent proposes it, the user approves it in Review, and only then does the
executor call CALL-E through its server SDK/API and record the structured result.
CALL-E does not need AgentCore-specific plumbing; it is an outbound provider
used by the executor. Chat transcripts are persisted separately from a small,
user-visible Drive-backed channel-memory store: the assistant can remember
that a specific business uses phone, email, text, or a booking system for a
specific situation. Chat and workspace-scan agents can record explicit channel
evidence from conversation, email, calendar, tasks, or contacts. AgentCore Identity, AgentCore Memory, and EventBridge
remain optional infrastructure integrations. There are no mock providers or
fake records in the actual frontend.

The Dashboard's **Study Me** flow is an onboarding/legacy-user pipeline, not a
chat command. It runs at most once after completion. It reads a bounded five
years of retrospective email/calendar history plus a one-year forward calendar
window, collecting provider pages in 90-day windows and sorting records oldest
first. It includes Gmail, Calendar, Tasks, Contacts, Google Docs, and Google
Sheets; spreadsheet tabs are read in row pages so a large CRM is not loaded
into one prompt. The agent receives one cross-source chronological day at a
time (capped at ten records for unusually busy days), checkpoints progress
after every page, and stores durable facts in `OpenPip/memory/insights/`. Each
fact has a stable key and source evidence; later evidence updates that key
instead of creating a duplicate. Explicitly documented care-provider and
appointment facts are allowed, while diagnoses and other sensitive inferences
are not.
