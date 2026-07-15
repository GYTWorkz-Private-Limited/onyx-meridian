// Org hierarchy + metrics: single source of truth in org-model.ts
export {
  BU_LIST,
  ENTERPRISE_METRICS,
  computeEnterpriseMetrics,
  buildDeptTwin,
  departmentsForBu,
  resolveDeptTwin,
  deptSlug,
  deptTwinId,
  getAbu,
  getDepartment,
  agentsInDepartment,
} from "@/data/org-model";
export type {
  BuListItem,
  Department,
  DepartmentLegacy,
  DeptChildNode,
  DeptNodeKind,
  DeptNodeStatus,
  DeptTwinModel,
  EnterpriseMetrics,
} from "@/data/org-model";

export { MFG_AGENTS, ALL_AGENTS, agentsForBu, agentsForDept } from "@/data/agents-registry";
export type { AgentRecord } from "@/data/agents-registry";

import { ENTERPRISE_METRICS } from "@/data/org-model";
import { deptTwinId } from "@/data/org-ids";

// ─── KPI Studio: Enterprise Health Overview ────────────────────
// Ten executive score cards shown at the top of KPI Studio. Each maps to
// a coherent slice of the KPI_CATALOG / BU_LIST data below it.
export interface HealthCard {
  id: string;
  label: string;
  score: number;
  target: number;
  trend: number[];
  confidence: number;
  summary: string;
}
export const ENTERPRISE_HEALTH_CARDS: HealthCard[] = [
  { id: "enterprise", label: "Enterprise Health", score: 84, target: 90, trend: [79, 80, 81, 82, 83, 83, 84], confidence: 96,
    summary: "Steady climb across all 5 ABUs; Manufacturing and Finance leading, Procurement cycle time the main drag." },
  { id: "mfg-perf", label: "Manufacturing Performance", score: 91, target: 92, trend: [88, 89, 90, 90, 91, 91, 91], confidence: 97,
    summary: "Near target — Line 7 downtime is the only open risk against an otherwise strong quarter." },
  { id: "prod-eff", label: "Production Efficiency", score: 78, target: 90, trend: [80, 79, 79, 78, 77, 78, 78], confidence: 92,
    summary: "OEE softened on Line 7 bearing wear; predictive maintenance work order already in flight." },
  { id: "fin-perf", label: "Financial Performance", score: 88, target: 92, trend: [83, 84, 85, 86, 87, 87, 88], confidence: 95,
    summary: "Margin expansion and falling COGS are driving steady improvement toward the EBITDA target." },
  { id: "supply-chain", label: "Supply Chain Health", score: 79, target: 88, trend: [82, 81, 80, 79, 79, 80, 79], confidence: 89,
    summary: "APAC demand spike is straining inventory turns; emergency reorder queued for SKU-8841." },
  { id: "quality", label: "Quality Health", score: 76, target: 90, trend: [79, 78, 77, 76, 76, 77, 76], confidence: 90,
    summary: "Scrap rate and DPMO both traced to one supplier material batch — corrective action in progress." },
  { id: "equipment", label: "Equipment Health", score: 72, target: 88, trend: [77, 76, 75, 73, 72, 72, 72], confidence: 91,
    summary: "MTBF trending down on Line 7 specifically; rest of the fleet stable. Repair scheduled this week." },
  { id: "safety", label: "Safety Compliance", score: 92, target: 95, trend: [89, 90, 90, 91, 91, 92, 92], confidence: 98,
    summary: "No recordable incidents in 14 days — tracking ahead of the annual safety target." },
  { id: "sustainability", label: "Sustainability Score", score: 82, target: 90, trend: [77, 78, 79, 80, 81, 81, 82], confidence: 88,
    summary: "Energy load-balancing is cutting consumption and emissions steadily toward the two-quarter target." },
  { id: "ai-workforce", label: "AI Workforce Health", score: 87, target: 92, trend: [83, 84, 85, 86, 86, 87, 87], confidence: 96,
    summary: `${ENTERPRISE_METRICS.totalAgents} AI agents at 97.2% uptime; automation coverage up 4 pts this quarter across all 5 ABUs.` },
];

export const ANOMALIES = [
  {
    id: "a1",
    severity: "critical",
    title: "OEE deviation on Line 7 — bearings at failure threshold",
    context: "Manufacturing · OEE Optimizer · 94% confidence · MX-0441 at 2.3σ",
    impact: "6-hr unplanned downtime risk · $480K production loss",
    action: "Trigger predictive maintenance work order for MX-0441",
    age: "6 min ago",
    trend: [72, 71, 70, 68, 65, 61, 57, 52, 48],
    buId: "manufacturing",
    deptId: deptTwinId("manufacturing", "OEE Optimizer"),
  },
  {
    id: "a2",
    severity: "warning",
    title: "Supplier risk score critical — 3 tier-1 vendors flagged",
    context: "Procurement · Supplier Risk Agent · 88% confidence · Q3 continuity risk",
    impact: "Supply chain disruption · 18-day lead-time extension",
    action: "Activate alternate supplier protocol — escalate to procurement manager",
    age: "22 min ago",
    trend: [20, 22, 28, 31, 36, 42, 48, 54, 61],
    buId: "procurement",
    deptId: deptTwinId("procurement", "Supplier Risk"),
  },
  {
    id: "a3",
    severity: "watch",
    title: "Inventory turns declining — WH-3 stockout risk in 11 days",
    context: "Supply Chain · Inventory Optimizer · 81% confidence · SKU-8841 velocity change",
    impact: "Delivery SLA risk +18% · $1.2M revenue at risk",
    action: "Reorder trigger recommended — expedite from secondary supplier",
    age: "1 hr ago",
    trend: [60, 58, 56, 53, 50, 47, 44, 41, 38],
    buId: "supply-chain",
    deptId: deptTwinId("supply-chain", "Inventory Optimizer"),
  },
  {
    id: "a4",
    severity: "watch",
    title: "Revenue pipeline conversion declining — APAC region -11%",
    context: "Revenue · Revenue Scout · 87% confidence · 30-day trend",
    impact: "Q3 target risk · $3.4M pipeline at risk",
    action: "Increase APAC outreach by 14% — prioritize tier-1 accounts",
    age: "2 hrs ago",
    trend: [85, 83, 81, 79, 77, 74, 72, 70, 68],
    buId: "revenue",
    deptId: deptTwinId("revenue", "Revenue Scout"),
  },
];

