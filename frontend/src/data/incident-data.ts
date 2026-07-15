export type IncidentSeverity = "critical" | "warning" | "watch";
export type DomainType = "manufacturing" | "procurement" | "supply-chain" | "finance" | "revenue";

export interface IncidentDetail {
  id: string;
  incidentId: string;
  title: string;
  severity: IncidentSeverity;
  confidence: number;
  timestamp: string;
  age: string;
  department: string;
  buId: DomainType;
  affectedAgent: string;
  affectedDepartment: string;
  summary: string;
  rootCause: {
    primary: string;
    contributing: string[];
    classification: string;
  };
  timeline: Array<{
    time: string;
    event: string;
    actor: string;
    type: "detection" | "escalation" | "action" | "resolution" | "system";
  }>;
  resolution: {
    status: "open" | "in-progress" | "escalated";
    progress: number;
    eta: string;
    owner: string;
    steps: Array<{ label: string; done: boolean }>;
  };
  affectedKpis: Array<{
    name: string;
    current: string;
    target: string;
    delta: string;
    trend: "up" | "down";
    critical: boolean;
    history: number[];
  }>;
  businessImpact: {
    cost: string;
    downtime: string;
    production: string;
    sla: string;
    revenue: string;
  };
  aiRecommendation: {
    primary: string;
    rationale: string;
    confidence: number;
    alternatives: string[];
  };
  recommendedActions: Array<{
    id: string;
    action: string;
    priority: "critical" | "high" | "medium";
    owner: string;
    eta: string;
    status: "pending" | "in-progress" | "done";
  }>;
  assignedAgents: Array<{
    name: string;
    role: string;
    status: string;
    autonomy: string;
  }>;
  assignedHumans: Array<{
    name: string;
    role: string;
    status: "notified" | "reviewing" | "actioning";
  }>;
  activeWorkflow: {
    name: string;
    status: string;
    progress: number;
    steps: Array<{ label: string; status: "done" | "active" | "pending" }>;
  };
  relatedSops: Array<{
    title: string;
    version: string;
    relevance: number;
  }>;
  policies: Array<{
    title: string;
    relevance: number;
  }>;
  evidence: {
    logs: Array<{ timestamp: string; source: string; message: string; level: "error" | "warn" | "info" }>;
    sensors: Array<{ id: string; name: string; value: string; threshold: string; status: "critical" | "warning" | "normal" }>;
    documents: Array<{ title: string; type: string; date: string }>;
    traces: Array<{ id: string; event: string; duration: string; status: "ok" | "warn" | "error" }>;
  };
  historicalIncidents: Array<{
    id: string;
    title: string;
    date: string;
    resolution: string;
    similarity: number;
  }>;
  riskPrediction: {
    probability: number;
    impact: string;
    timeToImpact: string;
    factors: Array<{ factor: string; weight: number }>;
  };
  escalationPath: Array<{
    level: number;
    role: string;
    name: string;
    trigger: string;
    status: "active" | "pending" | "done";
  }>;
  comments: Array<{
    id: string;
    author: string;
    role: string;
    time: string;
    text: string;
    isAI: boolean;
  }>;
  auditHistory: Array<{
    time: string;
    actor: string;
    action: string;
    details: string;
  }>;
  domainMetrics: ManufacturingMetrics | ProcurementMetrics | SupplyChainMetrics | FinanceMetrics | RevenueMetrics;
}

export interface ManufacturingMetrics {
  type: "manufacturing";
  oee: { current: number; target: number; history: number[] };
  uptime: { current: number; target: number; history: number[] };
  throughput: { current: number; target: number; unit: string; history: number[] };
  quality: { yieldRate: number; scrapRate: number; defectRate: number; history: number[] };
  telemetry: Array<{ sensor: string; id: string; value: number; unit: string; threshold: number; sigma: number; status: "critical" | "warning" | "normal" }>;
  predictiveMaintenance: { nextFailureHours: number; confidence: number; lastMaintenance: string; mtbf: string; recommendation: string };
  productionImpact: { unitsAtRisk: number; revenueAtRisk: string; linesAffected: number; shiftsImpacted: number };
  shiftTrend: Array<{ shift: string; oee: number; throughput: number; quality: number }>;
}

export interface ProcurementMetrics {
  type: "procurement";
  supplierHealth: Array<{ name: string; score: number; tier: number; country: string; risk: "critical" | "high" | "medium" | "low"; spend: string; alternatives: number }>;
  leadTimes: Array<{ category: string; current: number; target: number; delta: number; unit: string }>;
  purchaseOrders: Array<{ poId: string; supplier: string; value: string; status: string; daysOpen: number; risk: "high" | "medium" | "low" }>;
  inventory: { daysOfSupply: number; reorderPoint: number; criticalSkus: number; coverageGap: string };
  spend: { mtd: string; budget: string; variance: string; atRisk: string };
  sourcingRisk: { exposure: number; alternateReadiness: number; concentrationRisk: number };
  spendTrend: Array<{ month: string; spend: number; budget: number }>;
}

export interface SupplyChainMetrics {
  type: "supply-chain";
  warehouse: { utilization: number; accuracy: number; pickRate: number; location: string };
  logistics: Array<{ route: string; carrier: string; onTime: number; status: "on-track" | "delayed" | "at-risk" }>;
  otif: { current: number; target: number; trend: number[]; daysLate: number };
  inventory: Array<{ sku: string; location: string; daysOfSupply: number; reorderPoint: number; status: "critical" | "warning" | "ok" }>;
  transport: { avgTransitDays: number; carrierScore: number; lateShipments: number; freightCost: string };
  fulfillment: { orderBacklog: number; fillRate: number; pendingOrders: number; expediteRate: number };
  inventoryTrend: Array<{ day: string; turns: number; fill: number }>;
}

export interface FinanceMetrics {
  type: "finance";
  budget: { total: string; spent: string; remaining: string; burnRate: string; variance: string };
  invoices: Array<{ id: string; vendor: string; amount: string; daysOpen: number; status: "approved" | "pending" | "overdue" }>;
  approvals: { pending: number; avgCycleTime: number; overdue: number; bottleneck: string };
  cashFlow: { inflow: string; outflow: string; net: string; forecastAccuracy: number; trend: number[] };
  spendVariance: Array<{ category: string; budget: number; actual: number; variance: number }>;
  compliance: { score: number; openItems: number; auditReadiness: string; lastAudit: string };
  forecastTrend: Array<{ month: string; forecast: number; actual: number }>;
}

export interface RevenueMetrics {
  type: "revenue";
  pipeline: { total: string; qualified: string; atRisk: string; conversionRate: number; stages: Array<{ stage: string; count: number; value: string }> };
  orders: { newMtd: number; totalValue: string; avgOrderValue: string; churnRisk: number };
  forecast: { q3Target: string; currentProjection: string; gap: string; confidence: number; trend: number[] };
  customers: Array<{ segment: string; count: number; revenue: string; churnRisk: number; nps: number }>;
  revenueImpact: { atRisk: string; protected: string; roi: string; dealVelocityDelta: string };
  pipelineTrend: Array<{ week: string; pipeline: number; converted: number }>;
}

