# server/ — PLANNED backend (not built in this prototype)

This directory is intentionally a stub. The backend is **designed** in
[`../doc/build.md`](../doc/build.md) (§5 schema, §6 routes) but **not implemented**
in the prototype.

The app currently runs entirely on **mock APIs** in `client/src/api/mock.js`,
which implement the same §6 contract over a seeded, `localStorage`-persisted store.

## Converting to a real backend (flag-flip, no UI changes)

1. Build an Express + Drizzle server here that implements the routes in
   `client/src/api/mock.js` (they are 1:1 with the planned Express routes).
2. Run it on `http://localhost:3100` (the Vite dev proxy already points `/api` there).
3. Start the client with `VITE_USE_MOCK=false` — the API client
   (`client/src/api/client.js`) then calls `fetch('/api/...')` instead of the mock.

No pages or components change — the API contract is the seam.
