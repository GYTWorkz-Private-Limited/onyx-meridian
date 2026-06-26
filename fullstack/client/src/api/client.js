// ============================================================
// API CLIENT — the single seam between the UI and the backend.
// In mock mode (default) requests are answered in-process by api/mock.js.
// When a real backend exists, set VITE_USE_MOCK=false and these same calls hit
// `fetch('/api/...')` — no page/component changes required (doc/build.md §3).
// ============================================================
import { mockHandle } from './mock.js';

const USE_MOCK = (import.meta.env?.VITE_USE_MOCK ?? 'true') !== 'false';
const BASE = import.meta.env?.VITE_API_BASE ?? '/api';

export async function request(method, path, body) {
  if (USE_MOCK) return mockHandle(path, method, body);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const isMock = USE_MOCK;
