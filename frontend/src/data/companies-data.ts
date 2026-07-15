export interface Company {
  id: string;
  name: string;
  domain: string;
  tagline: string;
  budgetMonthlyUsd: number;
  seeded: boolean;
}

// company-a is the fully-seeded flagship enterprise (all existing BU_LIST /
// MFG_AGENTS / Task data). company-b is a mostly-empty second tenant that
// exists to prove the Companies switch does something — most of the app
// (everything except Business Units, AI Workforce, and Tasks/My Work) keeps
// showing company-a's data regardless of selection; this is a deliberate
// prototype-fidelity scope-down, not a bug.
export const COMPANIES: Company[] = [
  {
    id: "company-a",
    name: "Meridian Manufacturing Corp",
    domain: "manufacturing",
    tagline: "Flagship enterprise — 5 Autonomous Business Units, 62 AI agents.",
    budgetMonthlyUsd: 530000,
    seeded: true,
  },
  {
    id: "company-b",
    name: "Halcyon Industrial Holdings",
    domain: "manufacturing",
    tagline: "A second tenant, proving company isolation. Starts nearly empty.",
    budgetMonthlyUsd: 40000,
    seeded: false,
  },
];

export const COMPANY_B_BU_STUBS = [
  { id: "cb-ops", name: "Operations", eei: 41, health: 48, agents: 2, workflows: 3, risk: "high" as const },
];

export const COMPANY_B_AGENT_STUBS = [
  { id: "cb-ag1", name: "Onboarding Assistant", role: "Setup & Discovery Agent", department: "Operations", bu: "cb-ops", status: "active", autonomy: "assisted", utilization: 12, sla: 100, costPerDay: 8, tasks: 3 },
];
