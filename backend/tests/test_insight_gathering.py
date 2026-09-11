import asyncio
from datetime import date

from openpip_backend import insight_gathering
from openpip_backend.google_workspace import GoogleApiError


def test_agent_pages_are_oldest_first_and_do_not_mix_days() -> None:
    entries = [
        {"record": {"sourceId": "email:old-2", "date": "2022-01-01T12:00:00Z"}, "reference": {"id": "email:old-2"}},
        {"record": {"sourceId": "email:new", "date": "2022-01-02T09:00:00Z"}, "reference": {"id": "email:new"}},
        {"record": {"sourceId": "email:old-1", "date": "2022-01-01T08:00:00Z"}, "reference": {"id": "email:old-1"}},
    ]
    ordered = insight_gathering._chronological(entries)

    first = insight_gathering._next_daily_page(ordered, 0)
    second = insight_gathering._next_daily_page(ordered, len(first))

    assert [item["record"]["sourceId"] for item in first] == ["email:old-1", "email:old-2"]
    assert [item["record"]["sourceId"] for item in second] == ["email:new"]


def test_memory_prompt_keeps_work_spans_and_personal_profile_facts() -> None:
    prompt = insight_gathering._prompt(
        "all summarized history for 2021-01-02",
        [{
            "record": {"sourceId": "calendar:work-1", "date": "2021-01-02", "summary": "Work at Acme"},
            "reference": {"id": "calendar:work-1", "kind": "calendar", "label": "Work"},
        }],
    )

    assert "earliest event as the observed start" in prompt
    assert "latest event as the observed end" in prompt
    assert "self-described personality" in prompt
    assert "official assessment" in prompt
    assert "Do not infer personality traits" in prompt
    assert "purchase cadence" in prompt
    assert "last observed purchase date" in prompt
    assert "syllabus" in prompt
    assert "chronological narrative" in prompt


def test_start_is_idempotent_after_completion(monkeypatch) -> None:
    completed = {
        "state": "completed", "runId": "run-1", "stages": {},
        "progress": 100, "insightsWritten": 4, "events": [],
    }

    async def fake_read(_token: str, _folder: str, _filename: str):
        return completed

    monkeypatch.setattr(insight_gathering, "read_json_file", fake_read)

    result = asyncio.run(insight_gathering.start_insight_gathering("token"))

    assert result["state"] == "completed"
    assert result["runId"] == "run-1"
    assert not insight_gathering._jobs


def test_status_requeues_a_persisted_run_after_worker_restart(monkeypatch) -> None:
    stale = {"state": "running", "runId": "run-1"}
    resumed = {**stale, "state": "queued", "statusMessage": "Resuming the historical review."}

    async def fake_read(_token: str):
        return stale

    async def fake_start(_token: str):
        return resumed

    monkeypatch.setattr(insight_gathering, "_read_status", fake_read)
    monkeypatch.setattr(insight_gathering, "start_insight_gathering", fake_start)

    result = asyncio.run(insight_gathering.get_insight_gathering_status("token"))

    assert result["state"] == "queued"
    assert result["statusMessage"] == "Resuming the historical review."


def test_worker_refreshes_expired_session_token_and_resumes(monkeypatch) -> None:
    calls: list[str] = []
    writes: list[str] = []

    async def fake_read_status(_token: str):
        return insight_gathering._default_status()

    async def fake_write_status(token: str, _status: dict):
        writes.append(token)

    async def fake_app_data(_token: str):
        return {"userData": {}}

    async def fake_context(_token: str):
        return ""

    async def fake_run_lazy(token: str, _status: dict, _context: str, _agent_name: str):
        calls.append(token)
        if len(calls) == 1:
            raise GoogleApiError(401, "expired access token")

    async def fake_resolve():
        return "fresh-token"

    monkeypatch.setattr(insight_gathering, "_read_status", fake_read_status)
    monkeypatch.setattr(insight_gathering, "_write_status", fake_write_status)
    monkeypatch.setattr(insight_gathering, "read_drive_app_data", fake_app_data)
    monkeypatch.setattr(insight_gathering, "load_context_documents", fake_context)
    monkeypatch.setattr(insight_gathering, "_run_lazy", fake_run_lazy)

    asyncio.run(insight_gathering._run(
        "expired-token", "run-1", owner_key="session-1", token_resolver=fake_resolve,
    ))

    assert calls == ["expired-token", "fresh-token"]
    assert "fresh-token" in writes
    assert insight_gathering._owner("expired-token", "session-1") not in insight_gathering._active_jobs


