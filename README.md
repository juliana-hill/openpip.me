# OpenPip.me

OpenPip is an approval-gated professional agent for solo professionals,
consultants, founders, and small-business owners. It produces a daily briefing
and source-cited proposals; it never sends, schedules, modifies, or calls
without an explicit human decision.

## How context works

OpenPip keeps its safety policy, tool inventory, and orchestration instructions
private. In Settings, each user can edit their **working context**: priorities,
work style, standing rules, communication preferences, and what to avoid. That
context guides what OpenPip recommends and how it communicates; it can never
grant permission to take an external action.

## Local development

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
pytest -q
uvicorn openpip_backend.app:app --reload --app-dir src
```

```bash
cd frontend
npm install
npm run lint
npm run build
```

Use `.env.example` only as a names-only template. Never commit OAuth tokens,
credentials, or real workspace data.

See [the project plan](docs/PLAN.md) and [OAuth setup reference](docs/OAUTH_SETUP.md).
