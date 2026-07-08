import { Router } from "express";

const router = Router();

const agents: any[] = [
  { id: "a1", name: "Revenue Scout", employeeId: "AIE-0041", role: "Pipeline Intelligence Analyst", department: "Revenue Intelligence", manager: "Sarah Kim", status: "deployed", autonomyLevel: "full", utilizationPct: 94, slaPerformance: 98.2, costPerDay: 142, taskCount: 284, skills: ["Opportunity Scoring", "Churn Prediction", "Pipeline Analytics", "NLP"], businessUnitId: "bu1" },
  { id: "a2", name: "Deal Closer AI", employeeId: "AIE-0042", role: "Sales Acceleration Agent", department: "Revenue Intelligence", manager: "Sarah Kim", status: "deployed", autonomyLevel: "supervised", utilizationPct: 87, slaPerformance: 95.4, costPerDay: 118, taskCount: 196, skills: ["Proposal Generation", "Objection Handling", "Contract Analysis"], businessUnitId: "bu1" },
  { id: "a3", name: "Finance Reconciler", employeeId: "AIE-0021", role: "Autonomous Finance Analyst", department: "Finance Intelligence", manager: "Anya Wright", status: "deployed", autonomyLevel: "full", utilizationPct: 78, slaPerformance: 99.1, costPerDay: 124, taskCount: 412, skills: ["Reconciliation", "Variance Analysis", "Regulatory Compliance", "ERP Integration"], businessUnitId: "bu2" },
  { id: "a4", name: "FP&A Analyst AI", employeeId: "AIE-0022", role: "Financial Planning Agent", department: "Finance Intelligence", manager: "Priya Singh", status: "deployed", autonomyLevel: "supervised", utilizationPct: 71, slaPerformance: 96.8, costPerDay: 108, taskCount: 187, skills: ["Forecasting", "Scenario Modeling", "Budget Analysis"], businessUnitId: "bu2" },
  { id: "a5", name: "Procurement Agent", employeeId: "AIE-0031", role: "Strategic Sourcing Agent", department: "Procurement Intelligence", manager: "Mark Torres", status: "deployed", autonomyLevel: "supervised", utilizationPct: 89, slaPerformance: 91.3, costPerDay: 136, taskCount: 321, skills: ["Supplier Evaluation", "Contract Negotiation", "Risk Assessment", "Market Intelligence"], businessUnitId: "bu3" },
  { id: "a6", name: "Contract AI", employeeId: "AIE-0032", role: "Contract Lifecycle Agent", department: "Procurement Intelligence", manager: "Mark Torres", status: "deployed", autonomyLevel: "assisted", utilizationPct: 64, slaPerformance: 88.7, costPerDay: 97, taskCount: 143, skills: ["Contract Analysis", "Clause Extraction", "Compliance Check"], businessUnitId: "bu3" },
  { id: "a7", name: "Logistics Optimizer", employeeId: "AIE-0011", role: "Route Intelligence Agent", department: "Supply Chain Intelligence", manager: "James Chen", status: "deployed", autonomyLevel: "full", utilizationPct: 97, slaPerformance: 88.4, costPerDay: 162, taskCount: 543, skills: ["Route Optimization", "Fleet Telemetry", "Delay Prediction", "Dynamic Rerouting"], businessUnitId: "bu4" },
  { id: "a8", name: "Port Operations AI", employeeId: "AIE-0012", role: "Port Throughput Agent", department: "Supply Chain Intelligence", manager: "David Reyes", status: "deployed", autonomyLevel: "supervised", utilizationPct: 82, slaPerformance: 90.2, costPerDay: 134, taskCount: 298, skills: ["Berth Allocation", "Crane Scheduling", "Throughput Optimization"], businessUnitId: "bu4" },
  { id: "a9", name: "Fleet AI", employeeId: "AIE-0013", role: "Fleet Management Agent", department: "Supply Chain Intelligence", manager: "James Chen", status: "suspended", autonomyLevel: "supervised", utilizationPct: 0, slaPerformance: 84.1, costPerDay: 112, taskCount: 178, skills: ["Fleet Tracking", "Driver Communication", "Route Planning"], businessUnitId: "bu4" },
  { id: "a10", name: "Maintenance AI", employeeId: "AIE-0051", role: "Predictive Maintenance Agent", department: "Engineering Intelligence", manager: "Abdul Rahman", status: "deployed", autonomyLevel: "full", utilizationPct: 91, slaPerformance: 97.6, costPerDay: 148, taskCount: 389, skills: ["Acoustic Analysis", "Vibration Monitoring", "Failure Prediction", "Work Order Generation"], businessUnitId: "bu5" },
  { id: "a11", name: "OEE Optimizer", employeeId: "AIE-0052", role: "Manufacturing Excellence Agent", department: "Engineering Intelligence", manager: "Abdul Rahman", status: "deployed", autonomyLevel: "supervised", utilizationPct: 76, slaPerformance: 93.4, costPerDay: 122, taskCount: 241, skills: ["OEE Monitoring", "Root Cause Analysis", "Shift Optimization"], businessUnitId: "bu5" },
  { id: "a12", name: "Process Optimizer AI", employeeId: "AIE-0053", role: "Production Process Agent", department: "Engineering Intelligence", manager: "Mark Torres", status: "configured", autonomyLevel: "assisted", utilizationPct: 0, slaPerformance: 0, costPerDay: 88, taskCount: 0, skills: ["Process Simulation", "Batching Optimization", "SKU Analysis"], businessUnitId: "bu5" },
];

