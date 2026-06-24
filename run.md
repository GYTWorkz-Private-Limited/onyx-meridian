# Running Onyx Meridian

## Stack overview

| Layer | Tech | Default port |
|-------|------|-------------|
| API (backend) | FastAPI + Uvicorn (Python 3.11+) | 8010 |
| UI (frontend) | React 19 + Vite + Tailwind | 5173 |
| Database | MongoDB 7 (optional) | 27017 |

---

## Option A — Full stack with Docker Compose (recommended)

Starts the API and MongoDB together with a single command.

```bash
docker compose up --build
```

- API: http://localhost:8010
- Swagger docs: http://localhost:8010/docs
- MongoDB: `mongodb://localhost:27017/meridian`

Stop everything:

```bash
docker compose down
```

Destroy data volumes too:

```bash
docker compose down -v
```

---

## Option B — Local dev (no Docker)

### 1. Backend

Install dependencies (Python 3.11+ required):

```bash
pip install -r requirements.txt
# or for dev/test tools too:
pip install -r requirements-dev.txt
```

Run with in-memory storage (no Mongo needed):

```bash
uvicorn meridian.main:app --reload --port 8010
```

Run with a local MongoDB:

```bash
MONGO_DB_URL=mongodb://localhost:27017/meridian \
  uvicorn meridian.main:app --reload --port 8010
```

- API: http://localhost:8010
- Swagger docs: http://localhost:8010/docs

### 2. Frontend

```bash
cd ui
npm install
npm run dev
```

- UI: http://localhost:5173

The UI proxies API calls to `http://localhost:8010` (configured in `ui/vite.config.ts`).

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_DB_URL` | *(unset)* | MongoDB connection string. Omit to use in-memory store. |
| `PORT` | `8010` | Port the API listens on. |
| `CORS_ORIGINS` | `["*"]` | Comma-separated list of allowed CORS origins. |

---

## Tests

```bash
pytest
```

---

## Health check

```bash
curl http://localhost:8010/
# {"service":"Onyx Meridian","version":"0.1.0","docs":"/docs"}
```