export const INCIDENT_DATA: Record<string, IncidentDetail> = {
  a1: {
    id: "a1",
    incidentId: "INC-2026-0441",
    title: "OEE deviation on Line 7 — bearings at failure threshold",
    severity: "critical",
    confidence: 94,
    timestamp: "Jun 26, 2026 — 08:14 UTC",
    age: "6 min ago",
    department: "Manufacturing",
    buId: "manufacturing",
    affectedAgent: "OEE Optimizer",
    affectedDepartment: "Manufacturing · Line 7 · MX-0441",
    summary: "IoT sensor MX-0441 on Production Line 7 has registered vibration readings 2.3σ above established baseline over 48 consecutive samples. Predictive Maintenance AI has classified this as an imminent bearing failure with 94% confidence. Without intervention, a 6-hour unplanned downtime event is projected within 4–6 hours, generating $480K in production losses across 3 downstream lines.",
    rootCause: {
      primary: "MX-0441 bearing showing progressive fatigue fracture pattern detected via acoustic emission analysis — vibration RMS exceeding threshold at 14.2 mm/s (threshold: 7.1 mm/s).",
      contributing: [
        "Lubrication interval overrun by 12% — last serviced 38 days ago (recommended: 34-day cycle)",
        "Thermal cycling stress from 3 unplanned restarts in last 7 days",
        "Load capacity operating at 96% — above recommended 85% sustained limit",
        "Replacement part not pre-staged — CMMS shows no standing order for MX-0441 bearing set",
      ],
      classification: "Predictive Maintenance · Mechanical Failure · Bearing Fatigue",
    },
    timeline: [
      { time: "07:48 UTC", event: "IoT sensor MX-0441 registers vibration spike — 9.2 mm/s (threshold: 7.1 mm/s)", actor: "SCADA System", type: "detection" },
      { time: "07:51 UTC", event: "OEE Optimizer flags anomaly — 1.8σ deviation, watch classification triggered", actor: "OEE Optimizer AI", type: "detection" },
      { time: "07:58 UTC", event: "Predictive Maintenance AI activates acoustic scan on MX-0441", actor: "Predictive Maintenance AI", type: "action" },
      { time: "08:04 UTC", event: "Bearing fatigue pattern confirmed — failure prediction at 94% confidence within 4–6 hrs", actor: "Predictive Maintenance AI", type: "detection" },
      { time: "08:10 UTC", event: "Severity escalated to CRITICAL — Maintenance Supervisor notified via push alert", actor: "Governance Engine", type: "escalation" },
      { time: "08:14 UTC", event: "Incident INC-2026-0441 opened — Deep Dive analysis initiated", actor: "Onyx Platform", type: "system" },
      { time: "08:18 UTC", event: "Work order WO-2026-4812 created in CMMS — parts sourcing check initiated", actor: "Predictive Maintenance AI", type: "action" },
      { time: "08:22 UTC", event: "Maintenance Supervisor reviewing incident — bearing stock check pending", actor: "J. Morrison (Maintenance Supervisor)", type: "action" },
    ],
    resolution: {
      status: "in-progress",
      progress: 28,
      eta: "3.5 hrs",
      owner: "J. Morrison — Maintenance Supervisor",
      steps: [
        { label: "Incident detection & classification", done: true },
        { label: "Work order created in CMMS", done: true },
        { label: "Bearing stock confirmed in warehouse", done: false },
        { label: "Scheduled maintenance window (next shift break)", done: false },
        { label: "Bearing replacement executed", done: false },
        { label: "Post-maintenance validation & SCADA reset", done: false },
      ],
    },
    affectedKpis: [
      { name: "OEE", current: "82.1%", target: "90%", delta: "-7.9%", trend: "down", critical: true, history: [88, 87, 86, 85, 85, 84, 83, 82.1] },
      { name: "Throughput", current: "2,614 u/hr", target: "3,000 u/hr", delta: "-386 u/hr", trend: "down", critical: true, history: [2840, 2810, 2780, 2740, 2700, 2670, 2640, 2614] },
      { name: "Uptime", current: "91.4%", target: "96%", delta: "-4.6%", trend: "down", critical: false, history: [95, 94.5, 94, 93, 92.8, 92.1, 91.8, 91.4] },
      { name: "Scrap Rate", current: "1.8%", target: "< 1%", delta: "+0.8%", trend: "up", critical: true, history: [1.1, 1.2, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8] },
      { name: "MTBF (Line 7)", current: "184 hrs", target: "240 hrs", delta: "-56 hrs", trend: "down", critical: false, history: [240, 230, 222, 215, 205, 197, 190, 184] },
    ],
    businessImpact: {
      cost: "$480K unplanned downtime exposure",
      downtime: "6 hrs projected (3 lines affected)",
      production: "~2,316 units at risk (3-line cascade)",
      sla: "+12% delivery SLA breach risk",
      revenue: "$480K — $720K revenue at risk",
    },
    aiRecommendation: {
      primary: "Immediate controlled shutdown of Line 7 during next scheduled break (T+42 min). Pre-stage bearing replacement kit from WH-A Bay 3. Execute replacement during 30-min window to prevent unplanned failure cascade to Lines 8 and 9.",
      rationale: "Acoustic emission pattern indicates <4 hr margin before catastrophic failure. Controlled shutdown at T+42 min minimizes production loss to ~340 units vs 2,316+ units if failure is uncontrolled. Q3 2025 bearing failure case (INC-2025-0288) used identical intervention — downtime reduced by 74%.",
      confidence: 94,
      alternatives: [
        "Reduce Line 7 speed to 60% load — extends failure window by ~2.5 hrs but continues partial production",
        "Emergency shutdown now — eliminates all risk but costs additional 2 hrs of production",
        "Continue monitoring with 10-min sensor refresh — not recommended given 94% failure confidence",
      ],
    },
    recommendedActions: [
      { id: "ra1", action: "Trigger predictive maintenance work order WO-2026-4812 in CMMS — assign Line 7 bearing replacement", priority: "critical", owner: "J. Morrison", eta: "15 min", status: "in-progress" },
      { id: "ra2", action: "Confirm bearing stock in WH-A Bay 3 — request expedite if insufficient", priority: "critical", owner: "Parts Manager", eta: "20 min", status: "pending" },
      { id: "ra3", action: "Schedule controlled Line 7 shutdown at next break window (T+42 min)", priority: "critical", owner: "Production Supervisor", eta: "42 min", status: "pending" },
      { id: "ra4", action: "Notify downstream lines 8 & 9 — prepare buffer stock adjustment", priority: "high", owner: "Production Planner AI", eta: "10 min", status: "pending" },
      { id: "ra5", action: "Update lubrication schedule for MX-0441 — reduce interval to 28 days", priority: "medium", owner: "Maintenance Planner", eta: "End of shift", status: "pending" },
    ],
    assignedAgents: [
      { name: "Predictive Maintenance AI", role: "Failure Prediction & Diagnosis", status: "active", autonomy: "full" },
      { name: "OEE Optimizer", role: "Real-time Monitoring & Impact Calc", status: "active", autonomy: "supervised" },
      { name: "Production Planner", role: "Schedule Adjustment & Buffer Mgmt", status: "active", autonomy: "full" },
    ],
    assignedHumans: [
      { name: "J. Morrison", role: "Maintenance Supervisor", status: "reviewing" },
      { name: "T. Chen", role: "Production Supervisor — Line 7", status: "notified" },
      { name: "R. Patel", role: "Parts Manager", status: "notified" },
    ],
    activeWorkflow: {
      name: "Predictive Maintenance — Line 7 Bearing Failure Response",
      status: "running",
      progress: 28,
      steps: [
        { label: "Anomaly Detection & Classification", status: "done" },
        { label: "AI Failure Diagnosis (Acoustic + Vibration)", status: "done" },
        { label: "Work Order Generation (CMMS)", status: "active" },
        { label: "Parts Sourcing & Staging", status: "pending" },
        { label: "Scheduled Maintenance Execution", status: "pending" },
        { label: "Post-Maintenance SCADA Validation", status: "pending" },
      ],
    },
    relatedSops: [
      { title: "Predictive Maintenance Execution", version: "v3.2", relevance: 97 },
      { title: "Emergency Work Order Protocol (MNT-001)", version: "v2.1", relevance: 91 },
      { title: "Line Shutdown & Restart Procedure", version: "v4.0", relevance: 84 },
    ],
    policies: [
      { title: "MNT-001 Emergency Work Order Authorization", relevance: 98 },
      { title: "MNT-004 Asset Criticality & Response SLA", relevance: 92 },
      { title: "PRD-007 Production Line Shutdown Authorization", relevance: 86 },
    ],
    evidence: {
      logs: [
        { timestamp: "08:14:02", source: "SCADA/MX-0441", message: "Vibration RMS: 14.2 mm/s | Threshold: 7.1 mm/s | ALARM CRITICAL", level: "error" },
        { timestamp: "08:13:58", source: "SCADA/MX-0441", message: "Temperature: 84.2°C | Baseline: 71.0°C | ALARM WARNING", level: "warn" },
        { timestamp: "08:13:45", source: "IoT/AcousticSensor-7A", message: "Bearing emission freq 14.8 kHz detected — fatigue pattern class 3", level: "error" },
        { timestamp: "08:12:11", source: "OEE-Optimizer/Line7", message: "OEE drop detected: 87.4% → 82.1% over 180 min window", level: "warn" },
        { timestamp: "08:04:33", source: "PredMaint-AI/Diagnosis", message: "Failure classification: BEARING_FATIGUE_STAGE3 | Confidence: 0.94 | ETA: 4-6 hrs", level: "error" },
        { timestamp: "07:51:22", source: "OEE-Optimizer/Anomaly", message: "Anomaly flagged: vibration deviation 1.8σ above 48-sample baseline", level: "warn" },
      ],
      sensors: [
        { id: "MX-0441-VIB", name: "Vibration RMS (Line 7 Main Bearing)", value: "14.2 mm/s", threshold: "7.1 mm/s", status: "critical" },
        { id: "MX-0441-TMP", name: "Bearing Temperature", value: "84.2°C", threshold: "75°C", status: "critical" },
        { id: "MX-0441-ACO", name: "Acoustic Emission Frequency", value: "14.8 kHz", threshold: "10 kHz", status: "critical" },
        { id: "LN7-OEE-001", name: "Line 7 OEE Realtime", value: "82.1%", threshold: "87%", status: "warning" },
        { id: "LN7-SPD-001", name: "Line 7 Speed Ratio", value: "96.4%", threshold: "85%", status: "warning" },
        { id: "MX-0441-LUB", name: "Lubrication Pressure", value: "0.84 bar", threshold: "1.2 bar", status: "critical" },
      ],
      documents: [
        { title: "MX-0441 Asset History & Maintenance Log", type: "CMMS Record", date: "Jun 26, 2026" },
        { title: "Line 7 Production Schedule — Week 26", type: "MES Schedule", date: "Jun 24, 2026" },
        { title: "Bearing Replacement SOP v3.2", type: "Maintenance SOP", date: "Mar 12, 2026" },
        { title: "Q3 2025 Bearing Failure Post-Mortem (INC-2025-0288)", type: "Historical Case", date: "Sep 18, 2025" },
      ],
      traces: [
        { id: "TRC-0441-001", event: "Vibration threshold breach → OEE Optimizer alert", duration: "180ms", status: "ok" },
        { id: "TRC-0441-002", event: "OEE Optimizer → Predictive Maintenance handoff", duration: "420ms", status: "ok" },
        { id: "TRC-0441-003", event: "Acoustic scan initiation → failure classification", duration: "8.2s", status: "ok" },
        { id: "TRC-0441-004", event: "Governance Engine severity escalation → notification dispatch", duration: "240ms", status: "ok" },
        { id: "TRC-0441-005", event: "CMMS work order creation API call", duration: "1.1s", status: "warn" },
      ],
    },
    historicalIncidents: [
      { id: "INC-2025-0288", title: "Line 7 Bearing Fatigue — MX-0389 Stage 2", date: "Sep 14, 2025", resolution: "Controlled replacement at shift break — 1.8 hr downtime prevented 8-hr failure", similarity: 94 },
      { id: "INC-2025-0104", title: "Line 4 Main Shaft Bearing — Unplanned Failure", date: "Apr 02, 2025", resolution: "Emergency repair — 6.2 hrs downtime, $310K production loss", similarity: 78 },
      { id: "INC-2024-0891", title: "Line 9 Motor Bearing — Predictive Intercept", date: "Nov 28, 2024", resolution: "Pre-emptive replacement during scheduled PM — zero downtime", similarity: 71 },
    ],
    riskPrediction: {
      probability: 94,
      impact: "6–8 hr unplanned downtime · $480K–$720K production loss · 3-line cascade risk",
      timeToImpact: "4–6 hours",
      factors: [
        { factor: "Bearing vibration 2.0x threshold", weight: 38 },
        { factor: "Lubrication overrun 12%", weight: 24 },
        { factor: "Thermal stress events (3 in 7 days)", weight: 21 },
        { factor: "Load ratio 96% (above 85% limit)", weight: 17 },
      ],
    },
    escalationPath: [
      { level: 1, role: "Maintenance Supervisor", name: "J. Morrison", trigger: "Vibration breach > 2.0x threshold", status: "active" },
      { level: 2, role: "Plant Manager", name: "D. Kowalski", trigger: "If bearing stock unavailable or window missed", status: "pending" },
      { level: 3, role: "VP Operations", name: "S. Nakamura", trigger: "If unplanned shutdown exceeds 3 hrs", status: "pending" },
    ],
    comments: [
      { id: "c1", author: "Predictive Maintenance AI", role: "AI Agent", time: "08:14 UTC", text: "Bearing failure confidence is 94% based on acoustic emission + vibration cross-correlation. Recommend controlled shutdown before T+3 hrs. Parts check in WH-A Bay 3 shows 2 bearing sets — sufficient for Line 7 and 1 spare.", isAI: true },
      { id: "c2", author: "J. Morrison", role: "Maintenance Supervisor", time: "08:22 UTC", text: "Reviewing now. Will confirm parts stock in 10 min. We have a 30-min break window at 09:00 — can we execute within that window?", isAI: false },
      { id: "c3", author: "OEE Optimizer", role: "AI Agent", time: "08:23 UTC", text: "30-min break window at 09:00 is sufficient for bearing replacement per SOP v3.2 (estimated 22 min). SCADA reset adds ~5 min. Recommending approval of this window.", isAI: true },
    ],
    auditHistory: [
      { time: "08:14 UTC", actor: "Onyx Platform", action: "Incident Created", details: "INC-2026-0441 opened · Severity: CRITICAL · Auto-classified" },
      { time: "08:14 UTC", actor: "Governance Engine", action: "Notifications Dispatched", details: "Maintenance Supervisor, Production Supervisor, Parts Manager — push + email" },
      { time: "08:18 UTC", actor: "Predictive Maintenance AI", action: "Work Order Created", details: "WO-2026-4812 in CMMS · Assigned: J. Morrison · Priority: Critical" },
      { time: "08:22 UTC", actor: "J. Morrison", action: "Incident Acknowledged", details: "Status: Reviewing · ETA response: 10 min" },
    ],
    domainMetrics: {
      type: "manufacturing",
      oee: { current: 82.1, target: 90, history: [88, 87.2, 86.8, 85.9, 85.1, 84.0, 83.2, 82.1] },
      uptime: { current: 91.4, target: 96, history: [95, 94.8, 94.2, 93.6, 93.0, 92.4, 91.8, 91.4] },
      throughput: { current: 2614, target: 3000, unit: "u/hr", history: [2840, 2810, 2770, 2740, 2710, 2680, 2650, 2614] },
      quality: { yieldRate: 97.2, scrapRate: 1.8, defectRate: 0.9, history: [98.8, 98.5, 98.2, 97.9, 97.6, 97.4, 97.3, 97.2] },
      telemetry: [
        { sensor: "Vibration RMS", id: "MX-0441", value: 14.2, unit: "mm/s", threshold: 7.1, sigma: 2.3, status: "critical" },
        { sensor: "Bearing Temp", id: "MX-0441", value: 84.2, unit: "°C", threshold: 75, sigma: 1.8, status: "critical" },
        { sensor: "Lubrication Pressure", id: "MX-0441", value: 0.84, unit: "bar", threshold: 1.2, sigma: 1.4, status: "critical" },
        { sensor: "Acoustic Emission", id: "7A-ACO", value: 14.8, unit: "kHz", threshold: 10, sigma: 1.9, status: "critical" },
        { sensor: "Motor Current Draw", id: "LN7-MTR", value: 48.2, unit: "A", threshold: 52, sigma: 0.6, status: "normal" },
        { sensor: "Line Speed Ratio", id: "LN7-SPD", value: 96.4, unit: "%", threshold: 85, sigma: 1.1, status: "warning" },
      ],
      predictiveMaintenance: { nextFailureHours: 4.5, confidence: 94, lastMaintenance: "May 19, 2026", mtbf: "184 hrs (target: 240 hrs)", recommendation: "Controlled bearing replacement at T+42 min break window" },
      productionImpact: { unitsAtRisk: 2316, revenueAtRisk: "$480K–$720K", linesAffected: 3, shiftsImpacted: 1 },
      shiftTrend: [
        { shift: "Night (Jun 25)", oee: 88.2, throughput: 2840, quality: 98.8 },
        { shift: "Day (Jun 26)", oee: 84.6, throughput: 2720, quality: 97.9 },
        { shift: "Current", oee: 82.1, throughput: 2614, quality: 97.2 },
      ],
    } as ManufacturingMetrics,
  },

  a2: {
    id: "a2",
    incidentId: "INC-2026-0218",
    title: "Supplier risk score critical — 3 tier-1 vendors flagged",
    severity: "warning",
    confidence: 88,
    timestamp: "Jun 26, 2026 — 07:58 UTC",
    age: "22 min ago",
    department: "Procurement",
    buId: "procurement",
    affectedAgent: "Supplier Risk Agent",
    affectedDepartment: "Procurement · Supplier Intelligence",
    summary: "Supplier Risk Agent has detected simultaneous risk score deterioration across 3 tier-1 vendors (AlphaSteel, PrecisionParts GmbH, and FastenerCo Asia). Combined exposure represents $4.2M in Q3 purchase commitments. If no mitigation is initiated, lead-time extension of 18+ days is expected, creating direct supply chain disruption downstream.",
    rootCause: {
      primary: "Geopolitical freight disruption (Southeast Asia shipping lanes) compounded by AlphaSteel financial strain (credit downgrade: BB → CCC) — identified via external risk intelligence feeds.",
      contributing: [
        "AlphaSteel credit rating downgraded — CFO of record changed, delayed shipments on 3 open POs",
        "PrecisionParts GmbH capacity constrained — announced 3-week factory retooling, no advance notice",
        "FastenerCo Asia — logistics partner (SeaRoute Express) suspended operations on APAC routes",
        "Procurement concentrated in 3 vendors for 61% of critical component spend — high concentration risk",
      ],
      classification: "Supplier Risk · Supply Continuity · External Disruption",
    },
    timeline: [
      { time: "06:40 UTC", event: "External risk feed: AlphaSteel credit downgrade published (Moody's)", actor: "Supplier Risk Agent", type: "detection" },
      { time: "07:12 UTC", event: "PrecisionParts GmbH retooling announcement detected via supply intelligence", actor: "Supplier Risk Agent", type: "detection" },
      { time: "07:31 UTC", event: "FastenerCo Asia — SeaRoute Express suspension confirmed via logistics API", actor: "Supplier Risk Agent", type: "detection" },
      { time: "07:44 UTC", event: "Cross-supplier risk correlation run — 3 tier-1 vendors simultaneously at CRITICAL", actor: "Supplier Risk Agent", type: "detection" },
      { time: "07:52 UTC", event: "Procurement Manager alerted — $4.2M exposure flagged", actor: "Governance Engine", type: "escalation" },
      { time: "07:58 UTC", event: "Incident INC-2026-0218 opened — alternate supplier protocol activated", actor: "Onyx Platform", type: "system" },
      { time: "08:08 UTC", event: "Alternate supplier shortlist generated — 4 qualified alternatives identified", actor: "Sourcing Agent AI", type: "action" },
    ],
    resolution: {
      status: "in-progress",
      progress: 35,
      eta: "48 hrs",
      owner: "M. Torres — Procurement Manager",
      steps: [
        { label: "Multi-vendor risk detection & alert", done: true },
        { label: "Alternate supplier shortlist generated", done: true },
        { label: "Outreach to alternate suppliers initiated", done: false },
        { label: "Emergency PO re-routing approval", done: false },
        { label: "Supplier continuity plan filed", done: false },
        { label: "Risk scores stabilized & monitoring", done: false },
      ],
    },
    affectedKpis: [
      { name: "Supplier Risk Score", current: "54/100", target: "85/100", delta: "-31 pts", trend: "down", critical: true, history: [80, 78, 74, 70, 65, 62, 58, 54] },
      { name: "PO Cycle Time", current: "16.8 days", target: "< 8 days", delta: "+8.8 days", trend: "up", critical: true, history: [12.4, 13.1, 13.8, 14.2, 14.9, 15.4, 16.1, 16.8] },
      { name: "Spend at Risk", current: "$4.2M", target: "$0", delta: "+$4.2M", trend: "up", critical: true, history: [0, 0.4, 0.8, 1.4, 2.1, 2.9, 3.6, 4.2] },
      { name: "Supplier Concentration", current: "61%", target: "< 40%", delta: "+21%", trend: "up", critical: false, history: [52, 54, 55, 57, 58, 59, 60, 61] },
      { name: "Lead Time Extension", current: "+18 days", target: "0", delta: "+18 days", trend: "up", critical: true, history: [0, 2, 4, 7, 10, 13, 16, 18] },
    ],
    businessImpact: {
      cost: "$4.2M Q3 purchase commitments at risk",
      downtime: "18-day lead-time extension projected",
      production: "Critical component shortage — 3 downstream lines at risk",
      sla: "+38% delivery SLA breach probability",
      revenue: "$2.8M revenue at risk (production dependency)",
    },
    aiRecommendation: {
      primary: "Activate emergency alternate sourcing protocol for AlphaSteel and FastenerCo Asia components. Initiate PO re-routing to pre-qualified alternates (EuroSteel AG and FasternerDirect EMEA). Negotiate 45-day bridge inventory purchase from spot market for PrecisionParts GmbH gap.",
      rationale: "87% of the at-risk components have qualified alternate suppliers at ≤8% cost premium. Bridge inventory strategy used in Q2 2025 supplier disruption (INC-2025-0088) avoided 100% of projected production loss at 6% cost impact.",
      confidence: 88,
      alternatives: [
        "Expedite partial shipments from AlphaSteel — costly but maintains relationship",
        "Single-source from EuroSteel AG for 90 days — concentration risk shifts, not eliminated",
        "Delay production schedule by 2 weeks — avoids sourcing cost but risks Q3 commitments",
      ],
    },
    recommendedActions: [
      { id: "ra1", action: "Issue emergency RFQ to EuroSteel AG and FastenerDirect EMEA for AlphaSteel volume", priority: "critical", owner: "Sourcing Agent AI", eta: "4 hrs", status: "in-progress" },
      { id: "ra2", action: "Negotiate spot purchase for PrecisionParts GmbH 45-day bridge inventory", priority: "critical", owner: "M. Torres", eta: "8 hrs", status: "pending" },
      { id: "ra3", action: "Route FastenerCo orders to alternate logistics carrier (DHL Express APAC)", priority: "high", owner: "Procurement Ops", eta: "24 hrs", status: "pending" },
      { id: "ra4", action: "Escalate to CFO — AlphaSteel exposure ($1.8M) requires exec approval for PO redirect", priority: "high", owner: "M. Torres → CFO", eta: "2 hrs", status: "pending" },
      { id: "ra5", action: "Update supplier concentration policy — reduce max tier-1 dependency to 35%", priority: "medium", owner: "Procurement Director", eta: "30 days", status: "pending" },
    ],
    assignedAgents: [
      { name: "Supplier Risk Agent", role: "Risk Detection & Scoring", status: "active", autonomy: "assisted" },
      { name: "Sourcing Agent AI", role: "Alternate Supplier Identification", status: "active", autonomy: "supervised" },
      { name: "Contract Bot", role: "Emergency RFQ & PO Drafting", status: "active", autonomy: "supervised" },
    ],
    assignedHumans: [
      { name: "M. Torres", role: "Procurement Manager", status: "actioning" },
      { name: "L. Brennan", role: "CFO (>$500K approval required)", status: "notified" },
      { name: "P. Okafor", role: "Supply Chain Coordinator", status: "reviewing" },
    ],
    activeWorkflow: {
      name: "Supplier Risk Mitigation — Multi-Vendor Disruption Response",
      status: "running",
      progress: 35,
      steps: [
        { label: "Multi-vendor risk detection & correlation", status: "done" },
        { label: "Alternate supplier qualification check", status: "done" },
        { label: "Emergency RFQ dispatch to alternates", status: "active" },
        { label: "CFO approval for >$500K PO redirect", status: "pending" },
        { label: "PO re-routing & confirmation", status: "pending" },
        { label: "Supplier continuity plan filed", status: "pending" },
      ],
    },
    relatedSops: [
      { title: "Supplier Risk Assessment", version: "v1.6", relevance: 98 },
      { title: "Emergency Alternate Sourcing Protocol (PRO-009)", version: "v2.4", relevance: 94 },
      { title: "Spend Approval & Escalation Framework", version: "v3.1", relevance: 88 },
    ],
    policies: [
      { title: "PRO-001 Spend Approval Threshold (>$500K → CFO)", relevance: 96 },
      { title: "PRO-009 Supplier Continuity & Single-Source Cap", relevance: 94 },
      { title: "PRO-014 Emergency Sourcing Authorization", relevance: 89 },
    ],
    evidence: {
      logs: [
        { timestamp: "07:44:18", source: "SupplierRisk-AI/Correlation", message: "3 tier-1 vendors breach CRITICAL threshold simultaneously — risk score composite: 54/100", level: "error" },
        { timestamp: "07:31:04", source: "Logistics-API/FastenerCo", message: "SeaRoute Express APAC suspension confirmed — ETA resumption: unknown", level: "error" },
        { timestamp: "07:12:41", source: "SupplyIntel-Feed/PrecisionParts", message: "Factory retooling announced — 3-week capacity reduction: 100%", level: "warn" },
        { timestamp: "06:40:22", source: "ExternalRisk/Moodys", message: "AlphaSteel credit downgrade: BB → CCC | CFO change of record flagged", level: "error" },
        { timestamp: "07:52:31", source: "Governance/NotificationEngine", message: "Procurement Manager M. Torres alerted — P0 severity | $4.2M exposure", level: "warn" },
      ],
      sensors: [
        { id: "ALPHA-RISK", name: "AlphaSteel Risk Score", value: "28/100", threshold: "60/100", status: "critical" },
        { id: "PREC-RISK", name: "PrecisionParts GmbH Risk Score", value: "41/100", threshold: "60/100", status: "critical" },
        { id: "FAST-RISK", name: "FastenerCo Asia Risk Score", value: "33/100", threshold: "60/100", status: "critical" },
        { id: "SPEND-CONC", name: "Tier-1 Spend Concentration", value: "61%", threshold: "40%", status: "critical" },
        { id: "PO-BACKLOG", name: "Open PO Backlog ($M)", value: "$4.2M", threshold: "$2.0M", status: "critical" },
      ],
      documents: [
        { title: "AlphaSteel Open PO Summary — Jun 2026", type: "ERP Export", date: "Jun 26, 2026" },
        { title: "Alternate Supplier Qualification Matrix v4", type: "Procurement Document", date: "May 30, 2026" },
        { title: "PRO-009 Supplier Continuity Policy", type: "Policy Document", date: "Jan 14, 2026" },
        { title: "Q2 2025 Supplier Disruption Post-Mortem (INC-2025-0088)", type: "Historical Case", date: "Jul 22, 2025" },
      ],
      traces: [
        { id: "TRC-0218-001", event: "External risk feed ingestion → AlphaSteel downgrade parse", duration: "340ms", status: "ok" },
        { id: "TRC-0218-002", event: "Cross-vendor correlation → risk composite calculation", duration: "1.8s", status: "ok" },
        { id: "TRC-0218-003", event: "Alternate supplier DB query → qualification filter", duration: "2.4s", status: "ok" },
        { id: "TRC-0218-004", event: "Governance escalation → notification dispatch", duration: "280ms", status: "ok" },
      ],
    },
    historicalIncidents: [
      { id: "INC-2025-0088", title: "Q2 Dual-Supplier Logistics Disruption", date: "May 18, 2025", resolution: "Bridge inventory + PO re-route — 0 production loss, 6% cost premium", similarity: 87 },
      { id: "INC-2024-0412", title: "AlphaSteel Credit Watch — Q4 2024", date: "Oct 31, 2024", resolution: "Partial PO diversification — 12-day delay on 2 orders", similarity: 73 },
      { id: "INC-2024-0201", title: "Single-Source Bottleneck — Precision Components", date: "Jun 06, 2024", resolution: "Emergency spot purchase — $180K premium, 0 production loss", similarity: 68 },
    ],
    riskPrediction: {
      probability: 88,
      impact: "18-day lead-time extension · $4.2M PO exposure · 3-line downstream disruption",
      timeToImpact: "5–12 days",
      factors: [
        { factor: "AlphaSteel credit downgrade to CCC", weight: 34 },
        { factor: "Concurrent multi-vendor disruption", weight: 28 },
        { factor: "61% concentration in at-risk vendors", weight: 22 },
        { factor: "No pre-staged alternate agreements", weight: 16 },
      ],
    },
    escalationPath: [
      { level: 1, role: "Procurement Manager", name: "M. Torres", trigger: "Any tier-1 vendor breach CRITICAL threshold", status: "active" },
      { level: 2, role: "CFO", name: "L. Brennan", trigger: "Spend redirect >$500K or 3+ vendors impacted", status: "active" },
      { level: 3, role: "CXO", name: "E. Hartwell", trigger: "Production stoppage risk exceeding $2M", status: "pending" },
    ],
    comments: [
      { id: "c1", author: "Supplier Risk Agent", role: "AI Agent", time: "07:58 UTC", text: "4 qualified alternate suppliers identified. EuroSteel AG (Tier 2, Germany) and FastenerDirect EMEA can cover 87% of at-risk volume at ≤8% premium. Recommend emergency RFQ in next 2 hours.", isAI: true },
      { id: "c2", author: "M. Torres", role: "Procurement Manager", time: "08:12 UTC", text: "Initiating outreach to EuroSteel AG now. Need CFO briefing doc for AlphaSteel re-route approval — can you draft?", isAI: false },
      { id: "c3", author: "Contract Bot", role: "AI Agent", time: "08:14 UTC", text: "CFO briefing memo drafted and attached. Includes: AlphaSteel exposure detail, proposed redirect, cost impact (+6.2%), and recommended approval path. Ready for your review.", isAI: true },
    ],
    auditHistory: [
      { time: "07:58 UTC", actor: "Onyx Platform", action: "Incident Created", details: "INC-2026-0218 opened · Severity: WARNING · Confidence: 88%" },
      { time: "07:58 UTC", actor: "Governance Engine", action: "Escalation Triggered", details: "Procurement Manager + CFO notified — $4.2M exposure threshold" },
      { time: "08:08 UTC", actor: "Sourcing Agent AI", action: "Alternate Supplier List Generated", details: "4 qualified alternates identified — EuroSteel AG, FastenerDirect EMEA, AsiaSupply Co, PrimeMetal US" },
      { time: "08:14 UTC", actor: "Contract Bot", action: "CFO Briefing Doc Created", details: "Document ID: DOC-2026-0441 · Routed to M. Torres for review" },
    ],
    domainMetrics: {
      type: "procurement",
      supplierHealth: [
        { name: "AlphaSteel Ltd.", score: 28, tier: 1, country: "UK", risk: "critical", spend: "$1.8M/qtr", alternatives: 2 },
        { name: "PrecisionParts GmbH", score: 41, tier: 1, country: "Germany", risk: "critical", spend: "$1.4M/qtr", alternatives: 3 },
        { name: "FastenerCo Asia", score: 33, tier: 1, country: "Vietnam", risk: "critical", spend: "$1.0M/qtr", alternatives: 2 },
        { name: "EuroSteel AG", score: 84, tier: 2, country: "Germany", risk: "low", spend: "$480K/qtr", alternatives: 4 },
        { name: "FastenerDirect EMEA", score: 79, tier: 2, country: "Poland", risk: "low", spend: "$240K/qtr", alternatives: 3 },
      ],
      leadTimes: [
        { category: "Steel Components", current: 28, target: 14, delta: 14, unit: "days" },
        { category: "Precision Fasteners", current: 22, target: 8, delta: 14, unit: "days" },
        { category: "Standard Hardware", current: 18, target: 10, delta: 8, unit: "days" },
        { category: "Specialty Parts", current: 35, target: 18, delta: 17, unit: "days" },
      ],
      purchaseOrders: [
        { poId: "PO-2026-0814", supplier: "AlphaSteel Ltd.", value: "$840K", status: "At Risk", daysOpen: 22, risk: "high" },
        { poId: "PO-2026-0791", supplier: "AlphaSteel Ltd.", value: "$960K", status: "At Risk", daysOpen: 18, risk: "high" },
        { poId: "PO-2026-0768", supplier: "PrecisionParts GmbH", value: "$1.4M", status: "Delayed", daysOpen: 31, risk: "high" },
        { poId: "PO-2026-0801", supplier: "FastenerCo Asia", value: "$720K", status: "Suspended", daysOpen: 14, risk: "high" },
        { poId: "PO-2026-0822", supplier: "FastenerCo Asia", value: "$280K", status: "Suspended", daysOpen: 8, risk: "high" },
      ],
      inventory: { daysOfSupply: 11, reorderPoint: 21, criticalSkus: 8, coverageGap: "10 days" },
      spend: { mtd: "$2.1M", budget: "$3.8M", variance: "-$1.7M underspend risk", atRisk: "$4.2M" },
      sourcingRisk: { exposure: 88, alternateReadiness: 54, concentrationRisk: 61 },
      spendTrend: [
        { month: "Jan", spend: 3400, budget: 3800 },
        { month: "Feb", spend: 3600, budget: 3800 },
        { month: "Mar", spend: 3750, budget: 3800 },
        { month: "Apr", spend: 3200, budget: 3800 },
        { month: "May", spend: 3480, budget: 3800 },
        { month: "Jun", spend: 2100, budget: 3800 },
      ],
    } as ProcurementMetrics,
  },

  a3: {
    id: "a3",
    incidentId: "INC-2026-0187",
    title: "Inventory turns declining — WH-3 stockout risk in 11 days",
    severity: "watch",
    confidence: 81,
    timestamp: "Jun 26, 2026 — 07:20 UTC",
    age: "1 hr ago",
    department: "Supply Chain",
    buId: "supply-chain",
    affectedAgent: "Inventory Optimizer",
    affectedDepartment: "Supply Chain · Warehouse 3 · SKU-8841",
    summary: "Inventory Optimizer has flagged accelerating demand velocity on SKU-8841 (High-Grade Fastener Set) at WH-3, projecting stockout in 11 days based on current burn rate. Fill rate has declined 2.9% over 14 days. Delivery SLA breach risk is elevated at +18%. $1.2M in revenue-dependent orders are at risk if replenishment is not expedited.",
    rootCause: {
      primary: "Demand velocity for SKU-8841 increased 34% over 14 days (Q3 build-up from 3 key customers) while replenishment order was delayed 8 days due to upstream procurement disruption.",
      contributing: [
        "Replenishment order delayed by upstream supplier (FastenerCo Asia logistics suspension — cross-incident with INC-2026-0218)",
        "Safety stock buffer set at 8 days — below current demand velocity requirement of 14 days",
        "Secondary supplier activation not triggered — Inventory Optimizer requires manual approval for secondary sourcing",
        "WH-3 receiving dock backlog caused 3-day inbound delay on last shipment",
      ],
      classification: "Inventory Management · Stockout Risk · Supply Velocity Mismatch",
    },
    timeline: [
      { time: "05:30 UTC", event: "Demand velocity spike detected on SKU-8841 — 34% increase vs 14-day baseline", actor: "Inventory Optimizer AI", type: "detection" },
      { time: "06:10 UTC", event: "Safety stock depletion projection updated — stockout in 11 days at current rate", actor: "Inventory Optimizer AI", type: "detection" },
      { time: "06:48 UTC", event: "Fill rate decline flagged — 94.1% → 91.2% over 14 days", actor: "Inventory Optimizer AI", type: "detection" },
      { time: "07:05 UTC", event: "Cross-reference with INC-2026-0218 — FastenerCo replenishment blocked", actor: "Inventory Optimizer AI", type: "detection" },
      { time: "07:18 UTC", event: "Supply Chain Coordinator notified — INC-2026-0187 raised", actor: "Governance Engine", type: "escalation" },
      { time: "07:20 UTC", event: "Incident INC-2026-0187 opened — expedite recommendation issued", actor: "Onyx Platform", type: "system" },
      { time: "07:41 UTC", event: "Secondary supplier check initiated — AsiaSupply Co assessed for SKU-8841", actor: "Inventory Optimizer AI", type: "action" },
    ],
    resolution: {
      status: "open",
      progress: 15,
      eta: "72 hrs",
      owner: "P. Okafor — Supply Chain Coordinator",
      steps: [
        { label: "Stockout risk detection & projection", done: true },
        { label: "Secondary supplier assessment initiated", done: false },
        { label: "Emergency reorder trigger approved", done: false },
        { label: "Expedited inbound shipment confirmed", done: false },
        { label: "WH-3 dock priority scheduling", done: false },
        { label: "Safety stock buffer policy updated", done: false },
      ],
    },
    affectedKpis: [
      { name: "Inventory Turns", current: "6.8x", target: "10x", delta: "-3.2x", trend: "down", critical: true, history: [8.2, 8.0, 7.8, 7.6, 7.4, 7.2, 7.0, 6.8] },
      { name: "Fill Rate", current: "91.2%", target: "97%", delta: "-5.8%", trend: "down", critical: true, history: [94.1, 93.8, 93.4, 93.0, 92.6, 92.1, 91.7, 91.2] },
      { name: "Days of Supply (SKU-8841)", current: "11 days", target: "21 days", delta: "-10 days", trend: "down", critical: true, history: [21, 19, 18, 16, 15, 14, 12, 11] },
      { name: "OTIF Rate", current: "84.2%", target: "95%", delta: "-10.8%", trend: "down", critical: false, history: [91, 90, 89, 88, 87, 86, 85, 84.2] },
      { name: "Replenishment Cycle", current: "18 days", target: "< 10 days", delta: "+8 days", trend: "up", critical: false, history: [10.2, 11.4, 12.8, 14.1, 15.2, 16.4, 17.1, 18] },
    ],
    businessImpact: {
      cost: "$1.2M revenue at risk from pending orders",
      downtime: "Delivery delay 11–18 days for affected orders",
      production: "3 downstream customer build plans at risk",
      sla: "+18% SLA breach probability on SKU-8841 orders",
      revenue: "$1.2M Q3 order revenue at risk",
    },
    aiRecommendation: {
      primary: "Trigger emergency reorder from AsiaSupply Co (secondary supplier) for SKU-8841 — 2,400 units at standard price +4% premium. Schedule WH-3 priority dock slot for inbound within 48 hrs. Concurrently, request demand smoothing from 2 largest customers (offer 10-day extension with 2% discount).",
      rationale: "AsiaSupply Co has 2,200 units available for immediate dispatch — sufficient to extend runway to 28 days. Q2 2025 stockout mitigation (INC-2025-0141) used identical dual-track approach — 0 SLA breaches achieved at 4.2% incremental cost.",
      confidence: 81,
      alternatives: [
        "Air freight from secondary supplier — faster (3 days) but 3x cost premium",
        "Customer demand smoothing only — reduces burn rate but insufficient to close gap",
        "Partial fulfillment prioritization — service top 3 accounts only, defer remainder",
      ],
    },
    recommendedActions: [
      { id: "ra1", action: "Approve emergency reorder — SKU-8841, 2,400 units from AsiaSupply Co", priority: "critical", owner: "P. Okafor", eta: "4 hrs", status: "pending" },
      { id: "ra2", action: "Schedule priority WH-3 dock slot — inbound T+48 hrs", priority: "high", owner: "WMS Agent AI", eta: "2 hrs", status: "pending" },
      { id: "ra3", action: "Contact top 2 customers — offer 10-day extension at 2% discount", priority: "high", owner: "Account Manager", eta: "Same day", status: "pending" },
      { id: "ra4", action: "Update safety stock buffer for SKU-8841 — minimum 14 days", priority: "medium", owner: "Inventory Optimizer AI", eta: "24 hrs", status: "pending" },
      { id: "ra5", action: "Enable auto-approval for secondary supplier reorders ≤$250K", priority: "medium", owner: "Supply Chain Director", eta: "48 hrs", status: "pending" },
    ],
    assignedAgents: [
      { name: "Inventory Optimizer", role: "Stockout Detection & Reorder Planning", status: "watch", autonomy: "supervised" },
      { name: "WMS Agent", role: "Warehouse & Dock Scheduling", status: "active", autonomy: "supervised" },
      { name: "Route Optimizer", role: "Inbound Route & Carrier Selection", status: "active", autonomy: "full" },
    ],
    assignedHumans: [
      { name: "P. Okafor", role: "Supply Chain Coordinator", status: "reviewing" },
      { name: "K. Ng", role: "Warehouse Manager — WH-3", status: "notified" },
    ],
    activeWorkflow: {
      name: "SKU-8841 Stockout Prevention — Emergency Reorder Workflow",
      status: "pending",
      progress: 15,
      steps: [
        { label: "Demand velocity & stockout detection", status: "done" },
        { label: "Secondary supplier assessment", status: "active" },
        { label: "Emergency reorder approval", status: "pending" },
        { label: "Carrier booking & WH-3 dock scheduling", status: "pending" },
        { label: "Inbound receipt & quality check", status: "pending" },
        { label: "Buffer policy recalibration", status: "pending" },
      ],
    },
    relatedSops: [
      { title: "Inventory Replenishment SOP — Emergency Reorder", version: "v2.3", relevance: 96 },
      { title: "Stockout Risk Escalation Protocol", version: "v1.8", relevance: 91 },
      { title: "Secondary Supplier Activation Framework", version: "v2.0", relevance: 85 },
    ],
    policies: [
      { title: "INV-002 Safety Stock Minimum — 14 Days", relevance: 94 },
      { title: "INV-007 Secondary Supplier Auto-Approval (<$250K)", relevance: 88 },
      { title: "SLA-003 Delivery SLA Breach Prevention Protocol", relevance: 84 },
    ],
    evidence: {
      logs: [
        { timestamp: "06:10:44", source: "InventoryOpt/SKU-8841", message: "Stockout projection: 11 days at current velocity (284 units/day vs baseline 212 units/day)", level: "error" },
        { timestamp: "05:30:21", source: "InventoryOpt/Demand", message: "Demand velocity spike detected: SKU-8841 +34% vs 14-day baseline | 3 customer spikes correlated", level: "warn" },
        { timestamp: "06:48:12", source: "WMS/WH3-FillRate", message: "Fill rate: 91.2% | Target: 97% | Delta: -5.8% | Trend: DOWN 14 days", level: "warn" },
        { timestamp: "07:05:33", source: "CrossRef/INC-0218", message: "Upstream supplier disruption linked — FastenerCo Asia suspension impacts replenishment ETA", level: "error" },
        { timestamp: "07:41:08", source: "InventoryOpt/AltSupplier", message: "AsiaSupply Co assessed: 2,200 units available | Lead time: 48 hrs | Premium: +4%", level: "info" },
      ],
      sensors: [
        { id: "WH3-SKU8841", name: "SKU-8841 Stock Level", value: "3,124 units", threshold: "4,200 units", status: "warning" },
        { id: "WH3-FILL", name: "WH-3 Fill Rate", value: "91.2%", threshold: "97%", status: "warning" },
        { id: "WH3-TURNS", name: "Inventory Turns", value: "6.8x", threshold: "10x", status: "warning" },
        { id: "WH3-DOS", name: "Days of Supply (SKU-8841)", value: "11 days", threshold: "21 days", status: "critical" },
        { id: "WH3-OTIF", name: "OTIF Rate", value: "84.2%", threshold: "95%", status: "warning" },
      ],
      documents: [
        { title: "WH-3 SKU-8841 Inventory Report — Jun 26", type: "WMS Report", date: "Jun 26, 2026" },
        { title: "Q3 Customer Demand Forecast — SKU-8841", type: "Demand Plan", date: "Jun 15, 2026" },
        { title: "AsiaSupply Co Qualification Certificate", type: "Supplier Document", date: "Apr 02, 2026" },
      ],
      traces: [
        { id: "TRC-0187-001", event: "WMS demand signal → Inventory Optimizer alert trigger", duration: "620ms", status: "ok" },
        { id: "TRC-0187-002", event: "Stockout projection model run → 11-day ETA", duration: "1.4s", status: "ok" },
        { id: "TRC-0187-003", event: "Secondary supplier DB query → AsiaSupply Co availability", duration: "880ms", status: "ok" },
      ],
    },
    historicalIncidents: [
      { id: "INC-2025-0141", title: "SKU-7722 Stockout — WH-2 Velocity Mismatch", date: "Jun 12, 2025", resolution: "Emergency reorder + demand smoothing — 0 SLA breaches at 4.2% cost premium", similarity: 88 },
      { id: "INC-2025-0064", title: "WH-3 Fill Rate Decline — Q1 Replenishment Delay", date: "Feb 28, 2025", resolution: "Air freight expedite — 3-day resolution, $28K premium", similarity: 74 },
    ],
    riskPrediction: {
      probability: 81,
      impact: "Stockout in 11 days · $1.2M revenue at risk · +18% SLA breach probability",
      timeToImpact: "11 days",
      factors: [
        { factor: "34% demand velocity increase above baseline", weight: 38 },
        { factor: "Upstream supplier disruption (INC-2026-0218)", weight: 31 },
        { factor: "Safety stock below demand-adjusted minimum", weight: 18 },
        { factor: "Secondary supplier approval gate (manual)", weight: 13 },
      ],
    },
    escalationPath: [
      { level: 1, role: "Supply Chain Coordinator", name: "P. Okafor", trigger: "Inventory DoS < 14 days for critical SKU", status: "active" },
      { level: 2, role: "Supply Chain Director", name: "F. Mendes", trigger: "SLA breach probability >15% or revenue at risk >$1M", status: "pending" },
      { level: 3, role: "COO", name: "A. Krishnan", trigger: "Customer SLA breach confirmed", status: "pending" },
    ],
    comments: [
      { id: "c1", author: "Inventory Optimizer", role: "AI Agent", time: "07:20 UTC", text: "AsiaSupply Co can supply 2,200 units within 48 hrs at +4% premium. Combined with demand smoothing request to Apex Corp and BuildCo, this extends runway to 31 days — well above the 21-day target.", isAI: true },
      { id: "c2", author: "P. Okafor", role: "Supply Chain Coordinator", time: "07:48 UTC", text: "Will approve the AsiaSupply reorder. Can you draft the PO and get it ready for my signature? Also flagging to K. Ng at WH-3 re: dock priority.", isAI: false },
    ],
    auditHistory: [
      { time: "07:20 UTC", actor: "Onyx Platform", action: "Incident Created", details: "INC-2026-0187 opened · Severity: WATCH · Confidence: 81%" },
      { time: "07:18 UTC", actor: "Governance Engine", action: "Supply Chain Coordinator Notified", details: "P. Okafor — push + email · $1.2M revenue risk threshold" },
      { time: "07:41 UTC", actor: "Inventory Optimizer AI", action: "Secondary Supplier Assessment", details: "AsiaSupply Co — 2,200 units available · Lead time: 48 hrs" },
    ],
    domainMetrics: {
      type: "supply-chain",
      warehouse: { utilization: 78, accuracy: 99.2, pickRate: 84, location: "WH-3, Sheffield" },
      logistics: [
        { route: "APAC → WH-3 (FastenerCo)", carrier: "SeaRoute Express", onTime: 0, status: "delayed" },
        { route: "EMEA → WH-3 (EuroSteel)", carrier: "DB Schenker", onTime: 94, status: "on-track" },
        { route: "UK → WH-3 (LocalParts)", carrier: "DHL UK", onTime: 97, status: "on-track" },
        { route: "US → WH-1 (American Supply)", carrier: "FedEx Freight", onTime: 88, status: "at-risk" },
      ],
      otif: { current: 84.2, target: 95, trend: [91, 90.2, 89.4, 88.6, 87.8, 86.9, 85.6, 84.2], daysLate: 4.2 },
      inventory: [
        { sku: "SKU-8841", location: "WH-3 Bay A", daysOfSupply: 11, reorderPoint: 21, status: "critical" },
        { sku: "SKU-4422", location: "WH-3 Bay B", daysOfSupply: 28, reorderPoint: 14, status: "ok" },
        { sku: "SKU-6631", location: "WH-3 Bay C", daysOfSupply: 16, reorderPoint: 14, status: "warning" },
        { sku: "SKU-9912", location: "WH-2 Bay D", daysOfSupply: 42, reorderPoint: 14, status: "ok" },
      ],
      transport: { avgTransitDays: 8.4, carrierScore: 79, lateShipments: 6, freightCost: "$48K/mo" },
      fulfillment: { orderBacklog: 48, fillRate: 91.2, pendingOrders: 124, expediteRate: 12 },
      inventoryTrend: [
        { day: "Jun 13", turns: 8.2, fill: 94.1 },
        { day: "Jun 15", turns: 7.9, fill: 93.6 },
        { day: "Jun 17", turns: 7.6, fill: 93.0 },
        { day: "Jun 19", turns: 7.3, fill: 92.4 },
        { day: "Jun 21", turns: 7.1, fill: 91.8 },
        { day: "Jun 23", turns: 6.9, fill: 91.5 },
        { day: "Jun 25", turns: 6.8, fill: 91.2 },
      ],
    } as SupplyChainMetrics,
  },

  a4: {
    id: "a4",
    incidentId: "INC-2026-0141",
    title: "Revenue pipeline conversion declining — APAC region -11%",
    severity: "watch",
    confidence: 87,
    timestamp: "Jun 26, 2026 — 06:18 UTC",
    age: "2 hrs ago",
    department: "Revenue",
    buId: "revenue",
    affectedAgent: "Revenue Scout",
    affectedDepartment: "Revenue · APAC · Pipeline Intelligence",
    summary: "Revenue Scout has identified an 11% decline in pipeline conversion rate across the APAC region over a 30-day rolling window. Enterprise account pipeline totaling $3.4M is at risk of missing Q3 targets. AI SDR resource allocation has been suboptimal — 68% of outreach effort is directed at SMB accounts while enterprise accounts (80% of pipeline value) receive only 32%. Forecast confidence has dropped to 74%.",
    rootCause: {
      primary: "AI SDR reallocation lag — resource allocation algorithm last updated Q1 (enterprise: 40% → target: 65%). Market shift in APAC enterprise buying cycle (from 28-day to 40-day avg) not reflected in outreach cadence.",
      contributing: [
        "Enterprise account outreach cadence not updated following Q2 APAC market intelligence report",
        "AI SDR bandwidth split: 68% SMB vs 32% Enterprise — inverse of pipeline value distribution",
        "6 strategic accounts approaching renewal — engagement score dropped below threshold (0.72)",
        "3 deal cycles stalled at Technical Evaluation stage >45 days without escalation",
      ],
      classification: "Revenue Operations · Pipeline Health · Resource Allocation",
    },
    timeline: [
      { time: "04:00 UTC", event: "30-day rolling conversion rate computed: 11% decline vs Q2 baseline", actor: "Revenue Scout AI", type: "detection" },
      { time: "04:18 UTC", event: "APAC enterprise account engagement drop detected — 6 accounts below 0.72 threshold", actor: "Revenue Scout AI", type: "detection" },
      { time: "04:41 UTC", event: "AI SDR allocation imbalance flagged — 68% SMB vs 32% Enterprise", actor: "Revenue Scout AI", type: "detection" },
      { time: "05:12 UTC", event: "Forecast confidence downgraded: 88% → 74% — Q3 target at risk", actor: "Forecast Agent AI", type: "detection" },
      { time: "05:48 UTC", event: "Revenue Operations Lead notified — $3.4M pipeline at risk", actor: "Governance Engine", type: "escalation" },
      { time: "06:18 UTC", event: "Incident INC-2026-0141 opened — Pipeline Intelligence task force activated", actor: "Onyx Platform", type: "system" },
      { time: "06:34 UTC", event: "AI SDR reallocation plan drafted — enterprise prioritization model v2.1 loaded", actor: "Revenue Scout AI", type: "action" },
    ],
    resolution: {
      status: "in-progress",
      progress: 22,
      eta: "14 days",
      owner: "C. Walsh — Revenue Operations Lead",
      steps: [
        { label: "Pipeline decline detection & root cause analysis", done: true },
        { label: "AI SDR reallocation plan drafted", done: true },
        { label: "VP Sales approval for reallocation", done: false },
        { label: "Enterprise account outreach cadence activated", done: false },
        { label: "6 at-risk accounts assigned to Customer Success", done: false },
        { label: "Conversion rate recovery measured (T+14 days)", done: false },
      ],
    },
    affectedKpis: [
      { name: "Pipeline Conversion Rate (APAC)", current: "14.2%", target: "25%", delta: "-10.8%", trend: "down", critical: true, history: [25, 24.1, 23.2, 22.0, 20.8, 19.4, 17.1, 14.2] },
      { name: "Enterprise Pipeline Value", current: "$3.4M at risk", target: "$8.2M", delta: "-41%", trend: "down", critical: true, history: [8.2, 8.0, 7.8, 7.4, 6.9, 6.2, 5.4, 4.8] },
      { name: "AI SDR Enterprise Allocation", current: "32%", target: "65%", delta: "-33%", trend: "down", critical: true, history: [41, 40, 38, 37, 35, 34, 33, 32] },
      { name: "Forecast Confidence", current: "74%", target: "88%", delta: "-14%", trend: "down", critical: false, history: [88, 87, 86, 84, 82, 80, 77, 74] },
      { name: "Deal Velocity (APAC)", current: "38.4 days", target: "< 22 days", delta: "+16.4 days", trend: "up", critical: false, history: [22, 23.8, 26.1, 28.4, 30.8, 33.2, 36.1, 38.4] },
    ],
    businessImpact: {
      cost: "$3.4M pipeline at Q3 miss risk",
      downtime: "N/A (revenue cycle disruption)",
      production: "14-day recovery timeline for allocation rebalance",
      sla: "Q3 revenue target gap: $2.1M projected miss",
      revenue: "$3.4M APAC pipeline · $2.1M Q3 target shortfall",
    },
    aiRecommendation: {
      primary: "Immediately reallocate AI SDR capacity to 65% enterprise / 35% SMB for APAC. Activate Customer Success AI for the 6 strategic accounts below 0.72 engagement threshold. Fast-track 3 stalled deals to executive-level engagement (VP Sales outreach within 48 hrs).",
      rationale: "SDR reallocation from Q3 2025 APAC recovery (INC-2025-0088) delivered +11% conversion in 60 days with identical resource shift. 6 at-risk enterprise accounts represent 78% of at-risk pipeline — early engagement has 84% churn prevention rate at this stage.",
      confidence: 87,
      alternatives: [
        "Discount-led APAC acceleration — offer 8–12% Q3 discount to accelerate closes",
        "New enterprise account acquisition focus — supplement existing pipeline with new logos",
        "Pipeline rationalization — formally close stalled deals and reset forecast baseline",
      ],
    },
    recommendedActions: [
      { id: "ra1", action: "Reallocate AI SDR to 65% enterprise / 35% SMB — APAC region", priority: "critical", owner: "Revenue Scout AI", eta: "24 hrs", status: "in-progress" },
      { id: "ra2", action: "Activate Customer Success AI on 6 at-risk enterprise accounts", priority: "critical", owner: "Customer Intel AI", eta: "48 hrs", status: "pending" },
      { id: "ra3", action: "Request VP Sales executive outreach on 3 stalled deals (>45 days)", priority: "high", owner: "C. Walsh → VP Sales", eta: "48 hrs", status: "pending" },
      { id: "ra4", action: "Update AI SDR allocation model — APAC enterprise cadence v2.1", priority: "high", owner: "Revenue Scout AI", eta: "72 hrs", status: "pending" },
      { id: "ra5", action: "Revise Q3 APAC forecast — communicate revised projection to exec team", priority: "medium", owner: "Forecast Agent AI", eta: "5 days", status: "pending" },
    ],
    assignedAgents: [
      { name: "Revenue Scout", role: "Pipeline Intelligence & Conversion Analysis", status: "active", autonomy: "supervised" },
      { name: "Deal Closer AI", role: "Deal Acceleration & Outreach", status: "active", autonomy: "supervised" },
      { name: "Customer Intel AI", role: "Account Health & Churn Risk", status: "active", autonomy: "supervised" },
      { name: "Forecast Agent", role: "Revenue Forecast Modeling", status: "watch", autonomy: "supervised" },
    ],
    assignedHumans: [
      { name: "C. Walsh", role: "Revenue Operations Lead", status: "actioning" },
      { name: "M. Park", role: "VP Sales — APAC", status: "notified" },
      { name: "A. Srinivasan", role: "Customer Success Lead", status: "notified" },
    ],
    activeWorkflow: {
      name: "APAC Enterprise Account Recovery — Pipeline Reactivation Workflow",
      status: "running",
      progress: 22,
      steps: [
        { label: "Pipeline conversion decline analysis", status: "done" },
        { label: "AI SDR reallocation plan drafted", status: "done" },
        { label: "VP Sales approval & executive outreach brief", status: "active" },
        { label: "SDR reallocation execution (enterprise priority)", status: "pending" },
        { label: "6 at-risk accounts — Customer Success activation", status: "pending" },
        { label: "Conversion recovery measurement (T+14 days)", status: "pending" },
      ],
    },
    relatedSops: [
      { title: "Revenue Pipeline Review", version: "v2.1", relevance: 96 },
      { title: "Enterprise Account Recovery Playbook", version: "v1.4", relevance: 92 },
      { title: "AI SDR Reallocation Protocol", version: "v1.0", relevance: 88 },
    ],
    policies: [
      { title: "REV-001 SDR Allocation — Enterprise Priority Floor (40%)", relevance: 94 },
      { title: "REV-004 Deal Stall Escalation (>30 days without progression)", relevance: 90 },
      { title: "REV-008 Churn Risk Threshold — Customer Success Trigger (0.72)", relevance: 87 },
    ],
    evidence: {
      logs: [
        { timestamp: "04:00:12", source: "RevenueScout/APAC", message: "30-day conversion rate: 14.2% | Baseline: 25.0% | Delta: -10.8% | DECLINING", level: "error" },
        { timestamp: "04:18:44", source: "RevenueScout/Enterprise", message: "6 enterprise accounts below churn threshold 0.72 | Total ARR at risk: $2.8M", level: "warn" },
        { timestamp: "04:41:22", source: "RevenueScout/SDR", message: "SDR allocation imbalance: 68% SMB vs 32% Enterprise | Target: 35%/65%", level: "warn" },
        { timestamp: "05:12:08", source: "ForecastAgent/APAC", message: "Q3 forecast confidence downgraded: 88% → 74% | Revenue at risk: $3.4M", level: "error" },
        { timestamp: "06:34:31", source: "RevenueScout/Reallocation", message: "SDR reallocation plan v2.1 loaded — APAC enterprise priority model activated", level: "info" },
      ],
      sensors: [
        { id: "APAC-CONV", name: "APAC Conversion Rate (30-day)", value: "14.2%", threshold: "22%", status: "critical" },
        { id: "APAC-PIPE", name: "Enterprise Pipeline at Risk", value: "$3.4M", threshold: "$1M", status: "critical" },
        { id: "SDR-ENT", name: "AI SDR Enterprise Allocation", value: "32%", threshold: "40%", status: "warning" },
        { id: "FCST-CONF", name: "Q3 Forecast Confidence", value: "74%", threshold: "85%", status: "warning" },
        { id: "DEAL-VEL", name: "Avg Deal Velocity (APAC)", value: "38.4 days", threshold: "22 days", status: "warning" },
      ],
      documents: [
        { title: "APAC Enterprise Pipeline Report — Jun 26", type: "CRM Export", date: "Jun 26, 2026" },
        { title: "Q2 APAC Market Intelligence Report", type: "Market Intel", date: "Jun 01, 2026" },
        { title: "Revenue Intelligence Playbook — Enterprise Expansion Q3", type: "Sales Playbook", date: "Jun 10, 2026" },
        { title: "Q3 2025 APAC Recovery Post-Mortem (INC-2025-0088)", type: "Historical Case", date: "Sep 30, 2025" },
      ],
      traces: [
        { id: "TRC-0141-001", event: "CRM data sync → Revenue Scout conversion calculation", duration: "2.1s", status: "ok" },
        { id: "TRC-0141-002", event: "SDR allocation audit → enterprise/SMB breakdown", duration: "840ms", status: "ok" },
        { id: "TRC-0141-003", event: "Forecast model rerun → confidence downgrade", duration: "4.2s", status: "ok" },
        { id: "TRC-0141-004", event: "6 at-risk account churn scoring → notification", duration: "1.8s", status: "ok" },
      ],
    },
    historicalIncidents: [
      { id: "INC-2025-0088", title: "APAC Enterprise Pipeline Stall — Q3 2025", date: "Aug 14, 2025", resolution: "AI SDR reallocation + exec outreach — +11% conversion in 60 days, $2.8M recovered", similarity: 94 },
      { id: "INC-2025-0041", title: "EMEA Deal Velocity Decline — Q2 2025", date: "Apr 22, 2025", resolution: "Cadence update + discount authorization — 9% conversion lift in 45 days", similarity: 72 },
    ],
    riskPrediction: {
      probability: 87,
      impact: "$3.4M pipeline at risk · $2.1M Q3 target shortfall · Forecast confidence 74%",
      timeToImpact: "30 days (Q3 close)",
      factors: [
        { factor: "11% conversion rate decline over 30 days", weight: 36 },
        { factor: "AI SDR allocation 33% below enterprise target", weight: 28 },
        { factor: "6 strategic accounts below churn threshold", weight: 22 },
        { factor: "3 deals stalled >45 days without escalation", weight: 14 },
      ],
    },
    escalationPath: [
      { level: 1, role: "Revenue Operations Lead", name: "C. Walsh", trigger: "Pipeline conversion decline >8% over 30 days", status: "active" },
      { level: 2, role: "VP Sales — APAC", name: "M. Park", trigger: "Enterprise pipeline at risk >$2M or 3+ strategic accounts stalled", status: "active" },
      { level: 3, role: "Chief Revenue Officer", name: "B. Diaz", trigger: "Q3 miss probability >50% or $5M+ pipeline at risk", status: "pending" },
    ],
    comments: [
      { id: "c1", author: "Revenue Scout", role: "AI Agent", time: "06:18 UTC", text: "Reallocation to 65% enterprise will take 24–48 hrs to fully shift cadence. Prioritizing 6 at-risk accounts immediately. Q3 2025 precedent shows +11% recovery is achievable within 60 days. Recommend VP Sales personal outreach to Apex Corp and BuildTech — both have high close probability if engaged at exec level.", isAI: true },
      { id: "c2", author: "C. Walsh", role: "Revenue Operations Lead", time: "06:42 UTC", text: "Agreed on VP Sales outreach. Preparing brief for M. Park. Can you generate personalized talking points for each of the 3 stalled deals?", isAI: false },
      { id: "c3", author: "Deal Closer AI", role: "AI Agent", time: "06:45 UTC", text: "Talking points generated for all 3 stalled deals (Apex Corp, BuildTech, SiteForce). Tailored to each deal's Technical Evaluation stage, last interaction, and key stakeholder pain points. Ready for M. Park review.", isAI: true },
    ],
    auditHistory: [
      { time: "06:18 UTC", actor: "Onyx Platform", action: "Incident Created", details: "INC-2026-0141 opened · Severity: WATCH · Confidence: 87%" },
      { time: "05:48 UTC", actor: "Governance Engine", action: "Revenue Ops Lead Notified", details: "C. Walsh — push + email · $3.4M pipeline risk threshold" },
      { time: "06:34 UTC", actor: "Revenue Scout AI", action: "Reallocation Plan Drafted", details: "AI SDR enterprise reallocation v2.1 — pending VP Sales approval" },
      { time: "06:45 UTC", actor: "Deal Closer AI", action: "Deal Talking Points Generated", details: "3 stalled deal briefings — Apex Corp, BuildTech, SiteForce · Routed to C. Walsh" },
    ],
    domainMetrics: {
      type: "revenue",
      pipeline: {
        total: "$12.4M",
        qualified: "$8.8M",
        atRisk: "$3.4M",
        conversionRate: 14.2,
        stages: [
          { stage: "Discovery", count: 42, value: "$3.2M" },
          { stage: "Qualification", count: 28, value: "$2.4M" },
          { stage: "Technical Eval", count: 18, value: "$3.8M" },
          { stage: "Proposal", count: 11, value: "$2.2M" },
          { stage: "Negotiation", count: 6, value: "$0.8M" },
        ],
      },
      orders: { newMtd: 41, totalValue: "$6.2M", avgOrderValue: "$151K", churnRisk: 6 },
      forecast: { q3Target: "$18.4M", currentProjection: "$16.3M", gap: "-$2.1M", confidence: 74, trend: [18.4, 18.2, 17.9, 17.6, 17.2, 16.8, 16.5, 16.3] },
      customers: [
        { segment: "Enterprise", count: 24, revenue: "$9.8M", churnRisk: 6, nps: 68 },
        { segment: "Mid-Market", count: 84, revenue: "$4.2M", churnRisk: 3, nps: 74 },
        { segment: "SMB", count: 241, revenue: "$2.4M", churnRisk: 12, nps: 81 },
      ],
      revenueImpact: { atRisk: "$3.4M", protected: "$14.2M", roi: "2.7x", dealVelocityDelta: "+16.4 days vs target" },
      pipelineTrend: [
        { week: "May W4", pipeline: 14.2, converted: 3.6 },
        { week: "Jun W1", pipeline: 13.8, converted: 3.2 },
        { week: "Jun W2", pipeline: 13.2, converted: 2.9 },
        { week: "Jun W3", pipeline: 12.8, converted: 2.4 },
        { week: "Jun W4", pipeline: 12.4, converted: 1.8 },
      ],
    } as RevenueMetrics,
  },
};
