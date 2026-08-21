"""Provider interfaces kept independent of live Google or CALL-E credentials."""

from dataclasses import dataclass
from typing import Protocol

from .demo_data import demo_request
from .models import BriefingRequest


@dataclass(frozen=True)
class ConnectorStatus:
    name: str
    label: str
    connected: bool
    mode: str
    scopes: tuple[str, ...]


class WorkspaceProvider(Protocol):
    def read_context(self) -> BriefingRequest: ...


class MockWorkspaceProvider:
    """Sanitized provider used locally until OAuth-backed adapters are configured."""

    def read_context(self) -> BriefingRequest:
        return demo_request()


def connector_statuses() -> list[ConnectorStatus]:
    return [
        ConnectorStatus("gmail", "Gmail", False, "mock", ("gmail.readonly", "gmail.modify", "gmail.compose")),
        ConnectorStatus("calendar", "Calendar", False, "mock", ("calendar.readonly", "calendar.events")),
        ConnectorStatus("tasks", "Tasks", False, "mock", ("tasks",)),
        ConnectorStatus("drive", "Drive", False, "mock", ("drive.readonly",)),
    ]
