"""Real, visible-in-Drive files — distinct from google_drive_store.py's single
hidden appDataFolder JSON blob. Two things live here, both under a real
"OpenPip" folder the user can browse (drive.file scope, see google_oauth.py):

1. Agent & Guidelines text documents (agent.md, goals-n-guidelines/*.md) —
   get_or_create_document(). Ported from ~/Projects/Personal/travel-agent's
   agent/src/tools/google-drive.ts (that project's Node backend) — same
   folder-walk-then-find-or-create design, reimplemented against this
   backend's httpx/async style. Stored as plain text/plain, not Google Docs,
   so reading them back is a direct `alt=media` fetch — this backend needs
   their content as pure text to fold into agent prompts, not just a place
   to click "open".

2. Per-task JSON records (one file per task, not one shared blob) —
   read_json_file/write_json_file/list_json_files/delete_json_file. Tasks
   are an unbounded, ever-growing collection, unlike the small fixed set of
   fields in google_drive_store.py's settings document, so each task's local
   data (its schedule, its accumulated timer elapsed-ms) is its own
   "<task id>.json" file under a folder such as "OpenPip/tasks/schedules".
"""

from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.parse import quote

import httpx

from .google_workspace import GOOGLE_TIMEOUT, GoogleApiError

_DRIVE_API = "https://www.googleapis.com/drive/v3"
_DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3"
_FOLDER_MIME = "application/vnd.google-apps.folder"


