"""google_drive_store.py's app-data document was renamed from
"OpenPip App Data.json" to "user_settings.json". Accounts that already wrote
the old-named file (in the hidden, per-user appDataFolder space) must not
appear to have lost their settings — _find_file falls back to the legacy
name and migrates the file in place. Covering that here since it is exactly
the kind of thing a plain rename silently breaks."""

import json
import re

import httpx

from openpip_backend import google_drive_store as gds


def _fake_drive(files: dict, rename_calls: list, create_calls: list):
    """A tiny in-memory fake of the appDataFolder-space endpoints
    google_drive_store.py calls. `files` maps id -> {"name", "content"}."""

    async def fake_send(self, request, **kwargs):
        method, url = request.method, str(request.url)
        parsed = httpx.URL(url)
        query = dict(httpx.QueryParams(parsed.query))
        body = request.content.decode("utf-8", "ignore") if request.content else ""

        if method == "GET" and parsed.path == "/drive/v3/files":
            name_match = re.search(r"name = '((?:[^'\\]|\\.)*)'", query.get("q", ""))
            name = name_match.group(1).replace("\\'", "'") if name_match else None
            match = next((fid for fid, f in files.items() if f["name"] == name), None)
            return httpx.Response(200, json={"files": [{"id": match}]} if match else {"files": []}, request=request)
        if method == "POST" and parsed.path == "/drive/v3/files":
            payload = json.loads(body)
            fid = f"file-{len(files) + 1}"
            files[fid] = {"name": payload["name"], "content": ""}
            create_calls.append(payload["name"])
            return httpx.Response(200, json={"id": fid}, request=request)
        if method == "PATCH" and parsed.path.startswith("/drive/v3/files/"):
            # Plain metadata PATCH (rename) — distinct from the /upload/ path below.
            fid = parsed.path.rsplit("/", 1)[-1]
            payload = json.loads(body)
            rename_calls.append((fid, payload["name"]))
            files[fid]["name"] = payload["name"]
            return httpx.Response(200, json={"id": fid}, request=request)
        if method == "PATCH" and parsed.path.startswith("/upload/drive/v3/files/"):
            fid = parsed.path.rsplit("/", 1)[-1]
            files[fid]["content"] = body
            return httpx.Response(200, json={"id": fid}, request=request)
        if method == "GET" and parsed.path.startswith("/drive/v3/files/") and query.get("alt") == "media":
            fid = parsed.path.rsplit("/", 1)[-1]
            return httpx.Response(200, text=files[fid]["content"], request=request)
        return httpx.Response(404, json={"error": f"unhandled {method} {parsed.path} q={query}"}, request=request)

    return fake_send


def test_read_migrates_the_pre_rename_filename_instead_of_orphaning_it(monkeypatch) -> None:
    saved = {"version": 1, "tags": [], "messageTags": {}, "userData": {"agentName": "Juno", "theme": "dark"}}
    files = {"file-1": {"name": gds._LEGACY_APP_DATA_FILE, "content": json.dumps(saved)}}
    rename_calls: list = []
    create_calls: list = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fake_drive(files, rename_calls, create_calls))

    import asyncio
    data = asyncio.run(gds.read_drive_app_data("token"))

    # The real settings come back — nothing was lost by the rename.
    assert data["userData"] == {"agentName": "Juno", "theme": "dark"}
    # The file was migrated in place, not duplicated under the new name.
    assert rename_calls == [("file-1", gds._APP_DATA_FILE)]
    assert not create_calls
    assert len(files) == 1
    assert files["file-1"]["name"] == gds._APP_DATA_FILE


def test_write_creates_the_new_filename_when_no_file_exists_yet(monkeypatch) -> None:
    files: dict = {}
    rename_calls: list = []
    create_calls: list = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fake_drive(files, rename_calls, create_calls))

    import asyncio
    asyncio.run(gds.write_drive_app_data("token", {"userData": {"agentName": "Nova"}}))

    assert create_calls == [gds._APP_DATA_FILE]
    assert not rename_calls
