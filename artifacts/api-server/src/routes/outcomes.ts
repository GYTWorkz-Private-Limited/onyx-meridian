import { Router } from "express";

const router = Router();

const generateTrend = (base: number, days = 90, volatility = 2) => {
  const points = [];
  const now = new Date("2025-06-22");
  for (let i = days; i >= 0; i -= 7) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const v = +(base + (Math.random() - 0.4) * volatility + (days - i) * 0.02).toFixed(1);
    points.push({ date: d.toISOString().slice(0, 10), value: v });
  }
  return points;
};

const outcomesMetrics = {
  eeiTrend: generateTrend(74, 90, 3),
  businessUnitTrends: [
    { businessUnit: "Revenue Intelligence", trend: generateTrend(80, 90, 2) },
    { businessUnit: "Finance Intelligence", trend: generateTrend(72, 90, 2) },
    { businessUnit: "Procurement Intelligence", trend: generateTrend(68, 90, 3) },
    { businessUnit: "Supply Chain Intelligence", trend: generateTrend(65, 90, 4) },
    { businessUnit: "Engineering Intelligence", trend: generateTrend(76, 90, 2) },
  ],
  agentEfficiencyTrend: generateTrend(81, 90, 2),
  workflowEfficiencyTrend: generateTrend(78, 90, 3),
  learningMetrics: {
    accuracy: 91.4,
    reliability: 96.8,
    costEfficiency: 84.2,
    goalCompletion: 87.6,
    driftDetection: 98.1,
    qualityScore: 89.3,
  },
};

const businessResults = [
  { id: "br1", metric: "Productivity Improvement", value: 23.4, unit: "%", change: 4.2, period: "Q2 2025", businessUnit: "Enterprise", category: "productivity" },
  { id: "br2", metric: "Cost Reduction", value: 3.8, unit: "M", change: 12.1, period: "Q2 2025", businessUnit: "Enterprise", category: "cost" },
  { id: "br3", metric: "SLA Improvement", value: 94.2, unit: "%", change: 6.8, period: "Q2 2025", businessUnit: "Supply Chain Intelligence", category: "sla" },
  { id: "br4", metric: "Revenue Impact", value: 14.2, unit: "M", change: 18.3, period: "Q2 2025", businessUnit: "Revenue Intelligence", category: "revenue" },
  { id: "br5", metric: "Risk Reduction", value: 7.6, unit: "M", change: 31.2, period: "Q2 2025", businessUnit: "Enterprise", category: "risk" },
  { id: "br6", metric: "Finance Close Cycle", value: 3.2, unit: "days saved", change: 38.1, period: "Q2 2025", businessUnit: "Finance Intelligence", category: "productivity" },
  { id: "br7", metric: "Return on Investment", value: 4.1, unit: "x", change: 0.8, period: "Q2 2025", businessUnit: "Enterprise", category: "roi" },
  { id: "br8", metric: "Forecast Accuracy", value: 87.2, unit: "%", change: 9.4, period: "Q2 2025", businessUnit: "Enterprise", category: "productivity" },
  { id: "br9", metric: "Supplier On-Time Delivery", value: 84.2, unit: "%", change: -2.4, period: "Q2 2025", businessUnit: "Procurement Intelligence", category: "sla" },
  { id: "br10", metric: "Agent Operational Hours Saved", value: 14800, unit: "hrs", change: 22.7, period: "Q2 2025", businessUnit: "Enterprise", category: "productivity" },
];

router.get("/metrics", (req, res) => {
  res.json(outcomesMetrics);
});

router.get("/business-results", (req, res) => {
  res.json(businessResults);
});

export default router;
