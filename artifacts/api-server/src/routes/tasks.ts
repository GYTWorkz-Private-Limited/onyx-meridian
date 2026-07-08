import { Router } from "express";

const router = Router();

let tasks: any[] = [
  {
    id: "t1",
    title: "Reallocate AI SDR Employees to Enterprise Accounts",
    status: "in-progress",
    priority: "p1",
    owner: "Revenue Operations Lead",
    ownerType: "human",
    linkedKpi: "Pipeline Conversion",
    dueDate: "2026-06-28",
    progress: 35,
    businessUnitId: "revenue",
    companyId: "company-a",
    aiGenerated: true,
    department: "Revenue Intelligence",
    workflow: "APAC Enterprise Account Recovery",
    dependencies: [],
    escalationStatus: "none",
    linkedRecommendation: "Pipeline conversion in APAC declined 11% over 30 days",
    expectedOutcome: "+8% Pipeline Conversion, +$1.2M Revenue Potential",
  },
  {
    id: "t2",
    title: "Launch Strategic Account Retention Workflow",
    status: "todo",
    priority: "p1",
    owner: "Customer Success AI Employee",
    ownerType: "ai",
    linkedKpi: "Customer Retention",
    dueDate: "2026-06-26",
    progress: 0,
    businessUnitId: "revenue",
    companyId: "company-a",
    aiGenerated: true,
    department: "Customer Intelligence",
    workflow: "Strategic Account Churn Prevention",
    dependencies: [],
    escalationStatus: "none",
    linkedRecommendation: "Strategic account churn risk exceeds threshold across 6 enterprise accounts",
    expectedOutcome: "-6% Churn Risk, +4% Customer Retention",
  },
  {
    id: "t3",
    title: "Reduce Invoice Approval Cycle Time",
    status: "in-progress",
    priority: "p1",
    owner: "Finance Operations Manager",
    ownerType: "human",
    linkedKpi: "Approval Cycle Time",
    dueDate: "2026-06-30",
    progress: 45,
    businessUnitId: "finance",
    companyId: "company-a",
    aiGenerated: true,
    department: "Finance Intelligence",
    workflow: "Invoice Approval Automation",
    dependencies: ["t5"],
    escalationStatus: "none",
    linkedRecommendation: "Invoice approval cycle time increased 18% vs Q1 baseline",
    expectedOutcome: "-14% Approval Time, +9% Finance Efficiency",
  },
  {
    id: "t4",
    title: "Optimize Release Validation Workflow",
    status: "blocked",
    priority: "p2",
    owner: "Engineering AI Employee",
    ownerType: "ai",
    linkedKpi: "Engineering Throughput",
    dueDate: "2026-07-05",
    progress: 20,
    businessUnitId: "manufacturing",
    companyId: "company-a",
    aiGenerated: true,
    department: "Engineering Intelligence",
    workflow: "Release Pipeline Rebalancing",
    dependencies: ["t6"],
    escalationStatus: "escalated",
    linkedRecommendation: "Release throughput declined 14% — AI and human review workload imbalanced",
    expectedOutcome: "+11% Throughput, -18% Lead Time",
  },
  {
    id: "t5",
    title: "Resolve Procurement-Finance Workflow Bottleneck",
    status: "in-progress",
    priority: "p1",
    owner: "Operations Coordinator",
    ownerType: "human",
    linkedKpi: "Workflow Cycle Time",
    dueDate: "2026-06-27",
    progress: 55,
    businessUnitId: "procurement",
    companyId: "company-a",
    aiGenerated: true,
    department: "Operations Intelligence",
    workflow: "Cross-BU Approval Automation",
    dependencies: [],
    escalationStatus: "none",
    linkedRecommendation: "38% of procurement approvals stalling at Finance review — avg 4.2 day delay",
    expectedOutcome: "-22% Cycle Time, +15% Operational Efficiency",
  },
  {
    id: "t6",
    title: "Deploy Engineering AI Employee — Code Review Module",
    status: "todo",
    priority: "p2",
    owner: "Engineering Lead",
    ownerType: "human",
    linkedKpi: "Engineering Throughput",
    dueDate: "2026-07-03",
    progress: 0,
    businessUnitId: "manufacturing",
    companyId: "company-a",
    aiGenerated: false,
    department: "Engineering Intelligence",
    workflow: "AI Workforce Expansion",
    dependencies: [],
    escalationStatus: "none",
    linkedRecommendation: "Release throughput declined 14% vs target",
    expectedOutcome: "+11% Throughput, -18% Lead Time",
  },
  {
    id: "t7",
    title: "Execute Q2 Revenue Reconciliation Sign-off",
    status: "done",
    priority: "p1",
    owner: "Finance AI Employee",
    ownerType: "ai",
    linkedKpi: "Close Cycle Duration",
    dueDate: "2026-06-22",
    progress: 100,
    businessUnitId: "finance",
    companyId: "company-a",
    aiGenerated: true,
    department: "Finance Intelligence",
    workflow: "Q2 Financial Close",
    dependencies: [],
    escalationStatus: "none",
    linkedRecommendation: "Q2 financial close timeline at risk — manual reconciliation backlog",
    expectedOutcome: "-3 Day Close Cycle, +9% Finance Efficiency",
  },
  {
    id: "t8",
    title: "Scale Customer Intelligence Data Pipeline",
    status: "in-progress",
    priority: "p2",
    owner: "Operations Coordinator",
    ownerType: "shared",
    linkedKpi: "Customer Retention",
    dueDate: "2026-07-08",
    progress: 30,
    businessUnitId: "revenue",
    companyId: "company-a",
    aiGenerated: false,
    department: "Customer Intelligence",
    workflow: "Customer Intelligence Data Pipeline Scale",
    dependencies: ["t2"],
    escalationStatus: "none",
    linkedRecommendation: "Strategic account churn risk exceeds threshold",
    expectedOutcome: "+4% Customer Retention",
  },
];

let nextId = 9;

router.get("/", (req, res) => {
  res.json(tasks);
});

router.post("/", (req, res) => {
  const { title, priority, owner, ownerType, linkedKpi, dueDate, businessUnitId, department, workflow } = req.body;
  const task = {
    id: `t${nextId++}`,
    title,
    status: "todo",
    priority,
    owner,
    ownerType: ownerType || "human",
    linkedKpi,
    dueDate,
    progress: 0,
    businessUnitId,
    companyId: "company-a",
    aiGenerated: false,
    department: department || null,
    workflow: workflow || null,
    dependencies: [],
    escalationStatus: "none",
    linkedRecommendation: null,
    expectedOutcome: null,
  };
  tasks.push(task);
  res.status(201).json(task);
});

router.patch("/:id", (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Not found" });
  const { title, status, priority, progress, owner, ownerType, escalationStatus } = req.body;
  if (title !== undefined) task.title = title;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (progress !== undefined) task.progress = progress;
  if (owner !== undefined) task.owner = owner;
  if (ownerType !== undefined) task.ownerType = ownerType;
  if (escalationStatus !== undefined) task.escalationStatus = escalationStatus;
  res.json(task);
});

export default router;
