"""Small per-user app-data store backed by the user's Google Drive."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.parse import quote

import httpx

from .google_workspace import GOOGLE_TIMEOUT, GoogleApiError

_APP_DATA_FILE = "user_settings.json"
# Renamed from "OpenPip App Data.json" — accounts that already wrote that file
# (in the hidden, per-user appDataFolder space) must not appear to lose their
# settings. _find_file below still matches the old name and migrates the file
# in place by renaming it, rather than orphaning it and starting a fresh
# empty document.
_LEGACY_APP_DATA_FILE = "OpenPip App Data.json"
_DRIVE_API = "https://www.googleapis.com/drive/v3"
_DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3"
_write_lock = asyncio.Lock()


async def _request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    access_token: str,
    *,
    params: dict[str, Any] | None = None,
    json_body: Any = None,
    content: str | None = None,
) -> httpx.Response:
    response = await client.request(
        method,
        url,
        params=params,
        json=json_body,
        content=content,
        headers={
            "Authorization": f"Bearer {access_token}",
            **({"Content-Type": "application/json"} if content is not None else {}),
        },
    )
    if response.is_success:
        return response
    try:
        payload = response.json()
        detail = payload.get("error", {}).get("message") or payload.get("error") or response.text
    except ValueError:
        detail = response.text
    raise GoogleApiError(response.status_code, str(detail)[:500])


async def _find_file(client: httpx.AsyncClient, access_token: str) -> str | None:
    response = await _request(
        client,
        "GET",
        f"{_DRIVE_API}/files",
        access_token,
        params={
            "q": f"name = '{_APP_DATA_FILE}' and trashed = false",
            "spaces": "appDataFolder",
            "pageSize": 1,
            "fields": "files(id)",
        },
    )
    files = response.json().get("files", [])
    if files and files[0].get("id"):
        return str(files[0]["id"])
    return await _find_and_migrate_legacy_file(client, access_token)


async def _find_and_migrate_legacy_file(client: httpx.AsyncClient, access_token: str) -> str | None:
    """Fall back to the pre-rename filename so an account that already has
    settings saved doesn't appear empty; rename it in place so this lookup
    only has to happen once per account."""
    response = await _request(
        client,
        "GET",
        f"{_DRIVE_API}/files",
        access_token,
        params={
            "q": f"name = '{_LEGACY_APP_DATA_FILE}' and trashed = false",
            "spaces": "appDataFolder",
            "pageSize": 1,
            "fields": "files(id)",
        },
    )
    files = response.json().get("files", [])
    if not files or not files[0].get("id"):
        return None
    file_id = str(files[0]["id"])
    await _request(
        client,
        "PATCH",
        f"{_DRIVE_API}/files/{quote(file_id, safe='')}",
        access_token,
        json_body={"name": _APP_DATA_FILE},
        params={"fields": "id"},
    )
    return file_id


async def read_drive_app_data(access_token: str) -> dict[str, Any]:
    """Read OpenPip settings/tracking data from the user's app-data space.

    Gmail labels and their message membership are intentionally not part of
    this document. Inbox reads them from Gmail and inbox writes use
    ``messages.modify`` directly, so a stale Drive projection cannot make the
    UI disagree with Gmail.
    """
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        file_id = await _find_file(client, access_token)
        if not file_id:
            return {"version": 1, "userData": {}, "contacts": {}}
        response = await _request(
            client,
            "GET",
            f"{_DRIVE_API}/files/{quote(file_id, safe='')}",
            access_token,
            params={"alt": "media"},
        )
    try:
        payload = response.json()
    except ValueError:
        payload = {}
    if not isinstance(payload, dict):
        return {"version": 1, "userData": {}, "contacts": {}}
    return {
        "version": 1,
        "userData": payload.get("userData") if isinstance(payload.get("userData"), dict) else {},
        # Keyed by Google People resourceName (e.g. "people/c123...") — this
        # is only the small tracking index. Per-contact CRM wrapper fields are
        # visible under OpenPip/contacts/<contact_id>/profile.json and the
        # unbounded interaction log under that folder's interactions/ tree.
        "contacts": payload.get("contacts") if isinstance(payload.get("contacts"), dict) else {},
    }


async def write_drive_app_data(access_token: str, data: dict[str, Any]) -> dict[str, Any]:
    """Create or replace OpenPip's settings/tracking app-data document.

    Do not add Gmail labels or message-to-label mappings here. Those are
    provider-owned state and must be changed through the Gmail API.
    """
    payload = {
        "version": 1,
        "userData": data.get("userData") if isinstance(data.get("userData"), dict) else {},
        "contacts": data.get("contacts") if isinstance(data.get("contacts"), dict) else {},
    }
    encoded = json.dumps(payload, separators=(",", ":"))
    async with _write_lock:
        async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
            file_id = await _find_file(client, access_token)
            if not file_id:
                metadata = await _request(
                    client,
                    "POST",
                    f"{_DRIVE_API}/files",
                    access_token,
                    json_body={"name": _APP_DATA_FILE, "mimeType": "application/json", "parents": ["appDataFolder"]},
                    params={"fields": "id"},
                )
                file_id = str(metadata.json()["id"])
            await _request(
                client,
                "PATCH",
                f"{_DRIVE_UPLOAD}/files/{quote(file_id, safe='')}",
                access_token,
                params={"uploadType": "media"},
                content=encoded,
            )
    return payload
