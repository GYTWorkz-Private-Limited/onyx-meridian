// Human employee directory — distinct from MFG_AGENTS (the AI workforce).
// Names reuse the human role-holders already referenced elsewhere in the app
// (SOP_CATALOG.humans, Unit of Work RACI, APPROVAL_QUEUE.approver) so the
// People directory feels connected to the rest of the app rather than
// introducing a disconnected cast of names.

import { deptTwinId } from "@/data/org-ids";

export interface Person {
  id: string;
  name: string;
  email: string;
  title: string;
  buId: string | null; // null = enterprise-wide (CXO office, Legal)
  deptId?: string; // department twin this person belongs to (dept_manager/employee scoping)
  roleTier: "member" | "abu_head" | "cxo";
  status: "active" | "invited" | "paused";
  /** Mock monthly AI-tool spend attributed to this person, for cost control. */
  costMtd: number;
}

export const PEOPLE: Person[] = [
  // Leadership (mirrors the seeded RBAC personas in lib/rbac.ts)
  { id: "per-cxo",      name: "Elena Sokolov",   email: "elena.sokolov@meridian-mfg.com",   title: "Chief Executive Officer",         buId: null,             roleTier: "cxo",      status: "active", costMtd: 420 },
  { id: "per-head-mfg", name: "Marcus Chen",     email: "marcus.chen@meridian-mfg.com",     title: "VP, Manufacturing Intelligence",  buId: "manufacturing",  roleTier: "abu_head", status: "active", costMtd: 280 },
  { id: "per-head-sc",  name: "Amara Osei",      email: "amara.osei@meridian-mfg.com",      title: "VP, Supply Chain Intelligence",   buId: "supply-chain",   roleTier: "abu_head", status: "active", costMtd: 195 },
  { id: "per-head-proc",name: "David Nakamura",  email: "david.nakamura@meridian-mfg.com",  title: "VP, Procurement Intelligence",    buId: "procurement",    roleTier: "abu_head", status: "active", costMtd: 165 },
  { id: "per-head-fin", name: "Priya Raman",     email: "priya.raman@meridian-mfg.com",     title: "VP, Finance Intelligence",        buId: "finance",        roleTier: "abu_head", status: "active", costMtd: 210 },
  { id: "per-head-rev", name: "Jordan Blake",    email: "jordan.blake@meridian-mfg.com",    title: "VP, Revenue Intelligence",        buId: "revenue",        roleTier: "abu_head", status: "active", costMtd: 240 },

  // Manufacturing
  { id: "per-1", name: "Plant Manager",          email: "plant.manager@meridian-mfg.com",       title: "Plant Manager",           buId: "manufacturing", roleTier: "member", status: "active", costMtd: 88 },
  { id: "per-2", name: "Maintenance Supervisor",  email: "maintenance.supervisor@meridian-mfg.com", title: "Maintenance Supervisor", buId: "manufacturing", deptId: deptTwinId("manufacturing", "Maintenance"), roleTier: "member", status: "active", costMtd: 64 },
  { id: "per-3", name: "Quality Manager",         email: "quality.manager@meridian-mfg.com",     title: "Quality Manager",          buId: "manufacturing", deptId: deptTwinId("manufacturing", "Quality"), roleTier: "member", status: "active", costMtd: 72 },
  { id: "per-4", name: "Line Supervisor",         email: "line.supervisor@meridian-mfg.com",     title: "Line Supervisor",          buId: "manufacturing", deptId: deptTwinId("manufacturing", "Production"), roleTier: "member", status: "active", costMtd: 45 },
  { id: "per-5", name: "Operations Coordinator",  email: "operations.coordinator@meridian-mfg.com", title: "Operations Coordinator", buId: "procurement",   deptId: deptTwinId("procurement", "Contracts"), roleTier: "member", status: "active", costMtd: 100 },

  // Supply Chain
  { id: "per-6", name: "Warehouse Manager",       email: "warehouse.manager@meridian-mfg.com",   title: "Warehouse Manager",        buId: "supply-chain",  deptId: deptTwinId("supply-chain", "Warehousing"), roleTier: "member", status: "active", costMtd: 58 },

  // Procurement
  { id: "per-7", name: "Procurement Manager",     email: "procurement.manager@meridian-mfg.com", title: "Procurement Manager",      buId: "procurement",   deptId: deptTwinId("procurement", "Supplier Management"), roleTier: "member", status: "active", costMtd: 76 },
  { id: "per-8", name: "Procurement Director",    email: "procurement.director@meridian-mfg.com",title: "Procurement Director",     buId: "procurement",   deptId: deptTwinId("procurement", "Sourcing"), roleTier: "member", status: "active", costMtd: 132 },
  { id: "per-9", name: "Legal Counsel",           email: "legal.counsel@meridian-mfg.com",       title: "Legal Counsel",            buId: "procurement",   deptId: deptTwinId("procurement", "Contracts"), roleTier: "member", status: "active", costMtd: 54 },

  // Finance
  { id: "per-10", name: "Finance Director",       email: "finance.director@meridian-mfg.com",    title: "Finance Director",         buId: "finance",       deptId: deptTwinId("finance", "FP&A"), roleTier: "member", status: "active", costMtd: 96 },
  { id: "per-11", name: "CFO",                    email: "cfo@meridian-mfg.com",                 title: "Chief Financial Officer",  buId: "finance",       deptId: deptTwinId("finance", "Audit"), roleTier: "member", status: "active", costMtd: 118 },

  // Revenue
  { id: "per-12", name: "Revenue Manager",        email: "revenue.manager@meridian-mfg.com",     title: "Revenue Manager",          buId: "revenue",       deptId: deptTwinId("revenue", "Sales"), roleTier: "member", status: "active", costMtd: 84 },
  { id: "per-13", name: "VP Sales",               email: "vp.sales@meridian-mfg.com",            title: "VP Sales",                 buId: "revenue",       deptId: deptTwinId("revenue", "Sales"), roleTier: "member", status: "active", costMtd: 142 },
];
