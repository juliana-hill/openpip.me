# OpenPip frontend

This directory is the copied travel-agent frontend source and assets, served by
Express.js with HJS templates. Each view has its own HJS file and Babel-compiled
browser entry point in `views/` and `public/js/`.

```bash
npm install
npm run build
PORT=4444 npm start
```

The browser makes same-origin requests. Express proxies `/api` to this
project's FastAPI backend (`BACKEND_URL`, default `http://localhost:8000`),
and uses the OAuth service (`AUTH_PROXY_URL`, default `http://localhost:4001`)
for sign-in/session endpoints only. Every `/agent` and `/api` feature—including
Google provider reads and Drive-backed app data—stays on this project's FastAPI
backend and cannot fall through to the legacy travel-agent service. Port 4000
is the travel-agent Next.js frontend and is never used as an API target.
Views render connected provider responses or an explicit empty/error state. No
demo, mock, fixture, seeded, or fake data is defined in this frontend.