export const IMPACT_MAP: Record<string, {
  trigger: string;
  chain: Array<{ label: string; metric: string; change: string; dir: "up" | "down"; severity: "high" | "medium" | "low" }>;
  eeiDelta: string;
  enterpriseOutcome: string;
}> = {
  manufacturing: {
    trigger: "Manufacturing Health ↓ 15%",
    chain: [
      { label: "OEE", metric: "Overall Equipment Effectiveness", change: "-8.2%", dir: "down", severity: "high" },
      { label: "Throughput", metric: "Units Produced / Hour", change: "-14%", dir: "down", severity: "high" },
      { label: "EEI", metric: "Enterprise Efficiency Index", change: "-3.1 pts", dir: "down", severity: "high" },
      { label: "Outcome", metric: "Revenue Target", change: "-$6.8M", dir: "down", severity: "high" },
    ],
    eeiDelta: "-3.1",
    enterpriseOutcome: "Q3 Production Target Miss",
  },
  "supply-chain": {
    trigger: "Supply Chain Health ↓ 15%",
    chain: [
      { label: "Inventory", metric: "Inventory Turns", change: "-2.1x", dir: "down", severity: "high" },
      { label: "Delivery", metric: "On-time Delivery Rate", change: "-11%", dir: "down", severity: "high" },
      { label: "EEI", metric: "Enterprise Efficiency Index", change: "-2.4 pts", dir: "down", severity: "high" },
      { label: "Outcome", metric: "Customer SLA Breach Risk", change: "+38%", dir: "up", severity: "high" },
    ],
    eeiDelta: "-2.4",
    enterpriseOutcome: "Customer Delivery Failure",
  },
  procurement: {
    trigger: "Procurement Health ↓ 15%",
    chain: [
      { label: "Supplier", metric: "Supplier Risk Exposure", change: "+22%", dir: "up", severity: "high" },
      { label: "Cycle", metric: "PO Approval Cycle Time", change: "+4.2 days", dir: "up", severity: "high" },
      { label: "EEI", metric: "Enterprise Efficiency Index", change: "-1.6 pts", dir: "down", severity: "medium" },
      { label: "Outcome", metric: "Cross-BU Workflow Stall", change: "+42%", dir: "up", severity: "high" },
    ],
    eeiDelta: "-1.6",
    enterpriseOutcome: "Operational Stall Risk",
  },
  finance: {
    trigger: "Finance Health ↓ 15%",
    chain: [
      { label: "Close", metric: "Month-end Close Duration", change: "+3.2 days", dir: "up", severity: "high" },
      { label: "Forecast", metric: "Cost Forecast Accuracy", change: "-8%", dir: "down", severity: "medium" },
      { label: "EEI", metric: "Enterprise Efficiency Index", change: "-1.4 pts", dir: "down", severity: "medium" },
      { label: "Outcome", metric: "Audit Risk Score", change: "+18%", dir: "up", severity: "medium" },
    ],
    eeiDelta: "-1.4",
    enterpriseOutcome: "Audit Risk Elevated",
  },
  revenue: {
    trigger: "Revenue Health ↓ 15%",
    chain: [
      { label: "Pipeline", metric: "Pipeline Conversion Rate", change: "-4.2%", dir: "down", severity: "high" },
      { label: "Forecast", metric: "Revenue Forecast Accuracy", change: "-9%", dir: "down", severity: "high" },
      { label: "EEI", metric: "Enterprise Efficiency Index", change: "-1.8 pts", dir: "down", severity: "medium" },
      { label: "Outcome", metric: "Revenue at Risk", change: "-$3.4M", dir: "down", severity: "high" },
    ],
    eeiDelta: "-1.8",
    enterpriseOutcome: "Revenue Target Miss",
  },
};


// ─── KPI Studio catalog ───────────────────────────────────────
// Every KPI abbreviation must be spelled out (fullName) wherever it's
// shown — never abbreviation-only. dependsOn/feeds encode the metric
// dependency chain for the Metric Tree; goalIds link into GOAL_TREE
// (see goals-data.ts) for Goal Alignment; rootCauses is only populated
// for KPIs currently missing target.

export interface KpiEntry {
  id: string;
  name: string;
  abbreviation?: string;
  fullName: string;
  category: string;
  value: string;
  target: string;
  trend: "up" | "down";
  delta: string;
  variance: string;
  healthScore: number;
  owner: string;
  buIds: string[];
  linked: string[];
  formula: string;
  dataSource: string;
  updateFrequency: string;
  forecastNext: string;
  dependsOn: string[];
  feeds: string[];
  goalIds: string[];
  rootCauses: { cause: string; confidence: number }[];
  aiSummary: string;
}

