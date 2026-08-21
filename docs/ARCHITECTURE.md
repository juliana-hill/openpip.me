# OpenPip architecture

```mermaid
flowchart LR
  UI[Next.js Today / Review / Settings / Contacts] --> API[FastAPI API]
  API --> Store[(SQLite proposal queue\npreferences + audit events)]
  API --> Agent[Strands briefing / triage agents]
  Agent --> Context[User working context]
  Agent --> Providers[Provider interfaces]
  Providers --> Mock[Sanitized mock providers]
  Providers -. future .-> Google[Google OAuth adapters]
  API --> Gate[Approval-only executor]
  Gate -. approved only .-> Effects[Google writes / CALL-E]
```

The immutable system instructions define the agent’s tools and safety policy.
User-authored working context is a separate, editable input used to prioritize
work and match communication style. It cannot authorize an external action.

Every proposed action includes a source reference. The review lifecycle is:

`pending → approved/rejected → executing → executed/failed`

The local executor is mock-only and produces no external side effects. Google,
CALL-E, AgentCore Identity, AgentCore Memory, and EventBridge adapters belong
behind the provider/executor interfaces as credentials become available.
