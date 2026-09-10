# OpenPip AWS Deployment Plan

This plan prepares OpenPip for the Agents for Humans hackathon. The target is
a working public deployment that demonstrates a Strands agent handling real,
approval-gated work for a user. The web application and Strands agent will run
on Google Cloud Run in the `travel-agent-cam-julie` project. Amazon Bedrock is
the current model provider; AgentCore is not used for this deployment.

## Current application boundary

OpenPip already has two Docker services for local development:

- `frontend/`: the user-facing application and session proxy. This will run on
  Cloud Run.
- `backend/`: the FastAPI web API for Google integrations, proposals, review
  actions, and the CALL-E adapter. This should run as a companion Cloud Run
  service unless it is intentionally colocated with the frontend container.

The current Strands factory is
`backend/src/openpip_backend/agent.py:build_executive_assistant()`. Locally,
the agent runs inside the FastAPI service. No AWS AgentCore runtime is part of
this deployment plan.

## Why AgentCore is not suitable here

AgentCore was evaluated, including the custom-runtime and identity paths, but
it is not the right runtime boundary for OpenPip's current workflow. OpenPip
combines deterministic daily pagination and recovery with an agentic final
memory pass. That pass must use the same per-user Google authorization,
historical-source tools, memory upserts, proposal records, review approvals,
and external-action executors as the FastAPI application.

AgentCore can host a self-contained agent, but moving only this agent into a
separate runtime would require an invocation boundary and secure token/state
handoffs for each processing pass. It would duplicate coordination and add
latency while making the pipeline less customizable. Keeping the Strands
agent inside FastAPI lets OpenPip tune each deterministic and agentic stage
for the user's data without a second runtime boundary. This is an application
fit and efficiency decision, not a limitation caused by GCP. Strands and
Amazon Bedrock remain part of the design; AgentCore is excluded from this
deployment.

## CALL-E compatibility

The deployment must preserve the CALL-E integration already present in the
backend. The CALL-E research supplied for this plan is treated as a design
constraint, not as an instruction to place a call or submit anything.

The deployed workflow remains:

```text
email, calendar, or task
    -> approval-gated call proposal
    -> user approval
    -> CALL-E call
    -> structured result
    -> calendar update only after successful provider confirmation
    -> auditable review record
```

Keep `CALL_E_API_KEY` in Google Cloud Secret Manager and keep the CALL-E adapter
behind the existing proposal and review workflow. A deployment is not complete if it
can only generate a text response or if it bypasses the approval step. The
phone path is only for appointments whose context requires a call. Failed,
declined, or unconfirmed calls must leave the existing Calendar event
unchanged. The
same deployment should support the separate CALL-E submission work, including
the reusable `email-task-call-proposal` skill and its upstream contribution,
without moving OpenPip's private adapter into the community repository.

## Recommended deployment order

### Phase 1: Deploy the working app to Cloud Run

Deploy the existing frontend and FastAPI web API containers to Google Cloud
Run. Keep these services responsible for the web experience, OAuth/session
routes, provider reads, proposals, review approvals, and approved execution.

1. Build and publish the frontend and backend images to Google Artifact
   Registry.
2. Create one Cloud Run service for the frontend and one for the FastAPI web
   API, or document a deliberate single-service arrangement.
3. Configure the frontend service to reach the backend over a private service
   connection or an authenticated public endpoint.
4. Configure HTTPS, health checks, logs, and the production Google OAuth
   redirect URI.
5. Verify the complete workflow from the public frontend through the backend,
   Strands, Bedrock, Google APIs, review approval, and the resulting action.

### Phase 2: Make state durable

The local Docker setup uses SQLite and a mounted `data/` directory. Cloud Run
can replace or restart containers, so the deployment
must not depend on container-local SQLite for durable production state.

Choose a durable store before inviting outside testers. The migration should
preserve proposals, review decisions, crawl progress, memories, and audit
records. If the initial hackathon deployment keeps SQLite for a controlled
demo, document the limitation and back up the database outside the container.

### Phase 3: Configure model access from Cloud Run

The current `build_executive_assistant()` creates the Strands agent inside
FastAPI and binds tools to the signed-in user's Google token. Keep that
boundary intact on Cloud Run. When the model provider remains Amazon Bedrock,
configure the Cloud Run service to obtain short-lived AWS credentials through
workload identity federation. Do not embed long-lived AWS keys in the image or
source repository. If the cross-cloud Bedrock connection proves unnecessary,
the model provider can be revisited separately without changing the web/API
deployment boundary.

## Secrets and identity

Use Google Cloud Secret Manager for Cloud Run application secrets, including:

- Google OAuth client credentials.
- `CALL_E_API_KEY`.
- Session signing secrets.
- Database connection details, if the durable store requires them.

Use a Cloud Run service account for Google Cloud access and Secret Manager
access. If Cloud Run continues to call Amazon Bedrock directly, use a
federated AWS role with short-lived credentials and restrict it to the models
and APIs the service needs. Keep each service limited to the permissions it
needs.

## Hackathon demonstration

The deployed app should show the complete Strands workflow:

```text
user context and connected records
    -> background agent work
    -> concise proposal or recommendation
    -> user review and approval
    -> approved external action
    -> recorded result and updated context
```

The demo should explain why OpenPip is more than a chat interface: it works in
the background, brings together the user's chosen context, and asks for a
decision only when an external action needs approval.

## Submission artifacts

The Agents for Humans submission requires:

- Public repository URL.
- Source code, assets, setup instructions, and a visible MIT or Apache license.
- Architecture diagram showing the frontend, backend, Strands, Bedrock, Google
  services, persistence, and the approval-gated workflow. The diagram should
  also explain why AgentCore is intentionally not in the runtime boundary.
- A working demonstration video of no more than five minutes.
- A public live demo link when available.
- AWS Builder ID.
- Optional public build story on [builder.aws.com](https://builder.aws.com/) with
  “Agents for Humans” in the title.

## Completion checklist

- [ ] Google Cloud project and Cloud Run region selected.
- [ ] Google Artifact Registry repositories created for frontend and backend.
- [ ] Frontend service deployed to Cloud Run.
- [ ] FastAPI web API service deployed to Cloud Run.
- [ ] Bedrock model access verified from the Cloud Run deployment.
- [ ] Short-lived AWS credentials or an alternate model provider configured.
- [ ] Google OAuth production redirect URI configured.
- [ ] Cloud Run application secrets loaded from Google Cloud Secret Manager.
- [ ] AWS access provided through short-lived federated credentials, not hard-coded keys.
- [ ] Durable persistence selected and tested, or the SQLite demo limitation
      documented.
- [ ] End-to-end Strands workflow verified on the public deployment.
- [ ] Architecture diagram completed.
- [ ] Five-minute-or-less demonstration video recorded.
- [ ] Public repository and live demo links added to the submission.
- [ ] Builder.aws article published, if pursuing the bonus.
