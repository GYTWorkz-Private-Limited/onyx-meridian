import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/index.js';
import { resetMockDB } from '../api/mock.js';

// Multi-company store backed by the mock API (api/*). The `useStore()` shape and
// action names are kept identical to the original Meridian store so every page
// keeps working unchanged — the only difference is data now flows through the
// API seam (mock now, real backend later) and is scoped to the current company.

let counter = 0;
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${counter++}`;

const COMPANY_KEY = 'paperclip-current-company';
const StoreCtx = createContext(null);

function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f1b2d' }}>
      <div className="signin-spinner" />
    </div>
  );
}

export function StoreProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(() => {
    try { return localStorage.getItem(COMPANY_KEY) || 'co-onyx'; } catch { return 'co-onyx'; }
  });
  const [state, setState] = useState(null); // current company's data slice
  const [loading, setLoading] = useState(true);

  // Load the company list once.
  useEffect(() => { api.listCompanies().then(setCompanies).catch(() => setCompanies([])); }, []);

  // Load (or reload) the current company's slice whenever the company changes.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.getState(companyId)
      .then(s => { if (alive) { setState(s); setLoading(false); } })
      .catch(() => { if (alive) { setState(null); setLoading(false); } });
    try { localStorage.setItem(COMPANY_KEY, companyId); } catch {}
    return () => { alive = false; };
  }, [companyId]);

  // Merge a patch into the current slice.
  const patch = (fn) => setState(s => (s ? fn(s) : s));

  const actions = {
    // ---- Companies (Paperclip) ----
    switchCompany: (id) => setCompanyId(id),
    createCompany: async ({ name, domain, tagline }) => {
      const co = await api.createCompany({ name, domain, tagline });
      setCompanies(cs => [...cs, co]);
      setCompanyId(co.id);
      return co;
    },

    // ---- People ----
    inviteUser: async (body) => {
      const p = await api.invitePerson(companyId, body);
      patch(s => ({ ...s, people: [p, ...s.people] }));
    },

    // ---- Employees / Agents ----
    createEmployee: async (emp) => {
      const e = await api.createEmployee(companyId, emp);
      patch(s => ({ ...s, employees: [e, ...s.employees] }));
      return e;
    },
    updateEmployee: async (id, patchBody) => {
      const e = await api.updateEmployee(companyId, id, patchBody);
      patch(s => ({ ...s, employees: s.employees.map(x => x.id === id ? e : x) }));
    },
    setReasoning: (id, reasoning) => actions.updateEmployee(id, { reasoning }),

    // ---- Tasks / Issues ----
    createTask: async (task) => {
      const t = await api.createTask(companyId, task);
      patch(s => ({ ...s, tasks: [t, ...s.tasks] }));
    },
    updateTask: async (id, patchBody) => {
      const t = await api.updateTask(companyId, id, patchBody);
      patch(s => ({ ...s, tasks: s.tasks.map(x => x.id === id ? t : x) }));
    },
    assignTask: (taskId, empId) => actions.updateTask(taskId, { assigneeType: 'ai', assignee: empId }),
    moveTask: (taskId, status) => actions.updateTask(taskId, { status }),

    // ---- Connectors ----
    connectConnector: async (id) => {
      const conn = await api.connectConnector(companyId, id);
      patch(s => ({ ...s, connectors: s.connectors.map(c => c.id === id ? conn : c) }));
    },

    // ---- Approvals ----
    addApproval: async (app) => {
      const a = await api.createApproval(companyId, app);
      patch(s => ({ ...s, approvals: [a, ...s.approvals] }));
    },
    resolveApproval: async (id) => {
      await api.resolveApproval(companyId, id);
      patch(s => ({ ...s, approvals: s.approvals.filter(a => a.id !== id) }));
    },

    // ---- Units of Work ----
    addUnitOfWork: async (uow) => {
      const u = await api.addUnitOfWork(companyId, uow);
      patch(s => ({ ...s, unitsOfWork: [u, ...s.unitsOfWork] }));
    },

    // ---- Chats ----
    addChatMessage: async (empId, message) => {
      const msg = await api.addChatMessage(companyId, empId, message);
      patch(s => ({ ...s, chats: { ...s.chats, [empId]: [...(s.chats[empId] || []), msg] } }));
    },

    // ---- Goals & Projects (Paperclip) ----
    createGoal: async (body) => {
      const g = await api.createGoal(companyId, body);
      patch(s => ({ ...s, goals: [g, ...s.goals] }));
    },
    createProject: async (body) => {
      const p = await api.createProject(companyId, body);
      patch(s => ({ ...s, projects: [p, ...s.projects] }));
    },

    // ---- Dev ----
    resetStore: () => { resetMockDB(); window.location.reload(); },
  };

  if (loading || !state) return <Splash />;

  const currentCompany = companies.find(c => c.id === companyId) || null;

  // Spread the slice (employees, tasks, …) + company context + actions, exactly
  // like the original store, so `useStore()` callers are unchanged.
  return (
    <StoreCtx.Provider value={{ ...state, companies, companyId, currentCompany, ...actions }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
