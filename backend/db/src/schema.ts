import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── companies ───────────────────────────────────────────────────

export const companiesTable = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({ id: true, createdAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;

// ─── business-units ──────────────────────────────────────────────

export const buRiskEnum = pgEnum("bu_risk", ["low", "medium", "high", "critical"]);
export const buStatusEnum = pgEnum("bu_status", ["healthy", "optimizing", "at-risk", "critical"]);

export const businessUnitsTable = pgTable(
  "business_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    color: text("color"),
    eeiScore: numeric("eei_score", { precision: 5, scale: 2 }).notNull().default("0"),
    healthScore: numeric("health_score", { precision: 5, scale: 2 }).notNull().default("0"),
    status: buStatusEnum("status").notNull().default("healthy"),
    risk: buRiskEnum("risk").notNull().default("low"),
    costMtd: numeric("cost_mtd", { precision: 14, scale: 2 }).notNull().default("0"),
    roi: numeric("roi", { precision: 6, scale: 2 }).notNull().default("0"),
    revenueProtected: numeric("revenue_protected", { precision: 14, scale: 2 }).notNull().default("0"),
    costSaved: numeric("cost_saved", { precision: 14, scale: 2 }).notNull().default("0"),
    hoursSaved: numeric("hours_saved", { precision: 12, scale: 2 }).notNull().default("0"),
    downtimePreventedHours: numeric("downtime_prevented_hours", { precision: 12, scale: 2 }).notNull().default("0"),
    automationPct: numeric("automation_pct", { precision: 5, scale: 2 }).notNull().default("0"),
    forecastAccuracy: numeric("forecast_accuracy", { precision: 5, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("business_units_company_slug_idx").on(t.companyId, t.slug)],
);

export const departmentsTable = pgTable(
  "departments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessUnitId: uuid("business_unit_id").notNull().references(() => businessUnitsTable.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    function: text("function"),
    status: buStatusEnum("status").notNull().default("healthy"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("departments_bu_slug_idx").on(t.businessUnitId, t.slug)],
);

export const insertBusinessUnitSchema = createInsertSchema(businessUnitsTable).omit({ id: true, createdAt: true });
export type InsertBusinessUnit = z.infer<typeof insertBusinessUnitSchema>;
export type BusinessUnit = typeof businessUnitsTable.$inferSelect;

export const insertDepartmentSchema = createInsertSchema(departmentsTable).omit({ id: true, createdAt: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departmentsTable.$inferSelect;

// ─── people ──────────────────────────────────────────────────────

export const roleTierEnum = pgEnum("role_tier", ["member", "dept_manager", "abu_head", "cxo", "developer"]);
export const personStatusEnum = pgEnum("person_status", ["active", "invited", "paused"]);

export const peopleTable = pgTable(
  "people",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    title: text("title").notNull(),
    roleTier: roleTierEnum("role_tier").notNull().default("member"),
    status: personStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("people_email_idx").on(t.email)],
);

export const insertPersonSchema = createInsertSchema(peopleTable).omit({ id: true, createdAt: true });
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof peopleTable.$inferSelect;

// ─── auth ────────────────────────────────────────────────────────

// Mock/dev-only credential store: plaintext passwords by design, since this
// is a local test database seeded with fixture people, not a production
// auth system. Replaces the frontend's mocked persona switcher (rbac.ts).
export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id").notNull().references(() => peopleTable.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username)],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── agents ──────────────────────────────────────────────────────

export const agentStatusEnum = pgEnum("agent_status", ["active", "watch", "critical", "quarantined"]);
export const autonomyLevelEnum = pgEnum("autonomy_level", ["full", "supervised", "assisted"]);

export const agentsTable = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").notNull().references(() => businessUnitsTable.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
    employeeId: text("employee_id").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    managerId: uuid("manager_id").references(() => peopleTable.id, { onDelete: "set null" }),
    status: agentStatusEnum("status").notNull().default("active"),
    autonomyLevel: autonomyLevelEnum("autonomy_level").notNull().default("supervised"),
    utilizationPct: numeric("utilization_pct", { precision: 5, scale: 2 }).notNull().default("0"),
    slaPerformance: numeric("sla_performance", { precision: 5, scale: 2 }).notNull().default("0"),
    costPerDay: numeric("cost_per_day", { precision: 10, scale: 2 }).notNull().default("0"),
    taskCount: integer("task_count").notNull().default(0),
    skills: text("skills").array().notNull().default([]),
    systems: text("systems").array().notNull().default([]),
    hoursSaved: numeric("hours_saved", { precision: 12, scale: 2 }).notNull().default("0"),
    revenueProtected: numeric("revenue_protected", { precision: 14, scale: 2 }).notNull().default("0"),
    downtimePreventedHours: numeric("downtime_prevented_hours", { precision: 12, scale: 2 }).notNull().default("0"),
    costSaved: numeric("cost_saved", { precision: 14, scale: 2 }).notNull().default("0"),
    automationPct: numeric("automation_pct", { precision: 5, scale: 2 }).notNull().default("0"),
    roi: numeric("roi", { precision: 6, scale: 2 }).notNull().default("0"),
    eeiContribution: numeric("eei_contribution", { precision: 5, scale: 2 }).notNull().default("0"),
    health: numeric("health", { precision: 5, scale: 2 }).notNull().default("0"),
    version: text("version"),
    model: text("model"),
    latencyMs: integer("latency_ms"),
    accuracy: numeric("accuracy", { precision: 5, scale: 2 }),
    hallucinationRate: numeric("hallucination_rate", { precision: 5, scale: 2 }),
    policyCompliance: numeric("policy_compliance", { precision: 5, scale: 2 }),
    tokenUsage: integer("token_usage"),
    costMtd: numeric("cost_mtd", { precision: 10, scale: 2 }),
    adapterId: text("adapter_id"),
    costModelId: text("cost_model_id"),
    reasoningLevel: text("reasoning_level"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("agents_company_employee_idx").on(t.companyId, t.employeeId)],
);

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;

// ─── kpis ────────────────────────────────────────────────────────

export const kpiTrendEnum = pgEnum("kpi_trend", ["up", "down", "flat"]);
export const kpiStatusEnum = pgEnum("kpi_status", ["on-track", "watch", "critical"]);

export const kpisTable = pgTable(
  "kpis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").notNull().references(() => businessUnitsTable.id, { onDelete: "cascade" }),
    externalId: text("external_id"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    abbreviation: text("abbreviation"),
    category: text("category").notNull(),
    value: numeric("value", { precision: 14, scale: 2 }).notNull(),
    unit: text("unit"),
    target: numeric("target", { precision: 14, scale: 2 }),
    trend: kpiTrendEnum("trend").notNull().default("flat"),
    delta: numeric("delta", { precision: 10, scale: 2 }),
    variance: numeric("variance", { precision: 10, scale: 2 }),
    healthScore: numeric("health_score", { precision: 5, scale: 2 }).notNull().default("0"),
    status: kpiStatusEnum("status").notNull().default("on-track"),
    ownerId: uuid("owner_id").references(() => peopleTable.id, { onDelete: "set null" }),
    formula: text("formula"),
    dataSource: text("data_source"),
    updateFrequency: text("update_frequency"),
    forecastNext: numeric("forecast_next", { precision: 14, scale: 2 }),
    aiSummary: text("ai_summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("kpis_company_slug_idx").on(t.companyId, t.slug)],
);

export const kpiBusinessUnitLinksTable = pgTable(
  "kpi_business_unit_links",
  {
    kpiId: uuid("kpi_id").notNull().references(() => kpisTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").notNull().references(() => businessUnitsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.kpiId, t.businessUnitId] })],
);

export const kpiDependenciesTable = pgTable(
  "kpi_dependencies",
  {
    kpiId: uuid("kpi_id").notNull().references(() => kpisTable.id, { onDelete: "cascade" }),
    dependsOnKpiId: uuid("depends_on_kpi_id").notNull().references(() => kpisTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.kpiId, t.dependsOnKpiId] })],
);

export const kpiAgentLinksTable = pgTable(
  "kpi_agent_links",
  {
    kpiId: uuid("kpi_id").notNull().references(() => kpisTable.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.kpiId, t.agentId] })],
);

export const kpiRootCausesTable = pgTable("kpi_root_causes", {
  id: uuid("id").primaryKey().defaultRandom(),
  kpiId: uuid("kpi_id").notNull().references(() => kpisTable.id, { onDelete: "cascade" }),
  cause: text("cause").notNull(),
  confidence: integer("confidence").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertKpiSchema = createInsertSchema(kpisTable).omit({ id: true, createdAt: true });
export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpisTable.$inferSelect;

export const insertKpiRootCauseSchema = createInsertSchema(kpiRootCausesTable).omit({ id: true });
export type InsertKpiRootCause = z.infer<typeof insertKpiRootCauseSchema>;
export type KpiRootCause = typeof kpiRootCausesTable.$inferSelect;

// ─── KPI Studio surfaces ─────────────────────────────────────────

export const kpiHealthCardsTable = pgTable(
  "kpi_health_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    label: text("label").notNull(),
    score: integer("score").notNull(),
    target: integer("target").notNull(),
    trend: integer("trend").array().notNull().default([]),
    confidence: integer("confidence").notNull(),
    summary: text("summary").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("kpi_health_cards_company_external_idx").on(t.companyId, t.externalId)],
);

export const businessEventImpactEnum = pgEnum("business_event_impact", ["info", "watch", "critical"]);

export const businessEventsTable = pgTable("business_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  externalId: text("external_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  impact: businessEventImpactEnum("impact").notNull().default("info"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
});

export const insertKpiHealthCardSchema = createInsertSchema(kpiHealthCardsTable).omit({ id: true });
export type InsertKpiHealthCard = z.infer<typeof insertKpiHealthCardSchema>;
export type KpiHealthCard = typeof kpiHealthCardsTable.$inferSelect;

export const insertBusinessEventSchema = createInsertSchema(businessEventsTable).omit({ id: true });
export type InsertBusinessEvent = z.infer<typeof insertBusinessEventSchema>;
export type BusinessEvent = typeof businessEventsTable.$inferSelect;

// ─── policies ────────────────────────────────────────────────────

export const policyTypeEnum = pgEnum("policy_type", [
  "rbac",
  "compliance",
  "budget",
  "behavior",
  "data",
  "governance",
  "safety",
  "quality",
]);
export const policyStatusEnum = pgEnum("policy_status", ["active", "draft", "deprecated"]);
export const policyEnforcementLevelEnum = pgEnum("policy_enforcement_level", ["block", "warn", "log"]);

export const policiesTable = pgTable("policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: policyTypeEnum("type").notNull(),
  scope: text("scope").notNull(),
  status: policyStatusEnum("status").notNull().default("draft"),
  enforcementLevel: policyEnforcementLevelEnum("enforcement_level").notNull().default("warn"),
  violationCount: integer("violation_count").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPolicySchema = createInsertSchema(policiesTable).omit({ id: true, createdAt: true });
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = typeof policiesTable.$inferSelect;

// ─── audit-logs ──────────────────────────────────────────────────

export const actorTypeEnum = pgEnum("actor_type", ["agent", "human", "system"]);
export const auditOutcomeEnum = pgEnum("audit_outcome", ["approved", "auto-approved", "escalated", "rejected"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high", "critical"]);

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  policyId: uuid("policy_id").references(() => policiesTable.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorPersonId: uuid("actor_person_id").references(() => peopleTable.id, { onDelete: "set null" }),
  actorAgentId: uuid("actor_agent_id").references(() => agentsTable.id, { onDelete: "set null" }),
  outcome: auditOutcomeEnum("outcome").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull().default("low"),
  details: text("details"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;

// ─── policy-rules ────────────────────────────────────────────────

export const ruleOperatorEnum = pgEnum("rule_operator", ["gt", "gte", "lt", "lte", "eq", "neq"]);

export const policyRulesTable = pgTable("policy_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().references(() => policiesTable.id, { onDelete: "cascade" }),
  field: text("field").notNull(),
  operator: ruleOperatorEnum("operator").notNull(),
  thresholdValue: text("threshold_value").notNull(),
  action: policyEnforcementLevelEnum("action").notNull().default("warn"),
  description: text("description"),
});

export const insertPolicyRuleSchema = createInsertSchema(policyRulesTable).omit({ id: true });
export type InsertPolicyRule = z.infer<typeof insertPolicyRuleSchema>;
export type PolicyRule = typeof policyRulesTable.$inferSelect;

// ─── policy-versions ─────────────────────────────────────────────

export const policyVersionsTable = pgTable(
  "policy_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: uuid("policy_id").notNull().references(() => policiesTable.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    status: policyStatusEnum("status").notNull().default("draft"),
    changeSummary: text("change_summary"),
    snapshot: jsonb("snapshot").notNull(),
    createdByPersonId: uuid("created_by_person_id").references(() => peopleTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("policy_versions_policy_version_idx").on(t.policyId, t.version)],
);

export const insertPolicyVersionSchema = createInsertSchema(policyVersionsTable).omit({ id: true, createdAt: true });
export type InsertPolicyVersion = z.infer<typeof insertPolicyVersionSchema>;
export type PolicyVersion = typeof policyVersionsTable.$inferSelect;

// ─── policy-violations ───────────────────────────────────────────

export const policyViolationsTable = pgTable("policy_violations", {
  id: uuid("id").primaryKey().defaultRandom(),
  policyId: uuid("policy_id").notNull().references(() => policiesTable.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").references(() => agentsTable.id, { onDelete: "set null" }),
  personId: uuid("person_id").references(() => peopleTable.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  severity: riskLevelEnum("severity").notNull().default("medium"),
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPolicyViolationSchema = createInsertSchema(policyViolationsTable).omit({ id: true, occurredAt: true });
export type InsertPolicyViolation = z.infer<typeof insertPolicyViolationSchema>;
export type PolicyViolation = typeof policyViolationsTable.$inferSelect;

// ─── approvals ───────────────────────────────────────────────────

export const approvalTypeEnum = pgEnum("approval_type", [
  "workflow",
  "agent-action",
  "agent-replacement",
  "agent-deployment",
]);
export const approvalPriorityEnum = pgEnum("approval_priority", ["urgent", "normal"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);

export const approvalsTable = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  requestedByPersonId: uuid("requested_by_person_id").references(() => peopleTable.id, { onDelete: "set null" }),
  requestedByAgentId: uuid("requested_by_agent_id").references(() => agentsTable.id, { onDelete: "set null" }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  type: approvalTypeEnum("type").notNull(),
  priority: approvalPriorityEnum("priority").notNull().default("normal"),
  status: approvalStatusEnum("status").notNull().default("pending"),
  estimatedImpact: text("estimated_impact"),
});

export const insertApprovalSchema = createInsertSchema(approvalsTable).omit({ id: true });
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvalsTable.$inferSelect;

// ─── approval-comments ───────────────────────────────────────────

export const approvalCommentsTable = pgTable("approval_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  approvalId: uuid("approval_id").notNull().references(() => approvalsTable.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => peopleTable.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApprovalCommentSchema = createInsertSchema(approvalCommentsTable).omit({ id: true, createdAt: true });
export type InsertApprovalComment = z.infer<typeof insertApprovalCommentSchema>;
export type ApprovalComment = typeof approvalCommentsTable.$inferSelect;

// ─── risk-scores ─────────────────────────────────────────────────

export const agentRiskStatusEnum = pgEnum("agent_risk_status", ["safe", "watch", "quarantined"]);

export const riskScoresTable = pgTable(
  "risk_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
    riskScore: numeric("risk_score", { precision: 5, scale: 2 }).notNull().default("0"),
    driftScore: numeric("drift_score", { precision: 5, scale: 2 }).notNull().default("0"),
    hallucinationRisk: numeric("hallucination_risk", { precision: 5, scale: 2 }).notNull().default("0"),
    policyViolations: integer("policy_violations").notNull().default(0),
    unauthorizedActions: integer("unauthorized_actions").notNull().default(0),
    status: agentRiskStatusEnum("status").notNull().default("safe"),
    riskReason: text("risk_reason"),
    replacementName: text("replacement_name"),
    replacementExpectedImprovement: text("replacement_expected_improvement"),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("risk_scores_agent_idx").on(t.agentId)],
);

export const insertRiskScoreSchema = createInsertSchema(riskScoresTable).omit({ id: true, evaluatedAt: true });
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScore = typeof riskScoresTable.$inferSelect;

// ─── tasks ───────────────────────────────────────────────────────

export const taskStatusEnum = pgEnum("task_status", ["todo", "in-progress", "blocked", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["p1", "p2"]);
export const ownerTypeEnum = pgEnum("owner_type", ["human", "ai", "shared"]);
export const escalationStatusEnum = pgEnum("escalation_status", ["none", "escalated"]);

export const tasksTable = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  departmentId: uuid("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("p2"),
  ownerType: ownerTypeEnum("owner_type").notNull().default("human"),
  ownerPersonId: uuid("owner_person_id").references(() => peopleTable.id, { onDelete: "set null" }),
  ownerAgentId: uuid("owner_agent_id").references(() => agentsTable.id, { onDelete: "set null" }),
  linkedKpiId: uuid("linked_kpi_id").references(() => kpisTable.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  progress: integer("progress").notNull().default(0),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  workflow: text("workflow"),
  escalationStatus: escalationStatusEnum("escalation_status").notNull().default("none"),
  linkedRecommendation: text("linked_recommendation"),
  expectedOutcome: text("expected_outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskDependenciesTable = pgTable(
  "task_dependencies",
  {
    taskId: uuid("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.dependsOnTaskId] })],
);

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

// ─── workflows ───────────────────────────────────────────────────

export const workflowStatusEnum = pgEnum("workflow_status", ["running", "completed", "paused", "blocked"]);
export const workflowPriorityEnum = pgEnum("workflow_priority", ["p1", "p2"]);

export const workflowsTable = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  status: workflowStatusEnum("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  stepCount: integer("step_count").notNull().default(0),
  completedSteps: integer("completed_steps").notNull().default(0),
  priority: workflowPriorityEnum("priority").notNull().default("p2"),
  assignedAgentId: uuid("assigned_agent_id").references(() => agentsTable.id, { onDelete: "set null" }),
  blockers: text("blockers"),
  estimatedCompletion: timestamp("estimated_completion", { withTimezone: true }),
});

export const insertWorkflowSchema = createInsertSchema(workflowsTable).omit({ id: true });
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflowsTable.$inferSelect;

// ─── insights ────────────────────────────────────────────────────

export const insightTypeEnum = pgEnum("insight_type", ["recommendation", "risk", "anomaly"]);
export const insightPriorityEnum = pgEnum("insight_priority", ["p1", "p2", "p3"]);

export const insightsTable = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  type: insightTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("0"),
  priority: insightPriorityEnum("priority").notNull().default("p3"),
  impact: text("impact"),
  businessImpact: text("business_impact"),
  kpiImpact: text("kpi_impact"),
  evidence: text("evidence").array().notNull().default([]),
  linkedKpiId: uuid("linked_kpi_id").references(() => kpisTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInsightSchema = createInsertSchema(insightsTable).omit({ id: true, createdAt: true });
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insightsTable.$inferSelect;

// ─── documents ───────────────────────────────────────────────────

export const documentTypeEnum = pgEnum("document_type", ["sop", "policy", "decision", "knowledge", "historical"]);

export const documentsTable = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  type: documentTypeEnum("type").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  relevanceScore: numeric("relevance_score", { precision: 4, scale: 3 }).notNull().default("0"),
  summary: text("summary"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, lastUpdated: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;

// ─── risks-opportunities ─────────────────────────────────────────

export const riskSeverityEnum = pgEnum("risk_severity", ["critical", "high", "medium"]);
export const riskStatusEnum = pgEnum("risk_status", ["active", "mitigating", "resolved"]);
export const opportunityStatusEnum = pgEnum("opportunity_status", ["identified", "analyzing", "actioning"]);

export const risksTable = pgTable("risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  severity: riskSeverityEnum("severity").notNull().default("medium"),
  impact: text("impact"),
  probability: numeric("probability", { precision: 4, scale: 3 }).notNull().default("0"),
  status: riskStatusEnum("status").notNull().default("active"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const opportunitiesTable = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  estimatedValue: numeric("estimated_value", { precision: 14, scale: 2 }).notNull().default("0"),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("0"),
  status: opportunityStatusEnum("status").notNull().default("identified"),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskSchema = createInsertSchema(risksTable).omit({ id: true, detectedAt: true });
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risksTable.$inferSelect;

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({ id: true, detectedAt: true });
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunitiesTable.$inferSelect;

// ─── business-results ────────────────────────────────────────────

export const businessResultCategoryEnum = pgEnum("business_result_category", [
  "revenue",
  "cost",
  "quality",
  "safety",
  "efficiency",
  "compliance",
]);

export const businessResultsTable = pgTable("business_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  metric: text("metric").notNull(),
  value: numeric("value", { precision: 14, scale: 2 }).notNull(),
  unit: text("unit"),
  change: numeric("change", { precision: 10, scale: 2 }),
  period: text("period").notNull(),
  category: businessResultCategoryEnum("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBusinessResultSchema = createInsertSchema(businessResultsTable).omit({ id: true, createdAt: true });
export type InsertBusinessResult = z.infer<typeof insertBusinessResultSchema>;
export type BusinessResult = typeof businessResultsTable.$inferSelect;

// ─── connectors ──────────────────────────────────────────────────

export const connectorsTable = pgTable(
  "connectors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    protocol: text("protocol").notNull(),
    connected: boolean("connected").notNull().default(false),
    secretName: text("secret_name"),
    lastSyncLabel: text("last_sync_label"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("connectors_company_external_idx").on(t.companyId, t.externalId)],
);

export const insertConnectorSchema = createInsertSchema(connectorsTable).omit({ id: true, createdAt: true });
export type InsertConnector = z.infer<typeof insertConnectorSchema>;
export type Connector = typeof connectorsTable.$inferSelect;

// ─── systems-health ──────────────────────────────────────────────

export const systemHealthStatusEnum = pgEnum("system_health_status", ["healthy", "degraded", "down"]);

export const systemsHealthTable = pgTable("systems_health", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: systemHealthStatusEnum("status").notNull().default("healthy"),
  uptimePct: numeric("uptime_pct", { precision: 5, scale: 2 }).notNull().default("100"),
  lastSync: timestamp("last_sync", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSystemHealthSchema = createInsertSchema(systemsHealthTable).omit({ id: true });
export type InsertSystemHealth = z.infer<typeof insertSystemHealthSchema>;
export type SystemHealth = typeof systemsHealthTable.$inferSelect;

// ─── sops ────────────────────────────────────────────────────────

export const sopRiskEnum = pgEnum("sop_risk", ["low", "medium", "high"]);
export const sopStatusEnum = pgEnum("sop_status", ["active", "draft", "retired"]);

export const sopsTable = pgTable("sops", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  ownerId: uuid("owner_id").references(() => peopleTable.id, { onDelete: "set null" }),
  version: text("version").notNull().default("1.0"),
  automationPct: numeric("automation_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  risk: sopRiskEnum("risk").notNull().default("low"),
  status: sopStatusEnum("status").notNull().default("active"),
  workflowSteps: text("workflow_steps").array().notNull().default([]),
  systems: text("systems").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sopKpiLinksTable = pgTable(
  "sop_kpi_links",
  {
    sopId: uuid("sop_id").notNull().references(() => sopsTable.id, { onDelete: "cascade" }),
    kpiId: uuid("kpi_id").notNull().references(() => kpisTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.sopId, t.kpiId] })],
);

export const sopAgentLinksTable = pgTable(
  "sop_agent_links",
  {
    sopId: uuid("sop_id").notNull().references(() => sopsTable.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.sopId, t.agentId] })],
);

export const sopPolicyLinksTable = pgTable(
  "sop_policy_links",
  {
    sopId: uuid("sop_id").notNull().references(() => sopsTable.id, { onDelete: "cascade" }),
    policyId: uuid("policy_id").notNull().references(() => policiesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.sopId, t.policyId] })],
);

export const insertSopSchema = createInsertSchema(sopsTable).omit({ id: true, createdAt: true });
export type InsertSop = z.infer<typeof insertSopSchema>;
export type Sop = typeof sopsTable.$inferSelect;

// ─── goals ───────────────────────────────────────────────────────

export const goalStatusEnum = pgEnum("goal_status", ["on-track", "at-risk", "missed", "achieved"]);

export const goalsTable = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
    externalId: text("external_id"),
    parentExternalId: text("parent_external_id"),
    title: text("title").notNull(),
    description: text("description"),
    targetValue: numeric("target_value", { precision: 14, scale: 2 }),
    currentValue: numeric("current_value", { precision: 14, scale: 2 }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: goalStatusEnum("status").notNull().default("on-track"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("goals_company_external_idx").on(t.companyId, t.externalId)],
);

export const kpiGoalLinksTable = pgTable(
  "kpi_goal_links",
  {
    kpiId: uuid("kpi_id").notNull().references(() => kpisTable.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").notNull().references(() => goalsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.kpiId, t.goalId] })],
);

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;

// ─── projects ────────────────────────────────────────────────────

export const projectStatusEnum = pgEnum("project_status", ["planning", "active", "done"]);

export const projectsTable = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
    leadAgentId: uuid("lead_agent_id").references(() => agentsTable.id, { onDelete: "set null" }),
    goalId: uuid("goal_id").references(() => goalsTable.id, { onDelete: "set null" }),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    status: projectStatusEnum("status").notNull().default("planning"),
    color: text("color"),
    targetDate: timestamp("target_date", { withTimezone: true }),
    progress: integer("progress").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_company_external_idx").on(t.companyId, t.externalId)],
);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;

// ─── unit-of-work ─────────────────────────────────────────────────

export const httpMethodEnum = pgEnum("http_method", ["GET", "POST", "PATCH", "PUT", "DELETE"]);
export const authModeEnum = pgEnum("auth_mode", ["proxy-delegated", "vault-credential"]);

export const unitsOfWorkTable = pgTable(
  "units_of_work",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
    businessUnitId: uuid("business_unit_id").references(() => businessUnitsTable.id, { onDelete: "set null" }),
    departmentId: uuid("department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    endpointBaseUrl: text("endpoint_base_url").notNull(),
    endpointPath: text("endpoint_path").notNull(),
    endpointMethod: httpMethodEnum("endpoint_method").notNull(),
    authMode: authModeEnum("auth_mode").notNull(),
    secretName: text("secret_name"),
    usedInWorkflows: text("used_in_workflows").array().notNull().default([]),
    raci: jsonb("raci").notNull(),
    mapping: jsonb("mapping").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("units_of_work_company_external_idx").on(t.companyId, t.externalId)],
);

export const insertUnitOfWorkSchema = createInsertSchema(unitsOfWorkTable).omit({ id: true, createdAt: true });
export type InsertUnitOfWork = z.infer<typeof insertUnitOfWorkSchema>;
export type UnitOfWork = typeof unitsOfWorkTable.$inferSelect;

// ─── model cost controls ─────────────────────────────────────────

export const modelCostModelsTable = pgTable(
  "model_cost_models",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    ratePerMillionTokens: numeric("rate_per_million_tokens", { precision: 10, scale: 4 }).notNull(),
  },
);

export const reasoningLevelsTable = pgTable(
  "reasoning_levels",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    multiplier: numeric("multiplier", { precision: 6, scale: 3 }).notNull(),
    note: text("note").notNull(),
  },
);

export const insertModelCostModelSchema = createInsertSchema(modelCostModelsTable);
export type InsertModelCostModel = z.infer<typeof insertModelCostModelSchema>;
export type ModelCostModel = typeof modelCostModelsTable.$inferSelect;

export const insertReasoningLevelSchema = createInsertSchema(reasoningLevelsTable);
export type InsertReasoningLevel = z.infer<typeof insertReasoningLevelSchema>;
export type ReasoningLevel = typeof reasoningLevelsTable.$inferSelect;

// ─── kpi saved chats (pinned Ask AI conversations) ────────────────

export const kpiSavedChatsTable = pgTable("kpi_saved_chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sqlQuery: text("sql_query"),
  resultData: jsonb("result_data"),
  chartSpec: jsonb("chart_spec"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type KpiSavedChat = typeof kpiSavedChatsTable.$inferSelect;
