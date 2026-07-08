import { Router } from "express";

const router = Router();

const auditLogs = [
  { id: "al1", action: "Reallocated AI SDR capacity to enterprise accounts — APAC", actor: "Revenue Scout AI Employee", actorType: "agent", timestamp: "2026-06-22T09:30:00Z", businessUnit: "Revenue Intelligence", outcome: "approved", riskLevel: "medium", details: "Revenue Orchestrator initiated SDR reallocation. Human sign-off obtained from Sarah Kim (Revenue Operations Lead)." },
  { id: "al2", action: "Launched strategic account retention workflow — 6 accounts", actor: "Customer Success AI Employee", actorType: "agent", timestamp: "2026-06-22T08:15:00Z", businessUnit: "Revenue Intelligence", outcome: "auto-approved", riskLevel: "low", details: "Within CRM engagement policy scope. Churn risk score exceeded 0.72 threshold — automated workflow triggered." },
  { id: "al3", action: "Generated invoice approval routing optimization proposal", actor: "Finance Operations AI Employee", actorType: "agent", timestamp: "2026-06-21T16:40:00Z", businessUnit: "Finance Intelligence", outcome: "escalated", riskLevel: "high", details: "Workflow modification exceeds Finance Operations Manager approval threshold. Escalated to CFO for review." },
  { id: "al4", action: "Accessed cross-BU procurement approval queue — 47 records", actor: "Operations Coordinator AI", actorType: "agent", timestamp: "2026-06-21T14:20:00Z", businessUnit: "Operations Intelligence", outcome: "approved", riskLevel: "low", details: "Standard data access within agent permissions. Cross-BU workflow analysis authorized." },
  { id: "al5", action: "Flagged release validation bottleneck — Engineering AI paused", actor: "Engineering AI Employee", actorType: "agent", timestamp: "2026-06-21T14:25:00Z", businessUnit: "Engineering Intelligence", outcome: "escalated", riskLevel: "high", details: "Blocked pending Engineering Lead approval for workload reallocation. Escalated to Engineering Lead." },
  { id: "al6", action: "Modified approval matrix — Agent budget threshold increased", actor: "Elena Sokolov", actorType: "human", timestamp: "2026-06-20T11:00:00Z", businessUnit: "Enterprise", outcome: "approved", riskLevel: "medium", details: "Finance AI Employee budget threshold increased from $50K to $100K. Governance board approval obtained." },
  { id: "al7", action: "Fleet AI suspended — GPS API dependency failure", actor: "System", actorType: "system", timestamp: "2026-06-15T16:00:00Z", businessUnit: "Supply Chain Intelligence", outcome: "auto-approved", riskLevel: "medium", details: "Fleet AI automatically quarantined due to dependency failure and behavioral drift. Replacement evaluation initiated." },
  { id: "al8", action: "Revenue Scout accessed enterprise competitive intelligence data", actor: "Revenue Scout AI Employee", actorType: "agent", timestamp: "2026-06-20T09:15:00Z", businessUnit: "Revenue Intelligence", outcome: "approved", riskLevel: "low", details: "Market intelligence access within approved data sources. APAC competitor pricing retrieved." },
  { id: "al9", action: "Procurement-Finance workflow bottleneck flagged — 38% stall rate", actor: "Operations Intelligence Engine", actorType: "system", timestamp: "2026-06-22T07:00:00Z", businessUnit: "Operations Intelligence", outcome: "escalated", riskLevel: "high", details: "Cross-BU threshold breach escalated to Operations Coordinator and CFO." },
  { id: "al10", action: "Budget reallocation request — $420K Operations expansion", actor: "Finance Operations AI Employee", actorType: "agent", timestamp: "2026-06-19T13:30:00Z", businessUnit: "Finance Intelligence", outcome: "rejected", riskLevel: "critical", details: "Exceeds agent authorization level. Rejected pending CFO and Governance Board review." },
];

const policies = [
  { id: "p1", name: "Agent Budget Authorization Limits", type: "budget", scope: "All AI Employees", status: "active", enforcementLevel: "block", violationCount: 3, lastUpdated: "2026-06-20", description: "Defines spending thresholds per AI Employee role. Finance: $100K. Procurement: $100K. All others: $50K. Exceeding limit requires Manager approval." },
  { id: "p2", name: "RBAC — AI Employee Data Access Tiers", type: "rbac", scope: "Enterprise", status: "active", enforcementLevel: "block", violationCount: 0, lastUpdated: "2026-05-15", description: "Four-tier data access framework: Public, Internal, Confidential, Restricted. AI Employees inherit role-based access. Cross-BU data requires approval." },
  { id: "p3", name: "Regulatory Compliance — Financial Decisions", type: "compliance", scope: "Finance Intelligence", status: "active", enforcementLevel: "block", violationCount: 1, lastUpdated: "2026-04-01", description: "All financial decisions exceeding $50K require human CFO sign-off. Automated reconciliation allowed within defined bounds per SOX controls." },
  { id: "p4", name: "AI Employee Behavior — No External Communication", type: "behavior", scope: "All AI Employees", status: "active", enforcementLevel: "block", violationCount: 0, lastUpdated: "2026-03-10", description: "AI Employees may not communicate with external parties without explicit human approval. All external actions logged and auditable." },
  { id: "p5", name: "Data Residency — EU Customer Records", type: "data", scope: "Revenue Intelligence", status: "active", enforcementLevel: "block", violationCount: 0, lastUpdated: "2026-02-20", description: "EU customer data must remain within EU infrastructure. Revenue Scout and Customer Success AI cannot transfer EU data cross-region." },
  { id: "p6", name: "Supplier Contract Approval — >$100K", type: "compliance", scope: "Procurement Intelligence", status: "active", enforcementLevel: "warn", violationCount: 2, lastUpdated: "2026-06-20", description: "All supplier contracts exceeding $100K require Procurement Manager review and CFO approval. Procurement AI authorized up to $100K autonomously." },
  { id: "p7", name: "Human Oversight — High-Risk Workflow Execution", type: "behavior", scope: "All AI Employees", status: "active", enforcementLevel: "block", violationCount: 0, lastUpdated: "2026-01-15", description: "Any workflow classified as P1 Critical or affecting >2 Business Units requires human approval before execution." },
  { id: "p8", name: "Agent Replacement Trigger — Risk Score >75", type: "governance", scope: "Enterprise", status: "active", enforcementLevel: "warn", violationCount: 1, lastUpdated: "2026-06-15", description: "AI Employees with risk score >75 are flagged for replacement evaluation. Governance board notified within 24 hours. Suspension may be automatic." },
];