const agentDetails: Record<string, any> = {};
agents.forEach((a) => {
  agentDetails[a.id] = {
    ...a,
    tools: ["ERP API", "CRM API", "Analytics Platform", "Notification Service", "Document Store"],
    permissions: ["read:erp", "write:recommendations", "read:crm", "write:tasks"],
    budget: 5000,
    reasoning: `Agent ${a.name} is operating within normal parameters. Recent decisions aligned with policy constraints. No drift detected.`,
    memoryUsage: Math.round(Math.random() * 40 + 20),
    tokenUsage: Math.round(Math.random() * 2000000 + 500000),
    latency: +(Math.random() * 1.2 + 0.4).toFixed(2),
    accuracy: +(Math.random() * 8 + 90).toFixed(1),
    hallucination: +(Math.random() * 2).toFixed(2),
    policyCompliance: +(Math.random() * 3 + 96).toFixed(1),
    recentTasks: [],
  };
});

router.get("/summary", (req, res) => {
  const deployed = agents.filter((a) => a.status === "deployed").length;
  const avgUtil = +(agents.filter(a => a.status === "deployed").reduce((s, a) => s + a.utilizationPct, 0) / deployed).toFixed(1);
  const avgSla = +(agents.filter(a => a.status === "deployed").reduce((s, a) => s + a.slaPerformance, 0) / deployed).toFixed(1);
  const totalCost = agents.reduce((s, a) => s + a.costPerDay, 0);
  const byStatus = [
    { label: "Deployed", count: agents.filter(a => a.status === "deployed").length, value: null },
    { label: "Configured", count: agents.filter(a => a.status === "configured").length, value: null },
    { label: "Suspended", count: agents.filter(a => a.status === "suspended").length, value: null },
    { label: "Retired", count: agents.filter(a => a.status === "retired").length, value: null },
    { label: "Draft", count: agents.filter(a => a.status === "draft").length, value: null },
  ];
  const depts = [...new Set(agents.map((a) => a.department))];
  const byDepartment = depts.map((d) => ({ label: d, count: agents.filter((a) => a.department === d).length, value: null }));
  res.json({ totalAgents: agents.length, deployedAgents: deployed, avgUtilization: avgUtil, avgSla, totalDailyCost: totalCost, byStatus, byDepartment });
});

router.get("/", (req, res) => {
  res.json(agents);
});

router.get("/:id", (req, res) => {
  const detail = agentDetails[req.params.id];
  if (!detail) return res.status(404).json({ error: "Not found" });
  res.json(detail);
});

router.patch("/:id", (req, res) => {
  const agent = agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: "Not found" });
  const { status, autonomyLevel } = req.body;
  if (status) agent.status = status;
  if (autonomyLevel) agent.autonomyLevel = autonomyLevel;
  res.json(agent);
});

export default router;
