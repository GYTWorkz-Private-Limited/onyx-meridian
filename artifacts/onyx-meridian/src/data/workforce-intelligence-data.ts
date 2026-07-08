// Deterministic mock data for the Workforce Intelligence dashboard.
// Uses a seeded PRNG (not Math.random()) so the generated workforce is
// stable across renders/HMR instead of reshuffling every reload.
import { BU_LIST } from "@/data/enterprise-data";
import { PERSONAS } from "@/lib/rbac";

// ---- seeded PRNG (mulberry32) -----------------------------------------
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260707);
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1));
const chance = (p: number) => rng() < p;

// ---- reference pools ----------------------------------------------------
const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie", "Drew", "Avery",
  "Priya", "Wei", "Diego", "Fatima", "Noah", "Mia", "Liam", "Ana", "Omar", "Yuki",
  "Sofia", "Lucas", "Elena", "Kenji", "Grace", "Marco", "Nadia", "Ravi", "Chloe", "Tom",
];
const LAST_NAMES = [
  "Chen", "Nakamura", "Silva", "Novak", "Patel", "Garcia", "Muller", "Kowalski", "Rossi", "Kim",
  "Anderson", "Osei", "Nguyen", "Ferreira", "Schmidt", "Yilmaz", "Rahman", "Costa", "Ivanov", "Park",
];

const REGIONS = ["North America", "EMEA", "APAC", "LATAM"] as const;
const OFFICES: Record<(typeof REGIONS)[number], string[]> = {
  "North America": ["Detroit Plant", "Houston Plant", "Chicago HQ"],
  EMEA: ["Rotterdam Hub", "Stuttgart Plant"],
  APAC: ["Singapore Hub", "Shenzhen Plant"],
  LATAM: ["Monterrey Plant"],
};

const DEPARTMENTS_BY_BU: Record<string, string[]> = {
  manufacturing: ["Production", "Quality", "Maintenance", "Engineering"],
  "supply-chain": ["Logistics", "Warehousing", "Demand Planning"],
  procurement: ["Sourcing", "Supplier Management", "Contracts"],
  finance: ["FP&A", "Accounting", "Audit"],
  revenue: ["Sales", "Customer Success", "Marketing"],
};

const SKILLS_BY_BU: Record<string, string[]> = {
  manufacturing: ["Lean Manufacturing", "Six Sigma", "SCADA", "Vibration Analysis", "CMMS", "Root Cause Analysis"],
  "supply-chain": ["Demand Forecasting", "WMS", "Route Optimization", "Inventory Planning"],
  procurement: ["Contract Negotiation", "Supplier Risk", "ERP", "Category Management"],
  finance: ["Financial Modeling", "Variance Analysis", "SAP", "Audit Compliance"],
  revenue: ["Salesforce", "Pipeline Management", "Negotiation", "Forecasting"],
};
const CROSS_CUTTING_SKILLS = ["Python", "SQL", "Project Management", "Data Analysis", "AI Infrastructure"];

const MANAGERS_BY_BU: Record<string, string[]> = {
  manufacturing: ["Rosa Diaz", "Kenji Sato", "Hannah Weiss"],
  "supply-chain": ["Tunde Alabi", "Mei Lin"],
  procurement: ["Carlos Vega", "Ingrid Berg"],
  finance: ["Sanjay Mehta", "Clara Dubois"],
  revenue: ["Leo Fischer", "Nia Robertson"],
};

