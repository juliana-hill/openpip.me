"""Small read-first clients for the Google APIs used by the workspace views."""

from __future__ import annotations

import asyncio
import base64
from datetime import UTC, date, datetime, timedelta
from email.message import EmailMessage
from email.utils import parseaddr
from typing import Any, Awaitable, Callable
from urllib.parse import quote

import httpx


class GoogleApiError(RuntimeError):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


GOOGLE_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


async def _get_json(client: httpx.AsyncClient, url: str, access_token: str, **params: Any) -> dict[str, Any]:
    response = await _get_response(client, url, access_token, **params)
    if not response.is_success:
        try:
            payload = response.json()
            detail = payload.get("error", {}).get("message") or payload.get("error") or response.text
        except ValueError:
            detail = response.text
        raise GoogleApiError(response.status_code, str(detail)[:500])
    return response.json()


async def _get_response(client: httpx.AsyncClient, url: str, access_token: str, **params: Any) -> httpx.Response:
    """Fetch a Google read endpoint with bounded retries for transient failures."""
    response: httpx.Response | None = None
    for attempt in range(3):
        try:
            response = await client.get(
                url,
                params=params,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        except (httpx.TimeoutException, httpx.NetworkError):
            if attempt == 2:
                raise
            await asyncio.sleep(0.5 * (2 ** attempt))
            continue
        if response.status_code not in {429, 500, 502, 503, 504} or attempt == 2:
            break
        retry_after = response.headers.get("Retry-After")
        try:
            delay = max(0.25, min(float(retry_after or 0.5), 3.0))
        except ValueError:
            delay = 0.5 * (2 ** attempt)
        await asyncio.sleep(delay)
    assert response is not None
    return response


async def _request_json(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    access_token: str,
    *,
    json_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Call a Google JSON endpoint and normalize API errors."""
    response = await client.request(
        method,
        url,
        json=json_body,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if not response.is_success:
        try:
            payload = response.json()
            detail = payload.get("error", {}).get("message") or payload.get("error") or response.text
        except ValueError:
            detail = response.text
        raise GoogleApiError(response.status_code, str(detail)[:500])
    if not response.content:
        return {}
    return response.json()


async def fetch_google_tasks(access_token: str, *, include_completed: bool = False) -> list[dict[str, Any]]:
    """Fetch the user's Google Tasks lists and flatten their tasks."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        lists: list[dict[str, Any]] = []
        list_page_token: str | None = None
        while True:
            list_payload = await _get_json(
                client,
                "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
                access_token,
                maxResults=100,
                **({"pageToken": list_page_token} if list_page_token else {}),
            )
            lists.extend(item for item in list_payload.get("items", []) if isinstance(item, dict))
            list_page_token = list_payload.get("nextPageToken")
            if not list_page_token or not list_payload.get("items"):
                break

        async def fetch_list(task_list: dict[str, Any]) -> list[dict[str, Any]]:
            list_id = task_list.get("id")
            if not list_id:
                return []
            result: list[dict[str, Any]] = []
            page_token: str | None = None
            while True:
                payload = await _get_json(
                    client,
                    f"https://tasks.googleapis.com/tasks/v1/lists/{list_id}/tasks",
                    access_token,
                    showCompleted=str(include_completed).lower(),
                    showHidden="false",
                    maxResults=100,
                    **({"pageToken": page_token} if page_token else {}),
                )
                for task in payload.get("items", []):
                    if not task.get("id") or not task.get("title"):
                        continue
                    completed = task.get("status") == "completed"
                    if completed and not include_completed:
                        continue
                    result.append(
                        {
                            "id": task["id"],
                            "source": "google",
                            "title": task["title"],
                            "notes": task.get("notes"),
                            "completed": completed,
                            "status": {"name": "Completed" if completed else "Todo", "isResolvedStatus": completed},
                            "due": task.get("due"),
                            "dueDate": task.get("due", "")[:10] or None,
                            "scheduledStart": None,
                            "duration": None,
                            "projectName": task_list.get("title", ""),
                            "listId": list_id,
                            "listName": task_list.get("title", ""),
                            "priority": _priority_for_list(task_list.get("title", "")),
                        }
                    )
                page_token = payload.get("nextPageToken")
                if not page_token or not payload.get("items"):
                    break
            return result

        batches = await asyncio.gather(*(fetch_list(task_list) for task_list in lists))
        return [task for batch in batches for task in batch]


async def fetch_google_task(access_token: str, list_id: str, task_id: str) -> dict[str, Any]:
    """Fetch one complete Google Task for the final memory pass."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        payload = await _get_json(
            client,
            f"https://tasks.googleapis.com/tasks/v1/lists/{quote(list_id, safe='')}/tasks/{quote(task_id, safe='')}",
            access_token,
        )
    return payload


def _priority_for_list(name: str) -> str:
    normalized = name.strip().lower()
    return {"asap": "ASAP", "high": "HIGH", "medium": "MEDIUM", "low": "LOW"}.get(normalized, "MEDIUM")


async def fetch_google_notebook_pages(access_token: str) -> list[dict[str, Any]]:
    """Represent Google Tasks lists as the notebook pages used by the UI."""
    tasks = await fetch_google_tasks(access_token, include_completed=True)
    pages: dict[str, dict[str, Any]] = {}
    for task in tasks:
        page = pages.setdefault(
            task["listId"],
            {
                "id": task["listId"],
                "title": task["listName"],
                "notes": None,
                "reminderAt": None,
                "items": [],
            },
        )
        page["items"].append(
            {
                "id": task["id"],
                "title": task["title"],
                "notes": task.get("notes"),
                "completed": task["completed"],
                "due": task.get("due"),
            }
        )
    return list(pages.values())


async def fetch_google_drive_files(access_token: str, *, page_size: int = 50) -> list[dict[str, Any]]:
    """Fetch the user's recent Google Drive files for the Notebook view."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        payload = await _get_json(
            client,
            "https://www.googleapis.com/drive/v3/files",
            access_token,
            q="trashed = false",
            pageSize=max(1, min(page_size, 100)),
            orderBy="modifiedTime desc",
            fields="files(id,name,mimeType,webViewLink,modifiedTime)",
        )
    return [
        {
            "id": file["id"],
            "name": file.get("name") or "Untitled file",
            "mimeType": file.get("mimeType") or "application/octet-stream",
            "webViewLink": file.get("webViewLink") or "https://drive.google.com/drive/my-drive",
            "modifiedTime": file.get("modifiedTime") or datetime.now(UTC).isoformat(),
        }
        for file in payload.get("files", [])
        if file.get("id")
    ]


async def fetch_google_drive_documents(
    access_token: str,
    *,
    modified_start: date | None = None,
    modified_end: date | None = None,
    page_size: int = 1000,
) -> list[dict[str, Any]]:
    """Fetch document metadata, optionally limited to one modified-date window."""
    date_filter = ""
    if modified_start:
        date_filter += f" and modifiedTime >= '{modified_start.isoformat()}T00:00:00Z'"
    if modified_end:
        date_filter += f" and modifiedTime < '{modified_end.isoformat()}T00:00:00Z'"
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        files: list[dict[str, Any]] = []
        page_token: str | None = None
        while True:
            payload = await _get_json(
                client,
                "https://www.googleapis.com/drive/v3/files",
                access_token,
                q="trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet')" + date_filter,
                pageSize=max(1, min(page_size, 1000)),
                orderBy="modifiedTime",
                fields="nextPageToken,files(id,name,webViewLink,modifiedTime)",
                **({"pageToken": page_token} if page_token else {}),
            )
            files.extend(payload.get("files", []))
            page_token = payload.get("nextPageToken")
            if not page_token or not payload.get("files"):
                break
    return [
        {
            "id": str(file["id"]),
            "name": file.get("name") or "Untitled document",
            "mimeType": file.get("mimeType") or "application/vnd.google-apps.document",
            "webViewLink": file.get("webViewLink") or "https://drive.google.com/drive/my-drive",
            "modifiedTime": file.get("modifiedTime") or "",
        }
        for file in files if file.get("id")
    ]


async def find_oldest_drive_document_date(
    access_token: str,
    *,
    start: date | None = None,
    end: date | None = None,
) -> date | None:
    """Ask Drive for the oldest document metadata using ascending modifiedTime."""
    date_filter = ""
    if start:
        date_filter += f" and modifiedTime >= '{start.isoformat()}T00:00:00Z'"
    if end:
        date_filter += f" and modifiedTime < '{end.isoformat()}T00:00:00Z'"
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        payload = await _get_json(
            client,
            "https://www.googleapis.com/drive/v3/files",
            access_token,
            q="trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet')" + date_filter,
            pageSize=1,
            orderBy="modifiedTime",
            fields="files(modifiedTime)",
        )
    files = payload.get("files") or []
    if not files or not files[0].get("modifiedTime"):
        return None
    try:
        return date.fromisoformat(str(files[0]["modifiedTime"])[:10])
    except ValueError:
        return None


async def find_newest_drive_document_date(access_token: str) -> date | None:
    """Ask Drive for the newest document metadata using descending modifiedTime."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        payload = await _get_json(
            client,
            "https://www.googleapis.com/drive/v3/files",
            access_token,
            q="trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet')",
            pageSize=1,
            orderBy="modifiedTime desc",
            fields="files(modifiedTime)",
        )
    files = payload.get("files") or []
    if not files or not files[0].get("modifiedTime"):
        return None
    try:
        return date.fromisoformat(str(files[0]["modifiedTime"])[:10])
    except ValueError:
        return None


async def fetch_google_drive_document(access_token: str, file_id: str) -> str:
    """Export one Google Doc as plain text for the current agent page."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        response = await _get_response(
            client,
            f"https://www.googleapis.com/drive/v3/files/{quote(file_id, safe='')}/export",
            access_token,
            mimeType="text/plain",
        )
        if not response.is_success:
            raise GoogleApiError(response.status_code, response.text[:500])
        return response.text


