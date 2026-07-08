import { Router } from "express";

const router = Router();

const generateTrend = (base: number, days = 90) => {
  const points = [];
  const now = new Date();
  for (let i = days; i >= 0; i -= 7) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toISOString().slice(0, 10),
      value: +(base + (Math.random() - 0.4) * 8).toFixed(1),
    });
  }
  return points;
};

const businessUnits = [
  {
    id: "bu1",
    name: "Revenue Intelligence",
    domain: "Sales & GTM",
    eeiScore: 84.2,
    eeiTrend: 3.1,
    healthScore: 91,
    activeKpis: 7,
    activeAgents: 9,
    activeWorkflows: 4,
    status: "healthy",
    risks: 1,
    opportunities: 3,
    cost: 42000,
    roi: 4.8,
    forecastAccuracy: 91.2,
  },
  {
    id: "bu2",
    name: "Finance Intelligence",
    domain: "Finance & Accounting",
    eeiScore: 76.8,
    eeiTrend: 1.4,
    healthScore: 88,
    activeKpis: 6,
    activeAgents: 7,
    activeWorkflows: 3,
    status: "optimizing",
    risks: 2,
    opportunities: 2,
    cost: 35000,
    roi: 3.9,
    forecastAccuracy: 89.4,
  },
  {
    id: "bu3",
    name: "Procurement Intelligence",
    domain: "Procurement & Supply",
    eeiScore: 71.3,
    eeiTrend: -0.8,
    healthScore: 74,
    activeKpis: 8,
    activeAgents: 8,
    activeWorkflows: 4,
    status: "at-risk",
    risks: 4,
    opportunities: 2,
    cost: 38000,
    roi: 2.7,
    forecastAccuracy: 82.1,
  },
  {
    id: "bu4",
    name: "Supply Chain Intelligence",
    domain: "Logistics & Operations",
    eeiScore: 68.9,
    eeiTrend: -2.3,
    healthScore: 67,
    activeKpis: 9,
    activeAgents: 10,
    activeWorkflows: 5,
    status: "critical",
    risks: 5,
    opportunities: 3,
    cost: 51000,
    roi: 2.1,
    forecastAccuracy: 79.8,
  },
  {
    id: "bu5",
    name: "Engineering Intelligence",
    domain: "Manufacturing & OEE",
    eeiScore: 79.6,
    eeiTrend: 1.8,
    healthScore: 83,
    activeKpis: 7,
    activeAgents: 8,
    activeWorkflows: 2,
    status: "healthy",
    risks: 2,
    opportunities: 2,
    cost: 44000,
    roi: 3.6,
    forecastAccuracy: 86.7,
  },
];