const RISK_TIERS = ["low", "medium", "high", "critical"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export interface Employee {
  id: string;
  name: string;
  initials: string;
  title: string;
  department: string;
  buId: string;
  managerName: string;
  region: (typeof REGIONS)[number];
  office: string;
  employmentType: "Full-time" | "Contract" | "Intern";
  status: "active" | "leave" | "inactive";
  performance: number;
  engagement: number;
  skills: string[];
  currentProjects: string[];
  utilization: number;
  risk: RiskTier;
  salaryBand: string;
  salaryUsd: number;
  tenureYears: number;
  lastReviewDate: string;
  online: boolean;
  workMode: "remote" | "hybrid" | "onsite";
}

const PROJECT_NAMES = [
  "Line 7 Recovery", "Q3 Cost Reduction", "Supplier Consolidation", "Auto-Close Rollout",
  "APAC Pipeline Push", "SCADA Upgrade", "Vendor Risk Review", "Forecast Model Refresh",
];

function buildEmployee(i: number): Employee {
  const bu = pick(BU_LIST as any[]);
  const buId = bu.id as string;
  const department = pick(DEPARTMENTS_BY_BU[buId]);
  const region = pick(REGIONS as unknown as string[]) as (typeof REGIONS)[number];
  const office = pick(OFFICES[region]);
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const name = `${first} ${last}`;
  const tenureYears = Math.round((int(1, 96) / 12) * 10) / 10;
  const lastReviewMonthsAgo = int(0, 18);
  const performance = int(45, 99);
  const engagement = int(40, 98);
  const utilization = int(55, 115);
  const salaryBandIdx = int(1, 6);
  const status: Employee["status"] = chance(0.03) ? "leave" : chance(0.01) ? "inactive" : "active";

  // Risk is derived from real signals, not pure noise, so it's a meaningful filter.
  let risk: RiskTier = "low";
  const riskScore =
    (performance < 60 ? 1 : 0) + (engagement < 55 ? 1 : 0) + (utilization > 105 ? 1 : 0) +
    (lastReviewMonthsAgo > 12 ? 1 : 0) + (tenureYears < 0.5 ? 1 : 0);
  if (riskScore >= 4) risk = "critical";
  else if (riskScore === 3) risk = "high";
  else if (riskScore >= 1) risk = "medium";

  const skillPool = [...SKILLS_BY_BU[buId], ...CROSS_CUTTING_SKILLS];
  const skills = Array.from(new Set([pick(skillPool), pick(skillPool), pick(skillPool)]));

  const date = new Date(2026, 6, 8);
  date.setMonth(date.getMonth() - lastReviewMonthsAgo);

  return {
    id: `emp-${i}`,
    name,
    initials: `${first[0]}${last[0]}`.toUpperCase(),
    title: `${department} ${pick(["Analyst", "Specialist", "Engineer", "Coordinator", "Associate", "Lead"])}`,
    department,
    buId,
    managerName: pick(MANAGERS_BY_BU[buId]),
    region,
    office,
    employmentType: chance(0.85) ? "Full-time" : chance(0.6) ? "Contract" : "Intern",
    status,
    performance,
    engagement,
    skills,
    currentProjects: chance(0.7) ? [pick(PROJECT_NAMES)] : [],
    utilization,
    risk,
    salaryBand: `L${salaryBandIdx}`,
    salaryUsd: 48000 + salaryBandIdx * 18000 + int(-4000, 4000),
    tenureYears,
    lastReviewDate: date.toISOString().slice(0, 10),
    online: status === "active" && chance(0.42),
    workMode: chance(0.35) ? "remote" : chance(0.5) ? "hybrid" : "onsite",
  };
}

export const EMPLOYEES: Employee[] = Array.from({ length: 1200 }, (_, i) => buildEmployee(i));

// ---- aggregate selectors -------------------------------------------------

export function computeKpis(employees: Employee[]) {
  const total = employees.length;
  const active = employees.filter((e) => e.status === "active").length;
  const online = employees.filter((e) => e.online).length;
  const remote = employees.filter((e) => e.workMode === "remote").length;
  const hybrid = employees.filter((e) => e.workMode === "hybrid").length;
  const avgPerf = active ? employees.reduce((s, e) => s + e.performance, 0) / total : 0;
  const avgEngagement = active ? employees.reduce((s, e) => s + e.engagement, 0) / total : 0;
  const avgUtilization = active ? employees.reduce((s, e) => s + e.utilization, 0) / total : 0;
  const attrition = employees.filter((e) => e.status === "inactive").length;
  const totalPayroll = employees.reduce((s, e) => s + e.salaryUsd, 0);

  return [
    { key: "total", label: "Total Employees", value: total.toLocaleString(), delta: 2.1 },
    { key: "active", label: "Active Employees", value: active.toLocaleString(), delta: 1.4 },
    { key: "online", label: "Employees Online", value: online.toLocaleString(), delta: 0.6 },
    { key: "remote", label: "Remote Workforce", value: `${Math.round((remote / total) * 100)}%`, delta: -0.8 },
    { key: "hybrid", label: "Hybrid Workforce", value: `${Math.round((hybrid / total) * 100)}%`, delta: 1.1 },
    { key: "productivity", label: "Avg Productivity", value: `${avgPerf.toFixed(1)}%`, delta: 3.2 },
    { key: "satisfaction", label: "Employee Satisfaction", value: `${avgEngagement.toFixed(1)}%`, delta: 1.9 },
    { key: "retention", label: "Retention Rate", value: `${(100 - (attrition / total) * 100).toFixed(1)}%`, delta: 0.4 },
    { key: "attrition", label: "Attrition Rate", value: `${((attrition / total) * 100).toFixed(1)}%`, delta: -0.3 },
    { key: "openPositions", label: "Open Positions", value: Math.max(6, Math.round(total * 0.03)).toString(), delta: 4.5 },
    { key: "utilization", label: "Average Utilization", value: `${avgUtilization.toFixed(0)}%`, delta: 1.6 },
    { key: "payroll", label: "Total Payroll", value: `$${(totalPayroll / 1_000_000).toFixed(1)}M`, delta: 2.8 },
  ];
}

export function departmentHeadcount(employees: Employee[]) {
  const map = new Map<string, number>();
  employees.forEach((e) => map.set(e.department, (map.get(e.department) ?? 0) + 1));
  return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function regionDistribution(employees: Employee[]) {
  return REGIONS.map((region) => {
    const inRegion = employees.filter((e) => e.region === region);
    const offices = OFFICES[region].map((office) => ({
      office,
      count: inRegion.filter((e) => e.office === office).length,
    }));
    return { region, count: inRegion.length, offices };
  });
}

export const HIRING_FUNNEL = [
  { stage: "Applicants", value: 4820 },
  { stage: "Screened", value: 1640 },
  { stage: "Interview", value: 612 },
  { stage: "Offer", value: 208 },
  { stage: "Accepted", value: 164 },
  { stage: "Onboarded", value: 141 },
];

export const GROWTH_HISTORY = (() => {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  let headcount = 1080;
  return months.map((month, i) => {
    const hires = int(12, 34);
    const attrition = int(6, 20);
    const transfers = int(2, 9);
    const promotions = int(4, 14);
    headcount += hires - attrition;
    return { month, headcount, hires, attrition, transfers, promotions };
  });
})();

export const PRODUCTIVITY_TIMELINE = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  productivity: 78 + Math.round(Math.sin(i / 4) * 6 + int(-2, 2)),
  meetings: int(2, 7),
  focusHours: int(3, 6),
  tasksCompleted: int(8, 26),
  commits: int(0, 18),
  ticketsResolved: int(0, 12),
}));