async def _request(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    access_token: str,
    *,
    params: dict[str, object] | None = None,
    json_body: object = None,
    content: str | None = None,
    content_type: str = "text/plain",
) -> httpx.Response:
    response = await client.request(
        method,
        url,
        params=params,
        json=json_body,
        content=content,
        headers={
            "Authorization": f"Bearer {access_token}",
            **({"Content-Type": content_type} if content is not None else {}),
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


def _escape(name: str) -> str:
    return name.replace("'", "\\'")


# Guards each (parent folder id, child folder name) pair against concurrent
# find-or-create — without this, two calls racing to resolve the same not-yet-
# existing folder (e.g. load_context_documents()'s asyncio.gather firing
# get_or_create_document three ways at once, all walking through "OpenPip"
# before it exists) can each see "not found" and each create their own
# duplicate. Keyed by segment, not the full path, so a lock taken while
# resolving "OpenPip" is shared by every deeper call walking through it, not
# just calls for the exact same full path. Never cleaned up, but the key
# space is small and bounded by how many distinct folders this app ever asks
# for — not a per-request growth.
_segment_locks: dict[tuple[str, str], asyncio.Lock] = {}


def _segment_lock(parent_id: str, name: str) -> asyncio.Lock:
    key = (parent_id, name)
    lock = _segment_locks.get(key)
    if lock is None:
        lock = asyncio.Lock()
        _segment_locks[key] = lock
    return lock


async def _get_or_create_folder(client: httpx.AsyncClient, access_token: str, folder_path: str) -> str:
    """Walk a "/"-separated folder path from Drive's root, creating any
    missing segment. Returns the deepest folder's id ("root" for an empty path)."""
    parent_id = "root"
    for part in (p.strip() for p in folder_path.split("/") if p.strip()):
        async with _segment_lock(parent_id, part):
            search = await _request(
                client, "GET", f"{_DRIVE_API}/files", access_token,
                params={
                    "q": f"name = '{_escape(part)}' and mimeType = '{_FOLDER_MIME}' and '{parent_id}' in parents and trashed = false",
                    "fields": "files(id)",
                    "pageSize": 1,
                },
            )
            files = search.json().get("files", [])
            if files:
                parent_id = str(files[0]["id"])
                continue
            created = await _request(
                client, "POST", f"{_DRIVE_API}/files", access_token,
                json_body={"name": part, "mimeType": _FOLDER_MIME, "parents": [parent_id]},
                params={"fields": "id"},
            )
            parent_id = str(created.json()["id"])
    return parent_id


async def _find_folder(client: httpx.AsyncClient, access_token: str, folder_path: str) -> str | None:
    """Resolve an existing folder without creating anything during a read."""
    parent_id = "root"
    for part in (p.strip() for p in folder_path.split("/") if p.strip()):
        search = await _request(
            client, "GET", f"{_DRIVE_API}/files", access_token,
            params={
                "q": f"name = '{_escape(part)}' and mimeType = '{_FOLDER_MIME}' and '{parent_id}' in parents and trashed = false",
                "fields": "files(id)",
                "pageSize": 1,
            },
        )
        files = search.json().get("files", [])
        if not files:
            return None
        parent_id = str(files[0]["id"])
    return parent_id


async def _find_file(client: httpx.AsyncClient, access_token: str, parent_id: str, filename: str) -> dict[str, str] | None:
    response = await _request(
        client, "GET", f"{_DRIVE_API}/files", access_token,
        params={
            "q": f"name = '{_escape(filename)}' and '{parent_id}' in parents and trashed = false",
            "fields": "files(id,webViewLink)",
            "pageSize": 1,
        },
    )
    files = response.json().get("files", [])
    if not files:
        return None
    return {"id": str(files[0]["id"]), "webViewLink": str(files[0].get("webViewLink") or "")}


async def _create_file(
    client: httpx.AsyncClient, access_token: str, parent_id: str, filename: str, content: str, mime_type: str,
) -> dict[str, str]:
    """Multipart upload (metadata + content in one request) so the file is
    created with its initial content in a single round trip."""
    boundary = "openpip-drive-file-boundary"
    multipart_body = (
        f"--{boundary}\r\n"
        "Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f'{{"name": {json.dumps(filename)}, "mimeType": "{mime_type}", "parents": ["{parent_id}"]}}\r\n'
        f"--{boundary}\r\n"
        f"Content-Type: {mime_type}\r\n\r\n"
        f"{content}\r\n"
        f"--{boundary}--"
    )
    response = await client.post(
        f"{_DRIVE_UPLOAD}/files",
        params={"uploadType": "multipart", "fields": "id,webViewLink"},
        content=multipart_body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        },
    )
    if not response.is_success:
        try:
            payload = response.json()
            detail = payload.get("error", {}).get("message") or payload.get("error") or response.text
        except ValueError:
            detail = response.text
        raise GoogleApiError(response.status_code, str(detail)[:500])
    data = response.json()
    return {"id": str(data.get("id") or ""), "webViewLink": str(data.get("webViewLink") or "")}


# ---- Agent & Guidelines text documents ----


async def get_or_create_document(access_token: str, folder_path: str, filename: str, initial_content: str) -> tuple[str, str]:
    """Find-or-create a plain-text document at folder_path/filename in the
    user's Drive. Returns (driveUrl, content) — content is what's actually in
    Drive for an existing file, or initial_content for one just created."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        parent_id = await _get_or_create_folder(client, access_token, folder_path)
        existing = await _find_file(client, access_token, parent_id, filename)
        if existing:
            content_response = await _request(
                client, "GET", f"{_DRIVE_API}/files/{quote(existing['id'], safe='')}", access_token,
                params={"alt": "media"},
            )
            return existing["webViewLink"], content_response.text
        created = await _create_file(client, access_token, parent_id, filename, initial_content, "text/plain")
        return created["webViewLink"], initial_content


async def overwrite_document(access_token: str, folder_path: str, filename: str, content: str) -> str:
    """Force-write a plain-text document, replacing its content if it already
    exists. Unlike get_or_create_document(), which never touches an existing
    file — used for a "reset to default" action, or reseeding a document
    whose starter template changed after the file was already created (a
    get_or_create_document call alone would keep serving the stale content
    forever). Returns the driveUrl."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        parent_id = await _get_or_create_folder(client, access_token, folder_path)
        existing = await _find_file(client, access_token, parent_id, filename)
        if existing:
            await _request(
                client, "PATCH", f"{_DRIVE_UPLOAD}/files/{quote(existing['id'], safe='')}", access_token,
                params={"uploadType": "media"}, content=content, content_type="text/plain",
            )
            return existing["webViewLink"]
        created = await _create_file(client, access_token, parent_id, filename, content, "text/plain")
        return created["webViewLink"]


# ---- Per-task JSON records ----


async def read_json_file(access_token: str, folder_path: str, filename: str) -> dict[str, Any] | None:
    """Read one "<name>.json" file from folder_path. None if it doesn't exist."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        parent_id = await _find_folder(client, access_token, folder_path)
        if parent_id is None:
            return None
        existing = await _find_file(client, access_token, parent_id, filename)
        if not existing:
            return None
        response = await _request(
            client, "GET", f"{_DRIVE_API}/files/{quote(existing['id'], safe='')}", access_token,
            params={"alt": "media"},
        )
        try:
            data = response.json()
        except ValueError:
            return None
        return data if isinstance(data, dict) else None


async def write_json_file(access_token: str, folder_path: str, filename: str, data: dict[str, Any]) -> None:
    """Create or overwrite one "<name>.json" file with `data`."""
    encoded = json.dumps(data, separators=(",", ":"))
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        parent_id = await _get_or_create_folder(client, access_token, folder_path)
        existing = await _find_file(client, access_token, parent_id, filename)
        if existing:
            await _request(
                client, "PATCH", f"{_DRIVE_UPLOAD}/files/{quote(existing['id'], safe='')}", access_token,
                params={"uploadType": "media"}, content=encoded, content_type="application/json",
            )
            return
        await _create_file(client, access_token, parent_id, filename, encoded, "application/json")


async def delete_json_file(access_token: str, folder_path: str, filename: str) -> None:
    """No-op if the file doesn't exist — deleting an already-absent record isn't an error."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        parent_id = await _find_folder(client, access_token, folder_path)
        if parent_id is None:
            return
        existing = await _find_file(client, access_token, parent_id, filename)
        if not existing:
            return
        await _request(client, "DELETE", f"{_DRIVE_API}/files/{quote(existing['id'], safe='')}", access_token)


async def list_json_files(access_token: str, folder_path: str) -> dict[str, dict[str, Any]]:
    """Read every "*.json" file in folder_path in parallel. Returns
    {filename stem (no ".json"): content} — the caller treats the stem as
    the record's id (e.g. a task id)."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        parent_id = await _find_folder(client, access_token, folder_path)
        if parent_id is None:
            return {}
        listing = await _request(
            client, "GET", f"{_DRIVE_API}/files", access_token,
            params={
                "q": f"'{parent_id}' in parents and trashed = false and name contains '.json'",
                "fields": "files(id,name)",
                "pageSize": 1000,
            },
        )
        files = [f for f in listing.json().get("files", []) if str(f.get("name", "")).endswith(".json")]

        async def read_one(file: dict[str, Any]) -> tuple[str, dict[str, Any]] | None:
            response = await _request(
                client, "GET", f"{_DRIVE_API}/files/{quote(str(file['id']), safe='')}", access_token,
                params={"alt": "media"},
            )
            try:
                data = response.json()
            except ValueError:
                return None
            if not isinstance(data, dict):
                return None
            return str(file["name"])[: -len(".json")], data

        results = await asyncio.gather(*(read_one(f) for f in files))
    return dict(entry for entry in results if entry is not None)
