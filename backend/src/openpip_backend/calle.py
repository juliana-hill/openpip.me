"""Small CALL-E Developer API adapter used only after proposal approval.

Proposal generation never imports or calls this module. The executor supplies
the exact recipient and goal from the approved proposal, then this adapter
creates one CALL-E task and polls it to a terminal state.
"""

from __future__ import annotations

import asyncio
import os
import time
from typing import Any
from urllib.parse import urlparse

import httpx

_DEFAULT_BASE_URL = "https://api.heycall-e.com"
_ALLOWED_HOST = "api.heycall-e.com"
_TERMINAL_STATUSES = {
    "completed", "failed", "rejected", "cancelled", "canceled", "expired",
}


class CalleError(RuntimeError):
    """A CALL-E request failed or returned an unusable result."""


def _base_url() -> str:
    value = os.getenv("CALLE_BASE_URL", _DEFAULT_BASE_URL).rstrip("/")
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.hostname != _ALLOWED_HOST:
        raise CalleError("CALLE_BASE_URL must use https://api.heycall-e.com")
    return value


def _api_key() -> str:
    # CALL_E_API_KEY is the name used by this project's existing .env.local;
    # CALLE_API_KEY remains supported for the official CALL-E spelling and
    # for deployments that already use the example configuration.
    value = os.getenv("CALL_E_API_KEY", "").strip() or os.getenv("CALLE_API_KEY", "").strip()
    if not value:
        raise CalleError("CALL_E_API_KEY or CALLE_API_KEY is not configured")
    return value


async def execute_call(
    *,
    recipient_name: str,
    phone: str,
    goal: str,
    proposal_id: str,
    region: str | None = None,
    locale: str | None = None,
    timeout_seconds: int = 300,
    poll_seconds: float = 3.0,
) -> dict[str, Any]:
    """Create one approved CALL-E task and wait for its terminal result."""
    if not recipient_name.strip() or not phone.strip() or not goal.strip():
        raise CalleError("CALL-E proposals require recipient_name, phone, and goal")

    payload = {
        "task": goal.strip(),
        "recipients": [{
            "phones": [phone.strip()],
            **({"region": region} if region else {}),
            **({"locale": locale} if locale else {}),
        }],
        "result_schema": {
            "type": "object",
            "required": ["outcome"],
            "properties": {
                "outcome": {
                    "type": "string",
                    "enum": ["confirmed", "rescheduled", "needs_reschedule", "declined", "no_answer", "unclear"],
                },
                "requested_new_time": {"type": ["string", "null"]},
            },
        },
        "metadata": {"openpip_proposal_id": proposal_id, "recipient_name": recipient_name.strip()},
    }
    headers = {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
        "Idempotency-Key": f"openpip-proposal-{proposal_id}",
    }
    base_url = _base_url()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{base_url}/v1/calls", headers=headers, json=payload)
        if not response.is_success:
            raise CalleError(f"CALL-E rejected the call request ({response.status_code})")
        created = response.json()
        call_id = str(created.get("id") or "")
        if not call_id:
            raise CalleError("CALL-E returned no call id")

        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            result_response = await client.get(f"{base_url}/v1/calls/{call_id}", headers=headers)
            if not result_response.is_success:
                raise CalleError(f"CALL-E result lookup failed ({result_response.status_code})")
            result = result_response.json()
            status = str(result.get("status") or "").lower()
            if status in _TERMINAL_STATUSES:
                # The Developer API's terminal representation is not required
                # to repeat the path id, so preserve it for audit references
                # and follow-up proposal idempotency.
                result.setdefault("id", call_id)
                return result
            await asyncio.sleep(poll_seconds)

    raise CalleError(f"CALL-E call {call_id} did not reach a terminal state")
