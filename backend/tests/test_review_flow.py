from fastapi.testclient import TestClient

from openpip_backend.app import app, store
from openpip_backend.agent import SYSTEM_PROMPT, build_briefing_prompt, build_executive_assistant
from openpip_backend.models import BriefingRequest, UserContext
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

    assert "travel" not in SYSTEM_PROMPT.lower()
    tools = captured["tools"]
    assert isinstance(tools, list)
    assert tools == [travel_agent]
    assert travel_agent.tool_name == "travel_agent"


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
    assert response.json()["generated_by"] in {"demo-fallback", "strands"}
    assert response.json()["proposals_created"] == 1
    assert client.get("/api/proposals?status=pending").json()["items"][0]["source"]["id"] == "message-client-followup"


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
        def execute(self, _proposal):
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
