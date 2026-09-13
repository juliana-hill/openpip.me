# CALL-E "Your Code Is Calling" — Submission Checklist

Source of truth: [`guidelines-rules.md`](guidelines-rules.md). Devpost draft: `call-e.devpost.com` → project **OpenPip - Open Performance Improvement Plan** (`.../submissions/1146791-openpip-open-performance-improvement-plan`).

Deployment and runtime decision: [`AWS_DEPLOYMENT_PLAN.md`](AWS_DEPLOYMENT_PLAN.md).

**Deadline: September 14, 2026, 11:45am SGT** (note: earlier in the day, US-Pacific-time, than the AWS deadline — check your timezone conversion, don't rely on "same day" intuition)

**Frontend integrity rule:** the existing travel-agent frontend and marketing
landing page are copied verbatim. Never add demo data, mock data, fixtures,
seeded records, or fake API responses to `frontend/`; recorded walkthroughs use
a dedicated real account and connected data.

## The build itself

- [ ] CALL-E account created (20 free calls included) via the [CALL-E Integrations](https://github.com/CALLE-AI/call-e-integrations) setup guide
- [ ] `email-task-call-proposal` skill and Python CALL-E adapter built: reads email/tasks/calendar, creates an approval-gated call proposal, and returns a structured outcome (confirmed / rescheduled / no answer)
- [ ] Wired into OpenPip's existing proposal/review pipeline — a call is proposed like any other action, only placed after Review-queue approval
- [ ] Call outcome writes back to the calendar + logs in the Review queue (auditable, not a special-cased log entry)
- [ ] Scope kept narrow — appointment confirm/reschedule only, nothing broader (cold outreach, reminders, surveys are explicitly out of scope per the plan)
- [ ] Submission narrative explains that AgentCore was evaluated but excluded because its separate runtime boundary would add token/state handoffs and reduce efficiency for OpenPip's customizable daily pipeline; this is not a GCP limitation

## ⚠️ The part that's easy to get wrong

- [x] **Open a pull request against CALL-E's shared repo, not your own.** Target: `https://github.com/CALLE-AI/awesome-phone-call-agents`. Your own OpenPip repo is where the real build lives — the PR is a separate, reusable contribution (the "confirm/reschedule appointment via call" skill) added under the Contribution Area their README specifies (`Agent Skills` is the likely fit). Open PR: https://github.com/CALLE-AI/awesome-phone-call-agents/pull/520
- [x] Read that repo's README before opening the PR — follow its folder structure / format exactly.

## Devpost submission form

- [x] Project name — **OpenPip - Open Performance Improvement Plan**
- [x] Elevator pitch
- [x] Project story (Inspiration / What it does / How we built it / Challenges / What's next)
- [x] Devpost About updated with the original OpenPip introduction plus detailed CALL-E execution flow and the public demo's no-login/no-call boundary
- [x] Built-with tags (CALL-E, Strands-Agents-SDK, MCP, TypeScript)
- [x] "Try it out" link — `demo.openpip.me`
- [x] Submitter type — Individual
- [x] Country of residence/incorporation — United States
- [x] "Which best describes the primary use case" — Appointment scheduling & confirmation
- [x] One-sentence real-world task description
- [x] Eligibility checkboxes (age of majority, eligible jurisdiction, not a sponsor employee)
- [x] **Project submission pull request URL** (required) — updated in the Devpost form to `https://github.com/CALLE-AI/awesome-phone-call-agents/pull/520`.
- [x] **Email address associated with your CALL-E account** — confirmed as `hello@openpip.me`.
- [x] **Testing instructions for application** — updated to explain the no-login public demo and approval-gated live CALL-E path.
- [x] **Video demo link** (required, **max 3 minutes** — shorter cap than AWS's 5, judges aren't required to watch past 3:00) — trimmed to 2:58 in YouTube Editor
- [ ] Optional: URL to functional demo app — already set to `demo.openpip.me`
- [x] Final Terms & Conditions agreement checkbox
- [x] **Submit** — Devpost returned `Submitted` and the public project read-back succeeded.

## Optional bonus

- [ ] Submit the CALL-E Feedback Survey during the Feedback Period (through Sep 18, 2026) — eligible for one of five $200 "Most Valuable Feedback" prizes. One submission per entrant; doesn't compete with or replace the main project submission.

## Notes

- This is a **separate Devpost submission** from the AWS one, built from the same underlying OpenPip agent — not a fork, not a competing product.
- Draft can be saved and edited any time before the deadline.
