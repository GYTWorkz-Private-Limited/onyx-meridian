// RBAC model for Onyx Meridian: three roles at increasing altitude.
// Mocked persona switcher — no real auth/session, just a stored "who's logged in".

export type Role = "employee" | "abu_head" | "ceo";

export interface Persona {
  id: string;
  name: string;
  title: string;
  role: Role;
  buId: string | null; // null = enterprise-wide (CEO)
}

export const ROLE_RANK: Record<Role, number> = { employee: 0, abu_head: 1, ceo: 2 };

export const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee",
  abu_head: "ABU Head",
  ceo: "CEO / Admin",
};

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
  { id: "p-emp",      name: "Operations Coordinator", title: "Operations Coordinator",     role: "employee",  buId: "procurement" },
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
const CEO_ONLY_PATHS = ["/companies", "/abu-onboarding"];
const ABU_HEAD_PLUS_PATHS = ["/goals", "/projects", "/cost-control", "/people", "/workforce-intelligence"];

function matches(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

export function canAccess(role: Role, path: string): boolean {
  if (matches(path, CEO_ONLY_PATHS)) return role === "ceo";
  if (matches(path, ABU_HEAD_PLUS_PATHS)) return hasMinRole(role, "abu_head");
  return true;
}
