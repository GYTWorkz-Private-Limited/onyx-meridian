export interface Project {
  id: string;
  name: string;
  description: string;
  leadAgentId: string;
  goalId: string;
  buId: string;
  buIds?: string[]; // set by the CXO creation wizard — multiple ABUs involved
  keyDocuments?: { type: string; title: string; summary: string }[]; // PRD / PR-FAQ / HLD, collected at creation
  status: "planning" | "active" | "done";
  color: string;
  targetDate: string;
  progress: number;
}

export const PROJECT_LIST: Project[] = [
  { id: "proj-1", name: "Line 7 Bearing Failure Prevention", description: "Close the predictive-maintenance coverage gap on Line 7's highest-risk assets before Q4.", leadAgentId: "ag3", goalId: "goal-5", buId: "manufacturing", status: "active",   color: "#3a86d4", targetDate: "2026-10-01", progress: 62 },
  { id: "proj-2", name: "Finance Auto-Close Q3",              description: "Automate the remaining manual reconciliation steps in month-end close.",                       leadAgentId: "ag7", goalId: "goal-4", buId: "finance",       status: "active",   color: "#2c9d8f", targetDate: "2026-08-15", progress: 74 },
  { id: "proj-3", name: "Supplier Risk Consolidation",        description: "Consolidate Tier-1 supplier risk scoring into a single continuously-updated model.",           leadAgentId: "ag6", goalId: "goal-3", buId: "procurement",   status: "planning", color: "#c0617f", targetDate: "2026-11-30", progress: 18 },
  { id: "proj-4", name: "APAC Pipeline Recovery",              description: "Reverse the 11% APAC pipeline conversion decline via targeted outreach automation.",           leadAgentId: "ag8", goalId: "goal-1", buId: "revenue",       status: "active",   color: "#8169b8", targetDate: "2026-09-15", progress: 41 },
];