async def fetch_google_spreadsheet_rows(
    access_token: str,
    file_id: str,
    *,
    status_callback: Callable[[str], Awaitable[None]] | None = None,
    max_rows: int | None = None,
) -> list[dict[str, Any]]:
    """Read a Google Sheet in row pages, preserving the header row per tab."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        metadata = await _get_json(
            client,
            f"https://sheets.googleapis.com/v4/spreadsheets/{quote(file_id, safe='')}",
            access_token,
            fields="sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)))",
        )
        rows: list[dict[str, Any]] = []
        for sheet in metadata.get("sheets", []):
            properties = sheet.get("properties") if isinstance(sheet.get("properties"), dict) else {}
            title = str(properties.get("title") or "Sheet1")
            grid = properties.get("gridProperties") if isinstance(properties.get("gridProperties"), dict) else {}
            row_count = int(grid.get("rowCount") or 0)
            safe_title = title.replace("'", "''")
            if status_callback:
                await status_callback("Building your chronological history.")
            header_payload = await _get_json(
                client,
                f"https://sheets.googleapis.com/v4/spreadsheets/{quote(file_id, safe='')}/values/{quote(f"'{safe_title}'!A1:ZZ1", safe='')}",
                access_token,
            )
            headers = [str(value or "").strip() or f"Column {index + 1}" for index, value in enumerate((header_payload.get("values") or [[]])[0])]
            if not headers:
                continue
            rows_read = 0
            for start in range(2, row_count + 1, 100):
                if max_rows is not None and rows_read >= max_rows:
                    break
                end = min(row_count, start + 99)
                if max_rows is not None:
                    end = min(end, start + max_rows - rows_read - 1)
                if status_callback:
                    await status_callback("Building your chronological history.")
                payload = await _get_json(
                    client,
                    f"https://sheets.googleapis.com/v4/spreadsheets/{quote(file_id, safe='')}/values/{quote(f"'{safe_title}'!A{start}:ZZ{end}", safe='')}",
                    access_token,
                )
                for offset, values in enumerate(payload.get("values", [])):
                    if not isinstance(values, list) or not any(str(value or "").strip() for value in values):
                        continue
                    rows.append({
                        "sheet": title,
                        "rowNumber": start + offset,
                        "values": {headers[index]: value for index, value in enumerate(values) if index < len(headers) and str(value or "").strip()},
                    })
                    rows_read += 1
    return rows


async def list_google_spreadsheet_rows(
    access_token: str,
    file_id: str,
    *,
    max_rows: int | None = None,
) -> list[dict[str, Any]]:
    """List spreadsheet row references without reading any cell values."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        metadata = await _get_json(
            client,
            f"https://sheets.googleapis.com/v4/spreadsheets/{quote(file_id, safe='')}",
            access_token,
            fields="sheets(properties(title,gridProperties(rowCount)))",
        )
    result: list[dict[str, Any]] = []
    for sheet in metadata.get("sheets", []):
        properties = sheet.get("properties") if isinstance(sheet.get("properties"), dict) else {}
        title = str(properties.get("title") or "Sheet1")
        grid = properties.get("gridProperties") if isinstance(properties.get("gridProperties"), dict) else {}
        row_count = int(grid.get("rowCount") or 0)
        for row_number in range(2, row_count + 1):
            result.append({"sheet": title, "rowNumber": row_number})
            if max_rows is not None and len(result) >= max_rows:
                return result
    return result


