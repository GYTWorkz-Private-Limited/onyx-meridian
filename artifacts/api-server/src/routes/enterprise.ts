import { Router } from "express";

const router = Router();

const enterpriseSummary = {
  eeiScore: 78.4,
  eeiTrend: 2.1,
  businessHealth: 82.0,
  governanceHealth: 94.5,
  aiWorkforceHealth: 87.3,
  revenueImpact: 14200000,
  costSavings: 3800000,
  riskExposure: 7600000,
  activeEscalations: 3,
  forecastAccuracy: 87.2,
  productivityImprovement: 23.4,
  activeBusinessUnits: 5,
  totalAgents: 42,
  activeWorkflows: 18,
};

const risks = [
  {
    id: "r1",
    title: "Supply Chain OTIF degradation — Route 4 congestion",
    severity: "critical",
    businessUnit: "Supply Chain Intelligence",
    impact: "Q3 Supply Chain goal at risk — $2.1M penalty exposure",
    probability: 0.82,
    status: "active",
    detectedAt: "2025-06-20T08:30:00Z",
  },
  {
    id: "r2",
    title: "Line B Extruder bearing fatigue — acoustic anomaly",
    severity: "critical",
    businessUnit: "Engineering Intelligence",
    impact: "OEE -8% — $240K unplanned downtime risk",
    probability: 0.94,
    status: "mitigating",
    detectedAt: "2025-06-21T14:20:00Z",
  },
  {
    id: "r3",
    title: "Supplier B material buffer depletion in 4 days",
    severity: "high",
    businessUnit: "Procurement Intelligence",
    impact: "Production risk — buffer below safety stock threshold",
    probability: 0.76,
    status: "active",
    detectedAt: "2025-06-22T06:00:00Z",
  },
  {
    id: "r4",
    title: "Finance close cycle delay — ERP sync lag",
    severity: "medium",
    businessUnit: "Finance Intelligence",
    impact: "Q2 reporting delayed — regulatory filing risk",
    probability: 0.61,
    status: "mitigating",
    detectedAt: "2025-06-19T11:00:00Z",
  },
  {
    id: "r5",
    title: "Revenue pipeline concentration — 3 accounts at 61% of Q3",
    severity: "high",
    businessUnit: "Revenue Intelligence",
    impact: "Q3 revenue at risk if any account churns",
    probability: 0.55,
    status: "active",
    detectedAt: "2025-06-18T09:00:00Z",
  },
];

const opportunities = [
  {
    id: "o1",
    title: "Reroute Route 4 logistics via Highway 12 corridor",
    businessUnit: "Supply Chain Intelligence",
    estimatedValue: 720000,
    confidence: 0.88,
    status: "analyzing",
    detectedAt: "2025-06-22T07:00:00Z",
  },
  {
    id: "o2",
    title: "Enable predictive Berth 7 crane allocation",
    businessUnit: "Supply Chain Intelligence",
    estimatedValue: 340000,
    confidence: 0.76,
    status: "actioning",
    detectedAt: "2025-06-21T10:00:00Z",
  },
  {
    id: "o3",
    title: "Activate spot purchase agreement with Supplier B",
    businessUnit: "Procurement Intelligence",
    estimatedValue: 180000,
    confidence: 0.82,
    status: "identified",
    detectedAt: "2025-06-20T13:00:00Z",
  },
  {
    id: "o4",
    title: "Expand Enterprise tier accounts — 14 qualified leads",
    businessUnit: "Revenue Intelligence",
    estimatedValue: 4200000,
    confidence: 0.71,
    status: "actioning",
    detectedAt: "2025-06-19T08:00:00Z",
  },
];

