"""Small read-first clients for the Google APIs used by the workspace views."""

from __future__ import annotations

import asyncio
from datetime import UTC, date, datetime, timedelta
from email.utils import parseaddr
from typing import Any
from urllib.parse import quote

import httpx


class GoogleApiError(RuntimeError):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


GOOGLE_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


async def _get_json(client: httpx.AsyncClient, url: str, access_token: str, **params: Any) -> dict[str, Any]:
    response = await client.get(
        url,
        params=params,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if not response.is_success:
        try:
            payload = response.json()
            detail = payload.get("error", {}).get("message") or payload.get("error") or response.text
        except ValueError:
            detail = response.text
        raise GoogleApiError(response.status_code, str(detail)[:500])
    return response.json()


async def fetch_google_tasks(access_token: str, *, include_completed: bool = False) -> list[dict[str, Any]]:
    """Fetch the user's Google Tasks lists and flatten their tasks."""
    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        list_payload = await _get_json(
            client,
            "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
            access_token,
            maxResults=100,
        )
        lists = list_payload.get("items", [])

        async def fetch_list(task_list: dict[str, Any]) -> list[dict[str, Any]]:
            list_id = task_list.get("id")
            if not list_id:
                return []
            payload = await _get_json(
                client,
                f"https://tasks.googleapis.com/tasks/v1/lists/{list_id}/tasks",
                access_token,
                showCompleted=str(include_completed).lower(),
                showHidden="false",
                maxResults=100,
            )
            result: list[dict[str, Any]] = []
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
            return result

        batches = await asyncio.gather(*(fetch_list(task_list) for task_list in lists))
        return [task for batch in batches for task in batch]


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
        calendar_payload = await _get_json(
            client,
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            access_token,
            maxResults=250,
        )

        async def fetch_calendar(calendar: dict[str, Any]) -> dict[str, Any]:
            calendar_id = calendar.get("id")
            if not calendar_id:
                return {"id": "", "name": "", "color": "#888888", "events": []}
            payload = await _get_json(
                client,
                f"https://www.googleapis.com/calendar/v3/calendars/{quote(calendar_id, safe='')}/events",
                access_token,
                timeMin=time_min,
                timeMax=time_max,
                singleEvents="true",
                orderBy="startTime",
                maxResults=250,
            )
            events: list[dict[str, Any]] = []
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
                        "meetLink": event.get("hangoutLink"),
                        "start": start_value,
                        "end": end_value or start_value,
                        "status": event.get("status"),
                    }
                )
            return {
                "id": calendar_id,
                "name": calendar.get("summary") or calendar.get("summaryOverride") or calendar_id,
                "color": calendar.get("backgroundColor") or "#888888",
                "events": events,
            }

        return await asyncio.gather(*(fetch_calendar(calendar) for calendar in calendar_payload.get("items", [])))


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


async def fetch_gmail_messages(
    access_token: str,
    *,
    local_date: str | None = None,
    page_size: int = 50,
) -> tuple[list[dict[str, Any]], int]:
    """Read Inbox messages from Gmail without touching local or SES stores."""
    query: dict[str, Any] = {
        "labelIds": "INBOX",
        "includeSpamTrash": "false",
        "maxResults": max(1, min(page_size, 100)),
    }
    if local_date:
        try:
            day = date.fromisoformat(local_date)
        except ValueError as error:
            raise ValueError("localDate must be an ISO date (YYYY-MM-DD)") from error
        query["q"] = f"after:{day:%Y/%m/%d} before:{day + timedelta(days=1):%Y/%m/%d}"

    async with httpx.AsyncClient(timeout=GOOGLE_TIMEOUT) as client:
        listing = await _get_json(
            client,
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            access_token,
            **query,
        )
        refs = listing.get("messages", [])

        async def fetch_message(ref: dict[str, Any]) -> dict[str, Any] | None:
            message_id = ref.get("id")
            if not message_id:
                return None
            detail = await _get_json(
                client,
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{quote(message_id, safe='')}",
                access_token,
                format="metadata",
                metadataHeaders=["From", "Subject", "Date"],
            )
            headers = detail.get("payload", {}).get("headers", [])
            from_header = _gmail_header(headers, "From")
            from_name, from_email = parseaddr(from_header)
            subject = _gmail_header(headers, "Subject") or "(no subject)"
            return {
                "id": f"gmail_{message_id}",
                "subject": subject,
                "snippet": detail.get("snippet", ""),
                "from": from_name or from_email or from_header,
                "fromEmail": from_email,
                "date": _gmail_date(str(detail.get("internalDate", "")), _gmail_header(headers, "Date")),
                "unread": "UNREAD" in detail.get("labelIds", []),
                "source": "gmail",
                "tags": [],
                "archived": False,
                "attachments": [],
            }

        messages = [message for message in await asyncio.gather(*(fetch_message(ref) for ref in refs)) if message]
        return messages, int(listing.get("resultSizeEstimate", len(messages)))


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
        for _ in range(10):  # ~10k contacts ceiling — a personal CRM, not a bulk export
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
