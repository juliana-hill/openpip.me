"""Real, visible-in-Drive text documents — distinct from google_drive_store.py's
single hidden appDataFolder JSON blob. This is for the Agent & Guidelines
documents (agent.md, goals-n-guidelines/*.md): the user opens and edits these
directly in their own Drive, in a real "OpenPip" folder, so they need the
drive.file scope (see google_oauth.py) rather than drive.appdata.

Ported from ~/Projects/Personal/travel-agent's agent/src/tools/google-drive.ts
(that project's Node/TypeScript backend) — same folder-walk-then-find-or-create
design, reimplemented against this backend's httpx/async style. Files are
stored as plain text/plain (not Google Docs) so reading them back is a direct
`alt=media` fetch, no export/conversion step — this backend needs their
content as pure text to fold into agent prompts, not just a place to click
"open".
"""

from __future__ import annotations

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
) -> httpx.Response:
    response = await client.request(
        method,
        url,
        params=params,
        json=json_body,
        content=content,
        headers={
            "Authorization": f"Bearer {access_token}",
            **({"Content-Type": "text/plain"} if content is not None else {}),
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


async def _get_or_create_folder(client: httpx.AsyncClient, access_token: str, folder_path: str) -> str:
    """Walk a "/"-separated folder path from Drive's root, creating any
    missing segment. Returns the deepest folder's id ("root" for an empty path)."""
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


async def _find_text_file(client: httpx.AsyncClient, access_token: str, parent_id: str, filename: str) -> dict[str, str] | None:
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


async def get_or_create_document(access_token: str, folder_path: str, filename: str, initial_content: str) -> tuple[str, str]:
    """Find-or-create a plain-text document at folder_path/filename in the
    user's Drive. Returns (driveUrl, content) — content is what's actually in
    Drive for an existing file, or initial_content for one just created."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        parent_id = await _get_or_create_folder(client, access_token, folder_path)
        existing = await _find_text_file(client, access_token, parent_id, filename)
        if existing:
            content_response = await _request(
                client, "GET", f"{_DRIVE_API}/files/{quote(existing['id'], safe='')}", access_token,
                params={"alt": "media"},
            )
            return existing["webViewLink"], content_response.text
        # Multipart upload (metadata + content in one request) so the file is
        # created with its initial text in a single round trip.
        boundary = "openpip-drive-doc-boundary"
        multipart_body = (
            f"--{boundary}\r\n"
            "Content-Type: application/json; charset=UTF-8\r\n\r\n"
            f'{{"name": "{filename}", "mimeType": "text/plain", "parents": ["{parent_id}"]}}\r\n'
            f"--{boundary}\r\n"
            "Content-Type: text/plain\r\n\r\n"
            f"{initial_content}\r\n"
            f"--{boundary}--"
        )
        response = await client.post(
            f"{_DRIVE_UPLOAD}/files",
            params={"uploadType": "multipart", "fields": "webViewLink"},
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
        return str(response.json().get("webViewLink") or ""), initial_content
