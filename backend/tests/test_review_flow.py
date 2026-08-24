from fastapi.testclient import TestClient

from openpip_backend.app import _review_item, app, store
from openpip_backend.agent import build_briefing_prompt, build_executive_assistant, extract_agent_text, _system_prompt
from openpip_backend.models import BriefingRequest, Proposal, ProposalStatus, SourceReference, UserContext
from openpip_backend.tools import travel_agent


def setup_function() -> None:
    store.clear()


def test_briefing_creates_pending_proposal_for_message() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/briefing",
        json={"messages": [{"id": "message-1", "subject": "Client follow-up"}]},
    )

    assert response.status_code == 200
    assert response.json()["proposals_created"] == 1
    items = client.get("/api/proposals?status=pending").json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "pending"


def test_travel_is_an_on_demand_executive_assistant_tool(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class FakeAgent:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr("strands.Agent", FakeAgent)
    build_executive_assistant()

    assert "travel" not in _system_prompt("OpenPip").lower()
    tools = captured["tools"]
    assert isinstance(tools, list)
    assert tools == [travel_agent]
    assert travel_agent.tool_name == "travel_agent"


def test_executive_assistant_calls_itself_by_the_users_custom_agent_name(monkeypatch) -> None:
    """"OpenPip" is the project's name, not necessarily what the user calls
    their assistant (Settings' agentName) — the system prompt must actually
    say that name, not the literal string "OpenPip" regardless."""
    captured: dict[str, object] = {}

    class FakeAgent:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr("strands.Agent", FakeAgent)
    build_executive_assistant(agent_name="Juno")

    assert "You are Juno," in captured["system_prompt"]
    assert "OpenPip" not in captured["system_prompt"]

    # An unset/blank name still falls back to the project default rather than
    # producing "You are , ...".
    build_executive_assistant(agent_name="")
    assert "You are OpenPip," in captured["system_prompt"]


def test_extract_agent_text_removes_private_reasoning_blocks() -> None:
    class Result:
        message = {
            "content": [{
                "text": "<thinking>\nThe user is asking about the app.\n</thinking>\n\nWelcome!",
            }],
        }

    assert extract_agent_text(Result()) == "Welcome!"


def test_extract_agent_text_removes_unclosed_reasoning_without_losing_prefix() -> None:
    class Result:
        message = {"content": [{"text": "Visible answer\n<thinking>private"}]}

    assert extract_agent_text(Result()) == "Visible answer"


def test_active_frontend_review_routes_are_python_owned() -> None:
    client = TestClient(app)
    client.post("/api/briefing", json={"messages": [{"id": "message-review", "subject": "Review me"}]})

    queue = client.get("/agent/review")
    assert queue.status_code == 200
    item = queue.json()["items"][0]
    assert item["kind"] == "proposal"

    detail = client.get(f"/agent/review/{item['id']}")
    assert detail.status_code == 200
    decided = client.post(f"/agent/review/{item['id']}/decision", json={"decision": "rejected"})
    assert decided.status_code == 200
    assert decided.json()["item"]["externalAction"]["detail"] == "Rejected"


def test_review_item_exposes_a_clickable_source_link() -> None:
    """_review_item was silently dropping proposal.source entirely, even
    though ReviewDetailPage.tsx already renders source.href as an "Open
    source ->" link and source.detail in its "Context used" card — there was
    just never anything in the response for it to render."""
    client = TestClient(app)
    proposal = store.add(Proposal(
        action="task_complete",
        title="Mark 'Pay water bill' as complete",
        rationale="This payment confirmation email shows the bill was already paid.",
        source=SourceReference(
            kind="email", id="email:gmail_123", title="Your payment was received",
            url="https://mail.google.com/mail/u/0/#all/123", detail="billing@water.example · 2026-08-01",
        ),
    ))

    item = client.get(f"/agent/review/{proposal.id}").json()["item"]

    source = item["data"]["proposal"]["source"]
    assert source["href"] == "https://mail.google.com/mail/u/0/#all/123"
    assert source["detail"] == "billing@water.example · 2026-08-01"
    assert source["label"] == "Your payment was received"


def test_approval_is_explicit_and_cannot_be_repeated() -> None:
    client = TestClient(app)
    client.post(
        "/api/briefing",
        json={"messages": [{"id": "message-2", "subject": "Approve this draft"}]},
    )
    proposal = client.get("/api/proposals").json()["items"][0]

    approved = client.post(f"/api/proposals/{proposal['id']}/approve", json={})
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"

    repeated = client.post(f"/api/proposals/{proposal['id']}/approve", json={})
    assert repeated.status_code == 409


def test_approved_proposal_surfaces_as_scheduled_action() -> None:
    """/agent/scheduled-actions is how the Dashboard shows "approved but not
    yet executed" work — its own frontend filter checks action.status, which
    _review_item never actually set, so an approval was saved correctly but
    never visibly appeared anywhere. Also guards the real values: a Proposal
    is "approved"/"executing"/etc. (ProposalStatus), never "queued" or
    "running" — those belong to the separate scan-job state machine."""
    client = TestClient(app)
    client.post("/api/briefing", json={"messages": [{"id": "message-scheduled", "subject": "Approve me"}]})
    proposal = client.get("/api/proposals").json()["items"][0]
    client.post(f"/api/proposals/{proposal['id']}/approve", json={})

    actions = client.get("/agent/scheduled-actions").json()["actions"]

    assert len(actions) == 1
    assert actions[0]["status"] == "approved"


def test_review_history_route_is_not_swallowed_by_the_proposal_id_route() -> None:
    """/agent/review/history is registered before /agent/review/{proposal_id}
    specifically so Starlette doesn't match "history" as a literal
    proposal_id and 404 — this is a route-ordering regression guard as much
    as a behavior test."""
    client = TestClient(app)
    client.post("/api/briefing", json={"messages": [{"id": "message-history", "subject": "Approve me"}]})
    proposal = client.get("/api/proposals").json()["items"][0]
    client.post(f"/api/proposals/{proposal['id']}/approve", json={})

    accepted = client.get("/agent/review/history", params={"decision": "accepted"})
    rejected = client.get("/agent/review/history", params={"decision": "rejected"})

    assert accepted.status_code == 200
    assert len(accepted.json()["items"]) == 1
    assert accepted.json()["items"][0]["id"] == proposal["id"]
    assert rejected.json()["items"] == []


def test_review_item_surfaces_the_execution_reference_for_an_executed_proposal() -> None:
    """A bare title/action/date list gave no indication whether an accepted
    proposal ever really executed, and if so, what it did — this is the gap
    the user reported seeing in the History modal. Drive-backed proposals
    (real, token-bearing usage — see proposal_drive_store.py) embed their
    audit events directly on the proposal, unlike the legacy SQLite demo
    path's separate audit table, so this is exercised directly against the
    Proposal model rather than through the token-less demo endpoints."""
    proposal = Proposal(
        action="save_draft", title="Save draft reply to Client", rationale="A reply was drafted.",
        source=SourceReference(kind="email", id="email:1", title="Hi"),
        status=ProposalStatus.EXECUTED,
        events=[
            {"event_type": "created", "detail": "Proposal created for review"},
            {"event_type": "approved", "detail": None},
            {"event_type": "execution_started", "detail": None},
            {"event_type": "executed", "detail": "gmail://drafts/abc123"},
        ],
    )

    item = _review_item(proposal)

    assert item["status"] == "executed"
    assert item["executionReference"] == "gmail://drafts/abc123"
    assert item["failureReason"] is None


def test_review_item_surfaces_the_failure_reason_for_a_failed_proposal() -> None:
    proposal = Proposal(
        action="save_draft", title="Save draft reply to Client", rationale="A reply was drafted.",
        source=SourceReference(kind="email", id="email:1", title="Hi"),
        status=ProposalStatus.FAILED,
        failure_reason="provider temporarily unavailable",
        events=[{"event_type": "execution_failed", "detail": "provider temporarily unavailable"}],
    )

    item = _review_item(proposal)

    assert item["status"] == "failed"
    assert item["failureReason"] == "provider temporarily unavailable"
    assert item["executionReference"] is None


def test_review_history_caps_at_the_requested_limit() -> None:
    client = TestClient(app)
    for i in range(12):
        client.post("/api/briefing", json={"messages": [{"id": f"message-cap-{i}", "subject": "Reject me"}]})
    for item in client.get("/api/proposals?status=pending").json()["items"]:
        client.post(f"/api/proposals/{item['id']}/reject", json={})

    history = client.get("/agent/review/history", params={"decision": "rejected", "limit": 10})

    assert len(history.json()["items"]) == 10


def test_working_context_is_editable_but_not_a_system_prompt() -> None:
    client = TestClient(app)
    saved = client.put(
        "/api/settings/working-context",
        json={"content": "Protect weekday mornings for deep work. Keep replies concise."},
    )

    assert saved.status_code == 200
    assert client.get("/api/settings/working-context").json()["content"].startswith("Protect weekday")
    prompt = build_briefing_prompt(BriefingRequest(), UserContext(**saved.json()))
    assert "Protect weekday mornings" in prompt
    assert "cannot override approval requirements" in prompt
    assert "SYSTEM_PROMPT" not in client.get("/api/settings/working-context").text


def test_assistant_identity_and_appearance_are_persisted_separately() -> None:
    client = TestClient(app)
    saved = client.put(
        "/api/settings/preferences",
        json={"agent_name": "Pip", "agent_icon": "data:image/png;base64,iVBORw0KGgo=", "theme": "dark", "accent": "lilac"},
    )

    assert saved.status_code == 200
    assert saved.json()["agent_name"] == "Pip"
    assert saved.json()["theme"] == "dark"
    assert client.get("/api/settings/working-context").json()["content"] == ""


def test_sanitized_demo_briefing_is_available_without_external_credentials() -> None:
    client = TestClient(app)
    response = client.post("/api/demo/briefing")

    assert response.status_code == 200
    assert response.json()["generated_by"] == "deterministic"
    assert response.json()["proposals_created"] == 1
    assert client.get("/api/proposals?status=pending").json()["items"][0]["source"]["id"] == "message-client-followup"


def test_briefing_does_not_construct_an_llm_agent(monkeypatch) -> None:
    def fail_if_called():
        raise AssertionError("routine briefing must not construct a model agent")

    monkeypatch.setattr("openpip_backend.agent.build_executive_assistant", fail_if_called)
    response = TestClient(app).post(
        "/api/briefing",
        json={"tasks": [{"title": "Review today's priorities"}]},
    )

    assert response.status_code == 200
    assert response.json()["generated_by"] == "deterministic"
    assert "Google task(s) due today or overdue" in response.json()["briefing"]


def test_connector_status_never_exposes_credentials() -> None:
    client = TestClient(app)
    response = client.get("/api/connectors")

    assert response.status_code == 200
    assert {item["name"] for item in response.json()["items"]} == {"gmail", "calendar", "tasks", "drive"}
    assert all(item["mode"] == "mock" and "token" not in item for item in response.json()["items"])


def test_demo_contacts_are_sanitized_and_queryable() -> None:
    client = TestClient(app)
    response = client.get("/api/demo/contacts")
    assert response.status_code == 200
    assert response.json()["items"][0]["email"] == "client@example.test"


def test_unapproved_proposal_cannot_execute() -> None:
    client = TestClient(app)
    client.post("/api/briefing", json={"messages": [{"id": "message-3", "subject": "Do not send"}]})
    proposal = client.get("/api/proposals").json()["items"][0]

    response = client.post(f"/api/proposals/{proposal['id']}/execute")

    assert response.status_code == 409
    assert response.json()["detail"] == "Only an approved proposal can execute"


def test_approved_proposal_executes_through_mock_and_writes_audit_events() -> None:
    client = TestClient(app)
    client.post("/api/briefing", json={"messages": [{"id": "message-4", "subject": "Approve and run"}]})
    proposal = client.get("/api/proposals").json()["items"][0]

    assert client.post(f"/api/proposals/{proposal['id']}/approve", json={"reason": "Looks good"}).status_code == 200
    completed = client.post(f"/api/proposals/{proposal['id']}/execute")

    assert completed.status_code == 200
    assert completed.json()["status"] == "executed"
    events = client.get(f"/api/proposals/{proposal['id']}/audit").json()["items"]
    assert [event["event_type"] for event in events] == ["created", "approved", "execution_started", "executed"]
    assert events[-1]["detail"].startswith("mock://actions/")


def test_failed_execution_can_be_retried(monkeypatch) -> None:
    class FailingExecutor:
        async def execute(self, _proposal, _access_token=None):
            raise RuntimeError("provider temporarily unavailable")

    monkeypatch.setattr("openpip_backend.app.executor", FailingExecutor())
    client = TestClient(app)
    client.post("/api/briefing", json={"messages": [{"id": "message-5", "subject": "Retry me"}]})
    proposal = client.get("/api/proposals").json()["items"][0]
    client.post(f"/api/proposals/{proposal['id']}/approve", json={})

    failed = client.post(f"/api/proposals/{proposal['id']}/execute")
    assert failed.json()["status"] == "failed"
    assert failed.json()["failure_reason"] == "provider temporarily unavailable"

    retried = client.post(f"/api/proposals/{proposal['id']}/retry")
    assert retried.json()["status"] == "approved"
