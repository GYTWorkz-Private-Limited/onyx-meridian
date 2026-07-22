import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { DEFAULT_PERSONA_ID, getPersona, PERSONAS, type Persona, type Role } from "@/lib/rbac";
import { login as apiLogin, type AuthUser } from "@/lib/auth";
import type { Person } from "@/data/people-data";
import { GOAL_TREE, type Goal } from "@/data/goals-data";

// ─── Cost control ───────────────────────────────────────────────
// Session-lived cap/lock state for BUs, departments, people and agents.
// null cap = unlimited. Mirrors the workflows/goals pattern below — this is
// a prototype with no backend persistence, so state lives here for the
// duration of the session and is shared across every cost-control surface
// (Cost Control page, Workforce Inventory, Harness, global kill switch).

export interface CapState { cap: number | null; locked: boolean }
export interface AgentCapState { sessionCap: number | null; totalCap: number | null; locked: boolean }

const DEFAULT_CAP: CapState = { cap: null, locked: false };
const DEFAULT_AGENT_CAP: AgentCapState = { sessionCap: null, totalCap: null, locked: false };

export interface WorkflowInstance {
  id: string;
  title: string;
  description: string;
  status: "running" | "pending" | "completed" | "failed";
  agent: string;
  startedAt: string;
  progress: number;
}

export interface AppTask {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  priority: "p1" | "p2" | "p3";
  businessUnit: string;
  status: "todo" | "in-progress" | "done" | "blocked";
  source: "human" | "ai" | "shared";
}