def test_progress_uses_oldest_newest_date_span_and_current_date() -> None:
    status = {
        "oldestSourceDates": {"emails": "2021-01-01", "calendar": "2021-01-01"},
        "newestSourceDates": {"emails": "2021-01-03", "calendar": "2021-01-03"},
        "currentDate": "2021-01-01",
        "stages": {"history": {"status": "running", "processed": 0, "total": 0}},
    }

    # The global span is January 1-3, 2021, calculated across collection
    # types. History accounts for 80% of the pipeline, so the first current
    # date is one third of that stage.
    assert insight_gathering._progress(status) == 27

    status["currentDate"] = "2021-01-02"
    assert insight_gathering._progress(status) == 53


def test_normalize_index_record_drops_legacy_raw_payload() -> None:
    normalized = insight_gathering._normalize_index_record({
        "record": {
            "sourceId": "email:1",
            "date": "2020-11-17T12:00:00Z",
            "body": "private source body",
        },
        "reference": {"id": "email:1", "kind": "email", "label": "Subject"},
    })

    assert normalized is not None
    assert normalized["sourceId"] == "email:1"
    assert "body" not in normalized
    assert normalized["status"] == "in_progress"


def test_document_index_uses_modified_date_for_daily_manifest() -> None:
    normalized = insight_gathering._normalize_index_record({
        "record": {
            "sourceId": "document:1",
            "modifiedTime": "2021-01-02T15:00:00Z",
            "name": "Offer letter",
        },
        "reference": {"id": "document:1", "kind": "google_doc", "label": "Offer letter"},
    })

    assert normalized is not None
    assert normalized["date"] == "2021-01-02"


def test_daily_index_summary_is_only_the_record_title() -> None:
    email = {
        "record": {
            "sourceId": "email:1",
            "subject": "Scout offer",
            "body": "A complete private message body that indexing must not read.",
        },
        "reference": {"id": "email:1", "kind": "email", "label": "Scout offer"},
    }
    document = {
        "record": {
            "sourceId": "document:1",
            "name": "Brief Timeline",
            "content": "A complete private document that indexing must not read.",
        },
        "reference": {"id": "document:1", "kind": "google_doc", "label": "Brief Timeline"},
    }

    assert insight_gathering._brief_record_summary(email) == "Scout offer"
    assert insight_gathering._brief_record_summary(document) == "Brief Timeline"


def test_read_manifest_entries_normalizes_flat_index_records(monkeypatch) -> None:
    async def fake_list(_token: str, _folder: str):
        return {
            "metadata": {},
            "2021-01-02": {
                "pages": [{"page": 1, "entries": [{
                    "sourceId": "document:1", "kind": "google_doc", "date": "2021-01-02",
                    "label": "Brief Timeline", "summary": "Brief Timeline", "status": "completed",
                }]}],
            },
        }

    monkeypatch.setattr(insight_gathering, "list_json_files", fake_list)

    entries = asyncio.run(insight_gathering._read_manifest_entries("token"))

    assert entries == [{
        "sourceId": "document:1", "kind": "google_doc", "date": "2021-01-02",
        "label": "Brief Timeline", "detail": None, "url": None, "providerId": None,
        "status": "completed", "summary": "Brief Timeline",
    }]


