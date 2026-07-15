// RBAC model for Onyx Meridian: four roles at increasing altitude.
// Mocked persona switcher — no real auth/session, just a stored "who's logged in".
//
// Maps to the Bharadwaj role hierarchy from the meeting notes:
//   ceo = CXO/Org, abu_head = Dept Head, dept_manager = Dept Manager, employee = Dept Employee.
// dept_manager sits between employee and abu_head: department-scoped like a
// head (has a buId) but lower altitude — sets objectives, breaks them into
// tasks, manages department documents.

export type Role = "employee" | "dept_manager" | "abu_head" | "ceo";

export interface Persona {
  id: string;
  name: string;
  title: string;
  role: Role;
  buId: string | null; // null = enterprise-wide (CEO)
  // For department-scoped roles: which department's digital twin they own.
  // Format matches department id in org-model: `${buId}:${slug(name)}`.
  deptId?: string;
}

export const ROLE_RANK: Record<Role, number> = { employee: 0, dept_manager: 1, abu_head: 2, ceo: 3 };

export const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee",
  dept_manager: "Dept Manager",
  abu_head: "ABU Head",
  ceo: "CEO / Admin",
};

// A role that belongs to (and is scoped to) a single department/BU. Both
// department heads and department managers see only their own BU's data;
// this is the single source of truth for that "one department" filtering.
export function isDeptScoped(role: Role): boolean {
  return role === "abu_head" || role === "dept_manager";
}

// Any approval at or above this dollar amount requires CEO sign-off,
// regardless of what a lower-level approver already authorized.
export const CEO_LOCK_THRESHOLD = 50000;

// Reuses names already present in existing mock data (e.g. "Operations
// Coordinator" is an existing Task owner in the api-server seed, "Elena
// Sokolov" is the existing governance audit-log actor) so role-filtered
// views aren't empty on first load.
export const PERSONAS: Persona[] = [
  { id: "p-ceo",      name: "Elena Sokolov",       title: "Chief Executive Officer",      role: "ceo",       buId: null },
  { id: "p-head-mfg", name: "Marcus Chen",         title: "VP, Manufacturing Intelligence", role: "abu_head", buId: "manufacturing" },
  { id: "p-head-sc",  name: "Amara Osei",          title: "VP, Supply Chain Intelligence",  role: "abu_head", buId: "supply-chain" },
  { id: "p-head-proc",name: "David Nakamura",      title: "VP, Procurement Intelligence",   role: "abu_head", buId: "procurement" },
  { id: "p-head-fin", name: "Priya Raman",         title: "VP, Finance Intelligence",       role: "abu_head", buId: "finance" },
  { id: "p-head-rev", name: "Jordan Blake",        title: "VP, Revenue Intelligence",       role: "abu_head", buId: "revenue" },
  { id: "p-mgr-proc", name: "Ravi Menon",          title: "Procurement Operations Manager", role: "dept_manager", buId: "procurement",   deptId: "procurement:supplier-management" },
  { id: "p-mgr-mfg",  name: "Lena Fischer",        title: "Manufacturing Line Manager",     role: "dept_manager", buId: "manufacturing", deptId: "manufacturing:production" },
  { id: "p-emp",      name: "Operations Coordinator", title: "Operations Coordinator",     role: "employee",  buId: "procurement",   deptId: "procurement:contracts" },
];

export const DEFAULT_PERSONA_ID = "p-ceo";

export function getPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

export function hasMinRole(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export function landingRouteFor(role: Role): string {
  return role === "ceo" ? "/" : "/my-work";
}

// Routes that must be enforced even on direct URL entry, not just hidden
// from nav. Everything else stays reachable by direct link (e.g. an
// Employee can still open /tasks via a link from My Work).
const CEO_ONLY_PATHS = ["/abu-onboarding"];
const ABU_HEAD_PLUS_PATHS = ["/cost-control"];
// Managers and above: strategy pages, plus workforce views a dept manager
// needs but scoped down to their own department (see isDeptScoped callers
// in workforce.tsx / people.tsx / workforce-intelligence.tsx / unit-of-work.tsx).
const DEPT_MANAGER_PLUS_PATHS = ["/goals", "/projects", "/people", "/workforce-intelligence"];

function matches(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

export function canAccess(role: Role, path: string): boolean {
  if (matches(path, CEO_ONLY_PATHS)) return role === "ceo";
  if (matches(path, ABU_HEAD_PLUS_PATHS)) return hasMinRole(role, "abu_head");
  if (matches(path, DEPT_MANAGER_PLUS_PATHS)) return hasMinRole(role, "dept_manager");
  return true;
}
