# Onyx Meridian

An AI-workforce monitoring platform — an "Executive Command" dashboard for tracking AI agents, tasks, costs, model performance, knowledge retrieval, security, and infrastructure health.

## Stack

- `frontend/` — Vite + React, standalone npm project
- `backend/` — FastAPI (Python), standalone venv project
- `backend/db/` — PostgreSQL schema + seed data (Drizzle ORM, standalone npm project)

## Running

**Backend** (FastAPI, port 8010):

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python main.py        # or: .venv/bin/uvicorn app.main:app --reload --port 8010
```

Requires `backend/.env` with `DATABASE_URL` pointing at Postgres.

**Database** (schema push + seed):

```bash
cd backend/db
npm install
npm run push   # push schema to Postgres
npm run seed   # seed manufacturing mock data + login users
```

Requires `backend/db/.env` with `DATABASE_URL`.

**Frontend** (Vite dev server):

```bash
cd frontend
npm install
npm run dev
```

Proxies `/api` requests to the backend at `http://localhost:8010` by default (override with `API_PROXY_TARGET`).

## Login

The login page authenticates against `backend/db`'s seeded `users` table (see `backend/db/src/seed.ts` for the credential list). All other API data is served as static mock data ported from the original Express prototype.
