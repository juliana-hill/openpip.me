# Google OAuth Setup Reference — Agentic Scanning

This is a from-scratch reference for wiring Google OAuth into the new OpenPip repo, so the agent can read Gmail, Calendar, Tasks, and Drive on the user's behalf. It's written up from what worked (and what to change) in the earlier OpenPip build, not copied from it — no credentials, tokens, or personal data are carried over.

## 1. Google Cloud project

1. Create a new Google Cloud project dedicated to this repo (don't reuse an old project tied to personal data).
2. Enable APIs: **Gmail API**, **Google Calendar API**, **Google Tasks API**, **Google Drive API**.
3. Create OAuth 2.0 credentials (Web application type). Set:
   - Authorized redirect URI(s): your callback route, e.g. `https://openpip.me/auth/callback` for production and `http://localhost:PORT/auth/callback` for local dev.
   - Authorized JavaScript origins: `https://openpip.me` and your local dev origin.

## 2. OAuth consent screen — keep it in "Testing" mode

- App type: External.
- **Scopes — request the minimum, not everything the old build asked for:**

  | Purpose | Recommended scope | Avoid |
  |---|---|---|
  | Identify the user | `openid`, `email`, `profile` | — |
  | Read calendar | `calendar.readonly` | — |
  | Create/update events the agent proposes | `calendar.events` | — |
  | Read/triage mail | `gmail.readonly` + `gmail.modify` (labels/archive) | `https://mail.google.com/` (full account access — sensitive, slower verification, more than the agent needs) |
  | Draft replies only, no autonomous send | `gmail.compose` (drafts only) | `gmail.send` (skip unless you truly want the agent capable of sending without a draft step) |
  | Task management | `tasks` | — |
  | Read reference docs, historical Google Docs, and Sheets | `drive.readonly` + `drive.file` + `spreadsheets.readonly` | full `drive` (broad, sensitive) |

  Narrower scopes = faster to demo, since several of these are "sensitive" or "restricted" scopes that require Google's app verification before they can be used with real (non-test) users at scale — verification review can take well beyond the 6-week build window.

- Add your own Google account(s) as **test users**. Testing mode supports up to 100 test users and works fine for building and recording the demo video — you do not need to complete verification for the hackathon submission.
- Set `access_type=offline` and `prompt=consent` on the auth request so you get a refresh token on first connect (needed for the agent to run in the background without the user re-logging in every hour).

## 3. Where the token lives — the current FastAPI session boundary

The current OpenPip web service owns Google OAuth and the user session. A
minimal Express (or FastAPI) route pair does it:

- `GET /auth/login` — build the Google `https://accounts.google.com/o/oauth2/v2/auth` URL with `client_id`, `redirect_uri`, `response_type=code`, `scope`, `access_type=offline`, `prompt=consent`, and a signed `state` param; redirect the browser there.
- `GET /auth/callback` — exchange the returned `code` for `access_token` + `refresh_token` at `https://oauth2.googleapis.com/token`, fetch `https://www.googleapis.com/oauth2/v2/userinfo` to get the user's email, then store the tokens server-side (encrypted at rest, using the production database and Google Cloud Secret Manager/KMS controls) keyed to a signed, `httpOnly` session cookie. Never store tokens in browser storage or in the frontend at all.
- A small refresh-token exchange helper that runs before any tool call whose cached access token has expired.

This FastAPI-owned boundary is deliberate. The agent's deterministic crawl,
agentic memory synthesis, proposal state, and approval executor all need the
same per-user authorization context. AgentCore Identity was evaluated, but
introducing a separate identity/runtime handoff would add coordination and
latency without improving this workflow. AgentCore is therefore not part of
the current deployment plan. This is an application-fit decision, not a
limitation imposed by Google Cloud.

## 4. Wiring tokens into Strands tools

Each MCP tool (calendar, gmail, tasks, drive) takes the current user's access
token as a per-call parameter, calls the relevant Google API endpoint, and
returns structured data to the agent. Keep tools read-first — any tool that
would *change* something (send a reply, create a calendar event, modify a
task) should write a **proposal** instead of executing directly; only the
Review-queue "approve" action should call the real Google write endpoint.
This is what makes the agent "surface only when there's a real decision to
make" instead of acting silently.

### Current OpenPip read adapters

The FastAPI service exposes the first read-only provider routes used by the
Express/HJS views:

| View data | Route |
|---|---|
| Google Tasks | `GET /agent/google/tasks` |
| Calendar events | `GET /agent/calendars?from=YYYY-MM-DD&days=7` |
| Notebook pages (Google Tasks lists) | `GET /agent/notebook/pages` |
| Recent Google Drive files | `GET /agent/drive/files?pageSize=50` |
| Gmail inbox | `GET /agent/inbox/messages?source=gmail` |
| Gmail unread count | `GET /agent/inbox/count` |

These routes require a live Google access token in `x-google-token` (or an
`Authorization: Bearer` header). The browser never stores or invents a token;
without one the service returns `401 {"detail":"Google account is not connected"}`.
The Express frontend sends `/api` requests directly to FastAPI. `/agent`
requests pass through the OAuth session boundary so it can inject the signed-in
user's access token, then must be forwarded to this Python backend—not the old
travel-agent service. For the local proxy, set `AGENT_URL=http://localhost:5501/agent`.
FastAPI validates the injected per-user token at each provider/app-data route.

## 5. Environment variables (names only — never commit values)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
SESSION_SIGNING_SECRET=
AWS_REGION=
```

Add all of the above to `.gitignore`'d `.env` files with a checked-in `.env.example` that lists names only, matching this list.

## 6. Demo data safety

Before recording the demo video or deploying a public live-demo link, connect a
dedicated real Google account (not a personal inbox). Never implement a
demo/seed account, mock provider, fixture, or fake API response in the actual
`frontend/` directory; the app must display connected provider data or an
explicit empty/error state.