async def fetch_google_spreadsheet_row(
    access_token: str,
    file_id: str,
    sheet: str,
    row_number: int,
) -> dict[str, Any]:
    """Read one complete spreadsheet row, including its header names."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        safe_title = sheet.replace("'", "''")
        header_payload = await _get_json(
            client,
            f"https://sheets.googleapis.com/v4/spreadsheets/{quote(file_id, safe='')}/values/{quote(f"'{safe_title}'!A1:ZZ1", safe='')}",
            access_token,
        )
        row_payload = await _get_json(
            client,
            f"https://sheets.googleapis.com/v4/spreadsheets/{quote(file_id, safe='')}/values/{quote(f"'{safe_title}'!A{row_number}:ZZ{row_number}", safe='')}",
            access_token,
        )
    header_values = (header_payload.get("values") or [[]])[0]
    values = (row_payload.get("values") or [[]])[0]
    headers = [str(value or "").strip() or f"Column {index + 1}" for index, value in enumerate(header_values)]
    return {
        "sheet": sheet,
        "rowNumber": row_number,
        "values": {headers[index]: value for index, value in enumerate(values) if index < len(headers) and str(value or "").strip()},
    }


def _window(from_date: str | None, days: int) -> tuple[str, str]:
    try:
        start = date.fromisoformat(from_date) if from_date else datetime.now(UTC).date()
    except ValueError as error:
        raise ValueError("from must be an ISO date (YYYY-MM-DD)") from error
    start_dt = datetime.combine(start, datetime.min.time(), tzinfo=UTC)
    end_dt = start_dt + timedelta(days=days)
    return start_dt.isoformat().replace("+00:00", "Z"), end_dt.isoformat().replace("+00:00", "Z")


async def fetch_google_calendars(access_token: str, *, from_date: str | None = None, days: int = 7) -> list[dict[str, Any]]:
    """Fetch calendar metadata and events in a bounded read-only window."""
    time_min, time_max = _window(from_date, days)
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        calendars: list[dict[str, Any]] = []
        calendar_page_token: str | None = None
        while True:
            calendar_payload = await _get_json(
                client,
                "https://www.googleapis.com/calendar/v3/users/me/calendarList",
                access_token,
                maxResults=250,
                **({"pageToken": calendar_page_token} if calendar_page_token else {}),
            )
            calendars.extend(item for item in calendar_payload.get("items", []) if isinstance(item, dict))
            calendar_page_token = calendar_payload.get("nextPageToken")
            if not calendar_page_token or not calendar_payload.get("items"):
                break

        async def fetch_calendar(calendar: dict[str, Any]) -> dict[str, Any]:
            calendar_id = calendar.get("id")
            if not calendar_id:
                return {"id": "", "name": "", "color": "#888888", "events": []}
            events: list[dict[str, Any]] = []
            page_token: str | None = None
            while True:
                payload = await _get_json(
                    client,
                    f"https://www.googleapis.com/calendar/v3/calendars/{quote(calendar_id, safe='')}/events",
                    access_token,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents="true",
                    orderBy="startTime",
                    maxResults=250,
                    **({"pageToken": page_token} if page_token else {}),
                )
                for event in payload.get("items", []):
                    start = event.get("start", {})
                    end = event.get("end", {})
                    start_value = start.get("dateTime") or start.get("date")
                    end_value = end.get("dateTime") or end.get("date")
                    if not event.get("id") or not start_value:
                        continue
                    events.append(
                        {
                            "id": event["id"],
                            "title": event.get("summary") or "Untitled event",
                            "description": event.get("description"),
                            "location": event.get("location"),
                            "attendees": [
                                {
                                    "email": str(attendee.get("email") or "").strip().lower(),
                                    "name": attendee.get("displayName"),
                                    "responseStatus": attendee.get("responseStatus"),
                                }
                                for attendee in event.get("attendees", [])
                                if attendee.get("email")
                            ],
                            "meetLink": event.get("hangoutLink"),
                            "htmlLink": event.get("htmlLink"),
                            "start": start_value,
                            "end": end_value or start_value,
                            "status": event.get("status"),
                        }
                    )
                page_token = payload.get("nextPageToken")
                if not page_token or not payload.get("items"):
                    break
            return {
                "id": calendar_id,
                "name": calendar.get("summary") or calendar.get("summaryOverride") or calendar_id,
                "color": calendar.get("backgroundColor") or "#888888",
                "events": events,
            }

        return await asyncio.gather(*(fetch_calendar(calendar) for calendar in calendars))


def _calendar_boundary(value: str, timezone_name: str | None = None) -> dict[str, str]:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError("calendar event boundaries must not be empty")
    if len(normalized) == 10:
        date.fromisoformat(normalized)
        return {"date": normalized}
    datetime.fromisoformat(normalized.replace("Z", "+00:00"))
    boundary = {"dateTime": normalized}
    if timezone_name:
        boundary["timeZone"] = timezone_name
    return boundary


async def update_google_calendar_event(
    access_token: str,
    calendar_id: str,
    event_id: str,
    *,
    start: str,
    end: str,
    timezone_name: str | None = None,
) -> dict[str, Any]:
    """Apply a confirmed reschedule to the existing event only."""
    body = {
        "start": _calendar_boundary(start, timezone_name),
        "end": _calendar_boundary(end, timezone_name),
    }
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        return await _request_json(
            client,
            "PATCH",
            f"https://www.googleapis.com/calendar/v3/calendars/{quote(calendar_id, safe='')}/events/{quote(event_id, safe='')}",
            access_token,
            json_body=body,
        )


async def fetch_google_calendar_event(access_token: str, calendar_id: str, event_id: str) -> dict[str, Any]:
    """Fetch one complete Calendar event for the final memory pass."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        payload = await _get_json(
            client,
            f"https://www.googleapis.com/calendar/v3/calendars/{quote(calendar_id, safe='')}/events/{quote(event_id, safe='')}",
            access_token,
        )
    start = payload.get("start") if isinstance(payload.get("start"), dict) else {}
    end = payload.get("end") if isinstance(payload.get("end"), dict) else {}
    return {
        "id": event_id,
        "title": payload.get("summary") or "Untitled event",
        "description": payload.get("description"),
        "location": payload.get("location"),
        "attendees": payload.get("attendees") or [],
        "start": start.get("dateTime") or start.get("date"),
        "end": end.get("dateTime") or end.get("date"),
        "status": payload.get("status"),
        "htmlLink": payload.get("htmlLink"),
    }


