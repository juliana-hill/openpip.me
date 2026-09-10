# Cloud Run Deployment and CALL-E Submission Plan

This plan covers the OpenPip deployment needed for the CALL-E submission. The
OpenPip application must be functional and use CALL-E at runtime. The separate
community contribution must be reusable outside OpenPip.

## Submission requirements

- OpenPip must be a working project that actually uses CALL-E at runtime.
- Open a pull request to the [CALL-E community repository](https://github.com/CALLE-AI/awesome-phone-call-agents).
- The pull request should contain a reusable contribution under `skills/`, not
  OpenPip's private backend adapter.
- Provide a public demonstration video that is less than three minutes long.
- Provide the email address associated with the CALL-E account.
- Use an authorized test number for the live CALL-E demonstration.

See the [CALL-E rules](https://call-e.devpost.com/rules) and the
[CALL-E community repository guide](https://github.com/CALLE-AI/awesome-phone-call-agents)
for the submission requirements and contribution format.

## Deployment boundary

Deploy the connected OpenPip web application and its Strands agent to Google
Cloud Run in the `travel-agent-cam-julie` project:

1. Build and publish the frontend and FastAPI web API containers to Google
   Artifact Registry.
2. Deploy the frontend and FastAPI web API as Cloud Run services.
3. Keep the Strands agent inside the FastAPI service, where it can share the
   deterministic crawl/recovery state, per-user Google authorization, memory
   pipeline, proposal state, and approval executor.
4. Place `CALL_E_API_KEY`, Google OAuth credentials, and application secrets in
   Google Cloud Secret Manager.
5. If Amazon Bedrock remains the model provider, let Cloud Run call it with
   short-lived federated AWS credentials. Do not add AgentCore or put long-
   lived keys in the image.
6. Configure the frontend service to reach the backend service over an
   authenticated Cloud Run service connection and verify the normal OpenPip
   workflow end to end.

The first milestone is a working Cloud Run application with a functional
CALL-E workflow. This plan intentionally does not use AgentCore. The decision
is based on application fit, not GCP: AgentCore's separate runtime boundary
would make OpenPip's fully customizable hybrid pipeline less efficient by
adding token-context and state handoffs between deterministic daily processing,
agentic memory synthesis, and approval-gated actions. The CALL-E submission
does not depend on AgentCore hosting the frontend or agent.

## Runtime workflow to demonstrate

```text
email, calendar, or task
    -> call proposal
    -> user approval
    -> CALL-E phone call
    -> structured result
    -> calendar update only after a successful provider confirmation
```

The phone path is only for appointments whose context requires a phone call.
Other events may use email, a booking system, or a direct Calendar proposal.
The phone call must only occur after the user approves the proposal. A live
demonstration should use a real, authorized test number and show the resulting
structured outcome in OpenPip. Failed, declined, or unconfirmed calls leave the
existing Calendar event unchanged.

## Reusable CALL-E contribution

The OpenPip adapter remains in this repository because it is application
integration code. The upstream pull request should contribute the portable
skill separately:

```text
skills/email-task-call-proposal/
```

The existing
[`email-task-call-proposal` skill](../../skills/email-task-call-proposal/SKILL.md)
is the candidate for that contribution. Follow the upstream repository's
README and place the skill under the contribution area it specifies.

The upstream pull request and the OpenPip application deployment are related,
but they are separate deliverables:

- OpenPip repository: working application, adapter, Cloud Run deployment, and demo.
- `CALLE-AI/awesome-phone-call-agents`: reusable skill and README entry.

## Why AgentCore is not part of this deployment

AgentCore was considered as a possible runtime for
`build_executive_assistant()` in `backend/src/openpip_backend/agent.py`, but it
is not suitable for this specific application boundary. OpenPip is not only a
single prompt/response agent. Its pipeline combines deterministic date-by-date
record crawling and resumable recovery with a final agentic memory pass. That
pass must use the same per-user Google token, historical-source tools, memory
upserts, proposal records, review approvals, and side-effecting executors as
the web API.

AgentCore's runtime boundary is not a suitable place to express OpenPip's
entire custom control flow. Moving only the agent into AgentCore would require
a second invocation and state boundary, secure token-context handoff, and
additional coordination for every daily pass. That would reduce efficiency
and make the pipeline less customizable without adding product value. We
therefore keep the agent in the FastAPI Cloud Run service. This is an
application-fit decision, not a limitation caused by GCP, and it does not
prevent OpenPip from using Strands, Bedrock, or CALL-E.

## Completion checklist

- [ ] Frontend service deployed to Google Cloud Run.
- [ ] FastAPI backend and Strands agent deployed to Google Cloud Run.
- [ ] Runtime secrets loaded from Google Cloud Secret Manager.
- [ ] Bedrock access from Cloud Run verified, using short-lived federated AWS
      credentials if Bedrock remains the provider.
- [ ] Email, calendar, or task to proposal flow verified.
- [ ] User approval gate verified before the call starts.
- [ ] CALL-E call completed with an authorized test number.
- [ ] Structured call result displayed and recorded by OpenPip.
- [ ] Portable skill prepared under `skills/email-task-call-proposal/`.
- [ ] Pull request opened against `CALLE-AI/awesome-phone-call-agents`.
- [ ] Public demonstration video recorded and kept under three minutes.
- [ ] CALL-E account email confirmed for Devpost.
- [ ] Devpost testing instructions updated with the deployed app details.
