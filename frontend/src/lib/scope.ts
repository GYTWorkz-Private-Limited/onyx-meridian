// Data scoping — every role sees only data within their buId / deptId boundary.

import type { Persona, Role } from "@/lib/rbac";

export type ScopeLevel = "enterprise" | "abu" | "department";

export interface DataScope {
  level: ScopeLevel;
  buId: string | null;
  deptId: string | null;
  readOnly: boolean;
}

export function getScope(persona: Persona): DataScope {
  const { role, buId, deptId } = persona;

  if (role === "ceo") {
    return { level: "enterprise", buId: null, deptId: null, readOnly: false };
  }

  if (role === "abu_head") {
    return { level: "abu", buId, deptId: null, readOnly: false };
  }

  if (role === "dept_manager") {
    return { level: "department", buId, deptId: deptId ?? null, readOnly: false };
  }

  // employee
  return { level: "department", buId, deptId: deptId ?? null, readOnly: true };
}

export function isReadOnlyRole(role: Role): boolean {
  return role === "employee";
}

interface ScopedRow {
  buId?: string | null;
  deptId?: string | null;
  bu?: string;
}

/** Filter any list of records that carry buId and/or deptId fields. */
export function filterByScope<T extends ScopedRow>(items: T[], scope: DataScope): T[] {
  if (scope.level === "enterprise") return items;

  if (scope.level === "abu" && scope.buId) {
    return items.filter((item) => (item.buId ?? item.bu) === scope.buId);
  }

  if (scope.level === "department") {
    return items.filter((item) => {
      const itemBu = item.buId ?? item.bu;
      if (scope.buId && itemBu && itemBu !== scope.buId) return false;
      if (scope.deptId && item.deptId && item.deptId !== scope.deptId) return false;
      // Rows with only buId (no deptId) are visible at department level if BU matches.
      if (scope.deptId && !item.deptId) return itemBu === scope.buId;
      return true;
    });
  }

  return items;
}

export function canSeeBu(scope: DataScope, buId: string): boolean {
  if (scope.level === "enterprise") return true;
  return scope.buId === buId;
}

export function canSeeDept(scope: DataScope, deptId: string, buId: string): boolean {
  if (scope.level === "enterprise") return true;
  if (scope.level === "abu") return scope.buId === buId;
  return scope.deptId === deptId;
}
