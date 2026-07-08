import { Router } from "express";

const router = Router();

const generateTrend = (base: number, days = 60, improving = true) => {
  const points = [];
  const now = new Date();
  for (let i = days; i >= 0; i -= 5) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const drift = improving
      ? +(base + (i / days) * -8 + (Math.random() - 0.3) * 4).toFixed(2)
      : +(base + (i / days) * 8 + (Math.random() - 0.5) * 4).toFixed(2);
    points.push({ date: d.toISOString().slice(0, 10), value: drift });
  }
  return points;
};

const insights = [
  {
    id: "i1",
    type: "recommendation",
    title: "Reallocate AI SDR Employees to Enterprise Accounts",
    description: "Pipeline conversion in APAC declined 11% over the last 30 days. Revenue Intelligence detected enterprise account pipeline stagnation while AI SDR capacity is concentrated on SMB tier. Reallocating two AI SDR Employees to enterprise accounts is projected to recover pipeline momentum and unlock $1.2M revenue potential.",
    confidence: 91,
    businessUnitId: "bu1",
    priority: "p1",
    impact: "+8% Pipeline Conversion, +$1.2M Revenue Potential",
    businessImpact: "+$1.2M Revenue Potential",
    kpiImpact: "+8% Pipeline Conversion",
    evidence: ["CRM pipeline data", "APAC account signals", "AI SDR utilization logs", "30-day conversion trend"],
    projectedTrajectory: generateTrend(54, 60, true),
    linkedKpi: "Pipeline Conversion",
    createdAt: "2026-06-22T08:00:00Z",
  },
  {
    id: "i2",
    type: "recommendation",
    title: "Launch Strategic Account Retention Workflow",
    description: "Strategic account churn risk exceeds the defined threshold. Customer Intelligence identified 6 enterprise accounts showing disengagement signals across product usage, support escalations, and renewal proximity. Launching a targeted retention workflow with Customer Success AI Employee is projected to reduce churn risk by 6% and improve retention by 4%.",
    confidence: 87,
    businessUnitId: "bu1",
    priority: "p1",
    impact: "-6% Churn Risk, +4% Customer Retention",
    businessImpact: "+4% Customer Retention",
    kpiImpact: "-6% Churn Risk",
    evidence: ["Product usage telemetry", "Support ticket escalations", "Renewal proximity data", "NPS trend signals"],
    projectedTrajectory: generateTrend(72, 60, true),
    linkedKpi: "Customer Retention",
    createdAt: "2026-06-22T07:30:00Z",
  },
  {
    id: "i3",
    type: "recommendation",
    title: "Optimize Invoice Approval Workflow to Reduce Cycle Time",
    description: "Invoice approval cycle time increased 18% in Q2 vs Q1 baseline. Finance Intelligence identified multi-approver queue backlogs and manual routing as the primary cause, creating downstream payment delays. Deploying automated routing and approval delegation is projected to cut approval time by 14% and improve Finance efficiency by 9%.",
    confidence: 84,
    businessUnitId: "bu2",
    priority: "p1",
    impact: "-14% Approval Time, +9% Finance Efficiency",
    businessImpact: "+9% Finance Efficiency",
    kpiImpact: "-14% Approval Time",
    evidence: ["ERP approval logs", "Queue depth analysis", "Benchmark comparison data", "Manual routing event log"],
    projectedTrajectory: generateTrend(68, 60, true),
    linkedKpi: "Approval Cycle Time",
    createdAt: "2026-06-22T06:45:00Z",
  },
  {
    id: "i4",
    type: "recommendation",
    title: "Rebalance AI and Human Review Workload in Release Pipeline",
    description: "Release throughput declined 14% vs target. Engineering Intelligence detected imbalanced AI-to-human review ratio causing review queue buildup and extended lead times. Rebalancing workload by shifting 60% of routine validation to Engineering AI Employee is projected to recover throughput by 11% and reduce lead time by 18%.",
    confidence: 78,
    businessUnitId: "bu5",
    priority: "p2",
    impact: "+11% Throughput, -18% Lead Time",
    businessImpact: "-18% Lead Time",
    kpiImpact: "+11% Throughput",
    evidence: ["CI/CD pipeline metrics", "Review queue depth", "AI utilization logs", "Lead time trend data"],
    projectedTrajectory: generateTrend(58, 60, true),
    linkedKpi: "Engineering Throughput",
    createdAt: "2026-06-21T15:00:00Z",
  },
  {
    id: "i5",
    type: "recommendation",
    title: "Resolve Cross-Functional Bottleneck Between Procurement and Finance",
    description: "Operations Intelligence detected a recurring workflow bottleneck at the Procurement-Finance handoff. 38% of procurement approvals stall at Finance review, adding an average 4.2-day cycle time. Deploying an automated cross-functional workflow with a shared approval queue is projected to reduce cycle time by 22% and improve operational efficiency by 15%.",
    confidence: 82,
    businessUnitId: "bu3",
    priority: "p1",
    impact: "-22% Cycle Time, +15% Operational Efficiency",
    businessImpact: "+15% Operational Efficiency",
    kpiImpact: "-22% Cycle Time",
    evidence: ["Workflow event logs", "Cross-BU handoff data", "Approval queue metrics", "Cycle time variance report"],
    projectedTrajectory: generateTrend(62, 60, true),
    linkedKpi: "Workflow Completion Time",
    createdAt: "2026-06-22T09:15:00Z",
  },
];

