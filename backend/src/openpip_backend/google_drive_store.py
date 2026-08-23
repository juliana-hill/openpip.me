"""Small per-user app-data store backed by the user's Google Drive."""

from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.parse import quote

import httpx

from .google_workspace import GOOGLE_TIMEOUT, GoogleApiError

_APP_DATA_FILE = "OpenPip App Data.json"
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
    return str(files[0]["id"]) if files and files[0].get("id") else None


async def read_drive_app_data(access_token: str) -> dict[str, Any]:
    """Read OpenPip's JSON document from the signed-in user's app-data space."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        file_id = await _find_file(client, access_token)
        if not file_id:
            return {"version": 1, "tags": [], "messageTags": {}, "userData": {}}
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
        return {"version": 1, "tags": [], "messageTags": {}, "userData": {}}
    return {
        "version": 1,
        "tags": payload.get("tags") if isinstance(payload.get("tags"), list) else [],
        "messageTags": payload.get("messageTags") if isinstance(payload.get("messageTags"), dict) else {},
        "userData": payload.get("userData") if isinstance(payload.get("userData"), dict) else {},
    }


async def write_drive_app_data(access_token: str, data: dict[str, Any]) -> dict[str, Any]:
    """Create or replace OpenPip's app-data JSON document."""
    payload = {
        "version": 1,
        "tags": data.get("tags") if isinstance(data.get("tags"), list) else [],
        "messageTags": data.get("messageTags") if isinstance(data.get("messageTags"), dict) else {},
        "userData": data.get("userData") if isinstance(data.get("userData"), dict) else {},
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
