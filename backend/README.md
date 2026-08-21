# OpenPip backend

The backend owns the approval-first agent loop:

1. Collect workspace context.
2. Generate a daily briefing with Strands.
3. Create source-cited proposals for actions.
4. Wait for explicit approval or rejection.
5. Execute an approved side effect through a dedicated adapter.

## Local development

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn openpip_backend.app:app --reload --app-dir src
```

The local fallback briefing works without Bedrock access. When AWS credentials and
Bedrock model access are available, the `/api/briefing` endpoint uses a Strands
agent backed by Amazon Bedrock.
