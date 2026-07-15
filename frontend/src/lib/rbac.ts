// RBAC model for Onyx Meridian: five roles at increasing altitude, plus a
// Developer role that sits outside the business hierarchy (full technical
// access, but not a substitute for CXO on business-scoped features).
// Mocked persona switcher — no real auth/session, just a stored "who's logged in".
//
// Maps to the Bharadwaj role hierarchy from the meeting notes:
//   cxo = CXO/Org, abu_head = Dept Head, dept_manager = Dept Manager, employee = Dept Employee.
// dept_manager sits between employee and abu_head: department-scoped like a
// head (has a buId) but lower altitude — sets objectives, breaks them into
// tasks, manages department documents.

export type Role = "employee" | "dept_manager" | "abu_head" | "cxo" | "developer";

export interface Persona {
  id: string;
  name: string;
  title: string;
  role: Role;
  buId: string | null; // null = enterprise-wide (CXO, Developer)
  // For department-scoped roles: which department's digital twin they own.
  // Format matches department id in org-model: `${buId}:${slug(name)}`.
  deptId?: string;
}

export const ROLE_RANK: Record<Role, number> = { employee: 0, dept_manager: 1, abu_head: 2, cxo: 3, developer: 4 };

export const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee",
  dept_manager: "Dept Manager",
  abu_head: "ABU Head",
  cxo: "CXO",
  developer: "Developer",
};

// A role that belongs to (and is scoped to) a single department/BU. Both
// department heads and department managers see only their own BU's data;
// this is the single source of truth for that "one department" filtering.
export function isDeptScoped(role: Role): boolean {
  return role === "abu_head" || role === "dept_manager";
}

// Any approval at or above this dollar amount requires CXO sign-off,
// regardless of what a lower-level approver already authorized.
export const CXO_LOCK_THRESHOLD = 50000;

// Reuses names already present in existing mock data (e.g. "Operations
// Coordinator" is an existing Task owner in the api-server seed, "Elena
// Sokolov" is the existing governance audit-log actor) so role-filtered
// views aren't empty on first load.
export const PERSONAS: Persona[] = [
  { id: "p-cxo",      name: "Elena Sokolov",       title: "Chief Executive Officer",      role: "cxo",       buId: null },
  { id: "p-head-mfg", name: "Marcus Chen",         title: "VP, Manufacturing Intelligence", role: "abu_head", buId: "manufacturing" },
  { id: "p-head-sc",  name: "Amara Osei",          title: "VP, Supply Chain Intelligence",  role: "abu_head", buId: "supply-chain" },
  { id: "p-head-proc",name: "David Nakamura",      title: "VP, Procurement Intelligence",   role: "abu_head", buId: "procurement" },
  { id: "p-head-fin", name: "Priya Raman",         title: "VP, Finance Intelligence",       role: "abu_head", buId: "finance" },
  { id: "p-head-rev", name: "Jordan Blake",        title: "VP, Revenue Intelligence",       role: "abu_head", buId: "revenue" },
  { id: "p-mgr-proc", name: "Ravi Menon",          title: "Procurement Operations Manager", role: "dept_manager", buId: "procurement",   deptId: "procurement:supplier-management" },
  { id: "p-mgr-mfg",  name: "Lena Fischer",        title: "Manufacturing Line Manager",     role: "dept_manager", buId: "manufacturing", deptId: "manufacturing:production" },
  { id: "p-emp",      name: "Operations Coordinator", title: "Operations Coordinator",     role: "employee",  buId: "procurement",   deptId: "procurement:contracts" },
  { id: "p-dev",      name: "Dev Account",         title: "Platform Developer",           role: "developer", buId: null },
];

export const DEFAULT_PERSONA_ID = "p-cxo";

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

