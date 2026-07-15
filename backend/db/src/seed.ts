import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import {
  agentsTable,
  approvalCommentsTable,
  approvalsTable,
  auditLogsTable,
  businessResultsTable,
  businessUnitsTable,
  companiesTable,
  departmentsTable,
  documentsTable,
  goalsTable,
  insightsTable,
  kpiAgentLinksTable,
  kpiGoalLinksTable,
  kpisTable,
  opportunitiesTable,
  peopleTable,
  policiesTable,
  policyRulesTable,
  policyVersionsTable,
  policyViolationsTable,
  risksTable,
  riskScoresTable,
  sopAgentLinksTable,
  sopKpiLinksTable,
  sopPolicyLinksTable,
  sopsTable,
  systemsHealthTable,
  tasksTable,
  usersTable,
  workflowsTable,
} from "./schema";

async function seed() {
  console.log("Seeding manufacturing mock data...");

  // Reseed cleanly on every run: truncating the root `companies` row
  // cascades through every FK-linked table in the schema.
  await db.execute(sql`TRUNCATE TABLE ${companiesTable} CASCADE`);

  const [company] = await db
    .insert(companiesTable)
    .values({ name: "Meridian Industrial Group", industry: "Discrete Manufacturing" })
    .returning();

  const [production, quality, supplyChain, maintenance, safety] = await db
    .insert(businessUnitsTable)
    .values([
      {
        companyId: company.id,
        slug: "production",
        name: "Production",
        domain: "Assembly & Fabrication",
        color: "#2563eb",
        eeiScore: "84.2",
        healthScore: "88.0",
        status: "healthy",
        risk: "low",
        costMtd: "1420000",
        roi: "3.10",
        revenueProtected: "2100000",
        costSaved: "480000",
        hoursSaved: "3200",
        downtimePreventedHours: "140",
        automationPct: "62.0",
        forecastAccuracy: "91.5",
      },
      {
        companyId: company.id,
        slug: "quality",
        name: "Quality Assurance",
        domain: "Inspection & Compliance",
        color: "#16a34a",
        eeiScore: "79.5",
        healthScore: "82.0",
        status: "optimizing",
        risk: "medium",
        costMtd: "310000",
        roi: "2.40",
        revenueProtected: "950000",
        costSaved: "210000",
        hoursSaved: "1450",
        downtimePreventedHours: "60",
        automationPct: "54.0",
        forecastAccuracy: "88.0",
      },
      {
        companyId: company.id,
        slug: "supply-chain",
        name: "Supply Chain",
        domain: "Procurement & Logistics",
        color: "#d97706",
        eeiScore: "71.8",
        healthScore: "74.5",
        status: "at-risk",
        risk: "high",
        costMtd: "2650000",
        roi: "1.80",
        revenueProtected: "1300000",
        costSaved: "390000",
        hoursSaved: "2100",
        downtimePreventedHours: "35",
        automationPct: "41.0",
        forecastAccuracy: "76.0",
      },
      {
        companyId: company.id,
        slug: "maintenance",
        name: "Maintenance & Reliability",
        domain: "Predictive Maintenance",
        color: "#9333ea",
        eeiScore: "88.6",
        healthScore: "90.5",
        status: "healthy",
        risk: "low",
        costMtd: "540000",
        roi: "4.20",
        revenueProtected: "1750000",
        costSaved: "620000",
        hoursSaved: "2800",
        downtimePreventedHours: "410",
        automationPct: "70.0",
        forecastAccuracy: "93.0",
      },
      {
        companyId: company.id,
        slug: "safety-compliance",
        name: "Safety & Compliance",
        domain: "EHS & Regulatory",
        color: "#dc2626",
        eeiScore: "82.1",
        healthScore: "85.0",
        status: "healthy",
        risk: "medium",
        costMtd: "180000",
        roi: "2.90",
        revenueProtected: "0",
        costSaved: "260000",
        hoursSaved: "900",
        downtimePreventedHours: "20",
        automationPct: "48.0",
        forecastAccuracy: "89.5",
      },
    ])
    .returning();

  const departments = await db
    .insert(departmentsTable)
    .values([
      { businessUnitId: production.id, slug: "cnc-machining", name: "CNC Machining", function: "Precision fabrication", status: "healthy" },
      { businessUnitId: production.id, slug: "final-assembly", name: "Final Assembly", function: "Line assembly", status: "healthy" },
      { businessUnitId: quality.id, slug: "incoming-inspection", name: "Incoming Inspection", function: "Supplier material QA", status: "optimizing" },
      { businessUnitId: quality.id, slug: "spc-lab", name: "SPC Lab", function: "Statistical process control", status: "healthy" },
      { businessUnitId: supplyChain.id, slug: "procurement", name: "Procurement", function: "Raw material sourcing", status: "at-risk" },
      { businessUnitId: supplyChain.id, slug: "logistics", name: "Logistics", function: "Inbound/outbound freight", status: "at-risk" },
      { businessUnitId: maintenance.id, slug: "predictive-maint", name: "Predictive Maintenance", function: "Condition monitoring", status: "healthy" },
      { businessUnitId: safety.id, slug: "ehs", name: "EHS", function: "Environmental health & safety", status: "healthy" },
    ])
    .returning();

  const dept = Object.fromEntries(departments.map((d) => [d.slug, d]));

  const people = await db
    .insert(peopleTable)
    .values([
      { companyId: company.id, name: "Elena Sokolov", email: "elena.sokolov@meridian-industrial.com", title: "Chief Executive Officer", roleTier: "ceo", status: "active" },
      { companyId: company.id, businessUnitId: production.id, name: "Marcus Chen", email: "marcus.chen@meridian-industrial.com", title: "VP of Production", roleTier: "abu_head", status: "active" },
      { companyId: company.id, businessUnitId: quality.id, name: "Priya Nair", email: "priya.nair@meridian-industrial.com", title: "VP of Quality Assurance", roleTier: "abu_head", status: "active" },
      { companyId: company.id, businessUnitId: supplyChain.id, name: "Tom Kowalski", email: "tom.kowalski@meridian-industrial.com", title: "VP of Supply Chain", roleTier: "abu_head", status: "active" },
      { companyId: company.id, businessUnitId: maintenance.id, name: "Amara Okafor", email: "amara.okafor@meridian-industrial.com", title: "VP of Maintenance & Reliability", roleTier: "abu_head", status: "active" },
      { companyId: company.id, businessUnitId: safety.id, name: "James Rutherford", email: "james.rutherford@meridian-industrial.com", title: "VP of Safety & Compliance", roleTier: "abu_head", status: "active" },
      { companyId: company.id, businessUnitId: production.id, departmentId: dept["cnc-machining"].id, name: "Diego Alvarez", email: "diego.alvarez@meridian-industrial.com", title: "CNC Machining Manager", roleTier: "dept_manager", status: "active" },
      { companyId: company.id, businessUnitId: quality.id, departmentId: dept["spc-lab"].id, name: "Hannah Weiss", email: "hannah.weiss@meridian-industrial.com", title: "SPC Lab Manager", roleTier: "dept_manager", status: "active" },
      { companyId: company.id, businessUnitId: supplyChain.id, departmentId: dept["procurement"].id, name: "Ravi Deshpande", email: "ravi.deshpande@meridian-industrial.com", title: "Procurement Manager", roleTier: "dept_manager", status: "active" },
    ])
    .returning();

  const personByName = Object.fromEntries(people.map((p) => [p.name, p]));

  const agents = await db
    .insert(agentsTable)
    .values([
      {
        companyId: company.id, businessUnitId: production.id, departmentId: dept["cnc-machining"].id,
        employeeId: "AIE-1001", name: "Line Throughput Optimizer", role: "Production Scheduling Agent",
        managerId: personByName["Diego Alvarez"].id, status: "active", autonomyLevel: "supervised",
        utilizationPct: "78.5", slaPerformance: "96.2", costPerDay: "185.00", taskCount: 42,
        skills: ["scheduling", "bottleneck-detection", "OEE-optimization"], systems: ["MES", "SAP PP"],
        hoursSaved: "620", revenueProtected: "410000", downtimePreventedHours: "38", costSaved: "95000",
        automationPct: "68.0", roi: "3.40", eeiContribution: "6.20", health: "94.0",
        version: "2.3.1", model: "claude-sonnet-5", latencyMs: 340, accuracy: "97.10",
        hallucinationRate: "0.40", policyCompliance: "99.80", tokenUsage: 1200000, costMtd: "4200.00",
      },
      {
        companyId: company.id, businessUnitId: quality.id, departmentId: dept["spc-lab"].id,
        employeeId: "AIE-1002", name: "Defect Vision Inspector", role: "Automated Visual QA Agent",
        managerId: personByName["Hannah Weiss"].id, status: "active", autonomyLevel: "full",
        utilizationPct: "91.0", slaPerformance: "98.5", costPerDay: "140.00", taskCount: 310,
        skills: ["computer-vision", "defect-classification", "SPC"], systems: ["Vision System", "LIMS"],
        hoursSaved: "980", revenueProtected: "620000", downtimePreventedHours: "12", costSaved: "150000",
        automationPct: "82.0", roi: "4.10", eeiContribution: "7.80", health: "97.0",
        version: "4.0.0", model: "claude-sonnet-5", latencyMs: 210, accuracy: "99.20",
        hallucinationRate: "0.10", policyCompliance: "100.00", tokenUsage: 850000, costMtd: "3100.00",
      },
      {
        companyId: company.id, businessUnitId: supplyChain.id, departmentId: dept["procurement"].id,
        employeeId: "AIE-1003", name: "Supplier Risk Sentinel", role: "Procurement Risk Agent",
        managerId: personByName["Ravi Deshpande"].id, status: "watch", autonomyLevel: "supervised",
        utilizationPct: "64.0", slaPerformance: "88.0", costPerDay: "210.00", taskCount: 58,
        skills: ["supplier-scoring", "spend-analysis", "contract-review"], systems: ["SAP MM", "Ariba"],
        hoursSaved: "410", revenueProtected: "0", downtimePreventedHours: "0", costSaved: "180000",
        automationPct: "45.0", roi: "1.90", eeiContribution: "3.10", health: "71.0",
        version: "1.8.4", model: "claude-sonnet-5", latencyMs: 480, accuracy: "91.30",
        hallucinationRate: "1.80", policyCompliance: "94.50", tokenUsage: 640000, costMtd: "5600.00",
      },
      {
        companyId: company.id, businessUnitId: supplyChain.id, departmentId: dept["logistics"].id,
        employeeId: "AIE-1004", name: "Freight Routing Agent", role: "Logistics Optimization Agent",
        status: "critical", autonomyLevel: "assisted",
        utilizationPct: "35.0", slaPerformance: "58.0", costPerDay: "165.00", taskCount: 19,
        skills: ["route-optimization", "carrier-selection"], systems: ["TMS"],
        hoursSaved: "120", revenueProtected: "0", downtimePreventedHours: "0", costSaved: "40000",
        automationPct: "28.0", roi: "0.80", eeiContribution: "0.90", health: "38.0",
        version: "1.2.0", model: "claude-sonnet-5", latencyMs: 890, accuracy: "79.40",
        hallucinationRate: "4.20", policyCompliance: "81.00", tokenUsage: 210000, costMtd: "6100.00",
      },
      {
        companyId: company.id, businessUnitId: maintenance.id, departmentId: dept["predictive-maint"].id,
        employeeId: "AIE-1005", name: "Predictive Maintenance Sentinel", role: "Condition Monitoring Agent",
        managerId: personByName["Amara Okafor"].id, status: "active", autonomyLevel: "full",
        utilizationPct: "88.0", slaPerformance: "99.0", costPerDay: "155.00", taskCount: 220,
        skills: ["vibration-analysis", "failure-prediction", "work-order-generation"], systems: ["CMMS", "IoT Sensor Grid"],
        hoursSaved: "1450", revenueProtected: "1750000", downtimePreventedHours: "410", costSaved: "620000",
        automationPct: "76.0", roi: "5.60", eeiContribution: "9.40", health: "98.0",
        version: "3.5.2", model: "claude-sonnet-5", latencyMs: 260, accuracy: "98.70",
        hallucinationRate: "0.20", policyCompliance: "99.90", tokenUsage: 1100000, costMtd: "4700.00",
      },
      {
        companyId: company.id, businessUnitId: safety.id, departmentId: dept["ehs"].id,
        employeeId: "AIE-1006", name: "Incident Compliance Monitor", role: "EHS Compliance Agent",
        managerId: personByName["James Rutherford"].id, status: "active", autonomyLevel: "supervised",
        utilizationPct: "70.0", slaPerformance: "95.0", costPerDay: "120.00", taskCount: 76,
        skills: ["incident-triage", "OSHA-reporting", "PPE-compliance-vision"], systems: ["EHS Platform"],
        hoursSaved: "540", revenueProtected: "0", downtimePreventedHours: "0", costSaved: "150000",
        automationPct: "55.0", roi: "2.70", eeiContribution: "4.80", health: "92.0",
        version: "2.1.0", model: "claude-sonnet-5", latencyMs: 300, accuracy: "96.50",
        hallucinationRate: "0.60", policyCompliance: "99.10", tokenUsage: 480000, costMtd: "2400.00",
      },
    ])
    .returning();

  const agentByName = Object.fromEntries(agents.map((a) => [a.name, a]));

  const kpis = await db
    .insert(kpisTable)
    .values([
      { companyId: company.id, businessUnitId: production.id, slug: "oee", name: "Overall Equipment Effectiveness", abbreviation: "OEE", category: "Production", value: "84.20", unit: "%", target: "88.00", trend: "up", delta: "1.80", variance: "-3.80", healthScore: "88.0", status: "on-track", ownerId: personByName["Marcus Chen"].id, formula: "Availability x Performance x Quality", dataSource: "MES", updateFrequency: "hourly", forecastNext: "85.10" },
      { companyId: company.id, businessUnitId: quality.id, slug: "first-pass-yield", name: "First Pass Yield", abbreviation: "FPY", category: "Quality", value: "96.40", unit: "%", target: "98.00", trend: "up", delta: "0.60", variance: "-1.60", healthScore: "82.0", status: "on-track", ownerId: personByName["Priya Nair"].id, formula: "Units passed without rework / total units", dataSource: "LIMS", updateFrequency: "daily", forecastNext: "96.80" },
      { companyId: company.id, businessUnitId: supplyChain.id, slug: "otd", name: "On-Time Delivery", abbreviation: "OTD", category: "Supply Chain", value: "81.30", unit: "%", target: "95.00", trend: "down", delta: "-2.40", variance: "-13.70", healthScore: "58.0", status: "critical", ownerId: personByName["Tom Kowalski"].id, formula: "On-time shipments / total shipments", dataSource: "TMS", updateFrequency: "daily", forecastNext: "79.80" },
      { companyId: company.id, businessUnitId: maintenance.id, slug: "mtbf", name: "Mean Time Between Failures", abbreviation: "MTBF", category: "Maintenance", value: "412.00", unit: "hrs", target: "450.00", trend: "up", delta: "18.00", variance: "-38.00", healthScore: "90.0", status: "on-track", ownerId: personByName["Amara Okafor"].id, formula: "Total uptime / number of failures", dataSource: "CMMS", updateFrequency: "weekly", forecastNext: "421.00" },
      { companyId: company.id, businessUnitId: safety.id, slug: "trir", name: "Total Recordable Incident Rate", abbreviation: "TRIR", category: "Safety", value: "0.86", unit: "per 200k hrs", target: "0.60", trend: "down", delta: "-0.12", variance: "0.26", healthScore: "78.0", status: "watch", ownerId: personByName["James Rutherford"].id, formula: "(Recordable incidents x 200,000) / hours worked", dataSource: "EHS Platform", updateFrequency: "monthly", forecastNext: "0.79" },
    ])
    .returning();

  const kpiBySlug = Object.fromEntries(kpis.map((k) => [k.slug, k]));

  await db.insert(kpiAgentLinksTable).values([
    { kpiId: kpiBySlug["oee"].id, agentId: agentByName["Line Throughput Optimizer"].id },
    { kpiId: kpiBySlug["first-pass-yield"].id, agentId: agentByName["Defect Vision Inspector"].id },
    { kpiId: kpiBySlug["otd"].id, agentId: agentByName["Freight Routing Agent"].id },
    { kpiId: kpiBySlug["mtbf"].id, agentId: agentByName["Predictive Maintenance Sentinel"].id },
    { kpiId: kpiBySlug["trir"].id, agentId: agentByName["Incident Compliance Monitor"].id },
  ]);

  const policies = await db
    .insert(policiesTable)
    .values([
      { companyId: company.id, name: "Agent Budget Authorization Limits", type: "budget", scope: "All AI Agents", status: "active", enforcementLevel: "block", violationCount: 2, description: "Spend thresholds per agent role: Procurement $100K, Maintenance $75K, all others $50K. Exceeding requires manager approval." },
      { companyId: company.id, businessUnitId: safety.id, name: "Lockout-Tagout Compliance", type: "safety", scope: "Safety & Compliance", status: "active", enforcementLevel: "block", violationCount: 0, description: "All maintenance work orders on energized equipment must pass automated LOTO verification before agent-initiated dispatch." },
      { companyId: company.id, businessUnitId: quality.id, name: "First Pass Yield Deviation Escalation", type: "quality", scope: "Quality Assurance", status: "active", enforcementLevel: "warn", violationCount: 4, description: "FPY drops below 95% on any line trigger automatic SPC lab review and supervisor notification." },
      { companyId: company.id, name: "RBAC — Agent Data Access Tiers", type: "rbac", scope: "Enterprise", status: "active", enforcementLevel: "block", violationCount: 0, description: "Four-tier access model: Public, Internal, Confidential, Restricted. Cross-BU data access requires approval." },
      { companyId: company.id, businessUnitId: supplyChain.id, name: "Supplier Contract Approval Threshold", type: "compliance", scope: "Supply Chain", status: "active", enforcementLevel: "warn", violationCount: 3, description: "Contracts exceeding $100K require Procurement Manager review and CFO approval. Agents authorized up to $100K autonomously." },
      { companyId: company.id, name: "Human Oversight — High-Risk Actions", type: "behavior", scope: "All AI Agents", status: "active", enforcementLevel: "block", violationCount: 1, description: "Any action affecting >2 business units or classified P1 critical requires human approval before execution." },
      { companyId: company.id, businessUnitId: production.id, name: "OSHA Recordable Data Residency", type: "data", scope: "Production", status: "draft", enforcementLevel: "log", violationCount: 0, description: "Incident and injury data must remain on-premises infrastructure, not transferred to cloud analytics without redaction." },
      { companyId: company.id, name: "Agent Replacement Trigger — Risk Score > 75", type: "governance", scope: "Enterprise", status: "active", enforcementLevel: "warn", violationCount: 1, description: "Agents with risk score above 75 are flagged for replacement evaluation within 24 hours; suspension may be automatic." },
    ])
    .returning();

  const policyByName = Object.fromEntries(policies.map((p) => [p.name, p]));

  await db.insert(auditLogsTable).values([
    { companyId: company.id, businessUnitId: maintenance.id, policyId: policyByName["Lockout-Tagout Compliance"].id, action: "Dispatched work order on energized conveyor motor after LOTO verification", actorType: "agent", actorAgentId: agentByName["Predictive Maintenance Sentinel"].id, outcome: "approved", riskLevel: "medium", details: "LOTO checklist auto-verified against CMMS lock records prior to dispatch." },
    { companyId: company.id, businessUnitId: quality.id, policyId: policyByName["First Pass Yield Deviation Escalation"].id, action: "FPY breach on Line 3 — SPC lab review triggered", actorType: "agent", actorAgentId: agentByName["Defect Vision Inspector"].id, outcome: "escalated", riskLevel: "high", details: "First pass yield dropped to 91.2% on Line 3, below 95% threshold. Escalated to SPC Lab Manager." },
    { companyId: company.id, businessUnitId: supplyChain.id, policyId: policyByName["Supplier Contract Approval Threshold"].id, action: "Flagged supplier contract renewal exceeding $100K", actorType: "agent", actorAgentId: agentByName["Supplier Risk Sentinel"].id, outcome: "escalated", riskLevel: "high", details: "Contract with Titan Alloys Ltd. renewal at $142K exceeds autonomous authorization. Routed to Procurement Manager." },
    { companyId: company.id, businessUnitId: supplyChain.id, action: "Freight Routing Agent quarantined — repeated misroutes", actorType: "system", outcome: "auto-approved", riskLevel: "critical", details: "Agent accuracy dropped below threshold after carrier API schema change; automatically quarantined pending fix." },
    { companyId: company.id, businessUnitId: production.id, action: "Modified agent budget threshold — Maintenance raised to $75K", actorType: "human", actorPersonId: personByName["Elena Sokolov"].id, outcome: "approved", riskLevel: "medium", details: "Governance board approved raised autonomous budget threshold for Maintenance & Reliability agents." },
  ]);

  await db.insert(approvalsTable).values([
    { companyId: company.id, businessUnitId: supplyChain.id, title: "Freight Routing Agent Replacement — v1.3 Deployment", requestedByPersonId: personByName["Tom Kowalski"].id, type: "agent-replacement", priority: "urgent", status: "pending", estimatedImpact: "+22% Routing Accuracy, -60% Misroute Rate" },
    { companyId: company.id, businessUnitId: quality.id, title: "SPC Lab Automation Expansion — Line 3", requestedByAgentId: agentByName["Defect Vision Inspector"].id, type: "workflow", priority: "normal", status: "pending", estimatedImpact: "-18% Inspection Time, +4% FPY" },
    { companyId: company.id, businessUnitId: maintenance.id, title: "Predictive Maintenance Sentinel — Sensor Grid Expansion (Plant 2)", requestedByPersonId: personByName["Amara Okafor"].id, type: "agent-deployment", priority: "normal", status: "approved", estimatedImpact: "+9% MTBF, -12% Unplanned Downtime" },
    { companyId: company.id, businessUnitId: production.id, title: "Line Throughput Optimizer — Cross-Shift Scheduling Authorization", requestedByAgentId: agentByName["Line Throughput Optimizer"].id, type: "agent-action", priority: "urgent", status: "pending", estimatedImpact: "+6% OEE, -9% Changeover Time" },
  ]);

  await db.insert(riskScoresTable).values([
    { agentId: agentByName["Freight Routing Agent"].id, riskScore: "82.00", driftScore: "71.00", hallucinationRisk: "4.20", policyViolations: 3, unauthorizedActions: 1, status: "quarantined", riskReason: "Carrier API schema change caused systematic misrouting across 65% of shipments. Unauthorized carrier override detected.", replacementName: "Freight Routing Agent v1.3", replacementExpectedImprovement: "+22% Routing Accuracy, -85% Drift Score" },
    { agentId: agentByName["Supplier Risk Sentinel"].id, riskScore: "58.00", driftScore: "34.00", hallucinationRisk: "1.80", policyViolations: 1, unauthorizedActions: 0, status: "watch", riskReason: "Minor contract threshold breach detected. Within acceptable range but trending up.", replacementName: null, replacementExpectedImprovement: null },
    { agentId: agentByName["Line Throughput Optimizer"].id, riskScore: "12.00", driftScore: "6.00", hallucinationRisk: "0.40", policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacementName: null, replacementExpectedImprovement: null },
    { agentId: agentByName["Defect Vision Inspector"].id, riskScore: "6.00", driftScore: "3.00", hallucinationRisk: "0.10", policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacementName: null, replacementExpectedImprovement: null },
    { agentId: agentByName["Predictive Maintenance Sentinel"].id, riskScore: "8.00", driftScore: "4.00", hallucinationRisk: "0.20", policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacementName: null, replacementExpectedImprovement: null },
    { agentId: agentByName["Incident Compliance Monitor"].id, riskScore: "15.00", driftScore: "9.00", hallucinationRisk: "0.60", policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacementName: null, replacementExpectedImprovement: null },
  ]);

  await db.insert(tasksTable).values([
    { companyId: company.id, businessUnitId: supplyChain.id, departmentId: dept["logistics"].id, title: "Rebuild Freight Routing Agent carrier API adapter", status: "in-progress", priority: "p1", ownerType: "shared", ownerPersonId: personByName["Tom Kowalski"].id, ownerAgentId: agentByName["Freight Routing Agent"].id, linkedKpiId: kpiBySlug["otd"].id, dueDate: new Date("2026-07-22"), progress: 40, aiGenerated: false, workflow: "Carrier Integration Recovery", escalationStatus: "escalated", expectedOutcome: "Restore OTD to 95% target" },
    { companyId: company.id, businessUnitId: quality.id, departmentId: dept["spc-lab"].id, title: "Root-cause Line 3 FPY deviation", status: "todo", priority: "p2", ownerType: "human", ownerPersonId: personByName["Hannah Weiss"].id, linkedKpiId: kpiBySlug["first-pass-yield"].id, dueDate: new Date("2026-07-20"), progress: 0, aiGenerated: true, workflow: "SPC Deviation Review", escalationStatus: "none", expectedOutcome: "Identify tooling drift on Line 3" },
    { companyId: company.id, businessUnitId: maintenance.id, departmentId: dept["predictive-maint"].id, title: "Expand vibration sensor coverage to Plant 2 press line", status: "in-progress", priority: "p2", ownerType: "ai", ownerAgentId: agentByName["Predictive Maintenance Sentinel"].id, linkedKpiId: kpiBySlug["mtbf"].id, dueDate: new Date("2026-08-01"), progress: 65, aiGenerated: false, workflow: "Sensor Grid Expansion", escalationStatus: "none", expectedOutcome: "+9% MTBF on Plant 2 press line" },
    { companyId: company.id, businessUnitId: safety.id, departmentId: dept["ehs"].id, title: "File Q2 OSHA 300 log", status: "done", priority: "p2", ownerType: "human", ownerPersonId: personByName["James Rutherford"].id, linkedKpiId: kpiBySlug["trir"].id, dueDate: new Date("2026-07-10"), progress: 100, aiGenerated: false, workflow: "Regulatory Filing", escalationStatus: "none", expectedOutcome: "Regulatory compliance filed on time" },
  ]);

  await db.insert(workflowsTable).values([
    { companyId: company.id, businessUnitId: production.id, name: "Cross-Shift Changeover Optimization", status: "running", stepCount: 8, completedSteps: 5, priority: "p2", assignedAgentId: agentByName["Line Throughput Optimizer"].id, blockers: null, estimatedCompletion: new Date("2026-07-18") },
    { companyId: company.id, businessUnitId: supplyChain.id, name: "Carrier Integration Recovery", status: "blocked", stepCount: 6, completedSteps: 2, priority: "p1", assignedAgentId: agentByName["Freight Routing Agent"].id, blockers: "Awaiting carrier API credential rotation from IT", estimatedCompletion: new Date("2026-07-25") },
    { companyId: company.id, businessUnitId: maintenance.id, name: "Sensor Grid Expansion — Plant 2", status: "running", stepCount: 5, completedSteps: 3, priority: "p2", assignedAgentId: agentByName["Predictive Maintenance Sentinel"].id, blockers: null, estimatedCompletion: new Date("2026-08-01") },
  ]);

  await db.insert(insightsTable).values([
    { companyId: company.id, businessUnitId: supplyChain.id, type: "risk", title: "On-time delivery trending below target for 3 consecutive weeks", description: "OTD dropped from 88% to 81.3% following carrier API disruption.", confidence: "0.910", priority: "p1", impact: "High — customer SLA breach risk", businessImpact: "-$180K exposure in late-delivery penalties", kpiImpact: "-13.7% vs OTD target", evidence: ["Carrier API error logs", "Shipment tracking variance"], linkedKpiId: kpiBySlug["otd"].id },
    { companyId: company.id, businessUnitId: maintenance.id, type: "recommendation", title: "Expand predictive sensor coverage to Plant 2 press line", description: "Vibration pattern analysis suggests early bearing wear undetected on uninstrumented equipment.", confidence: "0.870", priority: "p2", impact: "Medium — potential unplanned downtime avoidance", businessImpact: "+9% MTBF projected", kpiImpact: "+18 hrs MTBF", evidence: ["Historical failure correlation", "Sensor gap analysis"], linkedKpiId: kpiBySlug["mtbf"].id },
    { companyId: company.id, businessUnitId: quality.id, type: "anomaly", title: "Line 3 tooling drift detected via SPC control charts", description: "Cpk trending downward over 5 shifts, correlating with FPY deviation.", confidence: "0.780", priority: "p2", impact: "Medium — quality escape risk", businessImpact: "Rework cost avoidance", kpiImpact: "-1.6% vs FPY target", evidence: ["SPC control chart Cpk trend"], linkedKpiId: kpiBySlug["first-pass-yield"].id },
  ]);

  await db.insert(documentsTable).values([
    { companyId: company.id, departmentId: dept["cnc-machining"].id, title: "CNC Changeover Standard Operating Procedure", type: "sop", usageCount: 214, relevanceScore: "0.930", summary: "Step-by-step changeover procedure minimizing setup time between part runs." },
    { companyId: company.id, departmentId: dept["ehs"].id, title: "Lockout-Tagout Policy v4", type: "policy", usageCount: 340, relevanceScore: "0.970", summary: "Energy isolation procedure required before any maintenance on powered equipment." },
    { companyId: company.id, departmentId: dept["spc-lab"].id, title: "Line 3 FPY Deviation — Root Cause Decision Log", type: "decision", usageCount: 18, relevanceScore: "0.640", summary: "Historical record of prior FPY deviation investigations and resolutions on Line 3." },
  ]);

  await db.insert(risksTable).values([
    { companyId: company.id, businessUnitId: supplyChain.id, title: "Single-source dependency on Titan Alloys for raw aluminum", severity: "high", impact: "Production halt risk if supplier disruption occurs", probability: "0.320", status: "active" },
    { companyId: company.id, businessUnitId: production.id, title: "Aging CNC spindle motors approaching end-of-life on Line 2", severity: "medium", impact: "Increased unplanned downtime risk over next 2 quarters", probability: "0.410", status: "mitigating" },
  ]);

  await db.insert(opportunitiesTable).values([
    { companyId: company.id, businessUnitId: maintenance.id, title: "Extend predictive maintenance to packaging line", estimatedValue: "310000", confidence: "0.760", status: "analyzing" },
    { companyId: company.id, businessUnitId: production.id, title: "Automate changeover sequencing across all CNC cells", estimatedValue: "480000", confidence: "0.680", status: "identified" },
  ]);

  await db.insert(businessResultsTable).values([
    { companyId: company.id, businessUnitId: production.id, metric: "Units Produced", value: "48200", unit: "units", change: "3.20", period: "2026-06", category: "efficiency" },
    { companyId: company.id, businessUnitId: quality.id, metric: "Scrap Rate", value: "1.80", unit: "%", change: "-0.30", period: "2026-06", category: "quality" },
    { companyId: company.id, businessUnitId: supplyChain.id, metric: "Freight Cost per Unit", value: "4.12", unit: "$", change: "0.45", period: "2026-06", category: "cost" },
    { companyId: company.id, businessUnitId: safety.id, metric: "Recordable Incidents", value: "2", unit: "count", change: "-1.00", period: "2026-06", category: "safety" },
  ]);

  await db.insert(systemsHealthTable).values([
    { companyId: company.id, name: "MES (Manufacturing Execution System)", status: "healthy", uptimePct: "99.80", lastSync: new Date() },
    { companyId: company.id, name: "SAP PP/MM", status: "healthy", uptimePct: "99.50", lastSync: new Date() },
    { companyId: company.id, name: "TMS (Transportation Management)", status: "degraded", uptimePct: "92.10", lastSync: new Date() },
    { companyId: company.id, name: "CMMS (Maintenance)", status: "healthy", uptimePct: "99.90", lastSync: new Date() },
  ]);

  // --- Policy Studio gap-fill: rules, violations, versions ---

  await db.insert(policyRulesTable).values([
    { policyId: policyByName["Agent Budget Authorization Limits"].id, field: "spend_amount_usd", operator: "gt", thresholdValue: "50000", action: "block", description: "Default spend cap for any agent role not explicitly listed." },
    { policyId: policyByName["Agent Budget Authorization Limits"].id, field: "spend_amount_usd", operator: "gt", thresholdValue: "100000", action: "block", description: "Procurement and Maintenance agent spend cap." },
    { policyId: policyByName["Lockout-Tagout Compliance"].id, field: "loto_verified", operator: "eq", thresholdValue: "false", action: "block", description: "Block any work order dispatch to energized equipment without LOTO verification." },
    { policyId: policyByName["First Pass Yield Deviation Escalation"].id, field: "fpy_pct", operator: "lt", thresholdValue: "95", action: "warn", description: "Trigger SPC lab review when first pass yield drops below 95%." },
    { policyId: policyByName["Supplier Contract Approval Threshold"].id, field: "contract_value_usd", operator: "gt", thresholdValue: "100000", action: "warn", description: "Route to Procurement Manager + CFO for contracts above $100K." },
    { policyId: policyByName["Agent Replacement Trigger — Risk Score > 75"].id, field: "risk_score", operator: "gt", thresholdValue: "75", action: "warn", description: "Flag agent for replacement evaluation." },
  ]);

  await db.insert(policyViolationsTable).values([
    { policyId: policyByName["First Pass Yield Deviation Escalation"].id, agentId: agentByName["Defect Vision Inspector"].id, description: "Line 3 FPY dropped to 91.2%, below the 95% threshold.", severity: "high", resolved: false },
    { policyId: policyByName["Supplier Contract Approval Threshold"].id, agentId: agentByName["Supplier Risk Sentinel"].id, description: "Titan Alloys Ltd. contract renewal at $142K exceeded autonomous authorization without prior escalation.", severity: "medium", resolved: true, resolvedAt: new Date("2026-06-25") },
    { policyId: policyByName["Agent Budget Authorization Limits"].id, agentId: agentByName["Freight Routing Agent"].id, description: "Unauthorized carrier override committed spend above role threshold.", severity: "critical", resolved: false },
    { policyId: policyByName["Agent Replacement Trigger — Risk Score > 75"].id, agentId: agentByName["Freight Routing Agent"].id, description: "Risk score reached 82, exceeding the 75 replacement-evaluation trigger.", severity: "high", resolved: false },
  ]);

  await db.insert(policyVersionsTable).values([
    { policyId: policyByName["Lockout-Tagout Compliance"].id, version: 1, status: "deprecated", changeSummary: "Initial LOTO policy draft.", snapshot: { enforcementLevel: "warn", description: "Manual LOTO checklist required before maintenance dispatch." }, createdByPersonId: personByName["James Rutherford"].id, createdAt: new Date("2026-01-10") },
    { policyId: policyByName["Lockout-Tagout Compliance"].id, version: 2, status: "active", changeSummary: "Upgraded to blocking enforcement with automated CMMS lock-record verification.", snapshot: { enforcementLevel: "block", description: policyByName["Lockout-Tagout Compliance"].description }, createdByPersonId: personByName["James Rutherford"].id, createdAt: new Date("2026-03-10") },
    { policyId: policyByName["OSHA Recordable Data Residency"].id, version: 1, status: "draft", changeSummary: "Initial draft pending legal review.", snapshot: { enforcementLevel: "log", description: policyByName["OSHA Recordable Data Residency"].description }, createdByPersonId: personByName["James Rutherford"].id },
  ]);

  // --- Broader backend gap-fill: SOPs, goals, approval comments ---

  const [cncSop, spcSop] = await db
    .insert(sopsTable)
    .values([
      { companyId: company.id, businessUnitId: production.id, title: "CNC Changeover & Setup", ownerId: personByName["Diego Alvarez"].id, version: "3.1", automationPct: "68.0", risk: "medium", status: "active", workflowSteps: ["Pull next work order from MES", "Validate tooling against BOM", "Run automated changeover sequence", "Verify first-article inspection"], systems: ["MES", "SAP PP"] },
      { companyId: company.id, businessUnitId: quality.id, title: "SPC Deviation Response", ownerId: personByName["Hannah Weiss"].id, version: "2.0", automationPct: "54.0", risk: "high", status: "active", workflowSteps: ["Detect Cpk trend breach", "Pull control chart history", "Notify SPC Lab Manager", "Open root-cause task"], systems: ["LIMS", "Vision System"] },
    ])
    .returning();

  await db.insert(sopKpiLinksTable).values([
    { sopId: cncSop.id, kpiId: kpiBySlug["oee"].id },
    { sopId: spcSop.id, kpiId: kpiBySlug["first-pass-yield"].id },
  ]);
  await db.insert(sopAgentLinksTable).values([
    { sopId: cncSop.id, agentId: agentByName["Line Throughput Optimizer"].id },
    { sopId: spcSop.id, agentId: agentByName["Defect Vision Inspector"].id },
  ]);
  await db.insert(sopPolicyLinksTable).values([
    { sopId: spcSop.id, policyId: policyByName["First Pass Yield Deviation Escalation"].id },
  ]);

  const [otdGoal, mtbfGoal] = await db
    .insert(goalsTable)
    .values([
      { companyId: company.id, businessUnitId: supplyChain.id, title: "Restore On-Time Delivery to 95%", targetValue: "95.00", currentValue: "81.30", dueDate: new Date("2026-09-30"), status: "at-risk" },
      { companyId: company.id, businessUnitId: maintenance.id, title: "Raise MTBF to 450 hours plant-wide", targetValue: "450.00", currentValue: "412.00", dueDate: new Date("2026-12-31"), status: "on-track" },
    ])
    .returning();

  await db.insert(kpiGoalLinksTable).values([
    { kpiId: kpiBySlug["otd"].id, goalId: otdGoal.id },
    { kpiId: kpiBySlug["mtbf"].id, goalId: mtbfGoal.id },
  ]);

  const approvals = await db.select().from(approvalsTable);
  const freightApproval = approvals.find((a) => a.title.startsWith("Freight Routing Agent Replacement"))!;
  const sensorApproval = approvals.find((a) => a.title.startsWith("Predictive Maintenance Sentinel"))!;

  await db.insert(approvalCommentsTable).values([
    { approvalId: freightApproval.id, authorId: personByName["Tom Kowalski"].id, comment: "Requesting expedited review — misroutes are actively affecting OTD." },
    { approvalId: freightApproval.id, authorId: personByName["Elena Sokolov"].id, comment: "Approved pending confirmation that v1.3 has passed staging validation." },
    { approvalId: sensorApproval.id, authorId: personByName["Amara Okafor"].id, comment: "Sensor procurement lead time confirmed at 3 weeks; budget already allocated." },
  ]);

  // --- Logins: replaces the frontend's mocked persona switcher (rbac.ts) ---
  // Mock/dev credential store — plaintext by design, simple passwords per request.

  // Usernames are role-based (matching the frontend's org-model ABUs in
  // rbac.ts) rather than person names, so it's obvious at the login screen
  // which app role/scope each account exercises.
  const LOGINS: { name: string; username: string; password: string }[] = [
    { name: "Elena Sokolov", username: "cxo", password: "meridian123" },
    { name: "Marcus Chen", username: "manufacturing-abu", password: "meridian123" },
    { name: "Priya Nair", username: "procurement-abu", password: "meridian123" },
    { name: "Tom Kowalski", username: "supply-chain-abu", password: "meridian123" },
    { name: "Amara Okafor", username: "finance-abu", password: "meridian123" },
    { name: "James Rutherford", username: "revenue-abu", password: "meridian123" },
    { name: "Diego Alvarez", username: "manufacturing-manager", password: "meridian123" },
    { name: "Hannah Weiss", username: "employee", password: "meridian123" },
    { name: "Ravi Deshpande", username: "procurement-manager", password: "meridian123" },
  ];

  await db.insert(usersTable).values(
    LOGINS.map((l) => ({ personId: personByName[l.name].id, username: l.username, password: l.password })),
  );

  console.log(`Seed complete: company=${company.id}`);
  console.log("\nLogin credentials:");
  console.table(
    LOGINS.map((l) => ({
      username: l.username,
      password: l.password,
      name: l.name,
      title: personByName[l.name].title,
      role: personByName[l.name].roleTier,
    })),
  );

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
