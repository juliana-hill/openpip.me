"""google_drive_docs.py has never had a pytest file before — it was only
verified with ad-hoc scripts during development. Adding real coverage now,
specifically for the folder-creation race that produced duplicate "OpenPip"
folders in a real account (see _segment_lock's docstring)."""

import asyncio
import json
import re

import httpx

from openpip_backend import google_drive_docs as gdd


def _fake_drive(folders: dict, files: dict, create_calls: list):
    """A tiny in-memory fake of the Drive endpoints google_drive_docs.py
    calls, shared by both tests below. `folders`/`files` are (parent, name)
    -> id maps; `create_calls` records every folder POST so a test can
    assert exactly one happened even when many callers raced for it."""

    async def fake_send(self, request, **kwargs):
        method, url = request.method, str(request.url)
        parsed = httpx.URL(url)
        query = dict(httpx.QueryParams(parsed.query))
        body = request.content.decode("utf-8", "ignore") if request.content else ""

        if method == "GET" and parsed.path == "/drive/v3/files" and "q" in query:
            q = query["q"]
            name_match = re.search(r"name = '((?:[^'\\]|\\.)*)'", q)
            parent_match = re.search(r"'([^']*)' in parents", q)
            name = name_match.group(1).replace("\\'", "'") if name_match else None
            parent = parent_match.group(1) if parent_match else "root"
            if "mimeType = 'application/vnd.google-apps.folder'" in q:
                fid = folders.get((parent, name))
                return httpx.Response(200, json={"files": [{"id": fid}]} if fid else {"files": []}, request=request)
            f = files.get((parent, name))
            return httpx.Response(200, json={"files": [{"id": f["id"], "webViewLink": f"https://drive/{f['id']}"}]} if f else {"files": []}, request=request)
        if method == "POST" and parsed.path == "/drive/v3/files":
            payload = json.loads(body)
            create_calls.append((payload["parents"][0], payload["name"]))
            fid = f"folder-{len(create_calls)}"
            folders[(payload["parents"][0], payload["name"])] = fid
            return httpx.Response(200, json={"id": fid}, request=request)
        if method == "POST" and parsed.path == "/upload/drive/v3/files":
            meta_match = re.search(r"Content-Type: application/json.*?\r\n\r\n(\{.*?\})\r\n--", body, re.S)
            meta = json.loads(meta_match.group(1))
            content_match = re.search(r"Content-Type: (?:text/plain|application/json)\r\n\r\n(.*?)\r\n--[^-]", body, re.S)
            content = content_match.group(1) if content_match else ""
            fid = f"file-{len(files) + 1}"
            files[(meta["parents"][0], meta["name"])] = {"id": fid, "content": content}
            return httpx.Response(200, json={"id": fid, "webViewLink": f"https://drive/{fid}"}, request=request)
        if method == "PATCH" and parsed.path.startswith("/upload/drive/v3/files/"):
            fid = parsed.path.rsplit("/", 1)[-1]
            for f in files.values():
                if f["id"] == fid:
                    f["content"] = body
                    return httpx.Response(200, json={"id": fid}, request=request)
            return httpx.Response(404, json={"error": "not found"}, request=request)
        if method == "GET" and parsed.path.startswith("/drive/v3/files/") and query.get("alt") == "media":
            fid = parsed.path.rsplit("/", 1)[-1]
            for f in files.values():
                if f["id"] == fid:
                    return httpx.Response(200, text=f["content"], request=request)
            return httpx.Response(404, json={"error": "not found"}, request=request)
        return httpx.Response(404, json={"error": f"unhandled {method} {parsed.path} q={query}"}, request=request)

    return fake_send


def test_concurrent_calls_never_create_a_duplicate_folder(monkeypatch) -> None:
    folders: dict = {}
    files: dict = {}
    create_calls: list = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fake_drive(folders, files, create_calls))
    # A fresh module-level lock table per test — otherwise an earlier test's
    # locks (keyed by (parent_id, name), both "root" here) would still be
    # held/resolved and this test would pass for the wrong reason.
    gdd._segment_locks.clear()

    async def main():
        # Ten concurrent callers all racing to resolve the same not-yet-
        # existing "OpenPip" folder under root — the exact shape of the race
        # that produced 4 duplicate folders in a real account.
        results = await asyncio.gather(*(
            gdd.get_or_create_document("token", "OpenPip", f"doc{i}.md", f"content {i}")
            for i in range(10)
        ))
        return results

    results = asyncio.run(main())
    assert len(results) == 10
    # Exactly one "OpenPip" folder was ever created, despite ten concurrent callers.
    assert create_calls.count(("root", "OpenPip")) == 1
    assert len([name for (_parent, name) in folders if name == "OpenPip"]) == 1