const documents = [
  { id: "d1", title: "Revenue Intelligence Playbook — Enterprise Expansion Q3", type: "sop", department: "Revenue Intelligence", lastUpdated: "2026-06-01", usageCount: 234, relevanceScore: 0.94, summary: "Sales motion for Enterprise tier expansion. Covers account scoring, outreach sequencing, and AI-assisted proposal generation for APAC and EMEA markets." },
  { id: "d2", title: "AI Agent Governance Policy v2.4", type: "policy", department: "Enterprise", lastUpdated: "2026-05-15", usageCount: 412, relevanceScore: 0.91, summary: "Defines autonomy levels, approval gates, and escalation paths for AI Employees. Covers budget limits, RBAC, and audit requirements for all Business Units." },
  { id: "d3", title: "Customer Success AI Employee — Retention Playbook", type: "sop", department: "Customer Intelligence", lastUpdated: "2026-04-22", usageCount: 178, relevanceScore: 0.89, summary: "Retention engagement protocols for Customer Success AI Employee. Covers churn risk scoring thresholds, outreach sequencing, and escalation triggers for enterprise accounts." },
  { id: "d4", title: "Finance Operations — Invoice Automation Decision", type: "decision", department: "Finance Intelligence", lastUpdated: "2026-03-01", usageCount: 156, relevanceScore: 0.86, summary: "Board decision to automate invoice approval routing using Finance Operations AI Employee. Approved $180K investment, projected $420K annual savings in cycle time reduction." },
  { id: "d5", title: "Engineering AI Employee Deployment Standard — v2", type: "sop", department: "Engineering Intelligence", lastUpdated: "2026-05-10", usageCount: 203, relevanceScore: 0.83, summary: "Deployment and governance standards for Engineering AI Employees. Covers review workload allocation, handoff protocols, and performance thresholds." },
  { id: "d6", title: "Cross-BU Workflow Bottleneck Resolution Framework", type: "knowledge", department: "Operations Intelligence", lastUpdated: "2026-02-28", usageCount: 112, relevanceScore: 0.80, summary: "Framework for identifying and resolving cross-functional handoff bottlenecks. Covers root cause mapping, automated escalation, and shared queue design patterns." },
  { id: "d7", title: "Q2 2026 Enterprise Performance Review", type: "historical", department: "Enterprise", lastUpdated: "2026-06-20", usageCount: 89, relevanceScore: 0.77, summary: "Q2 performance summary across all 5 Business Units. Documents EEI progression, AI Employee utilization, and KPI attainment vs targets." },
  { id: "d8", title: "Procurement Risk Management Framework — v3", type: "policy", department: "Procurement Intelligence", lastUpdated: "2026-01-15", usageCount: 134, relevanceScore: 0.74, summary: "Defines supplier risk tiers, buffer stock requirements, and spot purchase authorization thresholds for Procurement Intelligence." },
];

const executionWorkflows = [
  { id: "ew1", name: "APAC Enterprise Account Recovery", status: "running", businessUnitId: "bu1", startedAt: "2026-06-21T14:00:00Z", stepCount: 6, completedSteps: 2, priority: "p1", assignedAgent: "Revenue Scout AI Employee", blockers: null, estimatedCompletion: "2026-06-28T00:00:00Z" },
  { id: "ew2", name: "Strategic Account Churn Prevention", status: "running", businessUnitId: "bu1", startedAt: "2026-06-22T06:00:00Z", stepCount: 5, completedSteps: 1, priority: "p1", assignedAgent: "Customer Success AI Employee", blockers: null, estimatedCompletion: "2026-06-26T00:00:00Z" },
  { id: "ew3", name: "Invoice Approval Automation", status: "running", businessUnitId: "bu2", startedAt: "2026-06-18T09:00:00Z", stepCount: 7, completedSteps: 3, priority: "p1", assignedAgent: "Finance Operations AI Employee", blockers: null, estimatedCompletion: "2026-06-30T00:00:00Z" },
  { id: "ew4", name: "Release Pipeline Rebalancing", status: "blocked", businessUnitId: "bu5", startedAt: "2026-06-15T09:00:00Z", stepCount: 8, completedSteps: 2, priority: "p2", assignedAgent: "Engineering AI Employee", blockers: "Pending Engineering Lead approval for workload reallocation", estimatedCompletion: null },
  { id: "ew5", name: "Cross-BU Approval Automation", status: "running", businessUnitId: "bu3", startedAt: "2026-06-20T08:00:00Z", stepCount: 5, completedSteps: 3, priority: "p1", assignedAgent: "Operations Coordinator AI", blockers: null, estimatedCompletion: "2026-06-27T00:00:00Z" },
  { id: "ew6", name: "H2 Revenue Forecast Refresh", status: "running", businessUnitId: "bu1", startedAt: "2026-06-18T09:00:00Z", stepCount: 7, completedSteps: 4, priority: "p2", assignedAgent: "FP&A Analyst AI Employee", blockers: null, estimatedCompletion: "2026-06-28T00:00:00Z" },
  { id: "ew7", name: "Q2 Financial Close", status: "completed", businessUnitId: "bu2", startedAt: "2026-06-01T09:00:00Z", stepCount: 12, completedSteps: 12, priority: "p1", assignedAgent: "Finance Reconciler AI Employee", blockers: null, estimatedCompletion: "2026-06-22T00:00:00Z" },
  { id: "ew8", name: "Customer Intelligence Data Pipeline Scale", status: "running", businessUnitId: "bu1", startedAt: "2026-06-19T08:00:00Z", stepCount: 6, completedSteps: 2, priority: "p2", assignedAgent: "Data Infrastructure AI", blockers: null, estimatedCompletion: "2026-07-08T00:00:00Z" },
];

router.get("/insights", (req, res) => {
  res.json(insights);
});

router.get("/documents", (req, res) => {
  res.json(documents);
});

router.get("/workflows", (req, res) => {
  res.json(executionWorkflows);
});

export default router;
