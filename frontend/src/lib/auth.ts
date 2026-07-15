import type { Role } from "@/lib/rbac";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  title: string;
  email: string;
  role: Role;
  buId: string | null;
  buName: string | null;
  deptId: string | null;
  deptName: string | null;
}

// Backend `role_tier` enum uses "member" for base employees; the frontend
// RBAC model (rbac.ts) calls that role "employee".
const ROLE_TIER_TO_ROLE: Record<string, Role> = {
  member: "employee",
  dept_manager: "dept_manager",
  abu_head: "abu_head",
  cxo: "cxo",
  developer: "developer",
};

// The Postgres backend (backend/db) models a single manufacturing plant —
// its business units (Production, Quality, Maintenance, Safety & Compliance,
// Supply Chain) and role tiers are plant-org concepts, not the app's 5
// enterprise ABUs (org-model.ts: manufacturing, supply-chain, procurement,
// finance, revenue) or its rbac.ts role hierarchy. So login only supplies
// identity (name/title/email) — role + scope (buId/deptId) are assigned
// here, keyed by username, to match rbac.ts's PERSONAS 1:1. This is what
// makes every seeded login resolve to a real, working ABU in the app
// instead of "No business unit is assigned to this persona."
const ORG_MODEL_SCOPE_BY_USERNAME: Record<string, { role: Role; buId: string | null; deptId: string | null }> = {
  cxo: { role: "cxo", buId: null, deptId: null },
  "manufacturing-abu": { role: "abu_head", buId: "manufacturing", deptId: null },
  "supply-chain-abu": { role: "abu_head", buId: "supply-chain", deptId: null },
  "procurement-abu": { role: "abu_head", buId: "procurement", deptId: null },
  "finance-abu": { role: "abu_head", buId: "finance", deptId: null },
  "revenue-abu": { role: "abu_head", buId: "revenue", deptId: null },
  "manufacturing-manager": { role: "dept_manager", buId: "manufacturing", deptId: "manufacturing:production" },
  "procurement-manager": { role: "dept_manager", buId: "procurement", deptId: "procurement:supplier-management" },
  employee: { role: "employee", buId: "procurement", deptId: "procurement:contracts" },
  dev: { role: "developer", buId: null, deptId: null },
};

export class LoginError extends Error {}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new LoginError(res.status === 401 ? "Invalid username or password" : "Login failed — try again");
  }

  const data = await res.json();
  const scope = ORG_MODEL_SCOPE_BY_USERNAME[data.username];
  return {
    id: data.id,
    username: data.username,
    name: data.name,
    title: data.title,
    email: data.email,
    role: scope ? scope.role : (ROLE_TIER_TO_ROLE[data.roleTier] ?? "employee"),
    buId: scope ? scope.buId : (data.businessUnit?.slug ?? null),
    buName: data.businessUnit?.name ?? null,
    deptId: scope ? scope.deptId : (data.department?.slug ?? null),
    deptName: data.department?.name ?? null,
  };
}
