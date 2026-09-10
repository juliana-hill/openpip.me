# OpenPip.me — AWS "Agents for Humans" Hackathon Plan

**Repo:** public OpenPip repository, MIT or Apache-2.0 licensed
**Branding to keep:** OpenPip.me — *Open Performance Improvement Plan*
**SDK:** Strands Agents SDK
**Deployment:** Cloud Run web services with the Strands agent running in FastAPI; Amazon Bedrock is the current model provider
**Track:** Professional Agents *(rationale below)*

## Frontend source-of-truth rule (non-negotiable)

The existing frontend and marketing landing page in the travel-agent source tree are the only UI source of truth. Copy those files verbatim; do not write a replacement frontend, navigation, view, or demo implementation. The actual `frontend/` application must never contain demo data, mock data, fixtures, seeded records, or fake API responses. All displayed application data must come from the connected backend/providers (or an explicitly empty state when no account is connected). Any demo recording uses a dedicated real account, not frontend fixtures.

---

## 1. Why Professional Agents (not Everyday or Good Neighbor)

OpenPip's existing core loop — read Gmail/Calendar/Tasks/Drive, build a daily briefing, propose actions, only surface work that needs a human decision, and gate every send/book/apply behind explicit approval — is squarely an executive-assistant product for people with a busy professional inbox and calendar. That is exactly the "makes someone dramatically better at the work they already do... repetitive, judgment-heavy tasks that eat their day" description of Professional Agents. Forcing it into Everyday Agents would undersell the professional-workload angle; Good Neighbor doesn't fit a single-user tool at all.

## 2. The pitch (for the demo video script)

- **Problem:** Knowledge workers lose hours a week to triaging inbox, re-scheduling meetings, and re-typing the same follow-ups and status updates — not because the tasks are hard, but because each one is small enough to not be worth automating on its own.
- **Who it's for:** Solo professionals, consultants, founders, and small-business owners who run their own inbox and calendar without an assistant.
- **Why it matters:** The agent should be judged by how little you have to open it, not how much. OpenPip reads your inbox, calendar, tasks, and docs in the background, drafts the resolution, and only pings you when a real decision is needed — never sends, books, or applies without your sign-off.

## 3. Scope for the 6-week build

Narrow the surface area from the old multi-skill platform (travel planning, career/job search campaigns, executive coaching) down to one coherent product loop. Judges reward "complete, coherent product experience" over feature sprawl — a tight MVP scores higher on Design than a wide, half-finished one.