const kpisByBu: Record<string, any[]> = {
  bu1: [
    { id: "k101", name: "Pipeline Value", value: 42.3, unit: "M", target: 40, status: "on-track", trend: 2.1, businessUnitId: "bu1", owner: "Sarah Kim", linkedGoal: "Q3 Revenue Target", description: "Total qualified pipeline value across all stages", history: generateTrend(40) },
    { id: "k102", name: "Win Rate", value: 34.7, unit: "%", target: 32, status: "on-track", trend: 1.3, businessUnitId: "bu1", owner: "James Chen", linkedGoal: "Sales Efficiency", description: "Closed-won rate across enterprise opportunities", history: generateTrend(33) },
    { id: "k103", name: "Churn Risk Accounts", value: 7, unit: "", target: 5, status: "watch", trend: -2, businessUnitId: "bu1", owner: "Elena Sokolov", linkedGoal: "Customer Retention", description: "Accounts with >70% churn probability", history: generateTrend(8) },
    { id: "k104", name: "Revenue Forecast Accuracy", value: 91.2, unit: "%", target: 90, status: "on-track", trend: 0.8, businessUnitId: "bu1", owner: "AI Agent", linkedGoal: "Forecast Reliability", description: "AI model accuracy vs actuals", history: generateTrend(89) },
  ],
  bu2: [
    { id: "k201", name: "Close Cycle Duration", value: 5.2, unit: "days", target: 5, status: "on-track", trend: -3.2, businessUnitId: "bu2", owner: "Priya Singh", linkedGoal: "Finance Efficiency", description: "Monthly close cycle from cutoff to report", history: generateTrend(6) },
    { id: "k202", name: "Budget Variance", value: 1.8, unit: "%", target: 2, status: "on-track", trend: -0.4, businessUnitId: "bu2", owner: "Anya Wright", linkedGoal: "Budget Compliance", description: "Deviation from approved budget", history: generateTrend(2.2) },
    { id: "k203", name: "AP Aging >60d", value: 12.4, unit: "%", target: 10, status: "watch", trend: 1.2, businessUnitId: "bu2", owner: "David Reyes", linkedGoal: "Cash Flow", description: "Accounts payable aged beyond 60 days", history: generateTrend(11) },
  ],
  bu3: [
    { id: "k301", name: "Supplier On-Time Delivery", value: 84.2, unit: "%", target: 90, status: "critical", trend: -2.4, businessUnitId: "bu3", owner: "Mark Torres", linkedGoal: "Supply Reliability", description: "% of supplier deliveries on schedule", history: generateTrend(87) },
    { id: "k302", name: "Material Cost Variance", value: 2.4, unit: "%", target: 0, status: "critical", trend: 0.8, businessUnitId: "bu3", owner: "Anya Wright", linkedGoal: "Cost Control", description: "Deviation from standard material cost", history: generateTrend(1.8) },
    { id: "k303", name: "Buffer Stock Days", value: 4.2, unit: "days", target: 7, status: "critical", trend: -2.8, businessUnitId: "bu3", owner: "AI Agent", linkedGoal: "Supply Resilience", description: "Days of buffer inventory remaining", history: generateTrend(6) },
    { id: "k304", name: "Contract Coverage", value: 76.3, unit: "%", target: 85, status: "watch", trend: 1.1, businessUnitId: "bu3", owner: "Priya Singh", linkedGoal: "Procurement Governance", description: "Spend covered by active contracts", history: generateTrend(74) },
  ],
  bu4: [
    { id: "k401", name: "Logistics Latency", value: 4.2, unit: "hrs", target: 3.5, status: "critical", trend: 0.4, businessUnitId: "bu4", owner: "James Chen", linkedGoal: "Q3 Supply Chain Resilience", description: "Average time from dispatch to delivery across all routes", history: generateTrend(3.8) },
    { id: "k402", name: "Supply Chain OTIF", value: 87.3, unit: "%", target: 95, status: "critical", trend: -2.1, businessUnitId: "bu4", owner: "Priya Singh", linkedGoal: "Customer SLA", description: "On-time in-full delivery rate across all orders", history: generateTrend(90) },
    { id: "k403", name: "Berth 7 Processing Rate", value: 110, unit: "T/hr", target: 130, status: "watch", trend: -5, businessUnitId: "bu4", owner: "David Reyes", linkedGoal: "Port Throughput", description: "Metric tonnes processed per hour at Pacific Port Berth 7", history: generateTrend(115) },
    { id: "k404", name: "Fleet Utilization", value: 78.4, unit: "%", target: 85, status: "watch", trend: 1.2, businessUnitId: "bu4", owner: "Elena Sokolov", linkedGoal: "Asset Efficiency", description: "Active fleet utilization vs available capacity", history: generateTrend(76) },
  ],
  bu5: [
    { id: "k501", name: "Overall OEE", value: 76.8, unit: "%", target: 85, status: "watch", trend: -0.1, businessUnitId: "bu5", owner: "Abdul Rahman", linkedGoal: "Manufacturing Excellence", description: "Overall equipment effectiveness across all manufacturing lines", history: generateTrend(77) },
    { id: "k502", name: "Line A CNC Uptime", value: 92.4, unit: "%", target: 97, status: "critical", trend: -1.2, businessUnitId: "bu5", owner: "Abdul Rahman", linkedGoal: "Production Continuity", description: "Percentage of scheduled time Line A operates without downtime", history: generateTrend(94) },
    { id: "k503", name: "Defect Rate", value: 0.34, unit: "%", target: 0.5, status: "on-track", trend: -0.08, businessUnitId: "bu5", owner: "AI Agent", linkedGoal: "Quality Excellence", description: "Production defects as % of total output", history: generateTrend(0.4) },
    { id: "k504", name: "Packaging Output", value: 2840, unit: "units/hr", target: 3000, status: "watch", trend: 340, businessUnitId: "bu5", owner: "Mark Torres", linkedGoal: "Throughput", description: "Packaging line output per hour", history: generateTrend(2700) },
  ],
};

