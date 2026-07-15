// Single source of truth: Enterprise → ABU → Department → Agents.
// BU_LIST metrics are derived from the agent registry, not hand-entered.

import { agentsForBu, agentsForDept } from "@/data/agents-registry";
import { deptTwinId } from "@/data/org-ids";

// ─── Types ────────────────────────────────────────────────────

export type DeptStatus = "active" | "watch" | "critical";

export interface DepartmentSeed {
  id: string;
  name: string;
  function: string;
  status: DeptStatus;
}

export interface Department extends DepartmentSeed {
  buId: string;
  agentCount: number;
}

/** @deprecated Use `departments` — kept for gradual migration. */
export type DepartmentLegacy = Pick<Department, "name" | "function" | "status"> & {
  role: string;
};

export interface AbuStatic {
  id: string;
  companyId: string;
  name: string;
  eei: number;
  health: number;
  workflows: number;
  risk: "low" | "medium" | "high" | "critical";
  eeiContrib: string;
  kpis: Record<string, string>;
  cost: string;
  openTasks: number;
  roi: string;
  revenueProtected: string;
  costSaved: string;
  hoursSaved: number;
  downtimePrevented: string;
  automationPct: number;
  productivityImprovement: number;
  eeiContribution: number;
  color: string;
  departments: DepartmentSeed[];
}

export interface BuListItem extends Omit<AbuStatic, "departments"> {
  agents: number;
  departments: Department[];
  /** @deprecated Alias for `departments` — same data, legacy field name. */
  employees: DepartmentLegacy[];
}

export type DeptNodeKind = "agent" | "workflow" | "integration" | "kpi";
export type DeptNodeStatus = "active" | "watch" | "critical";

export interface DeptChildNode {
  id: string;
  label: string;
  sub: string;
  kind: DeptNodeKind;
  status: DeptNodeStatus;
  metric: string;
  agentId?: string;
}

export interface DeptTwinModel {
  id: string;
  buId: string;
  buName: string;
  name: string;
  role: string;
  status: string;
  health: number;
  automation: number;
  agents: number;
  workflows: number;
  openTasks: number;
  nodes: DeptChildNode[];
}

export interface EnterpriseMetrics {
  eeiScore: number;
  eeiTrend: number;
  roi: string;
  revenueProtected: string;
  costSaved: string;
  hoursSaved: number;
  downtimePrevented: string;
  automationPct: number;
  productivityImprovement: number;
  eeiContribution: number;
  activeAgents: number;
  totalWorkflows: number;
  governanceHealth: number;
  aiWorkforceHealth: number;
  riskExposure: number;
  businessHealth: number;
  forecastAccuracy: number;
  activeEscalations: number;
  activeBusinessUnits: number;
  totalAgents: number;
  revenueImpact: number;
  costSavings: number;
}

// Re-export id helpers for backward compatibility.
export { deptSlug, deptTwinId } from "@/data/org-ids";

// ─── Static ABU + department definitions ──────────────────────

