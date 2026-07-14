// Units of Work: the atomic, credential-secured capability primitive.
// Each is one proxied API call an AI Employee can invoke — never a raw
// credential in the browser, always routed through the Meridian Proxy.

import { deptTwinId } from "@/data/enterprise-data";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type AuthMode = "proxy-delegated" | "vault-credential";

export interface UnitOfWork {
  id: string;
  name: string;
  buId: string;
  deptId: string;
  description: string;
  usedInWorkflows: string[];
  endpoint: { baseUrl: string; path: string; method: HttpMethod };
  authMode: AuthMode;
  secret?: string;
  raci: { responsible: string; accountable: string; consulted: string; informed: string };
  mapping: {
    manualMinutes: number;
    automatedMinutes: number;
    manualCostUsd: number;
    automatedCostUsd: number;
    runsPerMonth: number;
  };
}

export const UNIT_OF_WORK_CATALOG: UnitOfWork[] = [
  {
    id: "uow-1", name: "Pull Line Sensor Telemetry", buId: "manufacturing", deptId: deptTwinId("manufacturing", "Predictive Maintenance"),
    description: "Streams vibration, temperature, and load telemetry for a production line from the SCADA gateway.",
    usedInWorkflows: ["Predictive Maintenance Execution"],
    endpoint: { baseUrl: "https://scada.internal", path: "/v2/lines/{lineId}/telemetry", method: "GET" },
    authMode: "vault-credential", secret: "SCADA_GATEWAY_KEY",
    raci: { responsible: "Predictive Maintenance", accountable: "Maintenance Supervisor", consulted: "OEE Optimizer", informed: "Plant Manager" },
    mapping: { manualMinutes: 25, automatedMinutes: 1, manualCostUsd: 22, automatedCostUsd: 1.2, runsPerMonth: 620 },
  },
  {
    id: "uow-2", name: "Create CMMS Work Order", buId: "manufacturing", deptId: deptTwinId("manufacturing", "Predictive Maintenance"),
    description: "Opens a maintenance work order in the CMMS when a failure-risk threshold is crossed.",
    usedInWorkflows: ["Predictive Maintenance Execution"],
    endpoint: { baseUrl: "https://cmms.internal", path: "/v1/work-orders", method: "POST" },
    authMode: "vault-credential", secret: "CMMS_OAUTH",
    raci: { responsible: "Predictive Maintenance", accountable: "Maintenance Supervisor", consulted: "Parts Manager", informed: "Line Supervisor" },
    mapping: { manualMinutes: 40, automatedMinutes: 3, manualCostUsd: 34, automatedCostUsd: 2.4, runsPerMonth: 84 },
  },
  {
    id: "uow-3", name: "Log Vision Inspection Result", buId: "manufacturing", deptId: deptTwinId("manufacturing", "Quality Inspector"),
    description: "Records a defect-classification result from the vision-AI inspection line into MES.",
    usedInWorkflows: ["Production Quality Inspection"],
    endpoint: { baseUrl: "https://mes.internal", path: "/v1/quality/inspections", method: "POST" },
    authMode: "proxy-delegated",
    raci: { responsible: "Quality Inspector", accountable: "Quality Manager", consulted: "Line Supervisor", informed: "Plant Manager" },
    mapping: { manualMinutes: 8, automatedMinutes: 0.5, manualCostUsd: 6.5, automatedCostUsd: 0.4, runsPerMonth: 4200 },
  },
  {
    id: "uow-4", name: "Fetch Production Schedule", buId: "manufacturing", deptId: deptTwinId("manufacturing", "Production Planner"),
    description: "Retrieves the shift-level production schedule and capacity plan from MES.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://mes.internal", path: "/v1/schedule", method: "GET" },
    authMode: "proxy-delegated",
    raci: { responsible: "Production Planner", accountable: "Line Supervisor", consulted: "OEE Optimizer", informed: "Plant Manager" },
    mapping: { manualMinutes: 15, automatedMinutes: 1, manualCostUsd: 13, automatedCostUsd: 1, runsPerMonth: 260 },
  },
  {
    id: "uow-5", name: "Update Energy Load Setpoint", buId: "manufacturing", deptId: deptTwinId("manufacturing", "OEE Optimizer"),
    description: "Adjusts a facility's energy load-balancing setpoint based on real-time demand forecasting.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://scada.internal", path: "/v2/energy/setpoint", method: "PATCH" },
    authMode: "vault-credential", secret: "SCADA_GATEWAY_KEY",
    raci: { responsible: "Energy Intelligence", accountable: "Plant Manager", consulted: "OEE Optimizer", informed: "Finance Director" },
    mapping: { manualMinutes: 20, automatedMinutes: 2, manualCostUsd: 17, automatedCostUsd: 1.6, runsPerMonth: 140 },
  },
  {
    id: "uow-6", name: "Pull Inventory Levels", buId: "supply-chain", deptId: deptTwinId("supply-chain", "Inventory Optimizer"),
    description: "Reads current on-hand inventory by SKU and warehouse from the WMS.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://wms.internal", path: "/v1/inventory", method: "GET" },
    authMode: "vault-credential", secret: "WMS_API_KEY",
    raci: { responsible: "Inventory Optimizer", accountable: "Warehouse Manager", consulted: "Demand Planner", informed: "VP Supply Chain" },
    mapping: { manualMinutes: 18, automatedMinutes: 1, manualCostUsd: 15, automatedCostUsd: 1, runsPerMonth: 900 },
  },
  {
    id: "uow-7", name: "Trigger Reorder", buId: "supply-chain", deptId: deptTwinId("supply-chain", "Inventory Optimizer"),
    description: "Creates a replenishment order against a preferred supplier when stock falls below reorder point.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://wms.internal", path: "/v1/reorders", method: "POST" },
    authMode: "vault-credential", secret: "WMS_API_KEY",
    raci: { responsible: "Inventory Optimizer", accountable: "Warehouse Manager", consulted: "Route Optimizer", informed: "Finance Director" },
    mapping: { manualMinutes: 30, automatedMinutes: 2, manualCostUsd: 26, automatedCostUsd: 1.8, runsPerMonth: 110 },
  },
  {
    id: "uow-8", name: "Fetch Demand Forecast Model", buId: "supply-chain", deptId: deptTwinId("supply-chain", "Demand Planner"),
    description: "Pulls the latest statistical demand-forecast run for a SKU family from the ERP forecasting module.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://erp.internal", path: "/v1/forecast", method: "GET" },
    authMode: "proxy-delegated",
    raci: { responsible: "Demand Planner", accountable: "VP Supply Chain", consulted: "Inventory Optimizer", informed: "Plant Manager" },
    mapping: { manualMinutes: 22, automatedMinutes: 1.5, manualCostUsd: 19, automatedCostUsd: 1.3, runsPerMonth: 180 },
  },
  {
    id: "uow-9", name: "Score Supplier Risk", buId: "procurement", deptId: deptTwinId("procurement", "Supplier Risk"),
    description: "Computes a composite risk score for a supplier from continuity, financial, and quality signals.",
    usedInWorkflows: ["Supplier Risk Assessment"],
    endpoint: { baseUrl: "https://plm.internal", path: "/v1/suppliers/{id}/risk", method: "GET" },
    authMode: "vault-credential", secret: "PLM_OAUTH",
    raci: { responsible: "Supplier Risk Agent", accountable: "Procurement Manager", consulted: "Sourcing Agent", informed: "CFO" },
    mapping: { manualMinutes: 45, automatedMinutes: 3, manualCostUsd: 39, automatedCostUsd: 2.6, runsPerMonth: 60 },
  },
  {
    id: "uow-10", name: "Generate Purchase Order", buId: "procurement", deptId: deptTwinId("procurement", "Contract Bot"),
    description: "Creates and routes a purchase order in the ERP for approved sourcing decisions.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://erp.internal", path: "/v1/purchase-orders", method: "POST" },
    authMode: "vault-credential", secret: "SAP_ERP_SVC",
    raci: { responsible: "Contract Bot", accountable: "Procurement Director", consulted: "Sourcing Agent", informed: "Finance Director" },
    mapping: { manualMinutes: 35, automatedMinutes: 3, manualCostUsd: 30, automatedCostUsd: 2.4, runsPerMonth: 190 },
  },
  {
    id: "uow-11", name: "Draft Supplier Contract", buId: "procurement", deptId: deptTwinId("procurement", "Contract Bot"),
    description: "Generates a supplier contract or amendment from a template and routes it for e-signature.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://docusign.internal", path: "/v1/envelopes", method: "POST" },
    authMode: "vault-credential", secret: "DOCUSIGN_OAUTH",
    raci: { responsible: "Contract Bot", accountable: "Legal Counsel", consulted: "Procurement Manager", informed: "CFO" },
    mapping: { manualMinutes: 60, automatedMinutes: 6, manualCostUsd: 52, automatedCostUsd: 5, runsPerMonth: 24 },
  },
  {
    id: "uow-12", name: "Reconcile ERP Transactions", buId: "finance", deptId: deptTwinId("finance", "Finance Analyst"),
    description: "Matches ledger transactions across entities during month-end reconciliation.",
    usedInWorkflows: ["Monthly Financial Close"],
    endpoint: { baseUrl: "https://erp.internal", path: "/v1/gl/transactions", method: "GET" },
    authMode: "vault-credential", secret: "SAP_ERP_SVC",
    raci: { responsible: "Finance Analyst", accountable: "Finance Director", consulted: "Audit Agent", informed: "CFO" },
    mapping: { manualMinutes: 50, automatedMinutes: 4, manualCostUsd: 43, automatedCostUsd: 3.4, runsPerMonth: 40 },
  },
  {
    id: "uow-13", name: "Post Cost Allocation", buId: "finance", deptId: deptTwinId("finance", "Cost Controller"),
    description: "Allocates shared costs across cost centers per the current allocation model.",
    usedInWorkflows: ["Monthly Financial Close"],
    endpoint: { baseUrl: "https://erp.internal", path: "/v1/cost-allocations", method: "POST" },
    authMode: "vault-credential", secret: "SAP_ERP_SVC",
    raci: { responsible: "Cost Controller", accountable: "Finance Director", consulted: "Finance Analyst", informed: "CFO" },
    mapping: { manualMinutes: 38, automatedMinutes: 3, manualCostUsd: 33, automatedCostUsd: 2.6, runsPerMonth: 30 },
  },
  {
    id: "uow-14", name: "Query Data Warehouse Cost Model", buId: "finance", deptId: deptTwinId("finance", "Audit Agent"),
    description: "Runs an ad-hoc cost-model query against the Snowflake warehouse for audit review.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://snowflake.internal", path: "/v1/query", method: "GET" },
    authMode: "vault-credential", secret: "SNOWFLAKE_SVC",
    raci: { responsible: "Audit Agent", accountable: "CFO", consulted: "Finance Analyst", informed: "Finance Director" },
    mapping: { manualMinutes: 28, automatedMinutes: 2, manualCostUsd: 24, automatedCostUsd: 1.8, runsPerMonth: 20 },
  },
  {
    id: "uow-15", name: "Pull CRM Pipeline Snapshot", buId: "revenue", deptId: deptTwinId("revenue", "Revenue Scout"),
    description: "Retrieves current-quarter opportunity data across stages from Salesforce.",
    usedInWorkflows: ["Revenue Pipeline Review"],
    endpoint: { baseUrl: "https://sfdc.internal", path: "/v1/opportunities", method: "GET" },
    authMode: "vault-credential", secret: "SALESFORCE_OAUTH",
    raci: { responsible: "Revenue Scout", accountable: "VP Sales", consulted: "Forecast Agent", informed: "Revenue Manager" },
    mapping: { manualMinutes: 20, automatedMinutes: 1.5, manualCostUsd: 17, automatedCostUsd: 1.3, runsPerMonth: 260 },
  },
  {
    id: "uow-16", name: "Update Deal Stage", buId: "revenue", deptId: deptTwinId("revenue", "Deal Closer AI"),
    description: "Advances or corrects an opportunity's pipeline stage based on qualification signals.",
    usedInWorkflows: ["Revenue Pipeline Review"],
    endpoint: { baseUrl: "https://sfdc.internal", path: "/v1/opportunities/{id}", method: "PATCH" },
    authMode: "vault-credential", secret: "SALESFORCE_OAUTH",
    raci: { responsible: "Deal Closer AI", accountable: "Revenue Manager", consulted: "Revenue Scout", informed: "VP Sales" },
    mapping: { manualMinutes: 12, automatedMinutes: 1, manualCostUsd: 10, automatedCostUsd: 0.8, runsPerMonth: 340 },
  },
  {
    id: "uow-17", name: "Generate Forecast Model Run", buId: "revenue", deptId: deptTwinId("revenue", "Forecast Agent"),
    description: "Executes the revenue forecast model against the latest pipeline snapshot.",
    usedInWorkflows: [],
    endpoint: { baseUrl: "https://erp.internal", path: "/v1/forecast-runs", method: "POST" },
    authMode: "proxy-delegated",
    raci: { responsible: "Forecast Agent", accountable: "VP Sales", consulted: "Revenue Scout", informed: "CFO" },
    mapping: { manualMinutes: 40, automatedMinutes: 3, manualCostUsd: 34, automatedCostUsd: 2.6, runsPerMonth: 44 },
  },
];

export function effectivenessFor(uow: UnitOfWork) {
  const { manualMinutes, automatedMinutes, manualCostUsd, automatedCostUsd, runsPerMonth } = uow.mapping;
  const minutesSavedPerRun = manualMinutes - automatedMinutes;
  const costSavedPerRun = manualCostUsd - automatedCostUsd;
  const hoursSavedPerMonth = (minutesSavedPerRun * runsPerMonth) / 60;
  const costSavedPerMonth = costSavedPerRun * runsPerMonth;
  const roiMultiple = automatedCostUsd > 0 ? manualCostUsd / automatedCostUsd : manualCostUsd > 0 ? Infinity : 0;
  const pctFaster = manualMinutes > 0 ? Math.round((minutesSavedPerRun / manualMinutes) * 100) : 0;
  return { hoursSavedPerMonth, costSavedPerMonth, roiMultiple, pctFaster };
}