**In scope (MVP):**
1. Google OAuth connection (Gmail, Calendar, Tasks, Drive) — read + limited write.
2. Daily Briefing agent — synthesizes overnight email, today's calendar, and open tasks into one morning summary.
3. Inbox triage agent — clears low-value mail automatically, drafts replies for anything that needs a response, creates tasks for action items.
4. Proposal & Review pipeline — every autonomous action becomes a proposal with cited source (the email/event/task it's based on); nothing sends/books/schedules until approved in the Review queue.
5. Minimal contact/relationship memory (lightweight CRM) built from who you actually email — powers "haven't followed up with X in 2 weeks" style proposals.
6. Business-trip planning — turns a professional travel request from email, calendar, or chat into a proposed itinerary, identifies scheduling conflicts, and prepares approval-gated coordination actions for flights, lodging, ground transportation, and meetings.
7. CALL-E calling tool — a `propose_action`-compatible tool that places a real outbound phone call (via [CALL-E](https://github.com/CALLE-AI/call-e-integrations)'s SDK/MCP) only when an appointment reschedule requires a phone call. Other events remain in their appropriate email, booking-system, or direct Calendar workflow. Like every other action, a call is only ever a *proposal* until approved in the Review queue — approval is what actually triggers the CALL-E call. See [§9](#9-call-e-integration-dual-hackathon-submission) for how this doubles as the CALL-E hackathon submission.

**Explicitly out of scope for the hackathon submission** (roadmap-only, mention briefly in README as "what's next"):
- Personal/leisure travel planning and broad consumer route comparison
- Career/job-search campaigns
- Executive-coaching persona and homework tracking

## 4. Architecture: old pattern → Strands/Cloud Run equivalent

| Old (Claude Agent SDK build) | New (Strands + Cloud Run + Bedrock) | Notes |
|---|---|---|
| `services/agent.ts` orchestrator on `@anthropic-ai/claude-agent-sdk` | Strands `Agent` with a small set of specialized tool-agents (briefing, inbox, calendar/tasks) | Strands' model-driven loop replaces the custom orchestration code directly. |
| Custom MCP servers (`mcp/task-tools.ts`, `inbox-network-tools.ts`, etc.) via `@modelcontextprotocol/sdk` | Same MCP servers, consumed through Strands' built-in `MCPClient` | [Strands ships first-class MCP support](https://strandsagents.com/1.0.x/documentation/docs/user-guide/concepts/tools/mcp-tools/), so the tool-server pattern is largely portable — rewrite the tool bodies, keep the MCP shape. |
| `services/connectors.ts` + proxy OAuth routes (custom Express session store) | FastAPI OAuth/session baseline | The current web service owns Google OAuth and session context so each agent tool call receives the correct user's authorization. |
| `data/agent-memory-*.json`, `better-sqlite3` | Drive-backed channel memory plus the one-time, paginated historical-insight pipeline | Historical facts are stored in visible Drive with stable keys, source evidence, and resumable per-page progress. |
| `services/proposal-pipeline.ts` + `services/review-workflow.ts` | Same lifecycle, reimplemented as a Strands tool-calling loop: agent emits a `propose_action` tool call with a source reference; nothing executes until a `/review/:id/approve` endpoint calls the actual side-effecting tool | This is the single most important mechanic for both the hackathon theme and the "genuine understanding of the problem space" creativity criterion — keep it front and center in the demo. |
| `node-cron` scheduler | Cloud Scheduler triggering the Daily Briefing agent through an authenticated Cloud Run endpoint | Simple, visibly "runs in the background" for the demo. |
| Express + HJS frontend | Keep the validated Today / Review / Settings / Contacts UI shape while serving HJS views and per-view Babel outputs over HTTP | No client framework runtime, browser database, or service worker is required. |
| Observability: `claude-host.log`, ad hoc | Cloud Logging and Cloud Trace for Cloud Run | Show the trace of a proposal being generated, approved, and executed. |
| *(new)* | Approval-gated CALL-E adapter (`backend/src/openpip_backend/calle.py`) plus the portable `skills/email-task-call-proposal/` skill | Reads email, tasks, and calendar signals, chooses email/booking system/phone from the evidence, and invokes CALL-E only after a call proposal is approved. Doubles as the CALL-E hackathon submission (see §9). |

AgentCore was evaluated and intentionally excluded. It is a useful runtime for
a self-contained agent, but its separate invocation and identity boundaries
are a limitation for OpenPip's fully customizable hybrid pipeline:
deterministic daily crawling and recovery, agentic memory synthesis, per-user
Google authorization, proposal/review state, and approval-gated external
actions all need to remain coordinated in one application boundary. Splitting
that flow across AgentCore would add token-context and state handoffs,
duplicate coordination, and extra latency without improving the user's
workflow. This is a product-fit decision, not a GCP limitation.

## 5. New repo structure

```
openpip-agent/
├── LICENSE                  # MIT or Apache-2.0, visible in GitHub "About"
├── README.md                # Problem / audience / how it works / setup / demo link
├── docs/
│   ├── PLAN.md               # this document
│   ├── OAUTH_SETUP.md         # Google OAuth and Cloud Run setup reference
│   └── ARCHITECTURE.md        # diagram + component descriptions
├── backend/
│   ├── agents/                # Strands Agent definitions (briefing, inbox, orchestrator)
│   ├── tools/                 # MCP tool servers (calendar, tasks, drive, gmail, proposals, calle-call)
│   ├── review/                # proposal + review-approval lifecycle
├── frontend/                  # Express + HJS app (Today, Review, Settings, Contacts)
└── infra/                     # IaC for Cloud Run, Artifact Registry, and the schedule
```

Deploy the connected application frontend and API to Cloud Run in the
`travel-agent-cam-julie` project. Keep the Firebase-hosted landing page and
`demo.openpip.me` walkthrough in place until the application cutover is
verified. AgentCore is intentionally not used. The agent remains inside the
FastAPI service so the deterministic and agentic stages share the same state
and user context.

## 6. Six-week timeline

| Week | Milestone |
|---|---|
| 1 | Repo scaffold, license, rebranded README skeleton. Google Cloud project + OAuth consent screen (see `OAUTH_SETUP.md`). First Strands agent with one working MCP tool (Calendar read). |
| 2 | Gmail + Tasks + Drive tools online. FastAPI OAuth/session path verified. SQLite/Memory schema for proposals. |
| 3 | Daily Briefing agent producing a real end-to-end summary from live data. Inbox triage agent drafting replies + creating tasks. |
| 4 | Proposal → Review → Approve → Execute loop fully wired (the core theme mechanic). Contact memory / pseudo-CRM populated from real inbox activity, plus explicit situation-specific channel memory. |
| 5 | Frontend: Today, Review queue, Settings/Connectors, Contacts. Deploy frontend and backend to Cloud Run with observability on. Run the Strands agent inside the FastAPI service and verify direct Bedrock access. |
| 6 | Dedicated demo account with live connected data, README + architecture diagram finalized, 5-minute demo video recorded, builder.aws.com bonus post drafted and published ("Agents for Humans" in the title), full submission checklist run. No frontend demo/mock dataset is permitted. |

## 7. Judging-criteria alignment

- **Technological Implementation:** Non-trivial Strands build (orchestrator + specialized tool-agents), MCP tool servers, Cloud Run deployment, direct Bedrock model access, observability traces, and a live demo link. AgentCore was considered but intentionally excluded because its runtime boundary would make this stateful, customizable pipeline less efficient.
- **Design:** Deliberately narrowed to one coherent loop (scan → brief → propose → approve) instead of the old platform's sprawling skill set.
- **Potential Impact:** Concrete, demonstrable time saved for a named audience (solo professionals managing their own inbox/calendar), shown live against real (sanitized) data.
- **Creativity & Originality:** The approval-gated proposal pipeline with source-cited evidence is the genuinely non-obvious part — the agent must justify every proposal by linking to the email/event/task that triggered it.
- **Presentation:** 5-minute video: 30s problem/who/why, 3 min live walkthrough (morning briefing → inbox triage running quietly → one proposal appearing → approving it → result), 1 min architecture and the Cloud Run + Strands + Bedrock deployment decision.

## 8. Risks / lessons carried over from the old build

- The old repo had known TypeScript build failures across the Claude runner, MCP server, task tools, inbox integration, connector storage, and career service, plus a frontend build break from an undefined `setSpeaking` reference. None of that code is being copied in — starting fresh avoids inheriting it — but keep CI (`tsc --noEmit` + a build step) green from day one so this doesn't recur.
- Google's default OAuth scopes used previously included very broad access (full `https://mail.google.com/` mail scope, full Drive read/write). A public hackathon repo requesting sensitive/restricted scopes can trigger Google's app-verification process, which takes longer than 6 weeks. Plan to request the minimum scopes needed (see `OAUTH_SETUP.md`) and stay in OAuth "Testing" mode with your own account(s) as test users for the demo — do not attempt production verification during the hackathon window.
- Never commit credentials, tokens, or real personal inbox/calendar content to the public repo. Build and demo against a sanitized/seed account.

## 9. CALL-E Integration (dual hackathon submission)

OpenPip is also being entered into the separate **CALL-E: Your Code Is Calling** hackathon ([`docs/call-e-hackathon/guidelines-rules.md`](call-e-hackathon/guidelines-rules.md)), run by AIRUDDER, deadline Sep 14 2026 — the same day as the AWS deadline. This is a second, independent Devpost submission built from the *same* underlying agent, not a fork of the product.

**Why it fits without derailing the AWS build:** the proposal/review pipeline (§4) already treats every autonomous action — send email, create event, create task — as a proposal gated behind human approval. A phone-required appointment reschedule fits that same shape: `propose_action("call", {contact, reason, source})` → approved in Review → the approval handler invokes CALL-E. Events that can be handled by email, a booking system, or direct Calendar changes stay on those channel-specific paths. No architectural fork is needed.

**Scope for the CALL-E track specifically:**
1. A reusable `email-task-call-proposal` skill reads bounded email, task, and calendar context. It chooses a phone proposal for work such as rescheduling a hair appointment when the original provider is phone-only, while preserving email or booking-system follow-up when those channels are available.
2. On approval, `backend/src/openpip_backend/calle.py` calls CALL-E and polls for a structured result (confirmed / needs reschedule / declined / no answer / unclear). The phone path is limited to appointments whose context requires a call. The approved call carries the exact existing event and proposed time; the Calendar event is updated only after a successful call confirms the change. Failed, declined, or unapproved reschedules leave it unchanged.
3. Nothing here needs AgentCore-specific plumbing — the CALL-E adapter is an outbound provider behind the approval executor and runs directly from the FastAPI service on Cloud Run.

**Submission mechanics (different from the AWS Devpost flow — easy to get wrong, read carefully):**

Unlike the AWS submission, where "your code" and "what you submit" are the same link (your own public repo), CALL-E splits these into two separate repos with two separate jobs:

| | Where the code lives | What goes on the Devpost form |
|---|---|---|
| **AWS submission** | your own repo (`openpip.me` or similar) | a link to that same repo |
| **CALL-E submission** | still your own repo, for the actual OpenPip build | a **pull request URL** into CALL-E's shared repo, `https://github.com/CALLE-AI/awesome-phone-call-agents` — *not* a link to your own repo |

Concretely: build the `calle-call` tool inside OpenPip's own codebase as normal, then separately package the reusable part (the "confirm/reschedule appointment via phone call" pattern) and open a PR adding it to `CALLE-AI/awesome-phone-call-agents`, under whichever Contribution Area their README specifies (`Agent Skills` is the likely fit — it's a reusable skill, not an app-specific integration). Follow that repo's README/contribution guide exactly for folder structure and PR format. The Devpost form's "Project submission pull request URL" field takes **that PR's URL**, not the OpenPip repo URL.

Other Devpost form fields (`call-e.devpost.com`): a ≤3-minute demo video (separate, shorter cut than the AWS 5-minute video — can share footage but needs its own edit/upload), the email tied to the CALL-E account, and optionally the live demo URL.

Uses the 20 free CALL-E calls that come with a new CALL-E account for the demo; request more via CALL-E's call-request form if needed before the deadline.

**Out of scope for CALL-E specifically:** outbound cold-call/lead-gen calling, or any call type beyond appointment confirm/reschedule — keep the CALL-E submission as narrow and clearly-scoped as the AWS one, per both hackathons' "coherent over sprawling" judging language.
