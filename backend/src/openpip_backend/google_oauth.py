"""Google OAuth2 login, session, and token-refresh handling — entirely backend-owned.

This is Path B from docs/OAUTH_SETUP.md: a small OAuth proxy built directly into
this FastAPI service (no separate proxy process, no AgentCore Identity dependency
yet). It replaces the earlier situation where the frontend's AUTH_PROXY_URL had
nowhere of its own to point and was accidentally reaching the sibling
../travel-agent project's `proxy` container instead.

No cookies anywhere in this flow, by design:
  - Google's own identity assertion — the `id_token` returned alongside the
    access/refresh tokens — is a signed JWT (OpenID Connect). It is verified
    here against Google's public keys (signature, issuer, audience, expiry)
    rather than trusted blindly, and used directly instead of an extra
    REST call to Google's userinfo endpoint.
  - This project's own session credential, handed to the browser once via a
    URL fragment after /auth/callback (fragments never reach the server, so
    they never appear in logs), is likewise a JWT — HMAC-signed with
    SESSION_SIGNING_SECRET. The browser holds it in sessionStorage (cleared
    when the tab/browser closes) and resends it as the X-OpenPip-Session
    header on every request; the backend verifies it on every request too.
  - The actual Google access/refresh tokens never leave the backend. The
    session JWT only carries a `sid` claim referencing the encrypted-token
    row in oauth_sessions (see OAuthSessionStore) — never the tokens
    themselves.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx
import jwt
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, Request
from jwt import PyJWKClient

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")

# Minimum scopes for this project's read + limited-write use per
# docs/OAUTH_SETUP.md. drive.appdata (not the broader drive.file) is what
# google_drive_store.py actually needs — it only ever reads/writes the
# hidden per-app `appDataFolder` space, never the user's visible Drive files.
SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/drive.appdata",
]

SESSION_HEADER = "X-OpenPip-Session"
_SESSION_JWT_TTL_SECONDS = 60 * 60 * 24  # 24h ceiling on a leaked JWT's usefulness;
# sessionStorage clearing on tab/browser close is the primary "session" bound —
# this is defense in depth, not the main mechanism.
_ACCESS_TOKEN_SKEW_SECONDS = 60  # refresh a little before actual expiry

_jwks_client = PyJWKClient(GOOGLE_JWKS_URL)


class OAuthConfigError(RuntimeError):
    """Raised when required OAuth configuration is missing."""


def _client_id() -> str:
    value = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    if not value:
        raise OAuthConfigError("GOOGLE_CLIENT_ID is not configured")
    return value


def _client_secret() -> str:
    value = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    if not value:
        raise OAuthConfigError("GOOGLE_CLIENT_SECRET is not configured")
    return value


def _redirect_uri() -> str:
    value = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "").strip()
    if not value:
        raise OAuthConfigError("GOOGLE_OAUTH_REDIRECT_URI is not configured")
    return value


def _frontend_origin() -> str:
    return os.getenv("FRONTEND_ORIGIN", "http://localhost:6000").rstrip("/")


def _session_secret() -> str:
    value = os.getenv("SESSION_SIGNING_SECRET", "").strip()
    if not value:
        raise OAuthConfigError("SESSION_SIGNING_SECRET is not configured")
    return value


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(_session_secret().encode("utf-8")).digest())
    return Fernet(key)


def _encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def _decrypt(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken as error:
        raise HTTPException(status_code=401, detail="Session could not be decrypted; please sign in again") from error


# --- Google's own identity assertion (id_token, a real JWT) -----------------


def verify_google_id_token(id_token_str: str) -> dict[str, Any]:
    """Verify Google's id_token signature, issuer, audience, and expiry.

    Raises HTTPException(401) if verification fails for any reason — this is
    the actual trust boundary for who the user is, so it must never be
    skipped or downgraded to an unverified decode.
    """
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(id_token_str)
        return jwt.decode(
            id_token_str,
            signing_key.key,
            algorithms=["RS256"],
            audience=_client_id(),
            issuer=list(GOOGLE_ISSUERS),
        )
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail=f"Invalid Google id_token: {error}") from error


# --- This project's own session JWT (separate from Google's id_token) -------


def issue_session_jwt(*, email: str | None, name: str | None, picture: str | None, session_id: str) -> str:
    now = int(time.time())
    payload = {
        "sub": email,
        "name": name,
        "picture": picture,
        "sid": session_id,
        "iat": now,
        "exp": now + _SESSION_JWT_TTL_SECONDS,
    }
    return jwt.encode(payload, _session_secret(), algorithm="HS256")


def verify_session_jwt(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, _session_secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def read_session_jwt(request: Request) -> str | None:
    return request.headers.get(SESSION_HEADER)


class OAuthSessionStore:
    """SQLite-backed store for encrypted Google OAuth tokens, keyed by a random session id.

    Shares the same on-disk database as ProposalStore (OPENPIP_DATABASE_PATH) but
    owns its own table, matching the storage pattern already used by store.py.
    The session id here is purely an internal DB key — it is never handed to
    the browser directly; only the `sid` claim inside the signed session JWT
    references it.
    """

    def __init__(self, database_path: str = ":memory:") -> None:
        if database_path != ":memory:":
            Path(database_path).parent.mkdir(parents=True, exist_ok=True)
        self._connection = sqlite3.connect(database_path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._initialize()

    def _initialize(self) -> None:
        self._connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS oauth_sessions (
                id TEXT PRIMARY KEY,
                email TEXT,
                name TEXT,
                picture TEXT,
                access_token_encrypted TEXT NOT NULL,
                refresh_token_encrypted TEXT,
                access_token_expires_at REAL NOT NULL,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );
            """
        )
        self._connection.commit()

    def create(
        self,
        *,
        email: str | None,
        name: str | None,
        picture: str | None,
        access_token: str,
        refresh_token: str | None,
        expires_in: int,
    ) -> str:
        session_id = secrets.token_urlsafe(32)
        now = time.time()
        self._connection.execute(
            """
            INSERT INTO oauth_sessions
                (id, email, name, picture, access_token_encrypted, refresh_token_encrypted, access_token_expires_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                email,
                name,
                picture,
                _encrypt(access_token),
                _encrypt(refresh_token) if refresh_token else None,
                now + expires_in,
                now,
                now,
            ),
        )
        self._connection.commit()
        return session_id

    def _row(self, session_id: str) -> sqlite3.Row | None:
        cursor = self._connection.execute("SELECT * FROM oauth_sessions WHERE id = ?", (session_id,))
        return cursor.fetchone()

    def _update_access_token(self, session_id: str, access_token: str, expires_in: int) -> None:
        now = time.time()
        self._connection.execute(
            "UPDATE oauth_sessions SET access_token_encrypted = ?, access_token_expires_at = ?, updated_at = ? WHERE id = ?",
            (_encrypt(access_token), now + expires_in, now, session_id),
        )
        self._connection.commit()

    async def resolve_access_token(self, session_id: str) -> str | None:
        """Return a live Google access token for this session, refreshing it if expired."""
        row = self._row(session_id)
        if row is None:
            return None
        if row["access_token_expires_at"] > time.time() + _ACCESS_TOKEN_SKEW_SECONDS:
            return _decrypt(row["access_token_encrypted"])
        if not row["refresh_token_encrypted"]:
            # No refresh token (e.g. Google only issues one on first consent) —
            # the caller must re-authenticate via /auth/login.
            return None
        refresh_token = _decrypt(row["refresh_token_encrypted"])
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0)) as client:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": _client_id(),
                        "client_secret": _client_secret(),
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                    },
                )
        except httpx.HTTPError:
            return None
        if not response.is_success:
            # Refresh token was revoked/expired — force re-authentication rather
            # than silently failing every subsequent call the same way.
            self.delete(session_id)
            return None
        payload = response.json()
        access_token = payload["access_token"]
        self._update_access_token(session_id, access_token, int(payload.get("expires_in", 3600)))
        return access_token

    def delete(self, session_id: str) -> None:
        self._connection.execute("DELETE FROM oauth_sessions WHERE id = ?", (session_id,))
        self._connection.commit()


# --- CSRF state for the /auth/login -> /auth/callback round trip ------------


def _sign_state(payload: dict[str, Any]) -> str:
    """HMAC-sign the OAuth `state` param so /auth/callback can trust `next`."""
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")).decode("utf-8")
    signature = hmac.new(_session_secret().encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def _verify_state(state: str) -> dict[str, Any]:
    try:
        body, signature = state.split(".", 1)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from error
    expected = hmac.new(_session_secret().encode("utf-8"), body.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    try:
        return json.loads(base64.urlsafe_b64decode(body.encode("utf-8")).decode("utf-8"))
    except (ValueError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from error


def build_authorization_url(*, next_path: str) -> str:
    """Build the Google consent-screen URL for GET /auth/login."""
    nonce = secrets.token_urlsafe(16)
    state = _sign_state({"nonce": nonce, "next": next_path if next_path.startswith("/") else "/"})
    params = {
        "client_id": _client_id(),
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str) -> dict[str, Any]:
    """POST the authorization code to Google's token endpoint. Raises on failure."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0)) as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "code": code,
                "redirect_uri": _redirect_uri(),
                "grant_type": "authorization_code",
            },
        )
    if not response.is_success:
        raise HTTPException(status_code=502, detail=f"Google token exchange failed: {response.text[:300]}")
    return response.json()


def redirect_target_with_session(next_path: str, session_jwt: str) -> str:
    safe_next = next_path if next_path.startswith("/") and not next_path.startswith("//") else "/"
    return f"{_frontend_origin()}{safe_next}#openpip_session={session_jwt}"