export const KPI_CATALOG: KpiEntry[] = [
  // ── Manufacturing ──
  { id: "k1", name: "OEE", abbreviation: "OEE", fullName: "Overall Equipment Effectiveness", category: "Manufacturing", value: "87.4%", target: "90%", trend: "down", delta: "-1.2%", variance: "-2.6 pts vs target", healthScore: 78, owner: "Plant Manager", buIds: ["manufacturing"], linked: ["ag1", "ag2", "ag3"],
    formula: "Availability × Performance × Quality", dataSource: "SCADA / MES", updateFrequency: "Real-time", forecastNext: "88.1% next week",
    dependsOn: ["k-mtbf", "k-mttr", "k-downtime"], feeds: ["k2", "k12"], goalIds: ["goal-2", "goal-5"],
    rootCauses: [{ cause: "Line 7 bearing degradation raising unplanned downtime", confidence: 94 }, { cause: "Shift-change micro-stoppages", confidence: 61 }],
    aiSummary: "OEE slipped 1.2 pts this week, driven mainly by Line 7 unplanned downtime. Predictive Maintenance has already opened a work order; expect recovery toward 88% next week if the bearing swap holds." },
  { id: "k2", name: "Throughput", fullName: "Production Throughput", category: "Manufacturing", value: "2,840 u/hr", target: "3,000 u/hr", trend: "up", delta: "+42 u/hr", variance: "-160 u/hr vs target", healthScore: 82, owner: "Plant Manager", buIds: ["manufacturing"], linked: ["ag1"],
    formula: "Units produced ÷ production hours", dataSource: "MES", updateFrequency: "Real-time", forecastNext: "2,910 u/hr next week",
    dependsOn: ["k1"], feeds: ["k-revenue"], goalIds: [], rootCauses: [],
    aiSummary: "Throughput is climbing steadily on the new scheduling algorithm — up 42 u/hr this shift and on pace to close the gap to target within three weeks." },
  { id: "k3", name: "Scrap Rate", fullName: "Scrap Rate", category: "Manufacturing", value: "1.2%", target: "< 1%", trend: "down", delta: "-0.2%", variance: "+0.2 pts vs target", healthScore: 71, owner: "Quality Manager", buIds: ["manufacturing"], linked: ["ag2", "ag4"],
    formula: "Scrapped units ÷ total units produced", dataSource: "MES", updateFrequency: "Daily", forecastNext: "0.9% next month",
    dependsOn: ["k-fpy"], feeds: ["k-copq"], goalIds: [],
    rootCauses: [{ cause: "Raw material batch QD-229 out of tolerance", confidence: 88 }],
    aiSummary: "Scrap Rate is trending down toward target after Quality Inspector flagged batch QD-229; root cause traced to a supplier material variance, not a process fault." },
  { id: "k-mtbf", name: "MTBF", abbreviation: "MTBF", fullName: "Mean Time Between Failures", category: "Manufacturing", value: "412 hrs", target: "500 hrs", trend: "down", delta: "-18 hrs", variance: "-88 hrs vs target", healthScore: 68, owner: "Maintenance Supervisor", buIds: ["manufacturing"], linked: ["ag3"],
    formula: "Total operating time ÷ number of failures", dataSource: "CMMS", updateFrequency: "Daily", forecastNext: "430 hrs next month",
    dependsOn: [], feeds: ["k1"], goalIds: ["goal-5"],
    rootCauses: [{ cause: "Line 7 bearing wear accelerating past predicted curve", confidence: 91 }],
    aiSummary: "MTBF is down 18 hrs, concentrated entirely on Line 7 — the rest of the fleet is stable. A bearing swap is scheduled this week." },
  { id: "k-mttr", name: "MTTR", abbreviation: "MTTR", fullName: "Mean Time To Repair", category: "Manufacturing", value: "2.4 hrs", target: "< 2 hrs", trend: "up", delta: "+0.3 hrs", variance: "+0.4 hrs vs target", healthScore: 74, owner: "Maintenance Supervisor", buIds: ["manufacturing"], linked: ["ag3"],
    formula: "Total repair time ÷ number of repairs", dataSource: "CMMS", updateFrequency: "Daily", forecastNext: "2.1 hrs next month",
    dependsOn: [], feeds: ["k1", "k-downtime"], goalIds: ["goal-5"], rootCauses: [],
    aiSummary: "Repair time crept up slightly this month, mostly parts-availability wait time rather than technician performance." },
  { id: "k-downtime", name: "Downtime Hours", fullName: "Unplanned Downtime Hours", category: "Manufacturing", value: "4.2 hrs", target: "< 3 hrs", trend: "up", delta: "+1.1 hrs", variance: "+1.2 hrs vs target", healthScore: 65, owner: "Maintenance Supervisor", buIds: ["manufacturing"], linked: ["ag3"],
    formula: "Sum of unplanned stoppage duration this period", dataSource: "SCADA", updateFrequency: "Real-time", forecastNext: "3.1 hrs next week",
    dependsOn: ["k-mttr"], feeds: ["k1"], goalIds: ["goal-5"],
    rootCauses: [{ cause: "Line 7 bearing failure risk at 2.3σ above baseline", confidence: 94 }],
    aiSummary: "Downtime is above target this week, almost entirely attributable to the Line 7 bearing issue already in remediation." },
  { id: "k-fpy", name: "FPY", abbreviation: "FPY", fullName: "First Pass Yield", category: "Manufacturing", value: "96.8%", target: "98%", trend: "down", delta: "-0.4%", variance: "-1.2 pts vs target", healthScore: 80, owner: "Quality Manager", buIds: ["manufacturing"], linked: ["ag4"],
    formula: "Units passing inspection first time ÷ total units started", dataSource: "MES", updateFrequency: "Daily", forecastNext: "97.5% next month",
    dependsOn: [], feeds: ["k3", "k-copq"], goalIds: [], rootCauses: [],
    aiSummary: "First Pass Yield softened slightly alongside the QD-229 material variance flagged in Scrap Rate — same root cause, not a separate issue." },
  { id: "k-teep", name: "TEEP", abbreviation: "TEEP", fullName: "Total Effective Equipment Performance", category: "Manufacturing", value: "74.1%", target: "80%", trend: "up", delta: "+1.8%", variance: "-5.9 pts vs target", healthScore: 76, owner: "Plant Manager", buIds: ["manufacturing"], linked: ["ag1", "ag2"],
    formula: "OEE × Utilization of total calendar time", dataSource: "SCADA / MES", updateFrequency: "Daily", forecastNext: "75.6% next month",
    dependsOn: ["k1"], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "TEEP is improving as the new scheduling algorithm reclaims idle calendar time, independent of the OEE dip." },
  { id: "k-mutil", name: "Machine Utilization", fullName: "Machine Utilization", category: "Manufacturing", value: "81.2%", target: "85%", trend: "up", delta: "+0.9%", variance: "-3.8 pts vs target", healthScore: 79, owner: "Plant Manager", buIds: ["manufacturing"], linked: ["ag1"],
    formula: "Machine run time ÷ scheduled available time", dataSource: "SCADA", updateFrequency: "Real-time", forecastNext: "82% next week",
    dependsOn: [], feeds: ["k2"], goalIds: [], rootCauses: [],
    aiSummary: "Utilization is climbing steadily with no active constraints." },
  { id: "k-energy", name: "Energy Consumption", fullName: "Energy Consumption", category: "Sustainability", value: "4.8 MWh/day", target: "< 4.5 MWh/day", trend: "down", delta: "-0.2 MWh", variance: "+0.3 MWh vs target", healthScore: 83, owner: "Plant Manager", buIds: ["manufacturing"], linked: ["ag10"],
    formula: "Total facility energy draw per production day", dataSource: "BMS / IoT", updateFrequency: "Real-time", forecastNext: "4.6 MWh/day next month",
    dependsOn: [], feeds: ["k-carbon"], goalIds: [], rootCauses: [],
    aiSummary: "Energy Intelligence load-balancing is trimming consumption steadily toward target." },
  { id: "k-carbon", name: "Carbon Emissions", fullName: "Carbon Emissions", category: "Sustainability", value: "312 tCO₂e/mo", target: "< 290 tCO₂e/mo", trend: "down", delta: "-14 tCO₂e", variance: "+22 tCO₂e vs target", healthScore: 81, owner: "Plant Manager", buIds: ["manufacturing"], linked: ["ag10"],
    formula: "Emissions factor × energy consumption", dataSource: "BMS / IoT", updateFrequency: "Monthly", forecastNext: "295 tCO₂e next month",
    dependsOn: ["k-energy"], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "Tracking down in line with the energy reduction program; on pace to hit target within two quarters." },
  { id: "k-safety", name: "Safety Incident Rate", fullName: "Safety Incident Rate", category: "Safety", value: "0.8 / 200K hrs", target: "< 1.0 / 200K hrs", trend: "down", delta: "-0.1", variance: "0.2 under target", healthScore: 92, owner: "Plant Manager", buIds: ["manufacturing"], linked: [],
    formula: "Recordable incidents × 200,000 ÷ total labor hours", dataSource: "EHS System", updateFrequency: "Weekly", forecastNext: "0.7 next month",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "Safety performance remains ahead of target with no recordable incidents in the last 14 days." },
  { id: "k-dpmo", name: "DPMO", abbreviation: "DPMO", fullName: "Defects Per Million Opportunities", category: "Manufacturing", value: "340", target: "< 300", trend: "down", delta: "-22", variance: "+40 vs target", healthScore: 77, owner: "Quality Manager", buIds: ["manufacturing"], linked: ["ag4"],
    formula: "(Defects ÷ (units × opportunities per unit)) × 1,000,000", dataSource: "MES", updateFrequency: "Daily", forecastNext: "310 next month",
    dependsOn: [], feeds: ["k-copq"], goalIds: [], rootCauses: [],
    aiSummary: "Defect density is improving alongside the QD-229 corrective action." },
  { id: "k-copq", name: "COPQ", abbreviation: "COPQ", fullName: "Cost of Poor Quality", category: "Manufacturing", value: "$186K/mo", target: "< $150K/mo", trend: "down", delta: "-$12K", variance: "+$36K vs target", healthScore: 70, owner: "Quality Manager", buIds: ["manufacturing"], linked: ["ag4"],
    formula: "Scrap cost + rework cost + warranty cost + inspection cost", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "$164K next month",
    dependsOn: ["k3", "k-fpy", "k-dpmo"], feeds: ["k9"], goalIds: ["goal-3"],
    rootCauses: [{ cause: "Raw material batch QD-229 driving rework cost", confidence: 85 }],
    aiSummary: "Cost of Poor Quality is falling as the material-batch issue resolves; still above target but trending the right way." },

  // ── Supply Chain ──
  { id: "k4", name: "Inventory Turns", fullName: "Inventory Turnover", category: "Supply Chain", value: "8.2x", target: "10x", trend: "down", delta: "-0.4x", variance: "-1.8x vs target", healthScore: 66, owner: "Warehouse Manager", buIds: ["supply-chain"], linked: ["ag5"],
    formula: "Cost of goods sold ÷ average inventory value", dataSource: "WMS / ERP", updateFrequency: "Weekly", forecastNext: "8.6x next month",
    dependsOn: ["k-wip"], feeds: ["k5"], goalIds: [],
    rootCauses: [{ cause: "Demand spike +22% in APAC outpacing replenishment", confidence: 81 }],
    aiSummary: "Turns are down as APAC demand outruns replenishment cadence; Inventory Optimizer has an emergency reorder queued for SKU-8841." },
  { id: "k5", name: "Fill Rate", fullName: "Order Fill Rate", category: "Supply Chain", value: "94.1%", target: "97%", trend: "up", delta: "+0.6%", variance: "-2.9 pts vs target", healthScore: 84, owner: "Warehouse Manager", buIds: ["supply-chain"], linked: ["ag5"],
    formula: "Orders fully shipped ÷ total orders placed", dataSource: "WMS", updateFrequency: "Daily", forecastNext: "95.8% next month",
    dependsOn: ["k4"], feeds: ["k-otif"], goalIds: [], rootCauses: [],
    aiSummary: "Fill Rate is recovering on WMS Agent's rerouting of 18 orders and 3 expedited shipments this week." },
  { id: "k-wip", name: "WIP", abbreviation: "WIP", fullName: "Work In Progress", category: "Supply Chain", value: "$4.1M", target: "< $3.5M", trend: "up", delta: "+$210K", variance: "+$0.6M vs target", healthScore: 69, owner: "Warehouse Manager", buIds: ["supply-chain"], linked: ["ag5"],
    formula: "Value of unfinished goods in the production/logistics pipeline", dataSource: "ERP", updateFrequency: "Weekly", forecastNext: "$3.9M next month",
    dependsOn: [], feeds: ["k4"], goalIds: [], rootCauses: [],
    aiSummary: "WIP is climbing with the APAC demand surge; expect it to ease once the emergency reorder clears the backlog." },
  { id: "k-whutil", name: "Warehouse Utilization", fullName: "Warehouse Utilization", category: "Supply Chain", value: "88.4%", target: "< 90%", trend: "up", delta: "+2.1%", variance: "1.6 pts under target", healthScore: 87, owner: "Warehouse Manager", buIds: ["supply-chain"], linked: [],
    formula: "Occupied storage capacity ÷ total storage capacity", dataSource: "WMS", updateFrequency: "Daily", forecastNext: "90.1% next month",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "Utilization is approaching capacity — worth flagging for overflow planning next quarter." },
  { id: "k-otif", name: "OTIF", abbreviation: "OTIF", fullName: "On-Time In-Full Delivery", category: "Supply Chain", value: "91.2%", target: "95%", trend: "up", delta: "+0.8%", variance: "-3.8 pts vs target", healthScore: 80, owner: "Warehouse Manager", buIds: ["supply-chain"], linked: ["ag5"],
    formula: "Orders delivered on-time and complete ÷ total orders", dataSource: "WMS / TMS", updateFrequency: "Daily", forecastNext: "92.6% next month",
    dependsOn: ["k5", "k-leadtime"], feeds: ["k-nps"], goalIds: [], rootCauses: [],
    aiSummary: "OTIF is improving in step with Fill Rate; supplier lead time remains the binding constraint." },
  { id: "k-otd", name: "OTD", abbreviation: "OTD", fullName: "On-Time Delivery", category: "Supply Chain", value: "93.6%", target: "96%", trend: "up", delta: "+0.5%", variance: "-2.4 pts vs target", healthScore: 82, owner: "Warehouse Manager", buIds: ["supply-chain"], linked: [],
    formula: "Orders delivered by promised date ÷ total orders", dataSource: "TMS", updateFrequency: "Daily", forecastNext: "94.5% next month",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "Route Optimizer's re-routing is holding On-Time Delivery steady despite the APAC volume surge." },
  { id: "k-leadtime", name: "Supplier Lead Time", fullName: "Supplier Lead Time", category: "Supply Chain", value: "16.2 days", target: "< 14 days", trend: "up", delta: "+0.8 days", variance: "+2.2 days vs target", healthScore: 72, owner: "Procurement Manager", buIds: ["supply-chain", "procurement"], linked: ["ag6"],
    formula: "Average days from PO issuance to goods receipt", dataSource: "ERP", updateFrequency: "Weekly", forecastNext: "15.4 days next month",
    dependsOn: [], feeds: ["k-otif", "k7"], goalIds: [], rootCauses: [],
    aiSummary: "Lead time has crept up with 3 tier-1 suppliers flagged for risk; alternate-supplier protocol is under review." },

  // ── Procurement ──
  { id: "k6", name: "Supplier Score", fullName: "Supplier Performance Score", category: "Procurement", value: "74/100", target: "85/100", trend: "down", delta: "-3 pts", variance: "-11 pts vs target", healthScore: 62, owner: "Procurement Manager", buIds: ["procurement"], linked: ["ag6"],
    formula: "Weighted blend of quality, delivery, and risk sub-scores", dataSource: "ERP", updateFrequency: "Weekly", forecastNext: "77/100 next month",
    dependsOn: ["k-leadtime"], feeds: ["k7"], goalIds: [],
    rootCauses: [{ cause: "3 tier-1 vendors flagged for continuity risk", confidence: 88 }],
    aiSummary: "Supplier Score dropped on continuity risk at 3 tier-1 vendors; alternate-supplier protocol recommended before it worsens further." },
  { id: "k7", name: "Cycle Time", fullName: "Procurement Cycle Time", category: "Procurement", value: "12.4 days", target: "< 8 days", trend: "up", delta: "+0.8 days", variance: "+4.4 days vs target", healthScore: 58, owner: "Procurement Director", buIds: ["procurement"], linked: ["ag6"],
    formula: "Days from requisition to purchase order approval", dataSource: "ERP", updateFrequency: "Weekly", forecastNext: "11.2 days next month",
    dependsOn: ["k6", "k-leadtime"], feeds: [], goalIds: [],
    rootCauses: [{ cause: "Manual approval routing on contracts over $50K", confidence: 76 }],
    aiSummary: "Cycle Time is the weakest metric in Procurement — largely a manual-approval bottleneck rather than a supplier issue." },

  // ── Finance ──
  { id: "k8", name: "Forecast Accuracy", fullName: "Financial Forecast Accuracy", category: "Finance", value: "94.2%", target: "95%", trend: "up", delta: "+0.8%", variance: "-0.8 pts vs target", healthScore: 91, owner: "Finance Director", buIds: ["finance"], linked: ["ag7"],
    formula: "1 − (|actual − forecast| ÷ actual)", dataSource: "ERP / Data Warehouse", updateFrequency: "Monthly", forecastNext: "95.1% next quarter",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "Forecast Accuracy is nearly at target and improving each cycle as the model retrains on fresher data." },
  { id: "k9", name: "Cost per Unit", fullName: "Cost per Unit", category: "Finance", value: "$18.40", target: "< $17.00", trend: "down", delta: "+$0.30", variance: "+$1.40 vs target", healthScore: 73, owner: "Finance Director", buIds: ["finance"], linked: ["ag7"],
    formula: "Total production cost ÷ units produced", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "$17.90 next month",
    dependsOn: ["k-copq"], feeds: ["k-cogs"], goalIds: ["goal-3"], rootCauses: [],
    aiSummary: "Cost per Unit is elevated mostly due to the COPQ overrun from the QD-229 material issue — should ease as that resolves." },
  { id: "k-closetime", name: "Close Cycle Time", fullName: "Financial Close Cycle Time", category: "Finance", value: "3.1 days", target: "< 2 days", trend: "down", delta: "-0.4 days", variance: "+1.1 days vs target", healthScore: 75, owner: "CFO", buIds: ["finance"], linked: ["ag7"],
    formula: "Business days from period-end to books closed", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "2.5 days next quarter",
    dependsOn: [], feeds: [], goalIds: ["goal-4"], rootCauses: [],
    aiSummary: "Close Cycle Time is shrinking steadily toward the zero-touch close goal as reconciliation automation expands." },
  { id: "k-cogs", name: "COGS", abbreviation: "COGS", fullName: "Cost of Goods Sold", category: "Finance", value: "$62.4M/qtr", target: "< $60M/qtr", trend: "down", delta: "-$1.1M", variance: "+$2.4M vs target", healthScore: 76, owner: "CFO", buIds: ["finance"], linked: [],
    formula: "Direct material + labor + manufacturing overhead", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "$60.8M next quarter",
    dependsOn: ["k9"], feeds: ["k-grossmargin"], goalIds: [], rootCauses: [],
    aiSummary: "COGS is trending down toward target as unit costs normalize." },
  { id: "k-grossmargin", name: "Gross Margin", fullName: "Gross Margin", category: "Finance", value: "38.2%", target: "40%", trend: "up", delta: "+0.6%", variance: "-1.8 pts vs target", healthScore: 85, owner: "CFO", buIds: ["finance"], linked: [],
    formula: "(Revenue − COGS) ÷ Revenue", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "38.9% next quarter",
    dependsOn: ["k-cogs"], feeds: ["k-ebitda"], goalIds: [], rootCauses: [],
    aiSummary: "Gross Margin is improving in step with falling COGS — on pace to reach target within two quarters." },
  { id: "k-ebitda", name: "EBITDA", abbreviation: "EBITDA", fullName: "Earnings Before Interest, Taxes, Depreciation and Amortization", category: "Finance", value: "$18.6M/qtr", target: "$20M/qtr", trend: "up", delta: "+$0.9M", variance: "-$1.4M vs target", healthScore: 88, owner: "CFO", buIds: ["finance"], linked: [],
    formula: "Operating income + depreciation + amortization", dataSource: "ERP", updateFrequency: "Quarterly", forecastNext: "$19.4M next quarter",
    dependsOn: ["k-grossmargin"], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "EBITDA is climbing on margin expansion and cost discipline — trajectory supports hitting target within the fiscal year." },
  { id: "k-cashflow", name: "Cash Flow", fullName: "Operating Cash Flow", category: "Finance", value: "$9.2M/mo", target: "$10M/mo", trend: "up", delta: "+$0.4M", variance: "-$0.8M vs target", healthScore: 86, owner: "CFO", buIds: ["finance"], linked: [], formula: "Net income + non-cash items ± working capital changes", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "$9.6M next month",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "Cash Flow is trending positively; working-capital drag from elevated inventory is the main gap to target." },
  { id: "k-ap", name: "AP Days", abbreviation: "AP", fullName: "Accounts Payable Days Outstanding", category: "Finance", value: "42 days", target: "45 days", trend: "down", delta: "-1.5 days", variance: "3 days under target", healthScore: 89, owner: "Finance Director", buIds: ["finance"], linked: [], formula: "Average days to pay approved supplier invoices", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "43 days next month",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "AP Days is within a healthy range, balancing supplier relationships against working capital." },
  { id: "k-ar", name: "AR Days", abbreviation: "AR", fullName: "Accounts Receivable Days Outstanding", category: "Finance", value: "38 days", target: "< 35 days", trend: "up", delta: "+1.2 days", variance: "+3 days vs target", healthScore: 79, owner: "Finance Director", buIds: ["finance"], linked: [], formula: "Average days to collect on customer invoices", dataSource: "ERP", updateFrequency: "Monthly", forecastNext: "36 days next month",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "AR Days ticked up slightly with two enterprise accounts running late — Finance Analyst has escalated collections." },

  // ── Revenue ──
  { id: "k10", name: "Pipeline Health", fullName: "Sales Pipeline Health", category: "Revenue", value: "78/100", target: "85/100", trend: "up", delta: "+2 pts", variance: "-7 pts vs target", healthScore: 74, owner: "VP Sales", buIds: ["revenue"], linked: ["ag8"],
    formula: "Weighted blend of pipeline coverage, stage velocity, and win-probability", dataSource: "CRM", updateFrequency: "Daily", forecastNext: "82/100 next month",
    dependsOn: [], feeds: ["k-revenue"], goalIds: [],
    rootCauses: [{ cause: "APAC pipeline conversion -11% over 30 days", confidence: 87 }],
    aiSummary: "Pipeline Health is recovering but still below target, dragged down by APAC conversion softness under competitive pressure." },
  { id: "k11", name: "Deal Velocity", fullName: "Deal Velocity", category: "Revenue", value: "22.4 days", target: "< 18 days", trend: "up", delta: "+1.2 days", variance: "+4.4 days vs target", healthScore: 79, owner: "Revenue Manager", buIds: ["revenue"], linked: ["ag9"],
    formula: "Average days from qualified opportunity to closed-won", dataSource: "CRM", updateFrequency: "Daily", forecastNext: "20.6 days next month",
    dependsOn: [], feeds: ["k-revenue"], goalIds: [], rootCauses: [],
    aiSummary: "Deal Closer AI has lifted close rates 18% vs benchmark this quarter, though velocity is still above target." },
  { id: "k-revenue", name: "Revenue", fullName: "Total Revenue", category: "Revenue", value: "$14.2M/mo", target: "$15M/mo", trend: "up", delta: "+$0.6M", variance: "-$0.8M vs target", healthScore: 83, owner: "Revenue Manager", buIds: ["revenue"], linked: ["ag8", "ag9"],
    formula: "Sum of closed-won bookings recognized this period", dataSource: "CRM / ERP", updateFrequency: "Daily", forecastNext: "$14.8M next month",
    dependsOn: ["k10", "k11", "k2"], feeds: ["k-ebitda", "k12"], goalIds: [], rootCauses: [],
    aiSummary: "Revenue is tracking up toward target, led by Deal Closer AI's tier-2 close-rate gains offsetting APAC softness." },
  { id: "k-nps", name: "NPS", abbreviation: "NPS", fullName: "Net Promoter Score", category: "Revenue", value: "+42", target: "+50", trend: "up", delta: "+3 pts", variance: "-8 pts vs target", healthScore: 81, owner: "VP Sales", buIds: ["revenue"], linked: [],
    formula: "% Promoters − % Detractors (0-10 recommend-likelihood survey)", dataSource: "CRM", updateFrequency: "Monthly", forecastNext: "+45 next quarter",
    dependsOn: ["k-otif"], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "NPS is climbing alongside delivery reliability improvements — Customer Intel links the gain directly to OTIF recovery." },
  { id: "k-complaints", name: "Customer Complaints", fullName: "Customer Complaints", category: "Revenue", value: "14 / mo", target: "< 10 / mo", trend: "down", delta: "-3", variance: "+4 vs target", healthScore: 77, owner: "VP Sales", buIds: ["revenue"], linked: [],
    formula: "Count of formally logged customer complaints this period", dataSource: "CRM", updateFrequency: "Weekly", forecastNext: "11 next month",
    dependsOn: [], feeds: [], goalIds: [], rootCauses: [],
    aiSummary: "Complaint volume is falling as delivery and quality issues resolve upstream; still slightly above target." },

  // ── Enterprise ──
  { id: "k12", name: "EEI", abbreviation: "EEI", fullName: "Enterprise Execution Index", category: "Enterprise", value: "82.1", target: "90", trend: "up", delta: "+0.4", variance: "-7.9 pts vs target", healthScore: 84, owner: "CXO", buIds: ["manufacturing", "supply-chain", "procurement", "finance", "revenue"], linked: [],
    formula: "Weighted composite of all 5 ABU execution scores", dataSource: "Data Warehouse", updateFrequency: "Daily", forecastNext: "83.0 next month",
    dependsOn: ["k1", "k2", "k4", "k6", "k8", "k10"], feeds: [], goalIds: ["goal-1"], rootCauses: [],
    aiSummary: "EEI continues its steady climb; Manufacturing and Finance are the strongest contributors, Procurement's Cycle Time is the main drag." },
];

