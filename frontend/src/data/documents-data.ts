// Document Management System — mock data + access-control logic.
// No backend: everything here is static seed data mutated in-memory by
// the Documents pages via React state. Role hierarchy reuses lib/rbac.ts
// (ROLE_RANK) so "higher role edits freely, lower role needs approval
// from someone above them who already has access" is a single comparison,
// not a bespoke permission table.

import { ROLE_RANK, type Role } from "@/lib/rbac";
import { BU_LIST, MFG_AGENTS, deptTwinId } from "@/data/enterprise-data";
import { PEOPLE } from "@/data/people-data";

// ─── Categories ─────────────────────────────────────────────────
// Creatable at runtime via the Categories tab — this seed list is the
// starting seven, not a closed enum.

export interface DocCategory {
  id: string;
  name: string;
  description: string;
  color: string; // tailwind-safe hex used for the tag dot / icon tint
  builtin?: boolean; // seed categories can't be deleted, only user-created ones can
}

export const DOCUMENT_CATEGORIES: DocCategory[] = [
  { id: "cat-sop", name: "SOPs", description: "Standard Operating Procedures", color: "#2563eb", builtin: true },
  { id: "cat-manual", name: "Manuals", description: "Equipment and system manuals", color: "#7c3aed", builtin: true },
  { id: "cat-kpi", name: "KPI Evaluations", description: "KPI review and evaluation reports", color: "#059669", builtin: true },
  { id: "cat-policy", name: "Policies", description: "Governance and compliance policies", color: "#dc2626", builtin: true },
  { id: "cat-contract", name: "Contracts", description: "Supplier, vendor, and legal contracts", color: "#d97706", builtin: true },
  { id: "cat-report", name: "Reports", description: "Financial and operational reports", color: "#0891b2", builtin: true },
  { id: "cat-training", name: "Training", description: "Onboarding and training materials", color: "#be185d", builtin: true },
];

// ─── Access control ───────────────────────────────────────────────

export type Visibility = "cxo-only" | "restricted" | "shared";

export interface AccessGrant {
  personId: string;
  role: Role;
  canEdit: boolean;
}

export interface DocVersion {
  version: number;
  editedByPersonId: string;
  editedByRole: Role;
  editedAt: string;
  changeNote: string;
}

export interface PendingChange {
  id: string;
  submittedByPersonId: string;
  submittedByRole: Role;
  submittedAt: string;
  changeNote: string;
  requiredApproverRole: Role;
}

export interface DocMetadata {
  author: string;
  department: string;
  effectiveDate: string;
  reviewDate: string;
  classification: "public" | "internal" | "confidential" | "restricted";
  language: string;
  fileType: string;
  fileSizeKb: number;
}

export interface Document {
  id: string;
  title: string;
  categoryId: string;
  buId: string | null; // null = enterprise-wide (CXO documents typically)
  deptId?: string; // set for department-scoped documents
  visibility: Visibility;
  ownerPersonId: string;
  ownerRole: Role;
  access: AccessGrant[]; // explicit shares beyond the owner
  versions: DocVersion[]; // versions[versions.length-1] is current
  status: "approved" | "pending-approval";
  pendingChange?: PendingChange;
  metadata: DocMetadata;
  tags: string[];
  ocrText: string;
  summary: string;
  linkedMissionIds: string[];
  linkedAgentIds: string[];
}

// Lightweight local mission reference (workflow-studio.tsx's MISSION_TEMPLATES
// isn't exported, and pulling it in would couple this data module to a page
// module — these mirror its 3 seed missions by name/id for display purposes).
export interface MissionRef { id: string; name: string; buId: string; }
export const MISSION_REFS: MissionRef[] = [
  { id: "mt1", name: "Line 7 OEE Recovery", buId: "manufacturing" },
  { id: "mt2", name: "Supplier Risk Mitigation — Q3", buId: "procurement" },
  { id: "mt3", name: "Revenue Pipeline Recovery — APAC", buId: "revenue" },
];