const ABU_STATIC: AbuStatic[] = [
  {
    id: "manufacturing",
    companyId: "company-a",
    name: "Manufacturing",
    eei: 88,
    health: 91,
    workflows: 42,
    risk: "low",
    eeiContrib: "+4.8",
    kpis: { oee: "87.4%", throughput: "2,840 u/hr", scrapRate: "1.2%" },
    cost: "$148K/mo",
    openTasks: 14,
    roi: "2.4x",
    revenueProtected: "$4.2M",
    costSaved: "$920K",
    hoursSaved: 2840,
    downtimePrevented: "84 hrs",
    automationPct: 87,
    productivityImprovement: 22,
    eeiContribution: 4.8,
    color: "blue",
    departments: [
      { id: deptTwinId("manufacturing", "Production"), name: "Production", function: "Production Scheduling & Line Operations", status: "active" },
      { id: deptTwinId("manufacturing", "Engineering"), name: "Engineering", function: "Equipment Efficiency & Energy Management", status: "active" },
      { id: deptTwinId("manufacturing", "Maintenance"), name: "Maintenance", function: "Predictive & Preventive Maintenance", status: "active" },
      { id: deptTwinId("manufacturing", "Quality"), name: "Quality", function: "Defect Detection & Waste Reduction", status: "watch" },
    ],
  },
  {
    id: "supply-chain",
    companyId: "company-a",
    name: "Supply Chain",
    eei: 76,
    health: 79,
    workflows: 33,
    risk: "high",
    eeiContrib: "+1.8",
    kpis: { inventoryTurns: "8.2x", forecastAccuracy: "82%", fillRate: "94.1%" },
    cost: "$112K/mo",
    openTasks: 38,
    roi: "1.6x",
    revenueProtected: "$2.8M",
    costSaved: "$480K",
    hoursSaved: 1240,
    downtimePrevented: "—",
    automationPct: 64,
    productivityImprovement: 14,
    eeiContribution: 1.8,
    color: "amber",
    departments: [
      { id: deptTwinId("supply-chain", "Warehousing"), name: "Warehousing", function: "Inventory & Warehouse Operations", status: "watch" },
      { id: deptTwinId("supply-chain", "Demand Planning"), name: "Demand Planning", function: "Forecast & Demand Modeling", status: "active" },
      { id: deptTwinId("supply-chain", "Logistics"), name: "Logistics", function: "Route & Carrier Intelligence", status: "active" },
    ],
  },
  {
    id: "procurement",
    companyId: "company-a",
    name: "Procurement",
    eei: 73,
    health: 77,
    workflows: 22,
    risk: "high",
    eeiContrib: "+1.6",
    kpis: { costSavings: "$2.1M/yr", supplierScore: "74/100", cycleTime: "12.4 days" },
    cost: "$84K/mo",
    openTasks: 29,
    roi: "1.4x",
    revenueProtected: "$1.2M",
    costSaved: "$340K",
    hoursSaved: 680,
    downtimePrevented: "—",
    automationPct: 52,
    productivityImprovement: 11,
    eeiContribution: 1.6,
    color: "orange",
    departments: [
      { id: deptTwinId("procurement", "Supplier Management"), name: "Supplier Management", function: "Supplier Risk & Relationship Management", status: "watch" },
      { id: deptTwinId("procurement", "Sourcing"), name: "Sourcing", function: "Strategic Sourcing", status: "active" },
      { id: deptTwinId("procurement", "Contracts"), name: "Contracts", function: "Contract Lifecycle Management", status: "active" },
    ],
  },
  {
    id: "finance",
    companyId: "company-a",
    name: "Finance",
    eei: 87,
    health: 92,
    workflows: 18,
    risk: "low",
    eeiContrib: "+3.9",
    kpis: { forecastAccuracy: "94.2%", closeCycle: "3.1 days", costPerUnit: "$18.40" },
    cost: "$68K/mo",
    openTasks: 6,
    roi: "2.2x",
    revenueProtected: "$2.2M",
    costSaved: "$284K",
    hoursSaved: 1120,
    downtimePrevented: "—",
    automationPct: 88,
    productivityImprovement: 18,
    eeiContribution: 3.9,
    color: "emerald",
    departments: [
      { id: deptTwinId("finance", "FP&A"), name: "FP&A", function: "Financial Planning & Cost Analytics", status: "active" },
      { id: deptTwinId("finance", "Accounting"), name: "Accounting", function: "Budget & Cost Control", status: "active" },
      { id: deptTwinId("finance", "Audit"), name: "Audit", function: "Compliance & Audit", status: "active" },
    ],
  },
  {
    id: "revenue",
    companyId: "company-a",
    name: "Revenue",
    eei: 83,
    health: 87,
    workflows: 28,
    risk: "medium",
    eeiContrib: "+2.8",
    kpis: { forecastAccuracy: "88%", pipelineHealth: "78/100", dealVelocity: "22.4 days" },
    cost: "$118K/mo",
    openTasks: 19,
    roi: "2.7x",
    revenueProtected: "$14.2M",
    costSaved: "$620K",
    hoursSaved: 1840,
    downtimePrevented: "—",
    automationPct: 78,
    productivityImprovement: 24,
    eeiContribution: 2.8,
    color: "violet",
    departments: [
      { id: deptTwinId("revenue", "Sales"), name: "Sales", function: "Pipeline & Deal Intelligence", status: "watch" },
      { id: deptTwinId("revenue", "Customer Success"), name: "Customer Success", function: "Account Health & Retention", status: "active" },
      { id: deptTwinId("revenue", "Marketing"), name: "Marketing", function: "Demand Generation & Brand — not yet AI-covered", status: "active" },
    ],
  },
];

function toLegacyDept(d: Department): DepartmentLegacy {
  return { name: d.name, role: d.function, status: d.status };
}

function enrichDepartments(buId: string, seeds: DepartmentSeed[]): Department[] {
  return seeds.map((d) => ({
    ...d,
    buId,
    agentCount: agentsForDept(d.id).length,
  }));
}

function buildBuList(): BuListItem[] {
  return ABU_STATIC.map((abu) => {
    const departments = enrichDepartments(abu.id, abu.departments);
    const agents = agentsForBu(abu.id).length;
    const { departments: _seeds, ...rest } = abu;
    return {
      ...rest,
      agents,
      departments,
      employees: departments.map(toLegacyDept),
    };
  });
}

export const BU_LIST: BuListItem[] = buildBuList();

export function getAbu(buId: string): BuListItem | undefined {
  return BU_LIST.find((b) => b.id === buId);
}

export function getDepartment(deptId: string): Department | undefined {
  for (const bu of BU_LIST) {
    const dept = bu.departments.find((d) => d.id === deptId);
    if (dept) return dept;
  }
  return undefined;
}