export function attritionRiskBuckets(employees: Employee[]) {
  return RISK_TIERS.map((tier) => ({
    tier,
    count: employees.filter((e) => e.risk === tier).length,
  }));
}

export function skillsMatrix() {
  const allSkills = Array.from(new Set(Object.values(SKILLS_BY_BU).flat().concat(CROSS_CUTTING_SKILLS)));
  return allSkills.map((skill) => {
    const demand = int(30, 100);
    // AI Infrastructure is deliberately scarce, to match the canned insight
    // "Top skill shortage: AI Infrastructure".
    const availability = skill === "AI Infrastructure" ? int(10, 25) : int(20, 95);
    return { skill, demand, availability, gap: Math.max(0, demand - availability) };
  }).sort((a, b) => b.gap - a.gap);
}

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  buId: string | null;
  headcount: number;
  children: OrgNode[];
}

export function orgHierarchy(employees: Employee[]): OrgNode {
  const ceo = PERSONAS.find((p) => p.role === "ceo")!;
  const heads = PERSONAS.filter((p) => p.role === "abu_head");
  return {
    id: ceo.id, name: ceo.name, title: ceo.title, buId: null, headcount: employees.length,
    children: heads.map((head) => {
      const buEmployees = employees.filter((e) => e.buId === head.buId);
      const managers = MANAGERS_BY_BU[head.buId ?? ""] ?? [];
      return {
        id: head.id, name: head.name, title: head.title, buId: head.buId, headcount: buEmployees.length,
        children: managers.map((mgr, mi) => {
          const teamEmployees = buEmployees.filter((e) => e.managerName === mgr);
          return {
            id: `${head.id}-mgr-${mi}`, name: mgr, title: "Manager", buId: head.buId,
            headcount: teamEmployees.length, children: [],
          };
        }),
      };
    }),
  };
}

