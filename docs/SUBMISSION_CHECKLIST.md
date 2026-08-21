# AWS "Agents for Humans" — Submission Checklist

Source of truth: [`Hackathon-Guidelines-Rules.md`](Hackathon-Guidelines-Rules.md). Devpost draft: `agentsforhumans.devpost.com` → project **OpenPip** (`.../submissions/1138215-openpip`).

**Deadline: September 14, 2026, 5:00pm PDT**

## The build itself

- [ ] Public repo created (new, MIT or Apache-2.0 license, license visible in GitHub "About" section)
- [ ] Google OAuth wired (Gmail, Calendar, Tasks, Drive) with minimal scopes, app in "Testing" mode with your own account(s) as test users
- [ ] Daily Briefing agent working end-to-end on live (or sanitized demo) data
- [ ] Inbox triage agent drafting replies + creating tasks
- [ ] Proposal → Review → Approve → Execute pipeline fully wired, with source citation on every proposal
- [ ] Contact/relationship memory populated from real inbox activity
- [ ] Deployed to Amazon Bedrock AgentCore (strengthens Technical Implementation score; not strictly required)
- [ ] README (problem / audience / how it works / setup / demo link)
- [ ] Architecture diagram
- [ ] CI green (`tsc --noEmit` + build step) — avoid the old repo's build-failure history
- [ ] Sanitized demo dataset — no real personal inbox/calendar content, no credentials or tokens committed

## Devpost submission form

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
- [ ] Testing instructions, if the demo needs login credentials
- [ ] Final "Terms & Conditions" agreement checkbox
- [ ] **Submit** (only after everything above is real — draft can be saved and edited freely until the deadline)

## Bonus (optional, +0.6 points max)

- [ ] Publish a builder.aws.com blog post about the build journey — must include **"Agents for Humans"** in the title, must be public before the deadline (up to 3 posts, 0.2 pts each)

## Notes

- Draft submissions can be saved and edited any time before the deadline — nothing above is locked in until the final **Submit**.
- Root AWS access keys for this project were replaced with scoped IAM users (`openpip-app`, `openpip-deploy`) — see `.env.local`. Root access key itself is still active in the account; deactivating it is a separate follow-up, not a submission blocker.
