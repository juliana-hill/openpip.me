# OpenPip.me — AWS "Agents for Humans" Hackathon Plan

**Repo:** new, public, MIT or Apache-2.0 licensed
**Branding to keep:** OpenPip.me — *Open Performance Improvement Plan*
**SDK:** Strands Agents SDK, deployed on Amazon Bedrock AgentCore
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
7. CALL-E calling tool — a `propose_action`-compatible tool that places a real outbound phone call (via [CALL-E](https://github.com/CALLE-AI/call-e-integrations)'s SDK/MCP) to confirm or reschedule an appointment found on the calendar, or to follow up on a task that's better resolved by voice than email. Like every other action, a call is only ever a *proposal* until approved in the Review queue — approval is what actually triggers the CALL-E call. See [§9](#9-call-e-integration-dual-hackathon-submission) for how this doubles as the CALL-E hackathon submission.

**Explicitly out of scope for the hackathon submission** (roadmap-only, mention briefly in README as "what's next"):
- Personal/leisure travel planning and broad consumer route comparison
- Career/job-search campaigns
- Executive-coaching persona and homework tracking

## 4. Architecture: old pattern → Strands/AWS equivalent

| Old (Claude Agent SDK build) | New (Strands + AgentCore) | Notes |
|---|---|---|
| `services/agent.ts` orchestrator on `@anthropic-ai/claude-agent-sdk` | Strands `Agent` with a small set of specialized tool-agents (briefing, inbox, calendar/tasks) | Strands' model-driven loop replaces the custom orchestration code directly. |
| Custom MCP servers (`mcp/task-tools.ts`, `inbox-network-tools.ts`, etc.) via `@modelcontextprotocol/sdk` | Same MCP servers, consumed through Strands' built-in `MCPClient` | [Strands ships first-class MCP support](https://strandsagents.com/1.0.x/documentation/docs/user-guide/concepts/tools/mcp-tools/), so the tool-server pattern is largely portable — rewrite the tool bodies, keep the MCP shape. |
| `services/connectors.ts` + proxy OAuth routes (custom Express session store) | AgentCore Identity OAuth2 credential provider | Removes the hand-rolled session/token store; AgentCore issues the agent its own identity and manages the Google OAuth2 token lifecycle. Strengthens Technical Implementation score. Fallback: keep a small OAuth proxy (see `OAUTH_SETUP.md`) if Identity integration is too slow to land in week 1–2. |
| `data/agent-memory-*.json`, `better-sqlite3` | AgentCore Memory for durable user/contact/preference memory; keep SQLite (or DynamoDB) only for the proposal/review queue if Memory doesn't fit that shape | AgentCore Memory replaces the flat-file "insights" store; still want a queryable proposal table. |
| `services/proposal-pipeline.ts` + `services/review-workflow.ts` | Same lifecycle, reimplemented as a Strands tool-calling loop: agent emits a `propose_action` tool call with a source reference; nothing executes until a `/review/:id/approve` endpoint calls the actual side-effecting tool | This is the single most important mechanic for both the hackathon theme and the "genuine understanding of the problem space" creativity criterion — keep it front and center in the demo. |
| `node-cron` scheduler | EventBridge Scheduler (or AgentCore Runtime's async/long-running session) triggering the Daily Briefing agent | Simple, visibly "runs in the background" for the demo. |
| Express + HJS frontend | Keep the validated Today / Review / Settings / Contacts UI shape while serving HJS views and per-view Babel outputs over HTTP | No client framework runtime, browser database, or service worker is required. |
| Observability: `claude-host.log`, ad hoc | AgentCore Observability (OTEL traces) | Nice, free demo material — show the trace of a proposal being generated and approved. |
| *(new)* | CALL-E MCP tool (`tools/calle-call.ts`) wrapping CALL-E's SDK/MCP for outbound calls | Net-new tool, not a port — gives the agent a "phone call" action alongside send-email/create-event/create-task, gated by the same proposal/review pipeline. Doubles as the CALL-E hackathon submission (see §9). |

Optional stretch (only if time remains in week 5–6): AgentCore Gateway to turn the Google API calls into governed MCP tools instead of hand-written fetch calls, and AgentCore Code Interpreter if any proposal needs computed output (e.g., cost/time math).

## 5. New repo structure

```
openpip-agent/
├── LICENSE                  # MIT or Apache-2.0, visible in GitHub "About"
├── README.md                # Problem / audience / how it works / setup / demo link
├── docs/
│   ├── PLAN.md               # this document
│   ├── OAUTH_SETUP.md         # Google OAuth + AgentCore Identity setup reference
│   └── ARCHITECTURE.md        # diagram + component descriptions
├── backend/
│   ├── agents/                # Strands Agent definitions (briefing, inbox, orchestrator)
│   ├── tools/                 # MCP tool servers (calendar, tasks, drive, gmail, proposals, calle-call)
│   ├── review/                # proposal + review-approval lifecycle
│   └── agentcore/             # AgentCore Runtime deploy config, Identity provider config
├── frontend/                  # Express + HJS app (Today, Review, Settings, Contacts)
└── infra/                     # IaC (CDK) for AgentCore Runtime + EventBridge schedule
```

Deploy the frontend + API to the existing `openpip.me` domain (swap DNS/hosting target once the new backend is live); keep the current Firebase-hosted landing page or fold it into the new frontend deploy, whichever is less work in week 5.

## 6. Six-week timeline

| Week | Milestone |
|---|---|
| 1 | Repo scaffold, license, rebranded README skeleton. Google Cloud project + OAuth consent screen (see `OAUTH_SETUP.md`). First Strands agent with one working MCP tool (Calendar read). |
| 2 | Gmail + Tasks + Drive tools online. AgentCore Identity wired for token lifecycle (or proxy fallback). SQLite/Memory schema for proposals. |
| 3 | Daily Briefing agent producing a real end-to-end summary from live data. Inbox triage agent drafting replies + creating tasks. |
| 4 | Proposal → Review → Approve → Execute loop fully wired (the core theme mechanic). Contact memory / pseudo-CRM populated from real inbox activity. |
| 5 | Frontend: Today, Review queue, Settings/Connectors, Contacts. Deploy backend to AgentCore Runtime with Observability on. Point openpip.me at the new deploy. |
| 6 | Dedicated demo account with live connected data, README + architecture diagram finalized, 5-minute demo video recorded, builder.aws.com bonus post drafted and published ("Agents for Humans" in the title), full submission checklist run. No frontend demo/mock dataset is permitted. |

## 7. Judging-criteria alignment

- **Technological Implementation:** Non-trivial multi-agent Strands build (orchestrator + specialized tool-agents), MCP tool servers, AgentCore Runtime deploy, Identity-managed OAuth, Observability traces, live demo link.
- **Design:** Deliberately narrowed to one coherent loop (scan → brief → propose → approve) instead of the old platform's sprawling skill set.
- **Potential Impact:** Concrete, demonstrable time saved for a named audience (solo professionals managing their own inbox/calendar), shown live against real (sanitized) data.
- **Creativity & Originality:** The approval-gated proposal pipeline with source-cited evidence is the genuinely non-obvious part — the agent must justify every proposal by linking to the email/event/task that triggered it.
- **Presentation:** 5-minute video: 30s problem/who/why, 3 min live walkthrough (morning briefing → inbox triage running quietly → one proposal appearing → approving it → result), 1 min architecture/Strands+AgentCore callout.

## 8. Risks / lessons carried over from the old build

- The old repo had known TypeScript build failures across the Claude runner, MCP server, task tools, inbox integration, connector storage, and career service, plus a frontend build break from an undefined `setSpeaking` reference. None of that code is being copied in — starting fresh avoids inheriting it — but keep CI (`tsc --noEmit` + a build step) green from day one so this doesn't recur.
- Google's default OAuth scopes used previously included very broad access (full `https://mail.google.com/` mail scope, full Drive read/write). A public hackathon repo requesting sensitive/restricted scopes can trigger Google's app-verification process, which takes longer than 6 weeks. Plan to request the minimum scopes needed (see `OAUTH_SETUP.md`) and stay in OAuth "Testing" mode with your own account(s) as test users for the demo — do not attempt production verification during the hackathon window.
- Never commit credentials, tokens, or real personal inbox/calendar content to the public repo. Build and demo against a sanitized/seed account.

## 9. CALL-E Integration (dual hackathon submission)

OpenPip is also being entered into the separate **CALL-E: Your Code Is Calling** hackathon ([`docs/call-e-hackathon/guidelines-rules.md`](call-e-hackathon/guidelines-rules.md)), run by AIRUDDER, deadline Sep 14 2026 — the same day as the AWS deadline. This is a second, independent Devpost submission built from the *same* underlying agent, not a fork of the product.

**Why it fits without derailing the AWS build:** the proposal/review pipeline (§4) already treats every autonomous action — send email, create event, create task — as a proposal gated behind human approval. A phone call is just one more action type in that same shape: `propose_action("call", {contact, reason, source})` → approved in Review → the approval handler invokes CALL-E instead of the Gmail/Calendar API. No architectural fork needed.

**Scope for the CALL-E track specifically:**
1. A new MCP tool, `tools/calle-call.ts`, wrapping CALL-E's SDK (or MCP server) to place one kind of call: **appointment confirmation/reschedule** — the agent notices a calendar event with an unconfirmed or ambiguous attendee response, drafts a call script (who, why, what to ask), and proposes it.
2. On approval, the tool calls CALL-E, which dials out, holds the conversation, and returns a structured result (confirmed / rescheduled to X / no answer) that OpenPip writes back as a calendar update + a Review-queue log entry.
3. Nothing here needs AgentCore-specific plumbing — CALL-E is called the same way from whichever backend runtime the AWS build lands on (Strands tool, plain function call, doesn't matter for CALL-E's judging criteria).

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