const personById = (id: string) => PEOPLE.find((p) => p.id === id);
const agentById = (id: string) => MFG_AGENTS.find((a) => a.id === id);
const missionById = (id: string) => MISSION_REFS.find((m) => m.id === id);
const categoryById = (id: string) => DOCUMENT_CATEGORIES.find((c) => c.id === id);
const buName = (id: string | null) => (id ? BU_LIST.find((b) => b.id === id)?.name ?? id : "Enterprise-wide");

export { personById, agentById, missionById, categoryById, buName };

interface ViewerCtx {
  personId: string;
  role: Role;
  buId: string | null;
  deptId?: string;
}

// Can this person even see the document exists?
export function canView(doc: Document, viewer: ViewerCtx): boolean {
  if (viewer.role === "cxo") return true;
  const granted = doc.access.some((a) => a.personId === viewer.personId) || doc.ownerPersonId === viewer.personId;
  if (granted) return true;
  if (doc.visibility === "cxo-only") return false;
  // Cross-ABU / cross-department guardrail: must be in the same BU (and,
  // if the doc is department-scoped, the same department — ABU heads see
  // every department within their own BU).
  if (doc.buId && doc.buId !== viewer.buId) return false;
  if (doc.deptId && viewer.role !== "abu_head" && viewer.deptId !== doc.deptId) return false;
  return true;
}

// Can this person edit right now, and would it need approval?
export function editPermission(doc: Document, viewer: ViewerCtx): { canEdit: boolean; needsApproval: boolean; approverRole: Role | null } {
  const grant = doc.access.find((a) => a.personId === viewer.personId);
  const isOwner = doc.ownerPersonId === viewer.personId;
  const explicitEdit = isOwner || (grant?.canEdit ?? false);
  if (!explicitEdit && viewer.role !== "cxo") {
    // Not explicitly shared for editing and not CXO — still allow ABU
    // heads/dept managers to propose edits on in-scope documents (subject
    // to approval), matching "lower entities can still request a change."
    if (!canView(doc, viewer)) return { canEdit: false, needsApproval: false, approverRole: null };
  }

  // Highest role among everyone who currently holds access to the doc —
  // this is who "governs" it. CXO always governs their own docs.
  const holders: Role[] = [doc.ownerRole, ...doc.access.map((a) => a.role)];
  const maxHolderRank = Math.max(...holders.map((r) => ROLE_RANK[r]));
  const viewerRank = ROLE_RANK[viewer.role];

  if (viewerRank >= maxHolderRank) {
    return { canEdit: true, needsApproval: false, approverRole: null };
  }
  // Lower-ranked editor: needs sign-off from the nearest higher-ranked
  // person who already has access (falls back to the top holder role).
  const higherHolders = holders.filter((r) => ROLE_RANK[r] > viewerRank).sort((a, b) => ROLE_RANK[a] - ROLE_RANK[b]);
  const approverRole = higherHolders[0] ?? "cxo";
  return { canEdit: true, needsApproval: true, approverRole };
}

// Does this viewer have standing to approve a given pending change?
export function canApprove(doc: Document, viewer: ViewerCtx): boolean {
  if (!doc.pendingChange) return false;
  if (viewer.role === "cxo") return true;
  const hasAccess = doc.ownerPersonId === viewer.personId || doc.access.some((a) => a.personId === viewer.personId);
  return hasAccess && ROLE_RANK[viewer.role] >= ROLE_RANK[doc.pendingChange.requiredApproverRole];
}

// ─── Seed documents ───────────────────────────────────────────────
// 18 documents spanning every category, every BU, every visibility tier,
// with at least one CXO-only doc, one multi-person share, one with a
// pending approval in flight, and multi-version history throughout.

const now = () => new Date().toISOString().slice(0, 10);