async def find_oldest_calendar_date(
    access_token: str, *, start: date, end: date,
) -> date | None:
    """Ask Calendar for one earliest event per calendar using orderBy=startTime."""
    time_min, time_max = _window(start.isoformat(), (end - start).days)
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        calendar_payload = await _get_json(
            client,
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            access_token,
            maxResults=250,
        )
        calendars = [item for item in calendar_payload.get("items", []) if isinstance(item, dict) and item.get("id")]

        async def oldest(calendar: dict[str, Any]) -> date | None:
            payload = await _get_json(
                client,
                f"https://www.googleapis.com/calendar/v3/calendars/{quote(str(calendar['id']), safe='')}/events",
                access_token,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents="true",
                orderBy="startTime",
                maxResults=1,
                fields="items(start)",
            )
            items = payload.get("items") or []
            if not items:
                return None
            start_value = items[0].get("start") or {}
            value = start_value.get("dateTime") or start_value.get("date")
            try:
                return date.fromisoformat(str(value)[:10]) if value else None
            except ValueError:
                return None

        dates = await asyncio.gather(*(oldest(calendar) for calendar in calendars))
    return min((value for value in dates if value), default=None)


async def find_newest_calendar_date(
    access_token: str, *, start: date, end: date,
) -> date | None:
    """Probe Calendar event metadata to find the newest event date."""
    if start >= end:
        return None
    time_min, time_max = _window(start.isoformat(), (end - start).days)
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        calendar_payload = await _get_json(
            client,
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            access_token,
            maxResults=250,
        )
        calendars = [item for item in calendar_payload.get("items", []) if isinstance(item, dict) and item.get("id")]

        async def newest(calendar: dict[str, Any]) -> date | None:
            page_token: str | None = None
            newest_value: date | None = None
            while True:
                payload = await _get_json(
                    client,
                    f"https://www.googleapis.com/calendar/v3/calendars/{quote(str(calendar['id']), safe='')}/events",
                    access_token,
                    timeMin=time_min,
                    timeMax=time_max,
                    singleEvents="true",
                    orderBy="startTime",
                    maxResults=250,
                    fields="nextPageToken,items(start)",
                    **({"pageToken": page_token} if page_token else {}),
                )
                for item in payload.get("items", []):
                    start_value = item.get("start") or {}
                    value = start_value.get("dateTime") or start_value.get("date")
                    try:
                        parsed = date.fromisoformat(str(value)[:10]) if value else None
                    except ValueError:
                        parsed = None
                    if parsed and (newest_value is None or parsed > newest_value):
                        newest_value = parsed
                page_token = payload.get("nextPageToken")
                if not page_token or not payload.get("items"):
                    return newest_value

        values = await asyncio.gather(*(newest(calendar) for calendar in calendars))
    return max((value for value in values if value), default=None)


