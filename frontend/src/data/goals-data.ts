export interface Goal {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  status: "active" | "at-risk" | "planning" | "done";
  targetDate: string;
  buId: string | null; // null = enterprise-wide
}

export const GOAL_TREE: Goal[] = [
  { id: "goal-1", parentId: null,    title: "Lift Enterprise Execution Index to 90",           description: "Composite EEI across all 5 ABUs, weighted by contribution.", status: "active",   targetDate: "2026-12-31", buId: null },
  { id: "goal-2", parentId: "goal-1",title: "Hold Manufacturing OEE at or above 90%",          description: "Overall Equipment Effectiveness across all monitored lines.", status: "active",   targetDate: "2026-09-30", buId: "manufacturing" },
  { id: "goal-3", parentId: "goal-1",title: "Cut enterprise operating cost 15% via AI workforce", description: "Reduce blended operating cost through agent-driven automation.", status: "active", targetDate: "2026-12-31", buId: null },
  { id: "goal-4", parentId: "goal-3",title: "Zero-touch monthly financial close",              description: "Fully automated reconciliation and cost allocation, human sign-off only.", status: "active", targetDate: "2026-08-31", buId: "finance" },
  { id: "goal-5", parentId: "goal-2",title: "Reduce unplanned downtime below 40 hrs/quarter",  description: "Predictive maintenance coverage across all Tier-1 production lines.", status: "at-risk", targetDate: "2026-10-15", buId: "manufacturing" },
];

export function childrenOf(goalId: string): Goal[] {
  return GOAL_TREE.filter((g) => g.parentId === goalId);
}

export function rootGoals(): Goal[] {
  return GOAL_TREE.filter((g) => g.parentId === null);
}