const workflowsByBu: Record<string, any[]> = {
  bu1: [
    { id: "w101", name: "Q3 Account Expansion Campaign", status: "running", businessUnitId: "bu1", startedAt: "2025-06-10T09:00:00Z", stepCount: 8, completedSteps: 5, priority: "p1", assignedAgent: "Revenue Scout AI", blockers: null, estimatedCompletion: "2025-06-25T00:00:00Z" },
    { id: "w102", name: "Churn Prevention — 7 At-Risk Accounts", status: "running", businessUnitId: "bu1", startedAt: "2025-06-15T10:00:00Z", stepCount: 6, completedSteps: 3, priority: "p1", assignedAgent: "Customer Success AI", blockers: null, estimatedCompletion: "2025-06-30T00:00:00Z" },
  ],
  bu2: [
    { id: "w201", name: "Q2 Financial Close Automation", status: "completed", businessUnitId: "bu2", startedAt: "2025-06-01T09:00:00Z", stepCount: 12, completedSteps: 12, priority: "p1", assignedAgent: "Finance Reconciler AI", blockers: null, estimatedCompletion: "2025-06-15T00:00:00Z" },
    { id: "w202", name: "Budget Reforecast — H2 2025", status: "running", businessUnitId: "bu2", startedAt: "2025-06-18T09:00:00Z", stepCount: 7, completedSteps: 3, priority: "p2", assignedAgent: "FP&A Analyst AI", blockers: null, estimatedCompletion: "2025-06-28T00:00:00Z" },
  ],
  bu3: [
    { id: "w301", name: "Spot Purchase — Supplier B Steel Alloy", status: "running", businessUnitId: "bu3", startedAt: "2025-06-20T08:00:00Z", stepCount: 5, completedSteps: 2, priority: "p1", assignedAgent: "Procurement Agent AI", blockers: "Awaiting supplier confirmation", estimatedCompletion: "2025-06-24T00:00:00Z" },
    { id: "w302", name: "Contract Renewal — 12 Suppliers", status: "paused", businessUnitId: "bu3", startedAt: "2025-06-05T09:00:00Z", stepCount: 10, completedSteps: 4, priority: "p2", assignedAgent: "Contract AI", blockers: "Legal review pending", estimatedCompletion: "2025-07-10T00:00:00Z" },
  ],
  bu4: [
    { id: "w401", name: "Route 4 Dynamic Rerouting — Highway 7B", status: "running", businessUnitId: "bu4", startedAt: "2025-06-21T14:00:00Z", stepCount: 6, completedSteps: 2, priority: "p1", assignedAgent: "Logistics Optimizer AI", blockers: null, estimatedCompletion: "2025-06-23T00:00:00Z" },
    { id: "w402", name: "Berth 7 Crane Schedule Optimization", status: "running", businessUnitId: "bu4", startedAt: "2025-06-19T08:00:00Z", stepCount: 8, completedSteps: 5, priority: "p2", assignedAgent: "Port Operations AI", blockers: null, estimatedCompletion: "2025-06-24T00:00:00Z" },
    { id: "w403", name: "Fleet GPS Integration — 12 Vehicles", status: "blocked", businessUnitId: "bu4", startedAt: "2025-06-15T09:00:00Z", stepCount: 9, completedSteps: 6, priority: "p2", assignedAgent: "Fleet AI", blockers: "GPS provider API outage", estimatedCompletion: null },
  ],
  bu5: [
    { id: "w501", name: "Line B Preventive Maintenance", status: "running", businessUnitId: "bu5", startedAt: "2025-06-22T06:00:00Z", stepCount: 5, completedSteps: 1, priority: "p1", assignedAgent: "Maintenance AI", blockers: null, estimatedCompletion: "2025-06-23T00:00:00Z" },
    { id: "w502", name: "Packaging Line Batching Optimization", status: "paused", businessUnitId: "bu5", startedAt: "2025-06-18T09:00:00Z", stepCount: 7, completedSteps: 3, priority: "p2", assignedAgent: "Process Optimizer AI", blockers: "Shift handover required", estimatedCompletion: "2025-06-26T00:00:00Z" },
  ],
};

