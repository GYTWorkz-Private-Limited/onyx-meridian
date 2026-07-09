# Onyx Meridian

An AI-workforce monitoring platform — an "Executive Command" dashboard for tracking AI agents, tasks, costs, model performance, knowledge retrieval, security, and infrastructure health, backed by an Express API and Postgres/Drizzle.

## Stack

- pnpm workspace monorepo, Node.js 24, TypeScript 5.9
- Frontend: Vite + React (`artifacts/onyx-meridian`)
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`lib/api-zod`)
- API client codegen: Orval, generated from an OpenAPI spec (`lib/api-spec`, `lib/api-client-react`)

## Setup

Dependencies **must** be installed with `pnpm` — the repo is a pnpm workspace (see `pnpm-workspace.yaml` for the package list, version catalog, and supply-chain install policy) and `npm install` / `yarn install` are blocked by a `preinstall` guard.

```bash
pnpm install
```

Required env var: `DATABASE_URL` — Postgres connection string.

## Running

Once dependencies are installed, day-to-day scripts can be run with either `pnpm` or `npm run` (the root scripts just shell out to `pnpm --filter`/`pnpm -r` internally, so `npm run <script>` works too):

```bash
npm run dev       # frontend dev server (artifacts/onyx-meridian, Vite)
npm run dev:api   # API server (artifacts/api-server, port 5000)
npm run build     # typecheck + build all packages
npm run typecheck # typecheck across all packages
```

Other useful commands (run via `pnpm --filter <package> run <script>`):

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Repo map

- `artifacts/onyx-meridian` — main frontend app
- `artifacts/api-server` — Express API server
- `artifacts/mockup-sandbox` — UI mockup/sandbox app
- `lib/db` — Drizzle schema and DB access
- `lib/api-spec` — OpenAPI spec, source of truth for API contracts
- `lib/api-zod` — Zod schemas generated from the API spec
- `lib/api-client-react` — generated React Query hooks for the API
- `scripts` — misc workspace scripts
