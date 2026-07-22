// Mock "agent" that decomposes goals one level at a time: enterprise → ABU →
// department → employee. No real LLM integration exists in this codebase yet
// (confirmed — the only real API-call code is an offline embeddings script,
// unrelated to this flow). Each function below is the seam where a real
// backend agent call would later replace the fabrication — the UI (generate/
// approve/reject at whichever level owns it) doesn't need to change.

import { BU_LIST } from "@/data/enterprise-data";
import { PEOPLE } from "@/data/people-data";
import type { Goal } from "@/data/goals-data";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const ABU_VERBS = ["Readiness plan for", "Coordinate execution of", "Resource allocation for"];
const DEPT_VERBS = ["Operational plan for", "Execution track for", "Delivery plan for"];
const EMPLOYEE_VERBS = ["Own the rollout of", "Drive execution of", "Deliver on"];

// enterprise goal → 2-3 ABU-level sub-goals, one per involved business unit.
export function generateAbuGoals(goal: Goal): Goal[] {
  const primaryBu = BU_LIST.find((b) => b.id === goal.buId) ?? BU_LIST[0];
  const others = BU_LIST.filter((b) => b.id !== primaryBu.id);
  const h = hashString(goal.id + Date.now());
  const supportCount = 1 + (h % 2); // 1 or 2 supporting ABUs
  const supporting = Array.from({ length: supportCount }, (_, i) => others[(h + i * 7) % others.length]);
  const involved = [primaryBu, ...supporting];

  return involved.map((bu, i) => ({
    id: `${goal.id}-abu-${Date.now()}-${i}`,
    parentId: goal.id,
    level: "abu" as const,
    title: `${ABU_VERBS[(h + i) % ABU_VERBS.length]} "${goal.title}" — ${bu.name}`,
    description: `Agent-generated workstream for ${bu.name} supporting "${goal.title}".`,
    status: "planning" as const,
    targetDate: goal.targetDate,
    buId: bu.id,
  }));
}

// ABU-level goal → one dept-level sub-goal per real department in that ABU.
export function generateDeptGoals(abuGoal: Goal): Goal[] {
  const bu = BU_LIST.find((b) => b.id === abuGoal.buId);
  const depts = bu?.departments ?? [];
  const h = hashString(abuGoal.id + Date.now());
  return depts.map((dept, i) => ({
    id: `${abuGoal.id}-dept-${Date.now()}-${i}`,
    parentId: abuGoal.id,
    level: "dept" as const,
    title: `${DEPT_VERBS[(h + i) % DEPT_VERBS.length]} "${abuGoal.title}" — ${dept.name}`,
    description: `Agent-generated department breakdown for ${dept.name} (${dept.function}).`,
    status: "planning" as const,
    targetDate: abuGoal.targetDate,
    buId: abuGoal.buId,
    deptId: dept.id,
  }));
}

// Dept-level goal → up to 4 employee-level (leaf) tasks, one per person in
// that department (falls back to the wider BU roster if the dept has nobody
// tagged to it yet, same fallback pattern used on the People page).
export function generateEmployeeGoals(deptGoal: Goal): Goal[] {
  const deptPeople = PEOPLE.filter((p) => p.deptId === deptGoal.deptId);
  const roster = (deptPeople.length > 0 ? deptPeople : PEOPLE.filter((p) => p.buId === deptGoal.buId)).slice(0, 4);
  const h = hashString(deptGoal.id + Date.now());
  return roster.map((person, i) => ({
    id: `${deptGoal.id}-emp-${Date.now()}-${i}`,
    parentId: deptGoal.id,
    level: "employee" as const,
    title: `${EMPLOYEE_VERBS[(h + i) % EMPLOYEE_VERBS.length]} "${deptGoal.title}"`,
    description: `Agent-assigned task for ${person.name} supporting "${deptGoal.title}".`,
    status: "planning" as const,
    targetDate: deptGoal.targetDate,
    buId: deptGoal.buId,
    deptId: deptGoal.deptId,
    assigneePersonId: person.id,
  }));
}