def _gmail_header(headers: list[dict[str, Any]], name: str) -> str:
    wanted = name.lower()
    for header in headers:
        if str(header.get("name", "")).lower() == wanted:
            return str(header.get("value", ""))
    return ""


def _gmail_date(internal_date: str | None, header_date: str) -> str:
    if internal_date and internal_date.isdigit():
        return datetime.fromtimestamp(int(internal_date) / 1000, tz=UTC).isoformat()
    return header_date or datetime.now(UTC).isoformat()


def _decode_gmail_body(data: str) -> str:
    """Decode Gmail's URL-safe base64 body representation safely."""
    try:
        padded = data + "=" * (-len(data) % 4)
        return base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8", errors="replace")
    except (ValueError, UnicodeError):
        return ""


def _extract_gmail_content(payload: dict[str, Any]) -> tuple[str, list[dict[str, str]]]:
    """Extract the best readable MIME part and attachment names from Gmail."""
    html_parts: list[str] = []
    text_parts: list[str] = []
    attachments: list[dict[str, str]] = []

    def visit(part: dict[str, Any]) -> None:
        filename = str(part.get("filename") or "").strip()
        body = part.get("body") if isinstance(part.get("body"), dict) else {}
        if filename:
            attachments.append({"name": filename})
        data = body.get("data")
        if isinstance(data, str) and data:
            decoded = _decode_gmail_body(data)
            mime_type = str(part.get("mimeType") or "").lower()
            if mime_type == "text/html":
                html_parts.append(decoded)
            elif mime_type == "text/plain":
                text_parts.append(decoded)
        for child in part.get("parts", []) or []:
            if isinstance(child, dict):
                visit(child)

    visit(payload)
    return (html_parts[0] if html_parts else ("\n\n".join(text_parts) if text_parts else ""), attachments)