const insightsByBu: Record<string, any[]> = {
  bu1: [
    { id: "i101", type: "recommendation", title: "Activate predictive renewal outreach for 14 Enterprise accounts", description: "Usage pattern signals identify 14 accounts with 80%+ renewal probability — early outreach increases close rate by 23%.", confidence: 0.86, businessUnitId: "bu1", priority: "p2", impact: "+$4.2M ARR", evidence: ["CRM usage data", "Historical renewal patterns"], projectedTrajectory: generateTrend(82, 60), linkedKpi: "Pipeline Value", createdAt: "2025-06-22T07:00:00Z" },
  ],
  bu4: [
    { id: "i401", type: "risk", title: "Route 4 congestion — 340% latency spike during shift overlap", description: "Pattern recognition shows peak latency during 14:00–16:00. Rerouting via 7B resolves 73% of delay incidents.", confidence: 0.92, businessUnitId: "bu4", priority: "p1", impact: "-18% average latency", evidence: ["Fleet telemetry", "15 similar historical routes", "Depot exit analysis"], projectedTrajectory: generateTrend(4.2, 60), linkedKpi: "Logistics Latency", createdAt: "2025-06-22T09:24:00Z" },
    { id: "i402", type: "recommendation", title: "Increase Berth 7 crane operating hours by 2hr/day", description: "Weekday extension reduces port backlog by handling 3 extra ships per week.", confidence: 0.76, businessUnitId: "bu4", priority: "p2", impact: "+15% processing throughput", evidence: ["Port utilization data", "Crew availability records"], projectedTrajectory: generateTrend(115, 60), linkedKpi: "Berth 7 Processing Rate", createdAt: "2025-06-21T10:00:00Z" },
  ],
  bu5: [
    { id: "i501", type: "anomaly", title: "Line B Extruder bearing fatigue — acoustic anomaly", description: "IoT sensor pattern matches bearing failure signature from 15 historical cases. 94% confidence in failure within 7 days.", confidence: 0.94, businessUnitId: "bu5", priority: "p1", impact: "+8% OEE, +12% Throughput if prevented", evidence: ["IoT acoustic sensors", "Vibration analysis", "15 historical failure cases"], projectedTrajectory: generateTrend(76, 60), linkedKpi: "Overall OEE", createdAt: "2025-06-21T14:20:00Z" },
    { id: "i502", type: "recommendation", title: "Optimize packaging line batching algorithm", description: "Shift 2 batching is unoptimized for current SKU mix. Algorithm adjustment yields +340 units/hr output.", confidence: 0.65, businessUnitId: "bu5", priority: "p3", impact: "+340 units/hr output", evidence: ["Production logs", "SKU mix analysis"], projectedTrajectory: generateTrend(2840, 60), linkedKpi: "Packaging Output", createdAt: "2025-06-20T12:00:00Z" },
  ],
};

router.get("/", (req, res) => {
  res.json(businessUnits);
});

router.get("/:id", (req, res) => {
  const bu = businessUnits.find((b) => b.id === req.params.id);
  if (!bu) return res.status(404).json({ error: "Not found" });
  const recentInsights = insightsByBu[req.params.id] || [];
  const eeiHistory = generateTrend(bu.eeiScore, 90);
  res.json({ ...bu, recentInsights, eeiHistory });
});

router.get("/:id/kpis", (req, res) => {
  const kpis = kpisByBu[req.params.id] || [];
  res.json(kpis);
});

router.get("/:id/workflows", (req, res) => {
  const workflows = workflowsByBu[req.params.id] || [];
  res.json(workflows);
});

export default router;