// ─── Roll-ups ─────────────────────────────────────────────────

export function computeEnterpriseMetrics(): EnterpriseMetrics {
  const totalAgents = BU_LIST.reduce((s, b) => s + b.agents, 0);
  const totalWorkflows = BU_LIST.reduce((s, b) => s + b.workflows, 0);
  const avgHealth = Math.round(BU_LIST.reduce((s, b) => s + b.health, 0) / BU_LIST.length);
  const avgEei = Math.round(BU_LIST.reduce((s, b) => s + b.eei, 0) / BU_LIST.length);
  const avgAutomation = Math.round(BU_LIST.reduce((s, b) => s + b.automationPct, 0) / BU_LIST.length);
  const avgProductivity = Math.round(BU_LIST.reduce((s, b) => s + b.productivityImprovement, 0) / BU_LIST.length);
  const totalHoursSaved = BU_LIST.reduce((s, b) => s + b.hoursSaved, 0);
  const totalEeiContrib = BU_LIST.reduce((s, b) => s + b.eeiContribution, 0);

  return {
    eeiScore: avgEei,
    eeiTrend: 1.4,
    roi: "2.1x",
    revenueProtected: "$24.6M",
    costSaved: "$2.64M",
    hoursSaved: totalHoursSaved,
    downtimePrevented: "84 hrs",
    automationPct: avgAutomation,
    productivityImprovement: avgProductivity,
    eeiContribution: Math.round(totalEeiContrib * 10) / 10,
    activeAgents: totalAgents,
    totalWorkflows,
    governanceHealth: 91,
    aiWorkforceHealth: avgHealth,
    riskExposure: 18,
    businessHealth: avgHealth,
    forecastAccuracy: 91,
    activeEscalations: 2,
    activeBusinessUnits: BU_LIST.length,
    totalAgents,
    revenueImpact: 24600000,
    costSavings: 2640000,
  };
}

export const ENTERPRISE_METRICS: EnterpriseMetrics = computeEnterpriseMetrics();

// ─── Department twin builder (real agents, no random seeding) ─

function deptHealthFromAgents(deptId: string, fallbackStatus: DeptStatus): number {
  const agents = agentsForDept(deptId);
  if (agents.length === 0) {
    return fallbackStatus === "critical" ? 62 : fallbackStatus === "watch" ? 74 : 88;
  }
  const avg = agents.reduce((s, a) => s + a.health, 0) / agents.length;
  return Math.round(avg);
}

function deptAutomationFromAgents(deptId: string): number {
  const agents = agentsForDept(deptId);
  if (agents.length === 0) return 70;
  return Math.round(agents.reduce((s, a) => s + a.automationPct, 0) / agents.length);
}

export function buildDeptTwin(
  buId: string,
  dept: Pick<DepartmentSeed, "id" | "name" | "function" | "status">
): DeptTwinModel {
  const bu = getAbu(buId);
  const agents = agentsForDept(dept.id);

  // Digital Twin nodes are AI agents only — KPIs, workflows, and
  // integrations already have dedicated views (KPI Studio, Workflow
  // Studio, Connectors) and were adding noise here without new information.
  const nodes: DeptChildNode[] = agents.map((agent) => ({
    id: `${dept.id}:agent:${agent.id}`,
    label: agent.name,
    sub: agent.role,
    kind: "agent",
    status: agent.status,
    metric: `${agent.accuracy}% acc`,
    agentId: agent.id,
  }));

  const wfCount = Math.min(3, Math.max(1, Math.ceil(agents.length / 2)));
  const workflows = wfCount + 1;
  const openTasks =
    dept.status === "watch"
      ? agents.reduce((s, a) => s + a.tasks, 0)
      : Math.max(2, Math.round(agents.reduce((s, a) => s + a.tasks, 0) / 8));

  return {
    id: dept.id,
    buId,
    buName: bu?.name ?? buId,
    name: dept.name,
    role: dept.function,
    status: dept.status,
    health: deptHealthFromAgents(dept.id, dept.status),
    automation: deptAutomationFromAgents(dept.id),
    agents: agents.length,
    workflows,
    openTasks,
    nodes,
  };
}

export function departmentsForBu(buId: string): Department[] {
  return getAbu(buId)?.departments ?? [];
}

export function resolveDeptTwin(
  deptId: string | null | undefined,
  fallbackBuId: string | null
): DeptTwinModel | null {
  if (deptId) {
    const dept = getDepartment(deptId);
    if (dept) return buildDeptTwin(dept.buId, dept);
  }
  if (fallbackBuId) {
    const bu = getAbu(fallbackBuId);
    const first = bu?.departments[0];
    if (first) return buildDeptTwin(fallbackBuId, first);
  }
  return null;
}

export function agentsInDepartment(deptId: string) {
  return agentsForDept(deptId);
}