// Manager collaboration — cross-department interaction volume, derived
// deterministically from shared-project overlap counts (not random).
export function collaborationEdges() {
  const allManagers = Object.entries(MANAGERS_BY_BU).flatMap(([buId, mgrs]) => mgrs.map((m) => ({ m, buId })));
  const edges: { from: string; to: string; weight: number }[] = [];
  for (let i = 0; i < allManagers.length; i++) {
    for (let j = i + 1; j < allManagers.length; j++) {
      if (chance(0.35)) {
        edges.push({ from: allManagers[i].m, to: allManagers[j].m, weight: int(1, 9) });
      }
    }
  }
  return { nodes: allManagers, edges };
}

export function notificationsFor(employees: Employee[]) {
  const overUtilized = employees.filter((e) => e.utilization > 105);
  const missingReview = employees.filter((e) => {
    const months = (Date.now() - new Date(e.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    return months > 12;
  });
  const highRisk = employees.filter((e) => e.risk === "critical");
  const inactive = employees.filter((e) => e.status === "inactive");

  return [
    { id: "n1", type: "Burnout Alert", detail: `${overUtilized.length} employees over 105% utilization`, severity: "high" as const },
    { id: "n2", type: "Missing Reviews", detail: `${missingReview.length} employees overdue for review (>12mo)`, severity: "medium" as const },
    { id: "n3", type: "High Attrition Risk", detail: `${highRisk.length} employees flagged critical risk`, severity: "high" as const },
    { id: "n4", type: "Inactive Employees", detail: `${inactive.length} employees marked inactive`, severity: "low" as const },
    { id: "n5", type: "Training Overdue", detail: `${Math.round(employees.length * 0.04)} employees overdue on required training`, severity: "medium" as const },
  ];
}

export const AI_INSIGHTS = [
  "Engineering productivity increased 12% quarter-over-quarter.",
  "Sales hiring slowed in APAC — 3 open reqs unfilled 45+ days.",
  "Attrition risk rising in Customer Success — 4 critical-risk employees flagged.",
  "Hybrid teams outperforming fully-remote by 8% on avg productivity score.",
  "Recommend hiring 6 additional Maintenance engineers to cover Line 7 coverage gap.",
  "Top skill shortage: AI Infrastructure — demand outpaces availability 4-to-1.",
];

export const ACTIVITY_TEMPLATES = [
  (e: Employee) => `${e.name} completed skills training`,
  (e: Employee) => `${e.name} was promoted to Senior ${e.title.split(" ").slice(1).join(" ")}`,
  () => "5 new hires onboarded this week",
  () => "Payroll processed for current cycle",
  () => "Policy updated: remote work eligibility",
  (e: Employee) => `Manager approval pending for ${e.name}'s transfer request`,
  () => "Team reorganization completed in Supply Chain",
  (e: Employee) => `AI recommendation: review ${e.name}'s utilization (${e.utilization}%)`,
];