def _normalize_gmail_message(detail: dict[str, Any], *, include_body: bool = False) -> dict[str, Any]:
    message_id = str(detail.get("id") or "")
    payload = detail.get("payload") if isinstance(detail.get("payload"), dict) else {}
    headers = payload.get("headers", []) if isinstance(payload.get("headers"), list) else []
    is_draft = "DRAFT" in detail.get("labelIds", [])
    # Gmail draft messages are authored by the signed-in user. In the Drafts
    # view, the useful identity is their intended recipient instead of the
    # user's own From address, so grouping and display remain meaningful.
    counterparty_header = _gmail_header(headers, "To") if is_draft else _gmail_header(headers, "From")
    counterparty_name, counterparty_email = parseaddr(counterparty_header)
    result: dict[str, Any] = {
        "id": f"gmail_{message_id}",
        "subject": _gmail_header(headers, "Subject") or "(no subject)",
        "snippet": detail.get("snippet", ""),
        "from": counterparty_name or counterparty_email or counterparty_header or ("Draft recipient" if is_draft else "Unknown sender"),
        "fromEmail": counterparty_email,
        # Gmail's API has no direct permalink field; "#all/{id}" is the
        # standard deep-link form (works regardless of which label/folder
        # the message is under, unlike "#inbox/{id}").
        "gmailUrl": f"https://mail.google.com/mail/u/0/#all/{message_id}",
        # Gmail's own conversation grouping — needed to create a reply draft
        # that lands in the same thread instead of a new top-level one (see
        # create_gmail_draft).
        "threadId": str(detail.get("threadId") or ""),
        "date": _gmail_date(str(detail.get("internalDate", "")), _gmail_header(headers, "Date")),
        "unread": "UNREAD" in detail.get("labelIds", []),
        "source": "gmail",
        "tags": [],
        # Kept briefly in the API response so the app layer can map Gmail's
        # labels to their names without another request per message.
        "labelIds": [str(label_id) for label_id in detail.get("labelIds", []) if label_id],
        "archived": False,
        "gmailDraft": is_draft,
        "attachments": [],
    }
    if include_body:
        body, attachments = _extract_gmail_content(payload)
        result["body"] = body
        result["attachments"] = attachments
    return result


async def fetch_gmail_message(access_token: str, message_id: str) -> dict[str, Any]:
    """Fetch one Gmail message with its complete readable body."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        detail = await _get_json(
            client,
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{quote(message_id, safe='')}",
            access_token,
            format="full",
            metadataHeaders=["From", "To", "Subject", "Date"],
        )
    return _normalize_gmail_message(detail, include_body=True)


async def trash_gmail_messages(access_token: str, message_ids: list[str]) -> None:
    """Move Gmail messages to Trash, matching the inbox delete action."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        for message_id in message_ids:
            response = await client.post(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{quote(message_id, safe='')}/trash",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if not response.is_success:
                try:
                    payload = response.json()
                    detail = payload.get("error", {}).get("message") or payload.get("error") or response.text
                except ValueError:
                    detail = response.text
                raise GoogleApiError(response.status_code, str(detail)[:500])


def _fallback_gmail_label_color(label_id: str) -> str:
    palette = ("#f47560", "#45dfa4", "#1877f2", "#9b72cf", "#f4a261", "#6b9e6b")
    return palette[sum(ord(char) for char in label_id) % len(palette)]


def _normalize_gmail_label(label: dict[str, Any]) -> dict[str, Any] | None:
    label_id = str(label.get("id") or "").strip()
    name = str(label.get("name") or "").strip()
    # System labels are folders managed by Gmail (Inbox, Sent, Trash, etc.).
    # The inbox tag UI should expose the user's actual Gmail labels only.
    if not label_id or not name or label.get("type") != "user":
        return None
    color = label.get("color") if isinstance(label.get("color"), dict) else {}
    return {
        "id": label_id,
        "name": name,
        "color": str(color.get("backgroundColor") or _fallback_gmail_label_color(label_id)),
        "createdAt": "",
        "updatedAt": "",
    }


async def fetch_gmail_labels(access_token: str) -> list[dict[str, Any]]:
    """Fetch the signed-in user's Gmail labels (not OpenPip's Drive tags)."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        payload = await _get_json(
            client,
            "https://gmail.googleapis.com/gmail/v1/users/me/labels",
            access_token,
        )
    return [normalized for item in payload.get("labels", []) if (normalized := _normalize_gmail_label(item))]


async def create_gmail_label(access_token: str, name: str) -> dict[str, Any]:
    """Create a user Gmail label and return it in the inbox tag shape."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        label = await _request_json(
            client,
            "POST",
            "https://gmail.googleapis.com/gmail/v1/users/me/labels",
            access_token,
            json_body={"name": name, "labelListVisibility": "labelShow", "messageListVisibility": "show"},
        )
    return _normalize_gmail_label(label) or {"id": str(label.get("id") or ""), "name": name, "color": _fallback_gmail_label_color(name), "createdAt": "", "updatedAt": ""}


async def create_gmail_draft(
    access_token: str,
    *,
    to: str,
    subject: str,
    body: str,
    thread_id: str | None = None,
) -> dict[str, Any]:
    """Create a real Gmail draft — deliberately the one exception to this
    project's "propose, never act" rule for email. A draft is private (only
    the signed-in user ever sees it) and fully reversible (delete it in
    Gmail like any other draft), unlike actually sending, which stays
    proposal-gated as its own, later, separate approval. thread_id (Gmail's
    own conversation id, not an RFC822 Message-ID) keeps a reply grouped
    with the message it's answering instead of starting a new thread.
    """
    message = EmailMessage()
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
    draft_message: dict[str, Any] = {"raw": raw}
    if thread_id:
        draft_message["threadId"] = thread_id
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        return await _request_json(
            client,
            "POST",
            "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
            access_token,
            json_body={"message": draft_message},
        )