def test_get_or_create_document_reads_existing_content_without_recreating(monkeypatch) -> None:
    folders: dict = {}
    files: dict = {}
    create_calls: list = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fake_drive(folders, files, create_calls))
    gdd._segment_locks.clear()

    url1, content1 = asyncio.run(gdd.get_or_create_document("token", "OpenPip", "agent.md", "sample default"))
    assert content1 == "sample default"

    url2, content2 = asyncio.run(gdd.get_or_create_document("token", "OpenPip", "agent.md", "sample default"))
    assert url2 == url1
    assert content2 == "sample default"
    assert create_calls.count(("root", "OpenPip")) == 1


def test_drive_read_timeout_retries_idempotent_request(monkeypatch) -> None:
    calls = 0

    async def fake_send(self, request, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 1:
            raise httpx.ReadTimeout("temporary Drive timeout", request=request)
        return httpx.Response(200, json={"files": []}, request=request)

    monkeypatch.setattr(httpx.AsyncClient, "send", fake_send)
    gdd._segment_locks.clear()

    result = asyncio.run(gdd.read_json_file("token", "OpenPip/memory", "status.json"))

    assert result is None
    assert calls == 2


def test_drive_create_timeout_rechecks_before_retrying(monkeypatch) -> None:
    find_calls = 0
    post_calls = 0

    async def fake_find_file(*_args, **_kwargs):
        nonlocal find_calls
        find_calls += 1
        if find_calls == 1:
            return {"id": "created-before-timeout", "webViewLink": "https://drive/file"}
        return None

    async def fake_post(self, url, **kwargs):
        nonlocal post_calls
        post_calls += 1
        raise httpx.ReadTimeout("temporary Drive timeout", request=httpx.Request("POST", url))

    monkeypatch.setattr(gdd, "_find_file", fake_find_file)
    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)

    async def run() -> dict[str, str]:
        async with httpx.AsyncClient() as client:
            return await gdd._create_file(client, "token", "folder", "2026-09-10.json", "{}", "application/json")

    result = asyncio.run(run())

    assert result == {"id": "created-before-timeout", "webViewLink": "https://drive/file"}
    assert post_calls == 1
    assert find_calls == 1


def test_list_json_files_follows_drive_pagination(monkeypatch) -> None:
    requests: list[dict[str, object]] = []
    page_files = {
        None: [
            {"id": "file-1", "name": "2024-01-01.json"},
            {"id": "file-2", "name": "metadata.json"},
        ],
        "page-2": [
            {"id": "file-3", "name": "2024-01-02.json"},
        ],
    }
    contents = {
        "file-1": {"records": 1},
        "file-2": {"schema": 1},
        "file-3": {"records": 2},
    }

    async def fake_find_folder(*_args, **_kwargs):
        return "manifest-folder"

    async def fake_request(_client, method, url, _access_token, *, params=None, **_kwargs):
        params = params or {}
        requests.append({"method": method, "url": url, "params": params})
        if url.endswith("/files"):
            page_token = params.get("pageToken")
            files = page_files[page_token]
            payload = {"files": files}
            if page_token is None:
                payload["nextPageToken"] = "page-2"
            return httpx.Response(200, json=payload)
        file_id = url.rsplit("/", 1)[-1]
        return httpx.Response(200, json=contents[file_id])

    monkeypatch.setattr(gdd, "_find_folder", fake_find_folder)
    monkeypatch.setattr(gdd, "_request", fake_request)

    result = asyncio.run(gdd.list_json_files("token", "OpenPip/manifest"))

    assert result == {
        "2024-01-01": {"records": 1},
        "metadata": {"schema": 1},
        "2024-01-02": {"records": 2},
    }
    list_requests = [request for request in requests if str(request["url"]).endswith("/files")]
    assert len(list_requests) == 2
    assert list_requests[0]["params"]["fields"] == "nextPageToken,files(id,name)"
    assert list_requests[1]["params"]["pageToken"] == "page-2"


def test_overwrite_document_replaces_existing_content(monkeypatch) -> None:
    folders: dict = {}
    files: dict = {}
    create_calls: list = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fake_drive(folders, files, create_calls))
    gdd._segment_locks.clear()

    asyncio.run(gdd.get_or_create_document("token", "OpenPip", "agent.md", "old template"))
    asyncio.run(gdd.overwrite_document("token", "OpenPip", "agent.md", "new template"))
    _, content = asyncio.run(gdd.get_or_create_document("token", "OpenPip", "agent.md", "old template"))
    assert content == "new template"