export const SOP_CATALOG = [
  {
    id: "sop1", title: "Predictive Maintenance Execution", owner: "Manufacturing", version: "v3.2",
    automation: 84, risk: "medium", status: "active",
    workflow: ["Asset Anomaly Detected", "AI Diagnosis", "Work Order Generation", "Parts Request", "Scheduled Maintenance", "Verification"],
    kpis: ["OEE", "Downtime", "Asset Reliability"],
    agents: ["Predictive Maintenance", "OEE Optimizer"],
    humans: ["Maintenance Supervisor", "Parts Manager"],
    policies: ["MNT-001 Emergency Work Order", "MNT-004 Asset Criticality"],
    systems: ["CMMS", "IoT", "SCADA"],
    linkedDocs: ["Maintenance Manual v4", "Asset Risk Register", "Work Order Template"],
  },
  {
    id: "sop2", title: "Production Quality Inspection", owner: "Manufacturing", version: "v2.8",
    automation: 91, risk: "low", status: "active",
    workflow: ["Production Run Start", "Real-time Vision Inspection", "Defect Classification", "Rework/Pass Decision", "SPC Update", "Yield Report"],
    kpis: ["Yield", "Scrap Rate", "Defect Rate"],
    agents: ["Quality Inspector", "OEE Optimizer"],
    humans: ["Quality Manager", "Line Supervisor"],
    policies: ["QUA-002 Defect Threshold", "QUA-007 Rework Authorization"],
    systems: ["MES", "IoT", "ERP"],
    linkedDocs: ["Quality Control Plan", "Inspection Criteria v3", "Defect Catalog"],
  },
  {
    id: "sop3", title: "Supplier Risk Assessment", owner: "Procurement", version: "v1.6",
    automation: 62, risk: "high", status: "under-review",
    workflow: ["Supplier Event Trigger", "Risk Score Computation", "Exposure Analysis", "Escalation Decision", "Mitigation Plan", "Stakeholder Approval"],
    kpis: ["Supplier Score", "Cycle Time", "Cost Savings"],
    agents: ["Supplier Risk Agent", "Contract Bot"],
    humans: ["Procurement Manager", "CFO (>$500K)"],
    policies: ["PRO-001 Spend Approval", "PRO-009 Supplier Continuity"],
    systems: ["ERP", "PLM"],
    linkedDocs: ["Supplier Qualification Criteria", "Risk Matrix", "Escalation Playbook"],
  },
  {
    id: "sop4", title: "Monthly Financial Close", owner: "Finance", version: "v4.0",
    automation: 88, risk: "low", status: "active",
    workflow: ["Period End Signal", "Transaction Reconciliation", "Variance Analysis", "Cost Allocation", "Report Generation", "CFO Review"],
    kpis: ["Close Cycle", "Forecast Accuracy", "Cost per Unit"],
    agents: ["Finance Analyst", "Audit Agent"],
    humans: ["Finance Director", "CFO"],
    policies: ["FIN-001 Materiality Threshold", "FIN-004 Audit Compliance"],
    systems: ["ERP"],
    linkedDocs: ["Close Checklist v8", "Accounting Policy Manual", "Variance Thresholds"],
  },
  {
    id: "sop5", title: "Revenue Pipeline Review", owner: "Revenue", version: "v2.1",
    automation: 76, risk: "medium", status: "active",
    workflow: ["Pipeline Data Sync", "Opportunity Scoring", "Risk Flag Review", "Forecast Update", "Exec Briefing", "Action Assignment"],
    kpis: ["Pipeline Health", "Forecast Accuracy", "Deal Velocity"],
    agents: ["Revenue Scout", "Deal Closer AI"],
    humans: ["Revenue Manager", "VP Sales"],
    policies: ["REV-001 Discount Threshold", "REV-004 Deal Qualification"],
    systems: ["CRM", "ERP"],
    linkedDocs: ["Sales Playbook v6", "Deal Qualification Criteria", "Pricing Policy"],
  },
];