async def update_gmail_label(access_token: str, label_id: str, name: str) -> dict[str, Any]:
    """Rename a user Gmail label and return it in the inbox tag shape."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        label = await _request_json(
            client,
            "PUT",
            f"https://gmail.googleapis.com/gmail/v1/users/me/labels/{quote(label_id, safe='')}",
            access_token,
            json_body={"name": name},
        )
    return _normalize_gmail_label(label) or {"id": label_id, "name": name, "color": _fallback_gmail_label_color(label_id), "createdAt": "", "updatedAt": ""}


async def delete_gmail_label(access_token: str, label_id: str) -> None:
    """Delete a user Gmail label."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        await _request_json(
            client,
            "DELETE",
            f"https://gmail.googleapis.com/gmail/v1/users/me/labels/{quote(label_id, safe='')}",
            access_token,
        )


async def modify_gmail_message_labels(
    access_token: str,
    message_id: str,
    *,
    add_label_ids: list[str] | None = None,
    remove_label_ids: list[str] | None = None,
) -> None:
    """Add/remove Gmail labels on a message (the Gmail source of truth)."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        await _request_json(
            client,
            "POST",
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{quote(message_id, safe='')}/modify",
            access_token,
            json_body={
                "addLabelIds": add_label_ids or [],
                "removeLabelIds": remove_label_ids or [],
            },
        )


async def fetch_gmail_messages(
    access_token: str,
    *,
    local_date: str | None = None,
    label_id: str | None = None,
    gmail_query: str | None = None,
    unread_only: bool = False,
    page: int = 1,
    page_size: int = 50,
    fetch_all_pages: bool = True,
) -> tuple[list[dict[str, Any]], int]:
    """Read Gmail messages, optionally scoped to a label or Gmail search.

    The default remains the Inbox. Supplying a label ID intentionally removes
    the Inbox/date restriction so a label can retrieve read and archived mail;
    ``gmail_query`` does the same for searches such as ``from:sender``.
    """
    query: dict[str, Any] = {
        "includeSpamTrash": "false",
        # Gmail's resultSizeEstimate is explicitly approximate. Fetch the
        # message references across all result pages so the UI can display an
        # exact folder total and apply the requested page consistently.
        "maxResults": 100,
    }
    if label_id:
        query["labelIds"] = label_id
    elif not gmail_query:
        query["labelIds"] = "INBOX"
    query_parts: list[str] = []
    if gmail_query:
        query_parts.append(gmail_query)
    if unread_only:
        query_parts.append("is:unread")
    if local_date and not label_id:
        try:
            day = date.fromisoformat(local_date)
        except ValueError as error:
            raise ValueError("localDate must be an ISO date (YYYY-MM-DD)") from error
        query_parts.append(f"after:{day:%Y/%m/%d} before:{day + timedelta(days=1):%Y/%m/%d}")
    if query_parts:
        query["q"] = " ".join(query_parts)

    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        refs: list[dict[str, Any]] = []
        next_page_token: str | None = None
        requested_page = max(1, page)
        list_page = 0
        result_size_estimate = 0
        while True:
            list_page += 1
            request_query = dict(query)
            if next_page_token:
                request_query["pageToken"] = next_page_token
            listing = await _get_json(
                client,
                "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                access_token,
                **request_query,
            )
            refs.extend(item for item in listing.get("messages", []) if isinstance(item, dict))
            result_size_estimate = int(listing.get("resultSizeEstimate") or result_size_estimate or len(refs))
            next_page_token = listing.get("nextPageToken")
            if (
                not next_page_token
                or not listing.get("messages")
                or (not fetch_all_pages and list_page >= requested_page)
            ):
                break

        total = len(refs) if fetch_all_pages else max(result_size_estimate, len(refs))
        # The API returns at most 100 references per request, but a bounded
        # historical window may ask this helper for every matching message.
        local_page_size = max(1, min(page_size, 1000))
        start = (max(1, page) - 1) * local_page_size
        page_refs = refs[start:start + local_page_size]

        async def fetch_message(ref: dict[str, Any]) -> dict[str, Any] | None:
            message_id = ref.get("id")
            if not message_id:
                return None
            detail = await _get_json(
                client,
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{quote(message_id, safe='')}",
                access_token,
                format="metadata",
                metadataHeaders=["From", "To", "Subject", "Date"],
            )
            return _normalize_gmail_message(detail)

        messages = [message for message in await asyncio.gather(*(fetch_message(ref) for ref in page_refs)) if message]
        return messages, total


async def find_oldest_gmail_date(
    access_token: str, *, start: date, end: date, gmail_query: str | None = None,
) -> date | None:
    """Find the first day containing Gmail results using metadata-only probes.

    Gmail's list API is newest-first and has no ascending sort option. A
    binary search over ``after``/``before`` queries finds the oldest day with
    results without downloading every message just to discover the boundary.
    """
    if start >= end:
        return None
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        async def has_results(day: date) -> bool:
            parts = [f"after:{day - timedelta(days=1):%Y/%m/%d}", f"before:{end:%Y/%m/%d}"]
            if gmail_query:
                parts.insert(0, gmail_query)
            payload = await _get_json(
                client,
                "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                access_token,
                includeSpamTrash="false",
                maxResults=1,
                q=" ".join(parts),
            )
            return bool(payload.get("messages"))

        if not await has_results(start):
            return None
        lo, hi = start, end - timedelta(days=1)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if await has_results(mid):
                hi = mid
            else:
                lo = mid + timedelta(days=1)
        return lo


async def find_newest_gmail_date(
    access_token: str, *, start: date, end: date, gmail_query: str | None = None,
) -> date | None:
    """Read only the newest Gmail message's metadata to establish a boundary."""
    if start >= end:
        return None
    parts = [f"after:{start - timedelta(days=1):%Y/%m/%d}", f"before:{end:%Y/%m/%d}"]
    if gmail_query:
        parts.insert(0, gmail_query)
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        listing = await _get_json(
            client,
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            access_token,
            includeSpamTrash="false",
            maxResults=1,
            q=" ".join(parts),
        )
        message_id = (listing.get("messages") or [{}])[0].get("id")
        if not message_id:
            return None
        detail = await _get_json(
            client,
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{quote(str(message_id), safe='')}",
            access_token,
            format="metadata",
            metadataHeaders=["Date"],
            fields="internalDate,payload(headers)",
        )
    value = _normalize_gmail_message(detail).get("date")
    try:
        return date.fromisoformat(str(value)[:10]) if value else None
    except ValueError:
        return None


