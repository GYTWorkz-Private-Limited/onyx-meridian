import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { DEFAULT_PERSONA_ID, getPersona, PERSONAS, type Persona, type Role } from "@/lib/rbac";

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
  // Companies (shallow multi-tenancy)
  currentCompanyId: string;
  setCurrentCompanyId: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const PERSONA_STORAGE_KEY = "onyx.personaId";
const COMPANY_STORAGE_KEY = "onyx.companyId";

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

  const persona = getPersona(activePersonaId);
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

  return (
    <AppContext.Provider value={{
      workflows, addWorkflow, updateWorkflowStatus, pendingApprovals, decrementApprovals, incrementApprovals,
      persona, role: persona.role, currentBuId: persona.buId, setActivePersonaId,
      currentCompanyId, setCurrentCompanyId,
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
