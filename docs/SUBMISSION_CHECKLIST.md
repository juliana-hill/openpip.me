# AWS "Agents for Humans" — Submission Checklist

Source of truth: [`Hackathon-Guidelines-Rules.md`](Hackathon-Guidelines-Rules.md). Devpost draft: `agentsforhumans.devpost.com` → project **OpenPip** (`.../submissions/1138215-openpip`).

**Deadline: September 14, 2026, 5:00pm PDT**

**Frontend integrity rule:** copy the existing travel-agent frontend and
marketing landing page files verbatim. Never add demo data, mock data, fixtures,
seeded records, or fake API responses to `frontend/`; the UI must use connected
backend/provider data or an explicit empty state. Use a dedicated real account
for any recorded walkthrough.

## The build itself

- [ ] Public repo created (new, MIT or Apache-2.0 license, license visible in GitHub "About" section)
- [ ] Google OAuth wired (Gmail, Calendar, Tasks, Drive) with minimal scopes, app in "Testing" mode with your own account(s) as test users
- [ ] Daily Briefing agent working end-to-end on live data from a dedicated demo account
- [ ] Inbox triage agent drafting replies + creating tasks
- [ ] Proposal → Review → Approve → Execute pipeline fully wired, with source citation on every proposal
- [ ] Contact/relationship memory populated from real inbox activity
- [x] AgentCore evaluated and intentionally not used: its separate runtime and identity boundaries would add token/state handoffs and reduce efficiency for OpenPip's customizable deterministic-plus-agentic pipeline
- [ ] README (problem / audience / how it works / setup / demo link)
- [ ] Architecture diagram
- [ ] CI green (`tsc --noEmit` + build step) — avoid the old repo's build-failure history
- [ ] Dedicated demo account verified — no personal inbox/calendar content, credentials, tokens, demo fixtures, or mock data committed

## Devpost submission form

### Deployment decision text for the project story

OpenPip runs its frontend, FastAPI API, and Strands agent on Cloud Run in the
`travel-agent-cam-julie` project. Amazon Bedrock remains the model provider.
We evaluated Amazon Bedrock AgentCore, but did not use it because its separate
runtime and identity boundaries are not a good fit for OpenPip's fully
customizable pipeline. The product combines deterministic daily crawling and
recovery with an agentic memory pass, per-user Google authorization,
proposal/review state, and approval-gated external actions. Moving only the
agent into AgentCore would require token and state handoffs, add latency, and
reduce efficiency. This was an application-fit decision, not a limitation of
GCP.

- [x] Project name — **OpenPip**
- [x] Elevator pitch
- [x] Project story (Inspiration / What it does / How we built it / Challenges)
- [x] Built-with tags
- [x] "Try it out" links (`openpip.me`, `demo.openpip.me`)
- [x] Submitter type — Individual
- [x] Country of residence — United States
- [x] Track — **Professional Agents**
- [x] Optional live demo link field — `demo.openpip.me`
- [ ] **⚠️ Verify:** "PUBLIC URL to your code repo" currently shows `https://github.com/juliana-hill/openpip.me` (auto-filled by the browser, not typed) — confirm this repo actually exists, is public, and has the MIT/Apache license visible in its About section before relying on it
- [ ] **Architecture diagram file** (required — pdf/ppt/pptx/png/jpg, max 35MB) — nothing uploaded yet
- [ ] **AWS Builder ID** (required) — needs your personal Builder ID from `profile.aws.amazon.com` (unrelated to the AWS account/IAM credentials)
- [ ] **Video demo link** (required, max 5 minutes, YouTube/Vimeo, public) — must show: (1) the project actually working, (2) the problem/audience/why-it-matters pitch
- [ ] **Submission narrative** explains the deployment decision: Cloud Run hosts the web app and Strands agent, Bedrock remains the model provider, and AgentCore was evaluated but rejected for application-fit and efficiency reasons rather than because of GCP
- [ ] Testing instructions, if the demo needs login credentials
- [ ] Final "Terms & Conditions" agreement checkbox
- [ ] **Submit** (only after everything above is real — draft can be saved and edited freely until the deadline)

## Bonus (optional, +0.6 points max)

- [ ] Publish a builder.aws.com blog post about the build journey — must include **"Agents for Humans"** in the title, must be public before the deadline (up to 3 posts, 0.2 pts each)

## Notes

- Draft submissions can be saved and edited any time before the deadline — nothing above is locked in until the final **Submit**.
- Root AWS access keys for this project were replaced with scoped IAM users (`openpip-app`, `openpip-deploy`) — see `.env.local`. Root access key itself is still active in the account; deactivating it is a separate follow-up, not a submission blocker.
