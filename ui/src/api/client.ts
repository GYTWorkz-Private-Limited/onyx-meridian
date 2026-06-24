import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE ?? "http://localhost:8010";

export const http = axios.create({ baseURL, timeout: 15000 });

// --------------------------------------------------------------------------- //
// Types (subset of the API shapes the console uses)
// --------------------------------------------------------------------------- //
export type UnitStatus = "onboarding" | "active" | "paused" | "archived";

export interface Unit {
  id: string;
  name: string;
  description?: string | null;
  status: UnitStatus;
  caretaker_user_id?: string | null;
  allowed_scopes: string[];
  require_approval_for_deploy: boolean;
  require_approval_for_decommission: boolean;
  budget_monthly_usd: number;
}

export type EmployeeStatus =
  | "draft"
  | "configured"
  | "deployed"
  | "suspended"
  | "retired";

export interface Employee {
  id: string;
  version: number;
  unit_id: string;
  display_name: string;
  archetype?: string | null;
  tier: string;
  status: EmployeeStatus;
  autonomy: string;
  capabilities: string[];
  permissions: { data_scopes: string[]; action_scopes: string[]; deny: string[] };
  budget: { monthly_usd: number; max_actions_per_hour?: number | null };
  supervision: { caretaker?: string | null; escalate_after_hrs?: number | null };
  model_policy: { preferred: string; allowed: string[] };
  spent_usd: number;
  last_heartbeat_at?: string | null;
  principal_id?: string | null;
  pause_reason?: string | null;
}

export interface Approval {
  id: string;
  unit_id: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  subject_employee_id?: string | null;
  requested_by?: string | null;
  created_at?: string | null;
}

export interface Task {
  id: string;
  unit_id: string;
  title: string;
  description?: string | null;
  owner?: { type: string; id: string } | null;
  source: { type: string; doc_id?: string | null; quote?: string | null };
  status: string;
  priority: string;
  due?: string | null;
  depends_on: string[];
}

export interface Run {
  id: string;
  employee_id: string;
  principal_id?: string | null;
  status: string;
  model?: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  summary: string;
  created_at?: string | null;
}

export interface Dashboard {
  unit_id: string;
  unit_name: string;
  unit_status: string;
  employees_total: number;
  by_status: Record<string, number>;
  by_tier: Record<string, number>;
  by_autonomy: Record<string, number>;
  spent_usd: number;
  budget_monthly_usd: number;
  budget_utilization: number;
  commitments_total: number;
  open_commitments: number;
  overdue_commitments: number;
  completion_rate: number;
  commitments_by_status: Record<string, number>;
  open_approvals: number;
  stale_employees: { id: string; display_name: string; last_heartbeat_at: string | null }[];
  recent_activity: { id: string; actor: string; action: string; created_at?: string | null }[];
}

export interface Credential {
  principal_id: string;
  token: string;
  token_prefix: string;
}

// --------------------------------------------------------------------------- //
// API
// --------------------------------------------------------------------------- //
export const api = {
  // units
  listUnits: () => http.get<Unit[]>("/units").then((r) => r.data),
  getUnit: (id: string) => http.get<Unit>(`/units/${id}`).then((r) => r.data),
  createUnit: (body: Partial<Unit>) => http.post<Unit>("/units", body).then((r) => r.data),
  activateUnit: (id: string) => http.post<Unit>(`/units/${id}/activate`).then((r) => r.data),
  dashboard: (id: string) => http.get<Dashboard>(`/units/${id}/dashboard`).then((r) => r.data),
  escalate: (id: string) => http.post(`/units/${id}/tasks/escalate`).then((r) => r.data),

  // employees
  listEmployees: (unitId?: string) =>
    http.get<Employee[]>("/employees", { params: { unit_id: unitId } }).then((r) => r.data),
  getEmployee: (id: string) => http.get<Employee>(`/employees/${id}`).then((r) => r.data),
  instantiate: (body: Record<string, unknown>) =>
    http.post<Employee>("/employees", body).then((r) => r.data),
  configure: (id: string, body: Record<string, unknown>) =>
    http.post<Employee>(`/employees/${id}/configure`, body).then((r) => r.data),
  deploy: (id: string, actor?: string) =>
    http
      .post<{ pending: boolean; employee?: Employee; approval?: Approval; credential?: Credential }>(
        `/employees/${id}/deploy`,
        { actor },
      )
      .then((r) => r.data),
  suspend: (id: string, reason?: string) =>
    http.post<Employee>(`/employees/${id}/suspend`, { reason }).then((r) => r.data),
  resume: (id: string) => http.post<Employee>(`/employees/${id}/resume`, {}).then((r) => r.data),
  promote: (id: string, eval_passed: boolean) =>
    http.post<Employee>(`/employees/${id}/autonomy/promote`, { eval_passed }).then((r) => r.data),
  demote: (id: string) =>
    http.post<Employee>(`/employees/${id}/autonomy/demote`, {}).then((r) => r.data),
  decommission: (id: string, reason?: string) =>
    http
      .post<{ pending: boolean; employee?: Employee; approval?: Approval }>(
        `/employees/${id}/decommission`,
        { reason },
      )
      .then((r) => r.data),
  runHeartbeat: (id: string, trigger_detail = "console") =>
    http.post<Run>(`/employees/${id}/runs`, { trigger_detail }).then((r) => r.data),
  listRuns: (id: string) => http.get<Run[]>(`/employees/${id}/runs`).then((r) => r.data),
  getCredential: (id: string) => http.get(`/employees/${id}/credential`).then((r) => r.data),
  rotateCredential: (id: string) =>
    http.post<Credential>(`/employees/${id}/credential/rotate`).then((r) => r.data),

  // tasks
  listTasks: (unitId?: string) =>
    http.get<Task[]>("/tasks", { params: { unit_id: unitId } }).then((r) => r.data),
  createTask: (body: Record<string, unknown>) =>
    http.post<Task>("/tasks", body).then((r) => r.data),
  taskAction: (id: string, action: "start" | "complete" | "cancel" | "block") =>
    http.post<Task>(`/tasks/${id}/${action}`, {}).then((r) => r.data),

  // approvals
  listApprovals: (unitId?: string, status = "pending") =>
    http
      .get<Approval[]>("/approvals", { params: { unit_id: unitId, status } })
      .then((r) => r.data),
  decideApproval: (id: string, approve: boolean, decided_by = "console") =>
    http.post(`/approvals/${id}/decide`, { approve, decided_by }).then((r) => r.data),

  // people + ingest
  listPersons: (unitId?: string) =>
    http.get("/persons", { params: { unit_id: unitId } }).then((r) => r.data),
  createPerson: (body: Record<string, unknown>) =>
    http.post("/persons", body).then((r) => r.data),
  ingest: (body: { unit_id: string; title: string; content: string }) =>
    http
      .post<{ document: { id: string }; tasks: Task[]; unresolved_owners: string[] }>(
        "/ingest/transcript",
        body,
      )
      .then((r) => r.data),
};

export function errMsg(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { detail?: string; reasons?: string[] } | undefined;
    if (d?.reasons?.length) return d.reasons.join("; ");
    if (d?.detail) return d.detail;
    return e.message;
  }
  return String(e);
}