_PEOPLE_FIELDS = "names,emailAddresses,phoneNumbers,organizations,photos"


def _normalize_person(person: dict[str, Any]) -> dict[str, Any] | None:
    resource_name = person.get("resourceName")
    if not resource_name:
        return None
    names = person.get("names") or []
    emails = person.get("emailAddresses") or []
    phones = person.get("phoneNumbers") or []
    orgs = person.get("organizations") or []
    photos = person.get("photos") or []
    name = next((str(n["displayName"]) for n in names if n.get("displayName")), None)
    if not name:
        return None
    org = orgs[0] if orgs else {}
    return {
        "resourceName": str(resource_name),
        "name": name,
        "email": next((str(e["value"]) for e in emails if e.get("value")), None),
        "phone": next((str(p["value"]) for p in phones if p.get("value")), None),
        "company": str(org.get("name")) if org.get("name") else None,
        "role": str(org.get("title")) if org.get("title") else None,
        "photoUrl": next((str(p["url"]) for p in photos if p.get("url") and not p.get("default")), None),
    }


async def fetch_google_contacts(access_token: str) -> dict[str, dict[str, Any]]:
    """Fetch the user's Google Contacts (People API), keyed by resourceName.

    Read-only for this call, even though the OAuth scope also grants write:
    identity data always comes straight from Google — OpenPip only ever
    layers CRM fields (status, notes, interactions) on top in Drive app data,
    never mirrors or edits the Google contact itself from this path.
    """
    contacts: dict[str, dict[str, Any]] = {}
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        page_token: str | None = None
        while True:
            payload = await _get_json(
                client,
                "https://people.googleapis.com/v1/people/me/connections",
                access_token,
                personFields=_PEOPLE_FIELDS,
                pageSize=1000,
                **({"pageToken": page_token} if page_token else {}),
            )
            for person in payload.get("connections", []):
                normalized = _normalize_person(person)
                if normalized:
                    contacts[normalized["resourceName"]] = normalized
            page_token = payload.get("nextPageToken")
            if not page_token:
                break
    return contacts


async def fetch_google_contact(access_token: str, resource_name: str) -> dict[str, Any] | None:
    """Fetch a single Google Contact by resourceName (e.g. 'people/c123')."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        try:
            payload = await _get_json(
                client,
                f"https://people.googleapis.com/v1/{quote(resource_name, safe='/')}",
                access_token,
                personFields=_PEOPLE_FIELDS,
            )
        except GoogleApiError as error:
            if error.status_code == 404:
                return None
            raise
    return _normalize_person(payload)


async def create_google_contact(
    access_token: str,
    *,
    name: str,
    email: str | None = None,
    phone: str | None = None,
    company: str | None = None,
    role: str | None = None,
) -> dict[str, Any]:
    """Create a new Google Contact. Only ever called from an approved proposal's
    execution — never from a user-facing form; see docs on the proposal pipeline."""
    body: dict[str, Any] = {"names": [{"unstructuredName": name}]}
    if email:
        body["emailAddresses"] = [{"value": email}]
    if phone:
        body["phoneNumbers"] = [{"value": phone}]
    if company or role:
        org: dict[str, Any] = {}
        if company:
            org["name"] = company
        if role:
            org["title"] = role
        body["organizations"] = [org]

    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        response = await client.post(
            "https://people.googleapis.com/v1/people:createContact",
            params={"personFields": _PEOPLE_FIELDS},
            json=body,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if not response.is_success:
            try:
                payload = response.json()
                detail = payload.get("error", {}).get("message") or payload.get("error") or response.text
            except ValueError:
                detail = response.text
            raise GoogleApiError(response.status_code, str(detail)[:500])
        created = response.json()
    normalized = _normalize_person(created)
    if not normalized:
        raise GoogleApiError(500, "Google did not return a usable contact")
    return normalized