interface AppContextType {
  workflows: WorkflowInstance[];
  addWorkflow: (title: string, agent: string, description: string) => WorkflowInstance;
  updateWorkflowStatus: (id: string, status: WorkflowInstance["status"]) => void;
  pendingApprovals: number;
  decrementApprovals: () => void;
  incrementApprovals: () => void;
  // RBAC / persona
  persona: Persona;
  role: Role;
  currentBuId: string | null;
  setActivePersonaId: (id: string) => void;
  // "Preview as this person" — a temporary, app-wide view override for
  // CXO's People page. Does not touch authUser/login state; exiting simply
  // clears it and the real persona/role take back over.
  previewPerson: Person | null;
  startPreview: (person: Person) => void;
  exitPreview: () => void;
  // Goals — session-lived like `workflows`, so state survives navigation
  // (e.g. across the "preview as this person" role switch on People).
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  addGoals: (goals: Goal[]) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  // Companies (shallow multi-tenancy)
  currentCompanyId: string;
  setCurrentCompanyId: (id: string) => void;
  // Auth — real login against the FastAPI backend, replaces manual persona
  // switching once a user is logged in.
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  // Cost control — session-lived caps/locks scoped to BU, department, person
  // and agent, plus per-agent model/reasoning overrides and the global kill
  // switch. See the "Cost control" comment block above for the model.
  getBuCap: (id: string) => CapState;
  getDeptCap: (id: string) => CapState;
  getPersonCap: (id: string) => CapState;
  getAgentCap: (id: string) => AgentCapState;
  setBuCap: (id: string, cap: number | null, locked?: boolean) => void;
  setDeptCap: (id: string, cap: number | null, locked?: boolean) => void;
  setPersonCap: (id: string, cap: number | null, locked?: boolean) => void;
  setAgentCap: (id: string, patch: Partial<AgentCapState>) => void;
  agentModelOverride: Record<string, string>;
  agentReasoningOverride: Record<string, string>;
  setAgentModel: (id: string, modelId: string) => void;
  setAgentReasoning: (id: string, level: string) => void;
  killSwitchActive: boolean;
  activateKillSwitch: () => void;
  deactivateKillSwitch: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const PERSONA_STORAGE_KEY = "onyx.personaId";
const COMPANY_STORAGE_KEY = "onyx.companyId";
const AUTH_STORAGE_KEY = "onyx.authUser";

const INITIAL_WORKFLOWS: WorkflowInstance[] = [
  { id: "wf1", title: "APAC Enterprise Account Recovery", description: "Reallocate AI SDR to enterprise accounts", status: "running", agent: "Revenue Scout AI", startedAt: "2h ago", progress: 64 },
  { id: "wf2", title: "Strategic Account Churn Prevention", description: "Launch retention workflow for 6 at-risk accounts", status: "running", agent: "Customer Success AI", startedAt: "1h ago", progress: 41 },
  { id: "wf3", title: "Invoice Approval Automation", description: "Reduce invoice approval cycle time", status: "completed", agent: "Finance Operations AI", startedAt: "4h ago", progress: 100 },
  { id: "wf4", title: "Release Pipeline Rebalancing", description: "Optimize AI-to-human review ratio", status: "pending", agent: "Engineering AI Employee", startedAt: "30m ago", progress: 12 },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>(INITIAL_WORKFLOWS);
  const [pendingApprovals, setPendingApprovals] = useState(3);

  const [activePersonaId, setActivePersonaIdState] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_PERSONA_ID;
    const stored = window.localStorage.getItem(PERSONA_STORAGE_KEY);
    return stored && PERSONAS.some((p) => p.id === stored) ? stored : DEFAULT_PERSONA_ID;
  });
  const [currentCompanyId, setCurrentCompanyIdState] = useState<string>(() => {
    if (typeof window === "undefined") return "company-a";
    return window.localStorage.getItem(COMPANY_STORAGE_KEY) || "company-a";
  });

  useEffect(() => {
    window.localStorage.setItem(PERSONA_STORAGE_KEY, activePersonaId);
  }, [activePersonaId]);

  useEffect(() => {
    window.localStorage.setItem(COMPANY_STORAGE_KEY, currentCompanyId);
  }, [currentCompanyId]);

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });

  useEffect(() => {
    if (authUser) window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    else window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [authUser]);

  const login = useCallback(async (username: string, password: string) => {
    const user = await apiLogin(username, password);
    setAuthUser(user);
  }, []);

  const logout = useCallback(() => setAuthUser(null), []);

  const [previewPerson, setPreviewPerson] = useState<Person | null>(null);
  const startPreview = useCallback((person: Person) => setPreviewPerson(person), []);
  const exitPreview = useCallback(() => setPreviewPerson(null), []);

  // People-directory roleTiers don't distinguish dept_manager from a plain
  // employee — "member" maps to "employee" as the closest available preview.
  const previewPersona: Persona | null = previewPerson
    ? {
        id: previewPerson.id,
        name: previewPerson.name,
        title: previewPerson.title,
        role: previewPerson.roleTier === "abu_head" ? "abu_head" : previewPerson.roleTier === "cxo" ? "cxo" : "employee",
        buId: previewPerson.buId,
        deptId: previewPerson.deptId,
      }
    : null;

  // Once logged in, the real user drives persona/role/scope instead of the
  // manual persona switcher — unless a preview is active, which wins over both.
  const persona: Persona = previewPersona ?? (authUser
    ? { id: authUser.id, name: authUser.name, title: authUser.title, role: authUser.role, buId: authUser.buId, deptId: authUser.deptId ?? undefined }
    : getPersona(activePersonaId));
  const setActivePersonaId = useCallback((id: string) => setActivePersonaIdState(id), []);
  const setCurrentCompanyId = useCallback((id: string) => setCurrentCompanyIdState(id), []);

  const addWorkflow = useCallback((title: string, agent: string, description: string): WorkflowInstance => {
    const newWf: WorkflowInstance = {
      id: `wf-${Date.now()}`,
      title,
      description,
      status: "running",
      agent,
      startedAt: "just now",
      progress: 0,
    };
    setWorkflows(prev => [newWf, ...prev]);
    return newWf;
  }, []);

  const updateWorkflowStatus = useCallback((id: string, status: WorkflowInstance["status"]) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status } : w));
  }, []);

  const decrementApprovals = useCallback(() => setPendingApprovals(p => Math.max(0, p - 1)), []);
  const incrementApprovals = useCallback(() => setPendingApprovals(p => p + 1), []);

  const [goals, setGoals] = useState<Goal[]>(GOAL_TREE);
  const addGoal = useCallback((goal: Goal) => setGoals(prev => [...prev, goal]), []);
  const addGoals = useCallback((newGoals: Goal[]) => setGoals(prev => [...prev, ...newGoals]), []);
  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);

  // Cost control — seeded with a few non-blank examples so every role's
  // panel shows something real on first load rather than an empty state.
  const [buCostCaps, setBuCostCaps] = useState<Record<string, CapState>>({
    procurement: { cap: 150, locked: false },
  });
  const [deptCostCaps, setDeptCostCaps] = useState<Record<string, CapState>>({
    "procurement:supplier-management": { cap: 50, locked: false },
  });
  const [personCostCaps, setPersonCostCaps] = useState<Record<string, CapState>>({
    "per-5": { cap: 100, locked: false },
  });
  const [agentCostCaps, setAgentCostCaps] = useState<Record<string, AgentCapState>>({
    ag11: { sessionCap: null, totalCap: 25, locked: false },
    ag6: { sessionCap: null, totalCap: null, locked: true },
  });
  const [agentModelOverride, setAgentModelOverride] = useState<Record<string, string>>({});
  const [agentReasoningOverride, setAgentReasoningOverride] = useState<Record<string, string>>({});
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  const getBuCap = useCallback((id: string) => buCostCaps[id] ?? DEFAULT_CAP, [buCostCaps]);
  const getDeptCap = useCallback((id: string) => deptCostCaps[id] ?? DEFAULT_CAP, [deptCostCaps]);
  const getPersonCap = useCallback((id: string) => personCostCaps[id] ?? DEFAULT_CAP, [personCostCaps]);
  const getAgentCap = useCallback((id: string) => {
    const base = agentCostCaps[id] ?? DEFAULT_AGENT_CAP;
    return killSwitchActive ? { ...base, locked: true } : base;
  }, [agentCostCaps, killSwitchActive]);

  const setBuCap = useCallback((id: string, cap: number | null, locked?: boolean) => {
    setBuCostCaps(prev => ({ ...prev, [id]: { cap, locked: locked ?? (prev[id]?.locked ?? false) } }));
  }, []);
  const setDeptCap = useCallback((id: string, cap: number | null, locked?: boolean) => {
    setDeptCostCaps(prev => ({ ...prev, [id]: { cap, locked: locked ?? (prev[id]?.locked ?? false) } }));
  }, []);
  const setPersonCap = useCallback((id: string, cap: number | null, locked?: boolean) => {
    setPersonCostCaps(prev => ({ ...prev, [id]: { cap, locked: locked ?? (prev[id]?.locked ?? false) } }));
  }, []);
  const setAgentCap = useCallback((id: string, patch: Partial<AgentCapState>) => {
    setAgentCostCaps(prev => ({ ...prev, [id]: { ...(prev[id] ?? DEFAULT_AGENT_CAP), ...patch } }));
  }, []);
  const setAgentModel = useCallback((id: string, modelId: string) => {
    setAgentModelOverride(prev => ({ ...prev, [id]: modelId }));
  }, []);
  const setAgentReasoning = useCallback((id: string, level: string) => {
    setAgentReasoningOverride(prev => ({ ...prev, [id]: level }));
  }, []);

  // Kill switch is an override layer, not a mutation of individual agent
  // locks — getAgentCap ORs it in above, so deactivating restores whatever
  // each agent's own lock state was before the switch was thrown.
  const activateKillSwitch = useCallback(() => setKillSwitchActive(true), []);
  const deactivateKillSwitch = useCallback(() => setKillSwitchActive(false), []);

  return (
    <AppContext.Provider value={{
      workflows, addWorkflow, updateWorkflowStatus, pendingApprovals, decrementApprovals, incrementApprovals,
      persona, role: persona.role, currentBuId: persona.buId, setActivePersonaId,
      previewPerson, startPreview, exitPreview,
      goals, addGoal, addGoals, updateGoal,
      currentCompanyId, setCurrentCompanyId,
      authUser, isAuthenticated: authUser !== null, login, logout,
      getBuCap, getDeptCap, getPersonCap, getAgentCap,
      setBuCap, setDeptCap, setPersonCap, setAgentCap,
      agentModelOverride, agentReasoningOverride, setAgentModel, setAgentReasoning,
      killSwitchActive, activateKillSwitch, deactivateKillSwitch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