export const DOCUMENTS: Document[] = [
  {
    id: "doc-1", title: "Board Compensation & Equity Framework 2026", categoryId: "cat-policy",
    buId: null, visibility: "cxo-only", ownerPersonId: "per-cxo", ownerRole: "cxo", access: [],
    versions: [
      { version: 1, editedByPersonId: "per-cxo", editedByRole: "cxo", editedAt: "2026-01-08", changeNote: "Initial board approval." },
      { version: 2, editedByPersonId: "per-cxo", editedByRole: "cxo", editedAt: "2026-05-14", changeNote: "Updated equity vesting schedule." },
    ],
    status: "approved",
    metadata: { author: "Elena Sokolov", department: "Office of the CXO", effectiveDate: "2026-01-01", reviewDate: "2027-01-01", classification: "restricted", language: "English", fileType: "PDF", fileSizeKb: 842 },
    tags: ["board", "compensation", "confidential"],
    ocrText: "BOARD COMPENSATION & EQUITY FRAMEWORK — FY2026\n\n1. Purpose. This framework governs cash and equity compensation for the Board of Directors and C-suite executives for fiscal year 2026.\n\n2. Base Compensation. Board members receive an annual retainer of $180,000, payable quarterly...\n\n3. Equity Vesting. Executive equity grants vest over a 4-year schedule with a 1-year cliff...\n\n4. Review Cadence. This framework is reviewed annually by the Compensation Committee.",
    summary: "Governs board and executive compensation, equity grants, and vesting for FY2026. Reviewed annually by the Compensation Committee.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-2", title: "Enterprise M&A Target Pipeline — Confidential", categoryId: "cat-report",
    buId: null, visibility: "cxo-only", ownerPersonId: "per-cxo", ownerRole: "cxo", access: [],
    versions: [{ version: 1, editedByPersonId: "per-cxo", editedByRole: "cxo", editedAt: "2026-06-20", changeNote: "Q2 pipeline refresh." }],
    status: "approved",
    metadata: { author: "Elena Sokolov", department: "Office of the CXO", effectiveDate: "2026-06-20", reviewDate: "2026-09-20", classification: "restricted", language: "English", fileType: "XLSX", fileSizeKb: 310 },
    tags: ["m&a", "strategy", "confidential"],
    ocrText: "M&A TARGET PIPELINE — Q2 2026\n\nTarget A: Regional logistics platform, $40-60M range, synergy with Supply Chain ABU.\nTarget B: Precision components supplier, $15-25M range, vertical integration for Manufacturing.\nTarget C: SaaS analytics vendor, $8-12M range, accelerates Workforce Intelligence roadmap.\n\nAll discussions are subject to NDA and board approval prior to term sheet issuance.",
    summary: "Confidential list of acquisition targets under evaluation, with valuation ranges and strategic rationale per target.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-3", title: "Predictive Maintenance Execution SOP", categoryId: "cat-sop",
    buId: "manufacturing", deptId: deptTwinId("manufacturing", "Predictive Maintenance"), visibility: "shared",
    ownerPersonId: "per-head-mfg", ownerRole: "abu_head",
    access: [
      { personId: "per-2", role: "dept_manager", canEdit: true },
      { personId: "per-1", role: "dept_manager", canEdit: false },
    ],
    versions: [
      { version: 1, editedByPersonId: "per-head-mfg", editedByRole: "abu_head", editedAt: "2025-11-02", changeNote: "Initial SOP published." },
      { version: 2, editedByPersonId: "per-2", editedByRole: "dept_manager", editedAt: "2026-03-18", changeNote: "Added bearing vibration threshold table." },
      { version: 3, editedByPersonId: "per-head-mfg", editedByRole: "abu_head", editedAt: "2026-06-30", changeNote: "Updated escalation path to Predictive Maintenance AI." },
    ],
    status: "approved",
    metadata: { author: "Maintenance Supervisor", department: "Manufacturing", effectiveDate: "2025-11-02", reviewDate: "2026-11-02", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 1240 },
    tags: ["maintenance", "predictive", "line-7"],
    ocrText: "PREDICTIVE MAINTENANCE EXECUTION — SOP v3\n\n1. Trigger Conditions. A work order is auto-generated when vibration harmonics exceed 2.3σ above rolling baseline for 3 consecutive readings.\n\n2. Escalation. Predictive Maintenance AI notifies the Maintenance Supervisor within 5 minutes of threshold breach.\n\n3. Response Window. Critical assets (Tier-1) require acknowledgement within 30 minutes and a maintenance window scheduled within 4 hours.\n\n4. Verification. Post-repair, OEE Optimizer confirms recovery to baseline before closing the work order.",
    summary: "Defines the trigger thresholds, escalation path, and verification steps for predictive maintenance work orders on Tier-1 assets.",
    linkedMissionIds: ["mt1"], linkedAgentIds: ["ag3", "ag2"],
  },
  {
    id: "doc-4", title: "Line 7 SCADA & MES Integration Manual", categoryId: "cat-manual",
    buId: "manufacturing", deptId: deptTwinId("manufacturing", "Line Monitor"), visibility: "shared",
    ownerPersonId: "per-head-mfg", ownerRole: "abu_head",
    access: [{ personId: "p-mgr-mfg", role: "dept_manager", canEdit: true }],
    versions: [{ version: 1, editedByPersonId: "per-head-mfg", editedByRole: "abu_head", editedAt: "2025-08-14", changeNote: "Initial manual." }],
    status: "approved",
    metadata: { author: "Plant Manager", department: "Manufacturing", effectiveDate: "2025-08-14", reviewDate: "2026-08-14", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 3120 },
    tags: ["scada", "mes", "integration"],
    ocrText: "LINE 7 SCADA & MES INTEGRATION MANUAL\n\nSection 1: Network Topology. The SCADA gateway bridges to MES via OPC-UA on port 4840...\n\nSection 2: Tag Mapping. Line 7 sensor tags MFRS-7-01 through MFRS-7-48 map to MES work-center WC-107...\n\nSection 3: Failover. On gateway loss, Line Monitor falls back to local buffering for up to 15 minutes.",
    summary: "Technical integration guide for Line 7's SCADA-to-MES data bridge, including tag mapping and failover behavior.",
    linkedMissionIds: [], linkedAgentIds: ["ag1", "ag2"],
  },
  {
    id: "doc-5", title: "Q2 2026 OEE & Quality KPI Evaluation", categoryId: "cat-kpi",
    buId: "manufacturing", visibility: "shared",
    ownerPersonId: "per-head-mfg", ownerRole: "abu_head",
    access: [{ personId: "per-3", role: "employee", canEdit: false }],
    versions: [{ version: 1, editedByPersonId: "per-head-mfg", editedByRole: "abu_head", editedAt: "2026-07-05", changeNote: "Q2 close-out evaluation." }],
    status: "approved",
    metadata: { author: "Quality Manager", department: "Manufacturing", effectiveDate: "2026-07-05", reviewDate: "2026-10-05", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 480 },
    tags: ["oee", "quality", "quarterly-review"],
    ocrText: "Q2 2026 OEE & QUALITY KPI EVALUATION\n\nOEE closed the quarter at 87.4% against a 90% target, a 2.6pt miss driven primarily by Line 7 unplanned downtime in June.\n\nScrap Rate held at 1.2%, traced to raw material batch QD-229 — corrective action already in place with the supplier.\n\nRecommendation: prioritize the Line 7 bearing replacement program into Q3 planning.",
    summary: "Quarterly review of Manufacturing's OEE and quality KPIs, with root-cause notes and a Q3 recommendation.",
    linkedMissionIds: ["mt1"], linkedAgentIds: ["ag1", "ag2", "ag4"],
  },
  {
    id: "doc-6", title: "Supplier Risk Assessment Framework", categoryId: "cat-sop",
    buId: "procurement", deptId: deptTwinId("procurement", "Supplier Risk"), visibility: "shared",
    ownerPersonId: "per-head-proc", ownerRole: "abu_head",
    access: [{ personId: "p-mgr-proc", role: "dept_manager", canEdit: true }],
    versions: [
      { version: 1, editedByPersonId: "per-head-proc", editedByRole: "abu_head", editedAt: "2025-09-01", changeNote: "Initial framework." },
      { version: 2, editedByPersonId: "p-mgr-proc", editedByRole: "dept_manager", editedAt: "2026-07-10", changeNote: "Added tier-1 continuity risk scoring criteria." },
    ],
    status: "pending-approval",
    pendingChange: { id: "pc-1", submittedByPersonId: "p-mgr-proc", submittedByRole: "dept_manager", submittedAt: "2026-07-12", changeNote: "Tighten alternate-supplier activation threshold from 72h to 48h lead-time risk.", requiredApproverRole: "abu_head" },
    metadata: { author: "Procurement Manager", department: "Procurement", effectiveDate: "2025-09-01", reviewDate: "2026-09-01", classification: "internal", language: "English", fileType: "DOCX", fileSizeKb: 210 },
    tags: ["supplier-risk", "procurement", "continuity"],
    ocrText: "SUPPLIER RISK ASSESSMENT FRAMEWORK\n\n1. Scoring. Suppliers are scored 0-100 across financial stability, delivery reliability, and continuity risk.\n\n2. Tier-1 Continuity. Suppliers scoring below 70 on continuity risk trigger an alternate-supplier activation review.\n\n3. Escalation. Scores below 50 require immediate Procurement Director notification.",
    summary: "Defines how supplier risk is scored and when the alternate-supplier protocol activates. A tightened threshold is pending ABU Head approval.",
    linkedMissionIds: ["mt2"], linkedAgentIds: ["ag6"],
  },
  {
    id: "doc-7", title: "Procurement Contract Lifecycle Policy", categoryId: "cat-policy",
    buId: "procurement", visibility: "shared",
    ownerPersonId: "per-head-proc", ownerRole: "abu_head",
    access: [{ personId: "per-9", role: "employee", canEdit: false }],
    versions: [{ version: 1, editedByPersonId: "per-head-proc", editedByRole: "abu_head", editedAt: "2026-02-11", changeNote: "Annual policy refresh." }],
    status: "approved",
    metadata: { author: "Legal Counsel", department: "Procurement", effectiveDate: "2026-02-11", reviewDate: "2027-02-11", classification: "confidential", language: "English", fileType: "PDF", fileSizeKb: 560 },
    tags: ["contracts", "legal", "compliance"],
    ocrText: "PROCUREMENT CONTRACT LIFECYCLE POLICY\n\nAll supplier contracts above $50,000 require CFO sign-off regardless of prior approval level.\n\nContract renewals must be reviewed by Legal Counsel no later than 60 days before expiry.\n\nStandard payment terms are Net-45 unless otherwise negotiated.",
    summary: "Governs contract approval thresholds, renewal timelines, and standard payment terms for supplier agreements.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-8", title: "Contract Bot Operating Playbook", categoryId: "cat-manual",
    buId: "procurement", deptId: deptTwinId("procurement", "Contract Bot"), visibility: "shared",
    ownerPersonId: "p-mgr-proc", ownerRole: "dept_manager",
    access: [{ personId: "per-5", role: "employee", canEdit: true }],
    versions: [{ version: 1, editedByPersonId: "p-mgr-proc", editedByRole: "dept_manager", editedAt: "2026-04-22", changeNote: "Initial playbook." }],
    status: "approved",
    metadata: { author: "Procurement Operations Manager", department: "Procurement", effectiveDate: "2026-04-22", reviewDate: "2027-04-22", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 190 },
    tags: ["contract-bot", "playbook"],
    ocrText: "CONTRACT BOT OPERATING PLAYBOOK\n\nContract Bot drafts standard NDAs and purchase agreements from approved templates.\n\nAny clause deviation from template language routes to Legal Counsel for manual review before signature.",
    summary: "Operating instructions for the Contract Bot AI employee, including when clause deviations require human legal review.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-9", title: "Zero-Touch Monthly Close Runbook", categoryId: "cat-sop",
    buId: "finance", visibility: "shared",
    ownerPersonId: "per-head-fin", ownerRole: "abu_head",
    access: [{ personId: "per-10", role: "employee", canEdit: false }, { personId: "per-11", role: "employee", canEdit: false }],
    versions: [
      { version: 1, editedByPersonId: "per-head-fin", editedByRole: "abu_head", editedAt: "2025-12-01", changeNote: "Initial runbook." },
      { version: 2, editedByPersonId: "per-head-fin", editedByRole: "abu_head", editedAt: "2026-06-01", changeNote: "Added automated reconciliation exception handling." },
    ],
    status: "approved",
    metadata: { author: "Finance Director", department: "Finance", effectiveDate: "2025-12-01", reviewDate: "2026-12-01", classification: "confidential", language: "English", fileType: "PDF", fileSizeKb: 720 },
    tags: ["close", "finance", "automation"],
    ocrText: "ZERO-TOUCH MONTHLY CLOSE RUNBOOK\n\nDay 1: Automated bank and sub-ledger reconciliation via Finance Analyst AI.\n\nDay 2: Exception queue review — only unmatched transactions above $1,000 route to a human.\n\nDay 3: CFO sign-off and books close.",
    summary: "Step-by-step runbook for the automated monthly financial close, including exception-handling thresholds.",
    linkedMissionIds: [], linkedAgentIds: ["ag7"],
  },
  {
    id: "doc-10", title: "FY2026 Cost Allocation Policy", categoryId: "cat-policy",
    buId: "finance", visibility: "shared",
    ownerPersonId: "per-head-fin", ownerRole: "abu_head", access: [],
    versions: [{ version: 1, editedByPersonId: "per-head-fin", editedByRole: "abu_head", editedAt: "2026-01-15", changeNote: "FY2026 policy." }],
    status: "approved",
    metadata: { author: "CFO", department: "Finance", effectiveDate: "2026-01-15", reviewDate: "2027-01-15", classification: "confidential", language: "English", fileType: "PDF", fileSizeKb: 340 },
    tags: ["cost-allocation", "finance"],
    ocrText: "FY2026 COST ALLOCATION POLICY\n\nOverhead costs are allocated to business units on a headcount-weighted basis, reviewed quarterly.\n\nShared AI infrastructure costs are allocated by token-usage share per business unit.",
    summary: "Defines how shared overhead and AI infrastructure costs are allocated across business units for FY2026.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-11", title: "APAC Pipeline Recovery Report — June", categoryId: "cat-report",
    buId: "revenue", visibility: "shared",
    ownerPersonId: "per-head-rev", ownerRole: "abu_head",
    access: [{ personId: "per-12", role: "employee", canEdit: false }, { personId: "per-13", role: "employee", canEdit: false }],
    versions: [{ version: 1, editedByPersonId: "per-head-rev", editedByRole: "abu_head", editedAt: "2026-07-01", changeNote: "June close report." }],
    status: "approved",
    metadata: { author: "Revenue Manager", department: "Revenue", effectiveDate: "2026-07-01", reviewDate: "2026-08-01", classification: "internal", language: "English", fileType: "PPTX", fileSizeKb: 890 },
    tags: ["apac", "pipeline", "revenue"],
    ocrText: "APAC PIPELINE RECOVERY REPORT — JUNE 2026\n\nAPAC pipeline conversion declined 11% over the trailing 30 days, attributed to increased competitive pressure from two regional entrants.\n\nRevenue Scout has re-prioritized 14% additional outreach toward tier-1 accounts, with early signs of recovery in the final week of June.",
    summary: "Analysis of the APAC pipeline conversion decline and the outreach re-prioritization already underway to recover it.",
    linkedMissionIds: ["mt3"], linkedAgentIds: ["ag8", "ag9"],
  },
  {
    id: "doc-12", title: "Enterprise Data Retention & Classification Policy", categoryId: "cat-policy",
    buId: null, visibility: "shared",
    ownerPersonId: "per-cxo", ownerRole: "cxo",
    access: [
      { personId: "per-head-mfg", role: "abu_head", canEdit: false },
      { personId: "per-head-sc", role: "abu_head", canEdit: false },
      { personId: "per-head-proc", role: "abu_head", canEdit: false },
      { personId: "per-head-fin", role: "abu_head", canEdit: false },
      { personId: "per-head-rev", role: "abu_head", canEdit: false },
    ],
    versions: [{ version: 1, editedByPersonId: "per-cxo", editedByRole: "cxo", editedAt: "2026-01-20", changeNote: "Enterprise-wide policy issued to all ABU heads." }],
    status: "approved",
    metadata: { author: "Elena Sokolov", department: "Office of the CXO", effectiveDate: "2026-01-20", reviewDate: "2027-01-20", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 410 },
    tags: ["data", "compliance", "enterprise-wide"],
    ocrText: "ENTERPRISE DATA RETENTION & CLASSIFICATION POLICY\n\nAll documents must be classified as Public, Internal, Confidential, or Restricted at upload.\n\nRestricted documents are visible only to the CXO unless explicitly shared.\n\nRetention: Financial records 7 years, operational records 3 years, communications 1 year.",
    summary: "Enterprise-wide rules for document classification and retention, shared read-only with every ABU head.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-13", title: "Inventory Optimizer Configuration Guide", categoryId: "cat-manual",
    buId: "supply-chain", deptId: deptTwinId("supply-chain", "Inventory Optimizer"), visibility: "restricted",
    ownerPersonId: "per-head-sc", ownerRole: "abu_head", access: [],
    versions: [{ version: 1, editedByPersonId: "per-head-sc", editedByRole: "abu_head", editedAt: "2026-03-05", changeNote: "Initial guide." }],
    status: "approved",
    metadata: { author: "VP, Supply Chain Intelligence", department: "Supply Chain", effectiveDate: "2026-03-05", reviewDate: "2027-03-05", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 260 },
    tags: ["inventory", "configuration"],
    ocrText: "INVENTORY OPTIMIZER CONFIGURATION GUIDE\n\nReorder point calculation uses a 14-day rolling demand average with a 1.5x safety stock multiplier for tier-1 SKUs.\n\nAPAC region SKUs use an accelerated 7-day rolling window due to higher demand volatility.",
    summary: "Configuration reference for the Inventory Optimizer agent's reorder-point and safety-stock calculations.",
    linkedMissionIds: [], linkedAgentIds: ["ag5"],
  },
  {
    id: "doc-14", title: "Warehouse Safety & Handling Manual", categoryId: "cat-manual",
    buId: "supply-chain", visibility: "shared",
    ownerPersonId: "per-head-sc", ownerRole: "abu_head",
    access: [{ personId: "per-6", role: "employee", canEdit: false }],
    versions: [{ version: 1, editedByPersonId: "per-head-sc", editedByRole: "abu_head", editedAt: "2025-10-10", changeNote: "Annual safety manual." }],
    status: "approved",
    metadata: { author: "Warehouse Manager", department: "Supply Chain", effectiveDate: "2025-10-10", reviewDate: "2026-10-10", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 980 },
    tags: ["safety", "warehouse"],
    ocrText: "WAREHOUSE SAFETY & HANDLING MANUAL\n\nAll forklift operators must complete recertification annually.\n\nHazardous material storage areas require dual sign-off for access.",
    summary: "Safety procedures and handling requirements for warehouse operations, including forklift certification rules.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-15", title: "New AI Employee Onboarding Guide", categoryId: "cat-training",
    buId: null, visibility: "shared",
    ownerPersonId: "per-cxo", ownerRole: "cxo",
    access: [{ personId: "per-1", role: "employee", canEdit: false }, { personId: "per-5", role: "employee", canEdit: false }],
    versions: [{ version: 1, editedByPersonId: "per-cxo", editedByRole: "cxo", editedAt: "2026-02-01", changeNote: "Initial enterprise-wide onboarding guide." }],
    status: "approved",
    metadata: { author: "Office of the CXO", department: "Enterprise", effectiveDate: "2026-02-01", reviewDate: "2027-02-01", classification: "public", language: "English", fileType: "PDF", fileSizeKb: 150 },
    tags: ["onboarding", "training", "ai-employee"],
    ocrText: "NEW AI EMPLOYEE ONBOARDING GUIDE\n\nEvery new AI employee is provisioned with a scoped adapter, a reasoning-level default, and an autonomy tier (assisted, supervised, or full).\n\nHuman managers review the first 30 days of decisions before autonomy can be upgraded.",
    summary: "Enterprise-wide guide to how new AI employees are provisioned, supervised, and promoted to higher autonomy.",
    linkedMissionIds: [], linkedAgentIds: [],
  },
  {
    id: "doc-16", title: "Manufacturing Sustainability & Energy Report", categoryId: "cat-report",
    buId: "manufacturing", visibility: "shared",
    ownerPersonId: "per-head-mfg", ownerRole: "abu_head", access: [],
    versions: [{ version: 1, editedByPersonId: "per-head-mfg", editedByRole: "abu_head", editedAt: "2026-06-30", changeNote: "H1 sustainability report." }],
    status: "approved",
    metadata: { author: "Plant Manager", department: "Manufacturing", effectiveDate: "2026-06-30", reviewDate: "2026-12-31", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 520 },
    tags: ["sustainability", "energy"],
    ocrText: "MANUFACTURING SUSTAINABILITY & ENERGY REPORT — H1 2026\n\nEnergy consumption down 4% year-over-year via load-balancing automation.\n\nCarbon emissions tracking toward the two-quarter target of 290 tCO2e/month.",
    summary: "H1 2026 update on energy consumption and carbon emissions trends across the manufacturing facility.",
    linkedMissionIds: [], linkedAgentIds: ["ag10"],
  },
  {
    id: "doc-17", title: "Revenue Forecast Model Methodology", categoryId: "cat-kpi",
    buId: "revenue", visibility: "restricted",
    ownerPersonId: "per-head-rev", ownerRole: "abu_head", access: [],
    versions: [{ version: 1, editedByPersonId: "per-head-rev", editedByRole: "abu_head", editedAt: "2026-05-01", changeNote: "Methodology documentation." }],
    status: "approved",
    metadata: { author: "VP, Revenue Intelligence", department: "Revenue", effectiveDate: "2026-05-01", reviewDate: "2027-05-01", classification: "confidential", language: "English", fileType: "XLSX", fileSizeKb: 220 },
    tags: ["forecast", "methodology"],
    ocrText: "REVENUE FORECAST MODEL METHODOLOGY\n\nForecast Agent weights pipeline stage, historical win rate, and deal velocity to project 30/60/90-day revenue.\n\nModel accuracy is validated monthly against actuals; current forecast accuracy is 88%.",
    summary: "Explains how the revenue forecasting model weights pipeline signals, and its current accuracy against actuals.",
    linkedMissionIds: [], linkedAgentIds: ["ag8"],
  },
  {
    id: "doc-18", title: "Line Monitor Escalation Quick Reference", categoryId: "cat-sop",
    buId: "manufacturing", deptId: deptTwinId("manufacturing", "Line Monitor"), visibility: "shared",
    ownerPersonId: "p-mgr-mfg", ownerRole: "dept_manager",
    access: [{ personId: "per-4", role: "employee", canEdit: false }],
    versions: [{ version: 1, editedByPersonId: "p-mgr-mfg", editedByRole: "dept_manager", editedAt: "2026-04-01", changeNote: "Initial quick reference card." }],
    status: "approved",
    metadata: { author: "Manufacturing Line Manager", department: "Manufacturing", effectiveDate: "2026-04-01", reviewDate: "2027-04-01", classification: "internal", language: "English", fileType: "PDF", fileSizeKb: 60 },
    tags: ["line-monitor", "escalation", "quick-reference"],
    ocrText: "LINE MONITOR ESCALATION QUICK REFERENCE\n\nAmber alert: notify Line Supervisor within 15 minutes.\n\nRed alert: notify Plant Manager immediately and pause dependent downstream lines if throughput risk exceeds 20%.",
    summary: "One-page escalation reference for Line Monitor alert severities and who to notify.",
    linkedMissionIds: [], linkedAgentIds: ["ag1"],
  },
];

export function currentVersion(doc: Document): DocVersion {
  return doc.versions[doc.versions.length - 1];
}