export const BU_INTELLIGENCE: Record<string, {
  recommendations: Array<{ title: string; impact: string; effort: string; confidence: number; sop?: string; workflow?: string }>;
  insights: Array<{ title: string; detail: string; type: string }>;
  forecast: Array<{ metric: string; current: string; predicted: string; dir: "up" | "down" }>;
  businessImpact: { roi: string; revenueProtected: string; costSaved: string; hoursSaved: number; downtimePrevented: string; automationPct: number; productivityImprovement: number; eeiContribution: string };
}> = {
  manufacturing: {
    businessImpact: { roi: "2.4x", revenueProtected: "$4.2M", costSaved: "$920K", hoursSaved: 2840, downtimePrevented: "84 hrs", automationPct: 87, productivityImprovement: 22, eeiContribution: "+4.8" },
    recommendations: [
      { title: "Increase OEE baseline via micro-stoppage elimination on Line 7", impact: "+$840K/mo", effort: "Low", confidence: 94, sop: "sop1", workflow: "wf1" },
      { title: "Shift Production Planner to Fully Autonomous — eval score 94.2%", impact: "+380 hrs/qtr", effort: "Medium", confidence: 88, sop: "sop2" },
      { title: "Pre-heat MX-0441 bearings per predictive cycle — reduce downtime risk", impact: "-$480K", effort: "Low", confidence: 97 },
    ],
    insights: [
      { title: "Line 7 bearing vibration 2.3σ above baseline — failure in 4–6 hrs", detail: "IoT sensor MX-0441 · SCADA alarm raised · Predictive Maintenance flagged at 94% confidence", type: "critical" },
      { title: "Throughput up 42 u/hr this shift — new scheduling algorithm effective", detail: "Production Planner v3.2 · MES integration synced · Shift delta +1.5%", type: "positive" },
      { title: "Scrap rate 1.2% vs 1.0% target — root cause: raw material batch QD-229", detail: "Quality Inspector flagged 3 batches · Scrap Analyzer cross-referenced ERP lot data", type: "warning" },
    ],
    forecast: [
      { metric: "OEE", current: "87.4%", predicted: "91.2%", dir: "up" },
      { metric: "Throughput", current: "2,840 u/hr", predicted: "3,020 u/hr", dir: "up" },
      { metric: "Scrap Rate", current: "1.2%", predicted: "0.9%", dir: "down" },
    ],
  },
  "supply-chain": {
    businessImpact: { roi: "1.6x", revenueProtected: "$2.8M", costSaved: "$480K", hoursSaved: 1240, downtimePrevented: "—", automationPct: 64, productivityImprovement: 14, eeiContribution: "+1.8" },
    recommendations: [
      { title: "Trigger emergency reorder for SKU-8841 — stockout risk in 11 days", impact: "-$1.2M revenue risk", effort: "Low", confidence: 81, sop: "sop3" },
      { title: "Shift Inventory Optimizer to Fully Autonomous for tier-2 SKUs", impact: "+220 hrs/qtr", effort: "Medium", confidence: 77 },
      { title: "Renegotiate lead time with Supplier #14 — 18-day buffer is excessive", impact: "-$340K/yr", effort: "High", confidence: 82 },
    ],
    insights: [
      { title: "WH-3 stockout risk for SKU-8841 in 11 days at current velocity", detail: "Inventory Optimizer 81% confidence · Demand spike +22% last 2 weeks", type: "critical" },
      { title: "Demand forecast accuracy 82% — below 90% target", detail: "Demand Planner v1.6 · High volatility in APAC orders · Model retraining due", type: "warning" },
      { title: "Fill rate 94.1% — above 92% baseline despite supply constraints", detail: "WMS Agent rerouted 18 orders · 3 expedited shipments", type: "positive" },
    ],
    forecast: [
      { metric: "Inventory Turns", current: "8.2x", predicted: "9.4x", dir: "up" },
      { metric: "Forecast Accuracy", current: "82%", predicted: "88%", dir: "up" },
      { metric: "Fill Rate", current: "94.1%", predicted: "95.8%", dir: "up" },
    ],
  },
  procurement: {
    businessImpact: { roi: "1.4x", revenueProtected: "$1.2M", costSaved: "$340K", hoursSaved: 680, downtimePrevented: "—", automationPct: 52, productivityImprovement: 11, eeiContribution: "+1.6" },
    recommendations: [
      { title: "Activate alternate supplier protocol for Supplier #084, #091, #112", impact: "Continuity protection", effort: "Medium", confidence: 88, sop: "sop3" },
      { title: "Automate PO approval below $10K — reduce 12.4-day cycle time", impact: "-4.2 days avg", effort: "Low", confidence: 91 },
      { title: "Pre-qualify 3 strategic backup suppliers for Tier-1 materials", impact: "Risk reduction", effort: "High", confidence: 84 },
    ],
    insights: [
      { title: "3 Tier-1 suppliers risk score >80 — continuity risk Q3", detail: "Supplier Risk Agent 88% confidence · Lead-time +18 days · Alternative sourcing recommended", type: "critical" },
      { title: "Approval cycle time 12.4 days vs 8-day target — procurement bottleneck", detail: "Contract Bot generated 187 POs this month · Human review queue backlog", type: "warning" },
      { title: "Sourcing Agent saved $2.1M YTD via renegotiation and consolidation", detail: "34 contracts renegotiated · 7 supplier consolidations · $184K avg saving", type: "positive" },
    ],
    forecast: [
      { metric: "Supplier Score", current: "74/100", predicted: "81/100", dir: "up" },
      { metric: "Cycle Time", current: "12.4 days", predicted: "9.1 days", dir: "down" },
      { metric: "Cost Savings", current: "$2.1M/yr", predicted: "$2.6M/yr", dir: "up" },
    ],
  },
  finance: {
    businessImpact: { roi: "2.2x", revenueProtected: "$2.2M", costSaved: "$284K", hoursSaved: 1120, downtimePrevented: "—", automationPct: 88, productivityImprovement: 18, eeiContribution: "+3.9" },
    recommendations: [
      { title: "Automate month-end variance reporting — reduce close cycle by 0.8 days", impact: "+$180K/qtr", effort: "Low", confidence: 92, sop: "sop4" },
      { title: "Enable real-time cost allocation vs end-of-month — better decision velocity", impact: "+1.2 days decision lead", effort: "Medium", confidence: 87 },
      { title: "Upgrade Audit Agent to v3.1 — compliance coverage expands 18%", impact: "Risk reduction", effort: "Medium", confidence: 89 },
    ],
    insights: [
      { title: "Close cycle 3.1 days — 0.1 days above 3.0-day target", detail: "Finance Analyst v3.0 · Reconciliation bottleneck on inter-company transactions", type: "warning" },
      { title: "Cost forecast accuracy 94.2% — highest in 4 quarters", detail: "Cost Controller cross-referenced MES actuals with budget model · ERP sync improved", type: "positive" },
      { title: "Audit Agent flagged 2 policy exceptions this month for CFO review", detail: "FIN-001 materiality threshold breached · Both resolved within SLA", type: "warning" },
    ],
    forecast: [
      { metric: "Close Cycle", current: "3.1 days", predicted: "2.6 days", dir: "down" },
      { metric: "Forecast Accuracy", current: "94.2%", predicted: "96.1%", dir: "up" },
      { metric: "Cost per Unit", current: "$18.40", predicted: "$17.20", dir: "down" },
    ],
  },
  revenue: {
    businessImpact: { roi: "2.7x", revenueProtected: "$14.2M", costSaved: "$620K", hoursSaved: 1840, downtimePrevented: "—", automationPct: 78, productivityImprovement: 24, eeiContribution: "+2.8" },
    recommendations: [
      { title: "Increase APAC outreach by 14% — pipeline conversion declining -11%", impact: "+$1.8M pipeline", effort: "Medium", confidence: 87, sop: "sop5" },
      { title: "Enable Deal Closer AI for tier-2 deals < $50K — reduce deal velocity by 4 days", impact: "+$2.4M/qtr", effort: "Low", confidence: 91 },
      { title: "Activate Revenue Scout for EMEA — same model, new region deployment", impact: "+$3.2M pipeline", effort: "Medium", confidence: 84 },
    ],
    insights: [
      { title: "APAC pipeline conversion rate -11% over 30 days — trend accelerating", detail: "Revenue Scout 87% confidence · 3 deals at decision stage · Competitor pressure identified", type: "critical" },
      { title: "Deal Closer AI closed 18% more deals this quarter vs benchmark", detail: "Deal velocity 22.4 days avg · Proposal acceptance rate 64%", type: "positive" },
      { title: "Q3 revenue forecast accuracy 88% — below 92% target", detail: "Forecast Agent flagged 4 large deals with >40% slip probability", type: "warning" },
    ],
    forecast: [
      { metric: "Pipeline Health", current: "78/100", predicted: "84/100", dir: "up" },
      { metric: "Forecast Accuracy", current: "88%", predicted: "92%", dir: "up" },
      { metric: "Deal Velocity", current: "22.4 days", predicted: "18.8 days", dir: "down" },
    ],
  },
};

