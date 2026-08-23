"""SQLite persistence for OpenPip's review queue and user-owned working context."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from .models import AuditEvent, Proposal, ProposalStatus, UserContext, UserPreferences, now


class ProposalStore:
    """Queryable proposals with append-only audit events and private user context."""

    def __init__(self, database_path: str = ":memory:") -> None:
        if database_path != ":memory:":
            Path(database_path).parent.mkdir(parents=True, exist_ok=True)
        self._connection = sqlite3.connect(database_path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._initialize()

    def _initialize(self) -> None:
        self._connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS proposals (
                id TEXT PRIMARY KEY, action TEXT NOT NULL, title TEXT NOT NULL,
                rationale TEXT NOT NULL, payload_json TEXT NOT NULL, source_json TEXT NOT NULL,
                status TEXT NOT NULL, created_at TEXT NOT NULL, decided_at TEXT,
                executed_at TEXT, failure_reason TEXT, idempotency_key TEXT UNIQUE
            );
            CREATE TABLE IF NOT EXISTS proposal_audit_events (
                id TEXT PRIMARY KEY, proposal_id TEXT NOT NULL REFERENCES proposals(id),
                event_type TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_context (
                singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
                content TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_preferences (
                singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
                agent_name TEXT NOT NULL, agent_icon TEXT, theme TEXT NOT NULL,
                accent TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS quotes (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL UNIQUE,
                sources_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                last_shown_at TEXT
            );
            """
        )
        self._connection.commit()

    @staticmethod
    def _proposal(row: sqlite3.Row) -> Proposal:
        return Proposal.model_validate({
            "id": row["id"], "action": row["action"], "title": row["title"],
            "rationale": row["rationale"], "payload": json.loads(row["payload_json"]),
            "source": json.loads(row["source_json"]), "status": row["status"],
            "created_at": row["created_at"], "decided_at": row["decided_at"],
            "executed_at": row["executed_at"], "failure_reason": row["failure_reason"],
            "idempotency_key": row["idempotency_key"],
        })

    def add(self, proposal: Proposal) -> Proposal:
        if proposal.idempotency_key:
            existing = self.get_by_idempotency_key(proposal.idempotency_key)
            if existing:
                return existing
        data = proposal.model_dump(mode="json")
        self._connection.execute(
            "INSERT INTO proposals VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                data["id"], data["action"], data["title"], data["rationale"],
                json.dumps(data["payload"]), json.dumps(data["source"]), data["status"],
                data["created_at"], data["decided_at"], data["executed_at"],
                data["failure_reason"], data["idempotency_key"],
            ),
        )
        self._append_event(proposal.id, "created", "Proposal created for review")
        self._connection.commit()
        return proposal

    def get(self, proposal_id: str) -> Proposal | None:
        row = self._connection.execute("SELECT * FROM proposals WHERE id = ?", (proposal_id,)).fetchone()
        return self._proposal(row) if row else None

    def get_by_idempotency_key(self, key: str) -> Proposal | None:
        row = self._connection.execute("SELECT * FROM proposals WHERE idempotency_key = ?", (key,)).fetchone()
        return self._proposal(row) if row else None

    def list(self, status: ProposalStatus | None = None) -> list[Proposal]:
        query, params = "SELECT * FROM proposals", ()
        if status:
            query, params = f"{query} WHERE status = ?", (status.value,)
        rows = self._connection.execute(f"{query} ORDER BY created_at DESC", params).fetchall()
        return [self._proposal(row) for row in rows]

    def get_user_context(self) -> UserContext:
        row = self._connection.execute("SELECT content, updated_at FROM user_context WHERE singleton = 1").fetchone()
        return UserContext(content=row["content"], updated_at=row["updated_at"]) if row else UserContext()

    def save_user_context(self, context: UserContext) -> UserContext:
        saved = context.model_copy(update={"updated_at": now()})
        self._connection.execute(
            """INSERT INTO user_context (singleton, content, updated_at) VALUES (1, ?, ?)
            ON CONFLICT(singleton) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at""",
            (saved.content, saved.updated_at.isoformat()),
        )
        self._connection.commit()
        return saved

    def get_preferences(self) -> UserPreferences:
        row = self._connection.execute("SELECT * FROM user_preferences WHERE singleton = 1").fetchone()
        if not row:
            return UserPreferences()
        return UserPreferences.model_validate(dict(row))

    def save_preferences(self, preferences: UserPreferences) -> UserPreferences:
        saved = preferences.model_copy(update={"updated_at": now()})
        self._connection.execute(
            """INSERT INTO user_preferences (singleton, agent_name, agent_icon, theme, accent, updated_at)
            VALUES (1, ?, ?, ?, ?, ?)
            ON CONFLICT(singleton) DO UPDATE SET agent_name = excluded.agent_name,
            agent_icon = excluded.agent_icon, theme = excluded.theme, accent = excluded.accent,
            updated_at = excluded.updated_at""",
            (saved.agent_name.strip() or "OpenPip", saved.agent_icon, saved.theme, saved.accent, saved.updated_at.isoformat()),
        )
        self._connection.commit()
        return self.get_preferences()

    def seed_quotes(self, seed: list[str]) -> None:
        """Idempotent: only inserts quotes that aren't already present (by
        exact text). Safe to call on every startup."""
        now_iso = now().isoformat()
        for text in seed:
            self._connection.execute(
                "INSERT OR IGNORE INTO quotes (id, text, sources_json, created_at) VALUES (?, ?, '[]', ?)",
                (f"quote_{abs(hash(text))}", text, now_iso),
            )
        self._connection.commit()

    def add_quote_if_new(self, text: str, sources: list[str] | None = None) -> bool:
        """Record a quote the model discovered via web grounding, if it isn't
        already in the pool. Returns whether it was actually new."""
        cursor = self._connection.execute(
            "INSERT OR IGNORE INTO quotes (id, text, sources_json, created_at) VALUES (?, ?, ?, ?)",
            (f"quote_{abs(hash(text))}", text, json.dumps(sources or []), now().isoformat()),
        )
        self._connection.commit()
        return cursor.rowcount > 0

    def recent_quotes(self, limit: int = 5) -> list[str]:
        """Most recently shown quotes, for a briefing prompt's own "avoid
        repeating these" instruction — not the whole pool."""
        rows = self._connection.execute(
            "SELECT text FROM quotes WHERE last_shown_at IS NOT NULL ORDER BY last_shown_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [row["text"] for row in rows]

    def pick_random_quote(self, exclude_recent: int = 3) -> str | None:
        """Random quote from the pool, avoiding the N most recently shown so
        consecutive briefings don't repeat one back-to-back. No LLM call —
        this is the path every regular briefing uses."""
        recent = set(self.recent_quotes(exclude_recent))
        placeholders = ",".join("?" for _ in recent)
        query = "SELECT text FROM quotes"
        params: tuple[str, ...] = ()
        if recent:
            query += f" WHERE text NOT IN ({placeholders})"
            params = tuple(recent)
        row = self._connection.execute(f"{query} ORDER BY RANDOM() LIMIT 1", params).fetchone()
        if not row and recent:
            # Every quote is in the "recently shown" set (a small pool) —
            # fall back to picking from the full table rather than returning
            # nothing.
            row = self._connection.execute("SELECT text FROM quotes ORDER BY RANDOM() LIMIT 1").fetchone()
        return row["text"] if row else None

    def mark_quote_shown(self, text: str) -> None:
        self._connection.execute("UPDATE quotes SET last_shown_at = ? WHERE text = ?", (now().isoformat(), text))
        self._connection.commit()

    def audit_events(self, proposal_id: str) -> list[AuditEvent]:
        rows = self._connection.execute(
            "SELECT * FROM proposal_audit_events WHERE proposal_id = ? ORDER BY created_at ASC", (proposal_id,)
        ).fetchall()
        return [AuditEvent.model_validate(dict(row)) for row in rows]

    def decide(self, proposal_id: str, status: ProposalStatus, reason: str | None = None) -> Proposal:
        if status not in {ProposalStatus.APPROVED, ProposalStatus.REJECTED}:
            raise ValueError("A decision must approve or reject a proposal")
        proposal = self._require(proposal_id, ProposalStatus.PENDING)
        decided_at = now().isoformat()
        self._connection.execute("UPDATE proposals SET status = ?, decided_at = ? WHERE id = ?", (status.value, decided_at, proposal.id))
        self._append_event(proposal.id, status.value, reason)
        self._connection.commit()
        return self.get(proposal.id)  # type: ignore[return-value]

    def claim_execution(self, proposal_id: str) -> Proposal:
        proposal = self._require(proposal_id, ProposalStatus.APPROVED, "Only an approved proposal can execute")
        self._connection.execute("UPDATE proposals SET status = ? WHERE id = ?", (ProposalStatus.EXECUTING.value, proposal.id))
        self._append_event(proposal.id, "execution_started", None)
        self._connection.commit()
        return self.get(proposal.id)  # type: ignore[return-value]

    def mark_executed(self, proposal_id: str, reference: str) -> Proposal:
        return self._finish_execution(proposal_id, ProposalStatus.EXECUTED, reference)

    def mark_failed(self, proposal_id: str, reason: str) -> Proposal:
        return self._finish_execution(proposal_id, ProposalStatus.FAILED, reason)

    def retry(self, proposal_id: str) -> Proposal:
        proposal = self._require(proposal_id, ProposalStatus.FAILED, "Only a failed proposal can be retried")
        self._connection.execute(
            "UPDATE proposals SET status = ?, failure_reason = NULL WHERE id = ?", (ProposalStatus.APPROVED.value, proposal.id)
        )
        self._append_event(proposal.id, "retry_requested", None)
        self._connection.commit()
        return self.get(proposal.id)  # type: ignore[return-value]

    def clear(self) -> None:
        self._connection.executescript("DELETE FROM proposal_audit_events; DELETE FROM proposals; DELETE FROM user_context; DELETE FROM user_preferences;")
        self._connection.commit()

    def _require(self, proposal_id: str, status: ProposalStatus, message: str | None = None) -> Proposal:
        proposal = self.get(proposal_id)
        if proposal is None:
            raise KeyError(proposal_id)
        if proposal.status != status:
            raise ValueError(message or "Proposal is no longer pending")
        return proposal

    def _finish_execution(self, proposal_id: str, status: ProposalStatus, detail: str) -> Proposal:
        proposal = self._require(proposal_id, ProposalStatus.EXECUTING, "Only an executing proposal can record a result")
        failure_reason = detail if status == ProposalStatus.FAILED else None
        self._connection.execute(
            "UPDATE proposals SET status = ?, executed_at = ?, failure_reason = ? WHERE id = ?",
            (status.value, now().isoformat(), failure_reason, proposal.id),
        )
        self._append_event(proposal.id, "executed" if status == ProposalStatus.EXECUTED else "execution_failed", detail)
        self._connection.commit()
        return self.get(proposal.id)  # type: ignore[return-value]

    def _append_event(self, proposal_id: str, event_type: str, detail: str | None) -> None:
        event = AuditEvent(proposal_id=proposal_id, event_type=event_type, detail=detail)
        self._connection.execute(
            "INSERT INTO proposal_audit_events VALUES (?, ?, ?, ?, ?)",
            (event.id, event.proposal_id, event.event_type, event.detail, event.created_at.isoformat()),
        )