def test_aggregate_phase_is_the_only_agentic_memory_pass(monkeypatch) -> None:
    entries = [{
        "sourceId": "calendar:work", "kind": "calendar", "date": "2021-09-13",
        "label": "Work", "detail": "2021-09-13T09:00:00Z", "url": None,
        "providerId": "calendar-1", "status": "completed", "summary": "Work",
    }]
    prompts: list[str] = []

    async def fake_manifest_entries(_token: str):
        return entries

    async def fake_write(_token: str, _folder: str, _filename: str, _data: dict):
        return None

    async def fake_write_status(_token: str, _status: dict):
        return None

    def fake_build(*_args, **_kwargs):
        return object()

    async def fake_stream(_agent, prompt: str, _status: dict, _token: str):
        prompts.append(prompt)

    monkeypatch.setattr(insight_gathering, "_read_manifest_entries", fake_manifest_entries)
    monkeypatch.setattr(insight_gathering, "write_json_file", fake_write)
    monkeypatch.setattr(insight_gathering, "_write_status", fake_write_status)
    monkeypatch.setattr(insight_gathering, "build_executive_assistant", fake_build)
    monkeypatch.setattr(insight_gathering, "_stream_agent_page", fake_stream)

    status = insight_gathering._default_status()
    manifest = {"aggregateStatus": "pending"}
    asyncio.run(insight_gathering._run_aggregate("token", status, manifest, "", "Pip"))

    assert len(prompts) == 1
    assert "list_historical_sources repeatedly" in prompts[0]
    assert "remember_historical_insight as the write tool" in prompts[0]
    assert "canonical output" in prompts[0]
    assert status["stages"]["aggregate"] == {"status": "completed", "processed": 1, "total": 1}
    assert manifest["aggregateStatus"] == "completed"


def test_write_lazy_date_index_persists_only_index_fields(monkeypatch) -> None:
    saved: dict[str, object] = {}

    async def fake_write(_token: str, _folder: str, filename: str, data: dict):
        saved[filename] = data

    monkeypatch.setattr(insight_gathering, "write_json_file", fake_write)

    asyncio.run(insight_gathering._write_lazy_date_index(
        "token",
        {"dateStates": {"2020-11-17": "indexing"}},
        "2020-11-17",
        {
            "email:1": {
                "sourceId": "email:1", "kind": "email", "date": "2020-11-17",
                "status": "completed", "summary": "A brief summary", "body": "must not persist",
            },
        },
    ))

    date_file = saved["2020-11-17.json"]
    assert date_file["status"] == "indexing"
    entry = date_file["pages"][0]["entries"][0]
    assert entry["status"] == "completed"
    assert entry["summary"] == "A brief summary"
    assert "body" not in entry


def test_write_lazy_date_index_omits_empty_dates(monkeypatch) -> None:
    writes: list[str] = []
    deletes: list[str] = []

    async def fake_write(_token: str, _folder: str, filename: str, _data: dict):
        writes.append(filename)

    async def fake_delete(_token: str, _folder: str, filename: str):
        deletes.append(filename)

    monkeypatch.setattr(insight_gathering, "write_json_file", fake_write)
    monkeypatch.setattr(insight_gathering, "delete_json_file", fake_delete)

    asyncio.run(insight_gathering._write_lazy_date_index(
        "token", {"dateStates": {"2020-11-18": "completed"}}, "2020-11-18", {},
    ))

    assert writes == []
    assert deletes == ["2020-11-18.json"]