const approvals = [
  { id: "ap1", title: "Invoice Approval Workflow Automation — Finance Intelligence", requestedBy: "Finance Operations AI Employee", requestedAt: "2026-06-22T08:15:00Z", type: "workflow", priority: "urgent", status: "pending", businessUnit: "Finance Intelligence", estimatedImpact: "-14% Approval Time, +9% Finance Efficiency" },
  { id: "ap2", title: "APAC AI SDR Reallocation — Enterprise Tier", requestedBy: "Revenue Orchestrator", requestedAt: "2026-06-22T09:00:00Z", type: "agent-action", priority: "urgent", status: "approved", businessUnit: "Revenue Intelligence", estimatedImpact: "+8% Pipeline Conversion, +$1.2M Revenue Potential" },
  { id: "ap3", title: "Fleet AI Replacement — Fleet AI v2.4 Deployment", requestedBy: "Governance System", requestedAt: "2026-06-22T11:00:00Z", type: "agent-replacement", priority: "urgent", status: "pending", businessUnit: "Supply Chain Intelligence", estimatedImpact: "+14% Routing Accuracy, -85% Behavioral Drift" },
  { id: "ap4", title: "Cross-BU Approval Automation — Procurement × Finance", requestedBy: "Operations Coordinator AI", requestedAt: "2026-06-19T13:30:00Z", type: "workflow", priority: "normal", status: "pending", businessUnit: "Operations Intelligence", estimatedImpact: "-22% Cycle Time, +15% Operational Efficiency" },
  { id: "ap5", title: "Engineering AI Employee — Code Review Module Deployment", requestedBy: "Engineering Lead", requestedAt: "2026-06-22T06:00:00Z", type: "agent-deployment", priority: "normal", status: "pending", businessUnit: "Engineering Intelligence", estimatedImpact: "+11% Release Throughput, -18% Lead Time" },
];

const riskScores = [
  {
    agentId: "a9", agentName: "Fleet AI", riskScore: 82, driftScore: 71, hallucinationRisk: 3.8, policyViolations: 2, unauthorizedActions: 1, status: "quarantined",
    riskReason: "GPS API dependency failure caused behavioral drift across 72% of fleet routing decisions. 2 unauthorized route overrides detected.",
    replacement: { name: "Fleet AI v2.4", expectedImprovement: "+14% Routing Accuracy, -85% Drift Score, +0% Hallucination Risk" }
  },
  {
    agentId: "a6", agentName: "Contract AI", riskScore: 67, driftScore: 44, hallucinationRisk: 3.2, policyViolations: 3, unauthorizedActions: 1, status: "watch",
    riskReason: "3 policy violations in 30 days. Unauthorized data access attempt flagged. Contract clause extraction accuracy declining.",
    replacement: { name: "Contract AI v3.2", expectedImprovement: "+18% Accuracy, -2.1% Hallucination Risk, 0 Policy Violations" }
  },
  { agentId: "a5", agentName: "Procurement Agent", riskScore: 38, driftScore: 22, hallucinationRisk: 1.1, policyViolations: 1, unauthorizedActions: 0, status: "watch", riskReason: "Minor spend threshold exceedance. Within acceptable range.", replacement: null },
  { agentId: "a7", agentName: "Logistics Optimizer", riskScore: 18, driftScore: 12, hallucinationRisk: 0.4, policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacement: null },
  { agentId: "a1", agentName: "Revenue Scout AI Employee", riskScore: 9, driftScore: 6, hallucinationRisk: 0.2, policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacement: null },
  { agentId: "a3", agentName: "Finance Reconciler", riskScore: 12, driftScore: 8, hallucinationRisk: 0.3, policyViolations: 1, unauthorizedActions: 0, status: "safe", riskReason: null, replacement: null },
  { agentId: "a10", agentName: "Maintenance AI", riskScore: 7, driftScore: 4, hallucinationRisk: 0.1, policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacement: null },
  { agentId: "a11", agentName: "Engineering AI Employee", riskScore: 14, driftScore: 9, hallucinationRisk: 0.5, policyViolations: 0, unauthorizedActions: 0, status: "safe", riskReason: null, replacement: null },
];

router.get("/audit-logs", (req, res) => {
  res.json(auditLogs);
});

router.get("/policies", (req, res) => {
  res.json(policies);
});

router.get("/approvals", (req, res) => {
  res.json(approvals);
});

router.get("/risk-scores", (req, res) => {
  res.json(riskScores);
});

export default router;
