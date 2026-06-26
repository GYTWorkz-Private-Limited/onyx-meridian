// ============================================================
// MOCK BACKEND — in-process implementation of the §6 API contract.
// Seeds the real-estate company from Meridian's store.js and a second empty
// "generic" company to prove the multi-company shell. State is persisted to
// localStorage so changes survive reloads (feels like a real DB).
//
// This is the ONLY place that knows the data is mocked. The UI calls
// `api/client.js` which does mock dispatch now and `fetch('/api/...')` later —
// converting to a real backend is a flag flip (VITE_USE_MOCK=false), no UI
// changes. Keep these handlers 1:1 with the planned Express routes (doc/build.md §6).
// ============================================================
import {
  DEPARTMENTS, EMPLOYEES, TASKS, APPROVALS, PEOPLE, CONNECTORS,
  UNITS_OF_WORK, QUESTIONS,
} from '../data/store.js';
import {
  DEFAULT_ADAPTERS, withOrgFields, seedGoals, seedProjects, seedActivity,
} from '../data/paperclip.js';

const KEY = 'paperclip-proto-db-v1';
let _c = 0;
const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(_c++).toString(36)}`;
const nowIso = () => new Date().toISOString();
const clone = (x) => JSON.parse(JSON.stringify(x));

function emptyCompanyData() {
  return {
    departments: [], employees: [], tasks: [], approvals: [], people: [],
    connectors: [], unitsOfWork: [], questions: [], chats: {},
    goals: [], projects: [], adapters: DEFAULT_ADAPTERS.map(a => ({ ...a })), activity: [],
  };
}

function seedDB() {
  const companies = [
    { id: 'co-onyx', name: 'Onyx Meridian Real Estate', domain: 'real-estate',
      tagline: 'Commercial & residential real-estate operations on ERP systems.',
      budgetMonthlyUsd: 25000, createdAt: nowIso() },
    { id: 'co-acme', name: 'Acme AI Labs', domain: 'generic',
      tagline: 'A fresh company — onboard a department to begin building a workforce.',
      budgetMonthlyUsd: 8000, createdAt: nowIso() },
  ];
  const onyx = {
    departments: [...DEPARTMENTS],
    employees: withOrgFields(clone(EMPLOYEES)),
    tasks: clone(TASKS),
    approvals: clone(APPROVALS),
    people: clone(PEOPLE),
    connectors: clone(CONNECTORS),
    unitsOfWork: clone(UNITS_OF_WORK),
    questions: clone(QUESTIONS),
    chats: {},
    goals: seedGoals('co-onyx'),
    projects: seedProjects('co-onyx'),
    adapters: DEFAULT_ADAPTERS.map(a => ({ ...a })),
    activity: seedActivity('co-onyx'),
  };
  const acme = emptyCompanyData();
  acme.goals = seedGoals('co-acme');
  return { companies, data: { 'co-onyx': onyx, 'co-acme': acme } };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const db = seedDB();
  saveDB(db);
  return db;
}
function saveDB(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} }

let DB = loadDB();

function logActivity(cid, entry) {
  const d = DB.data[cid];
  if (!d) return;
  d.activity = [{ id: uid('act'), at: nowIso(), ...entry }, ...(d.activity || [])].slice(0, 200);
}

// resource path segment → collection key on the company data object
const RES_KEY = { 'units-of-work': 'unitsOfWork' };
const keyOf = (res) => RES_KEY[res] || res;

// Defaults applied to newly-created records, per collection.
function withDefaults(res, body) {
  const base = { id: uid(res.slice(0, 4)), ...body };
  switch (res) {
    case 'employees':    return { status: 'active', reasoning: 'medium', model: 'sonnet-4-6', archetype: 'Coordinator', tokensMonth: 6_000_000, tasks_completed: 0, workflowIds: [], adapterId: 'adp-claude', budgetMonthlyUsd: 500, managerId: null, ...body, id: uid('emp') };
    case 'tasks':        return { status: 'todo', delegateTo: null, ...body, id: uid('task') };
    case 'approvals':    return { createdAt: nowIso(), ...body, id: uid('app') };
    case 'people':       return { status: 'invited', ...body, id: uid('p') };
    case 'units-of-work':return { ...body, id: uid('uow') };
    case 'goals':        return { status: 'active', parentId: null, ...body, id: uid('goal') };
    case 'projects':     return { status: 'planning', ...body, id: uid('proj') };
    default:             return base;
  }
}

// The mock "router". Mirror of the planned Express routes (doc/build.md §6).
export async function mockHandle(path, method = 'GET', body) {
  const parts = path.replace(/^\//, '').split('/').filter(Boolean);

  // /companies
  if (parts[0] === 'companies' && parts.length === 1) {
    if (method === 'GET') return clone(DB.companies);
    if (method === 'POST') {
      const co = { id: uid('co'), name: body.name, domain: body.domain || 'generic',
        tagline: body.tagline || '', budgetMonthlyUsd: body.budgetMonthlyUsd || 5000, createdAt: nowIso() };
      DB.companies.push(co);
      DB.data[co.id] = emptyCompanyData();
      DB.data[co.id].departments = [];
      saveDB(DB);
      logActivity(co.id, { actorType: 'user', actorId: body.actorId || 'admin-1', action: 'created_company', targetType: 'company', targetId: co.id, meta: { name: co.name } });
      return clone(co);
    }
  }

  // /companies/:cid/...
  if (parts[0] === 'companies' && parts.length >= 3) {
    const cid = parts[1];
    const res = parts[2];
    const rid = parts[3];
    const action = parts[4];
    const d = DB.data[cid];
    if (!d) throw new Error(`Unknown company ${cid}`);

    // GET full slice
    if (res === 'state' && method === 'GET') return clone(d);

    // POST /employees/:id/chat
    if (res === 'employees' && rid && action === 'chat' && method === 'POST') {
      const msg = { id: uid('msg'), ...body };
      d.chats[rid] = [...(d.chats[rid] || []), msg];
      saveDB(DB);
      return clone(msg);
    }
    // POST /connectors/:id/connect
    if (res === 'connectors' && rid && action === 'connect' && method === 'POST') {
      d.connectors = d.connectors.map(c => c.id === rid ? { ...c, connected: true } : c);
      saveDB(DB);
      logActivity(cid, { actorType: 'user', actorId: body?.actorId || 'admin-1', action: 'connected_connector', targetType: 'connector', targetId: rid, meta: { name: d.connectors.find(c => c.id === rid)?.name } });
      return clone(d.connectors.find(c => c.id === rid));
    }

    const key = keyOf(res);
    if (!(key in d)) throw new Error(`Unknown resource ${res}`);

    // Collection ops
    if (!rid && method === 'GET') return clone(d[key]);
    if (!rid && method === 'POST') {
      const rec = withDefaults(res, body);
      d[key] = [rec, ...d[key]];
      saveDB(DB);
      const actionMap = { employees: 'created_employee', tasks: 'created_task', goals: 'created_goal', projects: 'created_project', 'units-of-work': 'created_uow', people: 'invited_user', approvals: 'requested_approval' };
      if (actionMap[res]) logActivity(cid, { actorType: 'user', actorId: body.actorId || 'admin-1', action: actionMap[res], targetType: res, targetId: rec.id, meta: { name: rec.name || rec.title } });
      return clone(rec);
    }
    // Item ops
    if (rid && method === 'PATCH') {
      let updated = null;
      d[key] = d[key].map(item => item.id === rid ? (updated = { ...item, ...body }) : item);
      saveDB(DB);
      if (res === 'tasks' && body.status) logActivity(cid, { actorType: 'user', actorId: 'admin-1', action: 'moved_task', targetType: 'task', targetId: rid, meta: { name: updated?.title, status: body.status } });
      else if (res === 'employees') logActivity(cid, { actorType: 'user', actorId: 'admin-1', action: 'updated_employee', targetType: 'employee', targetId: rid, meta: { name: updated?.name } });
      return clone(updated);
    }
    if (rid && method === 'DELETE') {
      const removed = d[key].find(i => i.id === rid);
      d[key] = d[key].filter(i => i.id !== rid);
      saveDB(DB);
      if (res === 'approvals') logActivity(cid, { actorType: 'user', actorId: 'admin-1', action: 'resolved_approval', targetType: 'approval', targetId: rid, meta: { name: removed?.title } });
      return null;
    }
  }

  // health
  if (parts[0] === 'health') return { ok: true, mock: true };

  throw new Error(`Mock: no handler for ${method} ${path}`);
}

// Dev helper: wipe persisted state and reseed.
export function resetMockDB() {
  try { localStorage.removeItem(KEY); } catch {}
  DB = seedDB();
  saveDB(DB);
}