def test_collect_manifest_metadata_contains_pointers_not_records(monkeypatch) -> None:
    async def fake_boundary(*_args, **_kwargs):
        return date(2021, 1, 1)

    async def fake_write_status(_token: str, _status: dict):
        return None

    async def fake_write_json(_token: str, _folder: str, filename: str, data: dict):
        if filename == "metadata.json":
            captured.update(data)

    captured: dict = {}
    for name in (
        "find_oldest_gmail_date", "find_newest_gmail_date",
        "find_oldest_calendar_date", "find_newest_calendar_date",
        "find_oldest_drive_document_date", "find_newest_drive_document_date",
    ):
        monkeypatch.setattr(insight_gathering, name, fake_boundary)
    monkeypatch.setattr(insight_gathering, "_write_status", fake_write_status)
    monkeypatch.setattr(insight_gathering, "write_json_file", fake_write_json)

    asyncio.run(insight_gathering._collect_manifest("token", insight_gathering._default_status()))

    assert captured["oldestSourceDates"]["emails"] == "2021-01-01"
    assert captured["newestSourceDates"]["calendar"] == "2021-01-01"
    assert captured["oldestDate"] == "2021-01-01"
    assert captured["newestDate"] == date.today().isoformat()
    assert captured["currentDate"] == "2021-01-01"
    assert "sourceCursors" not in captured
    assert "sources" not in captured
    assert "numberOfEntries" not in captured


def test_daily_pointer_advances_one_day_until_newest_date() -> None:
    manifest = {
        "oldestDate": "2021-01-01",
        "newestDate": "2021-01-03",
        "currentDate": "2021-01-01",
    }

    insight_gathering._advance_daily_date(date(2021, 1, 1), manifest)
    assert manifest["currentDate"] == "2021-01-02"

    insight_gathering._advance_daily_date(date(2021, 1, 2), manifest)
    assert manifest["currentDate"] == "2021-01-03"

    insight_gathering._advance_daily_date(date(2021, 1, 3), manifest)
    assert manifest["currentDate"] is None
    assert manifest["lastFetchedDate"] == "2021-01-03"


def test_fetch_lazy_day_uses_exact_daily_bounds_not_next_nonempty_cursor(monkeypatch) -> None:
    calls: list[tuple[str, str]] = []

    async def fake_gmail(*_args, **kwargs):
        calls.append(("emails", kwargs["local_date"]))
        return ([{"id": "message-1", "date": "2021-01-02T12:00:00Z", "subject": "Subject"}], 1)

    async def fake_calendar(*_args, **kwargs):
        calls.append(("calendar", kwargs["from_date"]))
        return []

    async def fake_documents(*_args, **kwargs):
        calls.append(("documents", kwargs["modified_start"].isoformat()))
        return []

    async def fake_tasks(*_args, **_kwargs):
        calls.append(("tasks", "2021-01-02"))
        return []

    async def fake_contacts(*_args, **_kwargs):
        calls.append(("contacts", "2021-01-02"))
        return {}

    monkeypatch.setattr(insight_gathering, "fetch_gmail_messages", fake_gmail)
    monkeypatch.setattr(insight_gathering, "fetch_google_calendars", fake_calendar)
    monkeypatch.setattr(insight_gathering, "fetch_google_drive_documents", fake_documents)
    monkeypatch.setattr(insight_gathering, "fetch_google_tasks", fake_tasks)
    monkeypatch.setattr(insight_gathering, "fetch_google_contacts", fake_contacts)

    manifest = {
        "oldestSourceDates": {
            "emails": "2021-01-01", "calendar": "2021-01-03",
            "documents": "2021-01-02", "tasks": "2021-01-02", "contacts": "2021-01-02",
        },
        "newestSourceDates": {
            "emails": "2021-01-03", "calendar": "2021-01-03",
            "documents": "2021-01-02", "tasks": "2021-01-02", "contacts": "2021-01-02",
        },
    }

    entries = asyncio.run(insight_gathering._fetch_lazy_day("token", date(2021, 1, 2), manifest))

    assert {source for source, _ in calls} == {"emails", "documents", "tasks", "contacts"}
    assert ("emails", "2021-01-02") in calls
    assert ("documents", "2021-01-02") in calls
    assert not any(source == "calendar" for source, _ in calls)
    assert entries[0]["reference"]["id"] == "email:message-1"