export function hasMinRole(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export function landingRouteFor(role: Role): string {
  if (role === "cxo") return "/";
  if (role === "developer") return "/agent-studio";
  return "/my-work";
}

// Per-feature access levels. Deliberately NOT pure rank comparison: CXO is
// excluded from KPI Studio despite outranking Manager/Employee, and
// Developer's grant is scoped to what a platform engineer needs (Build
// section, Mission Control, workforce/cost tooling) rather than every
// business-strategy page. "none"/omitted = not accessible; "view" = read
// only; "scoped" = CRUD limited to the caller's own BU/department; "full" =
// enterprise-wide CRUD.
export type AccessLevel = "none" | "view" | "scoped" | "full";

export const FEATURE_ACCESS: Record<string, Partial<Record<Role, AccessLevel>>> = {
  "my-work":            { employee: "full", dept_manager: "full", abu_head: "full", cxo: "full", developer: "full" },
  "digital-twin":       { employee: "view", dept_manager: "scoped", abu_head: "scoped", cxo: "full", developer: "full" },
  "dashboard":          { employee: "view", dept_manager: "scoped", abu_head: "scoped", cxo: "full", developer: "full" },
  "business-units":     { dept_manager: "view", abu_head: "scoped", cxo: "full" },
  "kpi-studio":         { employee: "view", dept_manager: "scoped", abu_head: "scoped", cxo: "full", developer: "full" },
  "approvals":          { employee: "scoped", dept_manager: "full", abu_head: "full", cxo: "full" },
  "goals":              { employee: "view", dept_manager: "scoped", abu_head: "scoped", cxo: "full" },
  "workforce":          { employee: "scoped", dept_manager: "view", developer: "full" },
  "people":             { dept_manager: "scoped", abu_head: "scoped", cxo: "full" },
  // Deeper workforce analytics — not one of the matrix's 23 named rows;
  // keeps the manager/exec-tier access it already had pre-rename.
  "workforce-intelligence": { dept_manager: "scoped", abu_head: "scoped", cxo: "full" },
  "governance":         { employee: "scoped", dept_manager: "scoped" },
  "cost-control":       { employee: "scoped", dept_manager: "scoped", abu_head: "full", cxo: "full", developer: "full" },
  "intelligence":       { employee: "view", dept_manager: "scoped", abu_head: "full", cxo: "full" },
  "documents":          { employee: "full", dept_manager: "full", abu_head: "full", cxo: "full", developer: "full" },
  "knowledge-studio":   { employee: "scoped", dept_manager: "scoped", abu_head: "scoped", cxo: "full", developer: "full" },
  "employee-metrics":   { employee: "view", dept_manager: "view", abu_head: "view" },
  "my-activity":        { employee: "view", dept_manager: "view", abu_head: "view", cxo: "view", developer: "view" },
  "projects":           { employee: "view", dept_manager: "full", abu_head: "scoped", cxo: "full" },
  "business-impact":    { abu_head: "view", cxo: "view" },
  "simulation":         { abu_head: "view", cxo: "view" },
  "abu-onboarding":     { abu_head: "scoped", cxo: "full" },
  // SOP Library: matrix explicitly excludes CXO/ABU Head — Manager and
  // Developer get full edit rights, Employee can only suggest edits.
  "sop":                { employee: "scoped", dept_manager: "full", developer: "full" },
  // Mission Control / Logs: matrix excludes CXO entirely.
  "mission-control":    { employee: "view", dept_manager: "view", abu_head: "view", developer: "full" },
  // Build section: matrix gives Developer exclusive access ("core") and
  // every other role "—". Covers Agent Harness, Workflow Studio, Policy
  // Studio, Prompt Playground, Unit of Work, Adapters, Connectors.
  "build":              { developer: "full" },
};

export function accessLevel(role: Role, feature: string): AccessLevel {
  return FEATURE_ACCESS[feature]?.[role] ?? "none";
}

export function hasAccess(role: Role, feature: string): boolean {
  return accessLevel(role, feature) !== "none";
}

export function canEdit(role: Role, feature: string): boolean {
  const level = accessLevel(role, feature);
  return level === "scoped" || level === "full";
}

// Maps a route path to its FEATURE_ACCESS key. Sub-routes (e.g.
// /business-units/:id) inherit their parent's access level.
const PATH_TO_FEATURE: Record<string, string> = {
  "/my-work": "my-work",
  "/digital-twin": "digital-twin",
  "/dashboard": "dashboard",
  "/business-units": "business-units",
  "/kpi-studio": "kpi-studio",
  "/approvals": "approvals",
  "/goals": "goals",
  "/workforce": "workforce",
  "/people": "people",
  "/workforce-intelligence": "workforce-intelligence",
  "/governance": "governance",
  "/cost-control": "cost-control",
  "/intelligence": "intelligence",
  "/documents": "documents",
  "/knowledge-studio": "knowledge-studio",
  "/employee-metrics": "employee-metrics",
  "/my-activity": "my-activity",
  "/projects": "projects",
  "/business-impact": "business-impact",
  "/simulation": "simulation",
  "/abu-onboarding": "abu-onboarding",
  "/sop": "sop",
  "/agentops": "mission-control",
  "/mission-replay": "mission-control",
  "/agent-logs": "mission-control",
  "/agent-studio": "build",
  "/workflow-studio": "build",
  "/policy-studio": "build",
  "/prompt-playground": "build",
  "/unit-of-work": "build",
  "/adapters": "build",
  "/connectors": "build",
};

function matches(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

// No blanket allows: every path in PATH_TO_FEATURE is gated strictly by
// FEATURE_ACCESS — including Build tools, which the matrix reserves for
// Developer alone ("core" for Developer, "—" for every other role).
export function canAccess(role: Role, path: string): boolean {
  for (const [prefix, feature] of Object.entries(PATH_TO_FEATURE)) {
    if (matches(path, [prefix])) return hasAccess(role, feature);
  }
  return true;
}