const intelligenceFeed = [
  {
    id: "if1",
    type: "risk",
    title: "Route 4 congestion — 340% latency spike detected",
    description: "Pattern recognition shows Route 4 congestion increases latency 340% during 14:00–16:00 shift overlap windows. Rerouting via 7B resolves 73% of incidents.",
    businessUnit: "Supply Chain Intelligence",
    timestamp: "2025-06-22T09:24:00Z",
    priority: "p1",
    confidence: 0.92,
  },
  {
    id: "if2",
    type: "recommendation",
    title: "Schedule preventive maintenance on Line B Extruder bearing",
    description: "Acoustic anomaly detected. Preventive maintenance prevents estimated $240K unplanned downtime.",
    businessUnit: "Engineering Intelligence",
    timestamp: "2025-06-22T08:15:00Z",
    priority: "p1",
    confidence: 0.94,
  },
  {
    id: "if3",
    type: "insight",
    title: "Finance close cycle automated — 3.2 day reduction achieved",
    description: "AI-assisted reconciliation reduced monthly close from 8.4 to 5.2 days. Regulatory risk cleared.",
    businessUnit: "Finance Intelligence",
    timestamp: "2025-06-21T16:00:00Z",
    priority: "p2",
    confidence: 0.99,
  },
  {
    id: "if4",
    type: "alert",
    title: "Supplier B buffer approaching depletion threshold",
    description: "Current depletion rate projects 4-day buffer breach. Spot purchase window closing.",
    businessUnit: "Procurement Intelligence",
    timestamp: "2025-06-22T06:30:00Z",
    priority: "p1",
    confidence: 0.87,
  },
  {
    id: "if5",
    type: "outcome",
    title: "Q2 pipeline conversion +18% — Revenue Intelligence impact",
    description: "AI-assisted opportunity scoring contributed $2.1M in closed revenue. Predictive churn model prevented 4 at-risk accounts.",
    businessUnit: "Revenue Intelligence",
    timestamp: "2025-06-20T14:00:00Z",
    priority: "p2",
    confidence: 0.91,
  },
  {
    id: "if6",
    type: "insight",
    title: "Berth 7 throughput +15% — crane optimization active",
    description: "Dynamic allocation algorithm handling 3 extra ships per week. Port backlog cleared.",
    businessUnit: "Supply Chain Intelligence",
    timestamp: "2025-06-21T11:00:00Z",
    priority: "p2",
    confidence: 0.84,
  },
];

const digitalTwin = {
  eeiScore: 78.4,
  businessUnits: [
    { id: "bu1", name: "Revenue Intelligence", eeiScore: 84.2, health: 91, agentCount: 9, activeWorkflows: 4, risk: "low", kpiCount: 7 },
    { id: "bu2", name: "Finance Intelligence", eeiScore: 76.8, health: 88, agentCount: 7, activeWorkflows: 3, risk: "medium", kpiCount: 6 },
    { id: "bu3", name: "Procurement Intelligence", eeiScore: 71.3, health: 74, agentCount: 8, activeWorkflows: 4, risk: "high", kpiCount: 8 },
    { id: "bu4", name: "Supply Chain Intelligence", eeiScore: 68.9, health: 67, agentCount: 10, activeWorkflows: 5, risk: "critical", kpiCount: 9 },
    { id: "bu5", name: "Engineering Intelligence", eeiScore: 79.6, health: 83, agentCount: 8, activeWorkflows: 2, risk: "high", kpiCount: 7 },
  ],
  systemsHealth: [
    { id: "s1", name: "ERP System", status: "healthy", uptime: 99.8, lastSync: "4 min ago" },
    { id: "s2", name: "IoT Sensor Network", status: "degraded", uptime: 97.3, lastSync: "2 min ago" },
    { id: "s3", name: "Logistics API", status: "healthy", uptime: 100, lastSync: "Real-time" },
    { id: "s4", name: "Market Data Feed", status: "healthy", uptime: 98.2, lastSync: "1 min ago" },
    { id: "s5", name: "CRM Platform", status: "healthy", uptime: 99.5, lastSync: "8 min ago" },
  ],
  totalDecisions: 14872,
  humanWorkforce: 2840,
  aiWorkforce: 42,
  scenarioMode: false,
};

router.get("/summary", (req, res) => {
  res.json(enterpriseSummary);
});

router.get("/risks", (req, res) => {
  res.json(risks);
});

router.get("/opportunities", (req, res) => {
  res.json(opportunities);
});

router.get("/intelligence-feed", (req, res) => {
  res.json(intelligenceFeed);
});

router.get("/digital-twin", (req, res) => {
  res.json(digitalTwin);
});

export default router;
