import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Plus, Check, Trash2, Edit2, X, ChevronRight,
  BookOpen, GitBranch, Users, DollarSign, Lock, AlertTriangle,
  ArrowRight, Play, Copy, Clock, CheckCircle2, Settings,
  FileText, Search, Filter, History, FlaskConical, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SOP_CATALOG, BU_LIST } from "@/data/enterprise-data";

// ─── Types ─────────────────────────────────────────────────────

interface Policy {
  id: string; title: string; category: string; scope: string;
  status: "active" | "draft" | "inactive"; rule: string;
  createdAt: string; violations?: number; version?: string;
  department?: string;
}

type StudioTab =
  | "enterprise" | "department" | "sop-library" | "sop-builder"
  | "workflow" | "approvals" | "compliance" | "security"
  | "budget" | "history" | "testing" | "simulation"
  | "dependencies" | "templates";

// ─── Data ──────────────────────────────────────────────────────

const ENTERPRISE_POLICIES: Policy[] = [
  { id: "ep1", title: "Human Approval — Financial Threshold", category: "Financial Controls", status: "active", scope: "All AI Employees", rule: "Any financial transaction or commitment >$50K requires human approval. No exceptions.", createdAt: "Mar 14, 2026", violations: 0, version: "v2.1" },
  { id: "ep2", title: "PII Data Access Governance", category: "Data Privacy", status: "active", scope: "All AI Employees", rule: "PII data access must be logged, approved by DPO, and limited to minimum necessary scope.", createdAt: "Feb 10, 2026", violations: 1, version: "v1.4" },
  { id: "ep3", title: "Agent Autonomy Boundary v2.4", category: "AI Governance", status: "active", scope: "All AI Employees", rule: "AI agents may not self-modify their own instructions, create new agents, or override governance rules autonomously.", createdAt: "Apr 3, 2026", violations: 0, version: "v2.4" },
  { id: "ep4", title: "Model Replacement Governance", category: "AI Governance", status: "active", scope: "All AI Employees", rule: "No agent model replacement may occur without 72h review period and CISO approval.", createdAt: "Jan 22, 2026", violations: 0, version: "v1.0" },
  { id: "ep5", title: "Cross-BU Data Sharing Protocol", category: "Data Privacy", status: "draft", scope: "All Business Units", rule: "Data shared across business units must be classified, anonymized where required, and logged for compliance.", createdAt: "Jun 12, 2026", violations: 0, version: "v0.1" },
];

const DEPT_POLICIES: Policy[] = [
  { id: "dp1", title: "New Vendor Approval", category: "Procurement", status: "active", scope: "Procurement AI", rule: "All new vendor invoices require human approval regardless of amount for vendors under 90 days old.", createdAt: "May 1, 2026", violations: 2, version: "v1.2", department: "Procurement" },
  { id: "dp2", title: "Contract Generation Limits", category: "Legal Compliance", status: "active", scope: "Contract AI", rule: "Contract AI may only generate contract drafts. Final execution requires Legal Counsel sign-off.", createdAt: "Jun 10, 2026", violations: 0, version: "v1.0", department: "Procurement" },
  { id: "dp3", title: "Production Halt Escalation", category: "Manufacturing", status: "active", scope: "Manufacturing AI", rule: "Any production line halt exceeding 30 minutes must escalate to Plant Manager within 5 minutes.", createdAt: "Apr 18, 2026", violations: 0, version: "v1.1", department: "Manufacturing" },
  { id: "dp4", title: "Revenue Discount Threshold", category: "Sales Controls", status: "active", scope: "Revenue AI", rule: "Discounts exceeding 15% require VP Sales approval before deal progression.", createdAt: "Mar 28, 2026", violations: 1, version: "v2.0", department: "Revenue" },
  { id: "dp5", title: "Financial Close Approval Gate", category: "Finance Controls", status: "active", scope: "Finance AI", rule: "Month-end close reconciliation above $100K variance requires CFO review before booking.", createdAt: "Feb 14, 2026", violations: 0, version: "v1.3", department: "Finance" },
];

const WORKFLOW_POLICIES: Policy[] = [
  { id: "wp1", title: "Procurement Spend Gate", category: "Workflow", status: "active", scope: "Procurement Workflow", rule: "Any autonomous spend action >$10K is blocked + routed to Procurement Manager for approval within 4 hours.", createdAt: "Mar 14, 2026", violations: 0, version: "v1.0" },
  { id: "wp2", title: "Agent Collaboration Protocol", category: "Workflow", status: "active", scope: "All Workflows", rule: "Multi-agent workflows must have a designated orchestrator agent. Parallel actions require dependency resolution.", createdAt: "Apr 2, 2026", violations: 0, version: "v1.1" },
  { id: "wp3", title: "Workflow Timeout Policy", category: "Workflow", status: "active", scope: "All Workflows", rule: "Any workflow step exceeding 30 minutes without progress must trigger human escalation.", createdAt: "May 10, 2026", violations: 3, version: "v1.0" },
  { id: "wp4", title: "SOP Deviation Alert", category: "Workflow", status: "draft", scope: "Manufacturing Workflows", rule: "Any deviation from SOP execution path greater than 2 steps must be logged and reviewed within 24 hours.", createdAt: "Jun 1, 2026", violations: 0, version: "v0.2" },
];

const APPROVAL_RULES: Policy[] = [
  { id: "ar1", title: "Low Risk — Auto Approve", category: "Approval Rules", status: "active", scope: "All AI Employees", rule: "Routine operations within approved parameters, within budget, and with no PII access are auto-approved instantly.", createdAt: "Jan 10, 2026", violations: 0, version: "v1.0" },
  { id: "ar2", title: "Medium Risk — Manager Approval (4h SLA)", category: "Approval Rules", status: "active", scope: "Operations + Finance AI", rule: "Cross-BU data access, budget spend $10K–$50K, and policy exception requests require manager approval within 4 hours.", createdAt: "Jan 10, 2026", violations: 0, version: "v1.0" },
  { id: "ar3", title: "High Risk — Executive Approval (24h SLA)", category: "Approval Rules", status: "active", scope: "Procurement + Contract AI", rule: "Spend >$50K, cross-BU workflow changes, customer-facing actions, and regulated data access require executive approval.", createdAt: "Jan 10, 2026", violations: 0, version: "v1.0" },
  { id: "ar4", title: "Critical Risk — Governance Board (48h SLA)", category: "Approval Rules", status: "active", scope: "All Agents (Quarantine)", rule: "Policy modifications, spend >$500K, agent replacement, regulatory filings require full governance board review.", createdAt: "Jan 10, 2026", violations: 0, version: "v1.0" },
];

const COMPLIANCE_POLICIES: Policy[] = [
  { id: "cp1", title: "SOX Compliance — Financial Reporting", category: "Compliance", status: "active", scope: "Finance AI", rule: "All financial reporting actions must maintain audit trails, segregation of duties, and dual approval for material adjustments.", createdAt: "Jan 1, 2026", violations: 0, version: "v3.1" },
  { id: "cp2", title: "GDPR — Data Subject Rights", category: "Compliance", status: "active", scope: "All AI Employees", rule: "Any data subject request (access, deletion, portability) must be fulfilled within 30 days. AI agents must route to DPO.", createdAt: "Jan 1, 2026", violations: 0, version: "v2.0" },
  { id: "cp3", title: "ISO 27001 — Information Security", category: "Compliance", status: "active", scope: "All AI Employees", rule: "All AI actions involving confidential data must be encrypted, logged, and subject to quarterly access review.", createdAt: "Feb 1, 2026", violations: 0, version: "v1.2" },
];

const SECURITY_POLICIES: Policy[] = [
  { id: "sp1", title: "PII Data Fence", category: "Security", status: "active", scope: "All AI Employees", rule: "Hard block on any PII export or bulk read. Notify DPO within 15 minutes. Log to compliance audit trail.", createdAt: "Jan 5, 2026", violations: 1, version: "v2.0" },
  { id: "sp2", title: "Agent Credential Isolation", category: "Security", status: "active", scope: "All AI Employees", rule: "No AI agent may access or use credentials belonging to another agent or human user. Credential sharing is prohibited.", createdAt: "Feb 20, 2026", violations: 0, version: "v1.0" },
  { id: "sp3", title: "Prompt Injection Defense", category: "Security", status: "active", scope: "All AI Employees", rule: "All external data ingested by AI agents must pass injection detection. Flagged inputs must be quarantined.", createdAt: "Mar 10, 2026", violations: 2, version: "v1.1" },
];

const BUDGET_POLICIES: Policy[] = [
  { id: "bp1", title: "AI Cost Budget Cap — Monthly", category: "Budget", status: "active", scope: "All Business Units", rule: "Monthly AI cost per BU must not exceed 110% of allocated budget. Overage triggers automatic alert to Finance Controller.", createdAt: "Jan 1, 2026", violations: 0, version: "v1.0" },
  { id: "bp2", title: "Token Usage Limit", category: "Budget", status: "active", scope: "All AI Employees", rule: "Individual agent daily token usage may not exceed 5M tokens without budget approval from the BU lead.", createdAt: "Mar 15, 2026", violations: 1, version: "v1.0" },
  { id: "bp3", title: "Budget Reallocation Gate", category: "Budget", status: "inactive", scope: "Finance AI", rule: "Budget reallocation > $25,000 between BUs requires CFO approval with supporting context and 24h SLA.", createdAt: "Apr 2, 2026", violations: 0, version: "v0.1" },
];

const POLICY_TEMPLATES = [
  { name: "Financial Threshold Gate", description: "Block AI spend above a configurable threshold. Route to approver.", category: "Financial Controls", useCount: 12 },
  { name: "Human Approval Checkpoint", description: "Insert a mandatory human review step at a defined workflow point.", category: "Approval Rules", useCount: 24 },
  { name: "PII Access Control", description: "Block, log and alert on any PII data access by AI agents.", category: "Data Privacy", useCount: 8 },
  { name: "SLA Escalation Trigger", description: "Escalate to human when a workflow step exceeds a time threshold.", category: "Workflow", useCount: 16 },
  { name: "Data Classification Gate", description: "Require data classification before allowing cross-BU data access.", category: "Data Privacy", useCount: 6 },
  { name: "Autonomy Downgrade Rule", description: "Reduce agent autonomy level on policy violation or missed evaluation.", category: "AI Governance", useCount: 5 },
];

const VERSION_HISTORY = [
  { policy: "Agent Autonomy Boundary", version: "v2.4", date: "Apr 3, 2026", author: "AI Governance Board", change: "Added self-modification prohibition clause" },
  { policy: "Agent Autonomy Boundary", version: "v2.3", date: "Feb 14, 2026", author: "CISO", change: "Expanded scope to include model fine-tuning" },
  { policy: "PII Data Access Governance", version: "v1.4", date: "Feb 10, 2026", author: "DPO", change: "Aligned with GDPR Article 25 requirements" },
  { policy: "Human Approval — Financial Threshold", version: "v2.1", date: "Mar 14, 2026", author: "CFO Office", change: "Threshold raised from $25K to $50K" },
  { policy: "Revenue Discount Threshold", version: "v2.0", date: "Mar 28, 2026", author: "VP Sales", change: "Threshold reduced from 20% to 15%" },
];

// ─── Sub-components ─────────────────────────────────────────────

function PolicyList({ policies, onToggle, onEdit, onDelete }: {
  policies: Policy[];
  onToggle: (id: string) => void;
  onEdit: (p: Policy) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const cats = ["All", ...Array.from(new Set(policies.map(p => p.category)))];
  const visible = policies.filter(p =>
    (filter === "All" || p.category === filter) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.rule.toLowerCase().includes(search.toLowerCase()))
  );

  const statusCls: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    inactive: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full border border-border rounded-sm pl-7 pr-3 py-1.5 text-[11px] bg-white outline-none focus:border-primary"
            placeholder="Search policies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={cn("text-[9px] uppercase tracking-widest font-semibold px-2 py-1 border rounded-sm transition-colors",
                filter === c ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/30"
              )}>{c}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {visible.map(p => (
          <div key={p.id} className="bg-white border border-border rounded-sm p-3 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className={cn("w-6 h-6 rounded-sm border flex items-center justify-center shrink-0 mt-0.5", statusCls[p.status])}>
                  <Shield size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-[11px] text-foreground">{p.title}</span>
                    <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", statusCls[p.status])}>{p.status}</span>
                    <span className="text-[8px] bg-muted border border-border px-1.5 py-0.5 rounded-sm text-muted-foreground uppercase tracking-widest">{p.category}</span>
                    {p.version && <span className="text-[8px] text-muted-foreground font-mono">{p.version}</span>}
                    {(p.violations ?? 0) > 0 && <span className="text-[8px] bg-red-50 border border-red-200 text-red-600 px-1.5 py-0.5 rounded-sm font-bold">{p.violations} violations</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug mb-1">{p.rule}</p>
                  <div className="text-[9px] text-muted-foreground">Scope: <span className="font-semibold text-foreground">{p.scope}</span> · {p.createdAt}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onToggle(p.id)} className="text-[9px] uppercase tracking-widest border border-border rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  {p.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => onEdit(p)} className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"><Edit2 size={11} /></button>
                <button onClick={() => onDelete(p.id, p.title)} className="p-1.5 rounded-sm text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"><Trash2 size={11} /></button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="bg-white border border-border rounded-sm p-8 text-center text-sm text-muted-foreground">No policies match your filter.</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

const TABS: { id: StudioTab; label: string; icon: React.ElementType }[] = [
  { id: "enterprise", label: "Enterprise Policies", icon: Shield },
  { id: "department", label: "Department Policies", icon: Layers },
  { id: "sop-library", label: "SOP Library", icon: BookOpen },
  { id: "sop-builder", label: "SOP Builder", icon: Edit2 },
  { id: "workflow", label: "Workflow Policies", icon: GitBranch },
  { id: "approvals", label: "Human Approval Rules", icon: Users },
  { id: "compliance", label: "Compliance Policies", icon: CheckCircle2 },
  { id: "security", label: "Security Policies", icon: Lock },
  { id: "budget", label: "Budget Policies", icon: DollarSign },
  { id: "history", label: "Version History", icon: History },
  { id: "testing", label: "Policy Testing", icon: Play },
  { id: "simulation", label: "Policy Simulation", icon: FlaskConical },
  { id: "dependencies", label: "Policy Dependencies", icon: ArrowRight },
  { id: "templates", label: "Policy Templates", icon: FileText },
];

export default function PolicyStudio() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<StudioTab>("enterprise");

  const [enterprisePolicies, setEnterprisePolicies] = useState(ENTERPRISE_POLICIES);
  const [deptPolicies, setDeptPolicies] = useState(DEPT_POLICIES);
  const [workflowPolicies, setWorkflowPolicies] = useState(WORKFLOW_POLICIES);
  const [approvalRules, setApprovalRules] = useState(APPROVAL_RULES);
  const [compliancePolicies, setCompliancePolicies] = useState(COMPLIANCE_POLICIES);
  const [securityPolicies, setSecurityPolicies] = useState(SECURITY_POLICIES);
  const [budgetPolicies, setBudgetPolicies] = useState(BUDGET_POLICIES);

  const [showForm, setShowForm] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [form, setForm] = useState({ title: "", category: "AI Governance", scope: "All AI Employees", rule: "" });

  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<null | { passed: boolean; matched: string[]; blocked: boolean }>(null);
  const [simBu, setSimBu] = useState("manufacturing");
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<null | string[]>(null);
  const [nlDraft, setNlDraft] = useState("");
  const [nlParsed, setNlParsed] = useState<Partial<Policy> | null>(null);
  const [sopForm, setSopForm] = useState({ title: "", owner: "Manufacturing", automation: 80, workflow: "", agents: "", humans: "" });

  const getPoliciesForTab = (tab: StudioTab) => {
    if (tab === "enterprise") return enterprisePolicies;
    if (tab === "department") return deptPolicies;
    if (tab === "workflow") return workflowPolicies;
    if (tab === "approvals") return approvalRules;
    if (tab === "compliance") return compliancePolicies;
    if (tab === "security") return securityPolicies;
    if (tab === "budget") return budgetPolicies;
    return [];
  };

  const getSetterForTab = (tab: StudioTab) => {
    if (tab === "enterprise") return setEnterprisePolicies;
    if (tab === "department") return setDeptPolicies;
    if (tab === "workflow") return setWorkflowPolicies;
    if (tab === "approvals") return setApprovalRules;
    if (tab === "compliance") return setCompliancePolicies;
    if (tab === "security") return setSecurityPolicies;
    if (tab === "budget") return setBudgetPolicies;
    return setEnterprisePolicies;
  };

  const handleToggle = (tab: StudioTab) => (id: string) => {
    const setter = getSetterForTab(tab);
    setter((prev: Policy[]) => prev.map(p => {
      if (p.id !== id) return p;
      const next = p.status === "active" ? "inactive" : "active";
      toast({ title: `Policy ${next === "active" ? "Activated" : "Deactivated"}`, description: `"${p.title}" is now ${next}.` });
      return { ...p, status: next };
    }));
  };

  const handleEdit = (p: Policy) => {
    setEditPolicy(p);
    setForm({ title: p.title, category: p.category, scope: p.scope, rule: p.rule });
    setShowForm(true);
  };

  const handleDelete = (tab: StudioTab) => (id: string, title: string) => {
    const setter = getSetterForTab(tab);
    setter((prev: Policy[]) => prev.filter(p => p.id !== id));
    toast({ title: "Policy Removed", description: `"${title}" deleted.` });
  };

  const save = () => {
    if (!form.title.trim() || !form.rule.trim()) {
      toast({ title: "Missing fields", description: "Title and rule are required.", variant: "destructive" }); return;
    }
    if (editPolicy) {
      const setter = getSetterForTab(activeTab);
      setter((prev: Policy[]) => prev.map(p => p.id === editPolicy.id ? { ...p, ...form } : p));
      toast({ title: "Policy Updated" });
    }
    setShowForm(false); setEditPolicy(null);
  };

  const handleNewPolicy = () => {
    setEditPolicy(null);
    setForm({ title: "", category: "AI Governance", scope: "All AI Employees", rule: "" });
    setShowForm(true);
  };

  const handleAddNew = () => {
    if (!form.title.trim() || !form.rule.trim()) {
      toast({ title: "Missing fields", description: "Title and rule are required.", variant: "destructive" }); return;
    }
    const np: Policy = {
      id: `new-${Date.now()}`, ...form, status: "draft", violations: 0, version: "v0.1",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    const setter = getSetterForTab(activeTab);
    setter((prev: Policy[]) => [np, ...prev]);
    toast({ title: "Policy Created", description: `"${np.title}" added as draft.` });
    setShowForm(false);
  };

  const runTest = () => {
    if (!testInput.trim()) return;
    const lower = testInput.toLowerCase();
    const matched: string[] = [];
    const blocked = lower.includes("spend") || lower.includes("pii") || lower.includes("vendor");
    if (lower.includes("spend") || lower.includes("$")) matched.push("Human Approval — Financial Threshold", "Procurement Spend Gate");
    if (lower.includes("pii") || lower.includes("data")) matched.push("PII Data Access Governance", "PII Data Fence");
    if (lower.includes("vendor")) matched.push("New Vendor Approval", "Contract Review Policy");
    if (matched.length === 0) matched.push("No policies triggered — action is within approved parameters");
    setTestResult({ passed: !blocked, matched, blocked });
  };

  const runSimulation = () => {
    setSimRunning(true);
    setSimResult(null);
    setTimeout(() => {
      setSimRunning(false);
      setSimResult([
        `Simulation complete for ${BU_LIST.find(b => b.id === simBu)?.name ?? simBu}`,
        "14 policy checks triggered across 8 workflows",
        "2 actions would be blocked: spend approval, new vendor contract",
        "3 actions would require human escalation",
        "9 actions auto-approved — within approved parameters",
        "No compliance violations detected in simulation window",
      ]);
    }, 2000);
  };

  const parseNL = () => {
    if (!nlDraft.trim()) return;
    const lower = nlDraft.toLowerCase();
    const category = lower.includes("financ") || lower.includes("spend") ? "Financial Controls"
      : lower.includes("data") || lower.includes("pii") ? "Data Privacy"
      : lower.includes("vendor") || lower.includes("procure") ? "Procurement"
      : lower.includes("security") || lower.includes("access") ? "Security"
      : "AI Governance";
    setNlParsed({ title: nlDraft.length > 60 ? nlDraft.substring(0, 60) + "…" : nlDraft, category, scope: "All AI Employees", rule: nlDraft });
  };

  const acceptNL = () => {
    if (!nlParsed) return;
    const np: Policy = {
      id: `nl-${Date.now()}`, title: nlParsed.title ?? "New Policy", category: nlParsed.category ?? "AI Governance",
      scope: nlParsed.scope ?? "All AI Employees", rule: nlParsed.rule ?? nlDraft,
      status: "draft", violations: 0, version: "v0.1",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setEnterprisePolicies(prev => [np, ...prev]);
    toast({ title: "Policy Drafted from Natural Language", description: `"${np.title}" added.` });
    setNlDraft(""); setNlParsed(null);
  };

  const totalActive = [...enterprisePolicies, ...deptPolicies, ...workflowPolicies, ...approvalRules, ...compliancePolicies, ...securityPolicies, ...budgetPolicies].filter(p => p.status === "active").length;
  const totalAll = enterprisePolicies.length + deptPolicies.length + workflowPolicies.length + approvalRules.length + compliancePolicies.length + securityPolicies.length + budgetPolicies.length;
  const totalViolations = [...enterprisePolicies, ...deptPolicies, ...workflowPolicies, ...securityPolicies, ...budgetPolicies].reduce((s, p) => s + (p.violations ?? 0), 0);

  const policyTabs: StudioTab[] = ["enterprise", "department", "workflow", "approvals", "compliance", "security", "budget"];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="POLICY STUDIO"
        metrics={[
          { label: "ACTIVE", value: totalActive },
          { label: "TOTAL", value: totalAll },
          { label: "VIOLATIONS", value: totalViolations },
        ]}
      />

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[560px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wide">{editPolicy ? "Edit Policy" : "New Policy"}</h3>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Title *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Category</label>
                  <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Scope</label>
                  <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Rule Statement *</label>
                <textarea rows={3} className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary resize-none" value={form.rule} onChange={e => setForm(f => ({ ...f, rule: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={editPolicy ? save : handleAddNew}>
                {editPolicy ? "Save Changes" : "Create Policy"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Nav */}
        <div className="w-[200px] shrink-0 bg-white border-r border-border flex flex-col overflow-y-auto">
          <div className="px-3 py-3 border-b border-border">
            <div className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground">Policy Studio</div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                    activeTab === t.id ? "bg-primary/5 text-primary border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon size={12} className="shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Policy list tabs */}
          {policyTabs.includes(activeTab) && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">{TABS.find(t => t.id === activeTab)?.label}</h2>
                <div className="flex gap-2">
                  {activeTab === "enterprise" && (
                    <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest" onClick={() => { setNlParsed(null); setNlDraft(""); }}>
                      Draft from Natural Language
                    </Button>
                  )}
                  <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90" onClick={handleNewPolicy}>
                    <Plus size={11} className="mr-1" /> New Policy
                  </Button>
                </div>
              </div>

              {activeTab === "enterprise" && (
                <div className="bg-white border border-border rounded-sm p-4 mb-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Draft from Natural Language</div>
                  <div className="flex gap-2">
                    <textarea rows={2} className="flex-1 border border-border rounded-sm px-3 py-2 text-[11px] bg-white focus:outline-none focus:border-primary resize-none"
                      placeholder='e.g. "Any AI agent that attempts to access production data outside working hours must be blocked."'
                      value={nlDraft} onChange={e => setNlDraft(e.target.value)} />
                    <Button size="sm" variant="outline" className="text-xs h-auto self-start" onClick={parseNL} disabled={!nlDraft.trim()}>Parse →</Button>
                  </div>
                  {nlParsed && (
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1.5">Parsed Preview</div>
                      {[{ l: "Title", v: nlParsed.title }, { l: "Category", v: nlParsed.category }, { l: "Scope", v: nlParsed.scope }].map(r => (
                        <div key={r.l} className="flex gap-2 text-[10px] mb-0.5">
                          <span className="text-muted-foreground w-14 shrink-0 font-semibold">{r.l}:</span>
                          <span>{r.v}</span>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="h-6 text-[9px] uppercase tracking-widest bg-primary text-white" onClick={acceptNL}><Check size={9} className="mr-1" /> Accept</Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[9px] uppercase tracking-widest" onClick={() => setNlParsed(null)}>Discard</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <PolicyList
                policies={getPoliciesForTab(activeTab)}
                onToggle={handleToggle(activeTab)}
                onEdit={handleEdit}
                onDelete={handleDelete(activeTab)}
              />
            </>
          )}

          {activeTab === "sop-library" && (
            <div>
              <div className="text-sm font-bold text-foreground mb-4">SOP Library</div>
              <div className="space-y-3">
                {SOP_CATALOG.map((sop) => (
                  <div key={sop.id} className="bg-white border border-border rounded-sm p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm text-foreground">{sop.title}</span>
                          <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold",
                            sop.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          )}>{sop.status}</span>
                          <span className="text-[8px] font-mono text-muted-foreground">{sop.version}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground">Owner: {sop.owner} · {sop.automation}% automated · {sop.workflow.length} steps</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button className="text-[9px] uppercase tracking-widest font-semibold border border-border rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                          <Copy size={9} className="inline mr-1" />Clone
                        </button>
                        <button onClick={() => navigate("/workflow-studio")} className="text-[9px] uppercase tracking-widest font-semibold bg-primary text-white rounded-sm px-2 py-1 hover:bg-primary/90 transition-colors">
                          Edit →
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-0 overflow-x-auto pb-1 mt-2">
                      {sop.workflow.map((step, i) => (
                        <div key={step} className="flex items-center shrink-0">
                          <div className={cn("px-2 py-1 rounded-sm border text-[9px] font-semibold",
                            i === 0 ? "bg-primary/5 border-primary/30 text-primary" : i === sop.workflow.length - 1 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-muted/40 border-border text-foreground"
                          )}>{step}</div>
                          {i < sop.workflow.length - 1 && <ArrowRight size={10} className="text-muted-foreground mx-1 shrink-0" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-2 pt-2 border-t border-border/40">
                      <div className="text-[9px] text-muted-foreground">Agents: <span className="font-semibold text-foreground">{sop.agents.join(", ")}</span></div>
                      <div className="text-[9px] text-muted-foreground">Humans: <span className="font-semibold text-foreground">{sop.humans.join(", ")}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "sop-builder" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-foreground">SOP Builder</div>
                <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest bg-foreground text-background">
                  <Plus size={11} className="mr-1" /> New SOP
                </Button>
              </div>
              <div className="bg-white border border-border rounded-sm p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">SOP Title</label>
                    <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. Emergency Procurement Approval" value={sopForm.title} onChange={e => setSopForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Owning Department</label>
                    <select className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" value={sopForm.owner} onChange={e => setSopForm(f => ({ ...f, owner: e.target.value }))}>
                      {BU_LIST.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Workflow Steps (comma-separated)</label>
                  <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. Trigger, AI Analysis, Human Review, Execution, Verification" value={sopForm.workflow} onChange={e => setSopForm(f => ({ ...f, workflow: e.target.value }))} />
                  {sopForm.workflow && (
                    <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
                      {sopForm.workflow.split(",").map((s, i) => (
                        <div key={i} className="flex items-center shrink-0">
                          <div className={cn("px-2 py-1 rounded-sm border text-[9px] font-semibold",
                            i === 0 ? "bg-primary/5 border-primary/30 text-primary" : "bg-muted/40 border-border text-foreground"
                          )}>{s.trim()}</div>
                          {i < sopForm.workflow.split(",").length - 1 && <ArrowRight size={9} className="text-muted-foreground mx-1 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Assigned Agents</label>
                    <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. Supplier Risk, Contract Bot" value={sopForm.agents} onChange={e => setSopForm(f => ({ ...f, agents: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Human Approvers</label>
                    <input className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary" placeholder="e.g. Procurement Manager, CFO" value={sopForm.humans} onChange={e => setSopForm(f => ({ ...f, humans: e.target.value }))} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Target Automation %: {sopForm.automation}%</label>
                  <input type="range" min={0} max={100} value={sopForm.automation} onChange={e => setSopForm(f => ({ ...f, automation: parseInt(e.target.value) }))} className="w-full" />
                </div>
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={() => toast({ title: "SOP Saved", description: `"${sopForm.title || 'New SOP'}" has been saved to the library.` })}>
                  Save SOP to Library
                </Button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div className="text-sm font-bold text-foreground mb-4">Version History</div>
              <div className="bg-white border border-border rounded-sm overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-muted/30 border-b border-border">
                  {["Policy", "Version", "Date", "Author", "Change Summary"].map(h => (
                    <div key={h} className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground">{h}</div>
                  ))}
                </div>
                {VERSION_HISTORY.map((v, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/40 hover:bg-muted/10 items-center">
                    <div className="text-[10px] font-semibold text-foreground">{v.policy}</div>
                    <div className="text-[10px] font-mono text-primary font-bold">{v.version}</div>
                    <div className="text-[10px] text-muted-foreground">{v.date}</div>
                    <div className="text-[10px] text-foreground">{v.author}</div>
                    <div className="text-[10px] text-muted-foreground">{v.change}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "testing" && (
            <div>
              <div className="text-sm font-bold text-foreground mb-4">Policy Testing</div>
              <div className="bg-white border border-border rounded-sm p-4 mb-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Describe an AI agent action to test against all policies</div>
                <div className="flex gap-2">
                  <textarea rows={3} className="flex-1 border border-border rounded-sm px-3 py-2 text-[11px] bg-white focus:outline-none focus:border-primary resize-none"
                    placeholder='e.g. "Procurement agent requests spend of $28,000 on a new vendor for emergency parts"'
                    value={testInput} onChange={e => setTestInput(e.target.value)} />
                  <Button size="sm" className="h-auto self-start bg-primary text-white" onClick={runTest} disabled={!testInput.trim()}>
                    <Play size={11} className="mr-1" /> Run Test
                  </Button>
                </div>
              </div>
              {testResult && (
                <div className={cn("bg-white border rounded-sm p-4", testResult.blocked ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50")}>
                  <div className={cn("flex items-center gap-2 font-bold text-sm mb-3", testResult.blocked ? "text-red-700" : "text-emerald-700")}>
                    {testResult.blocked ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                    {testResult.blocked ? "Action BLOCKED by policy engine" : "Action APPROVED — within policy parameters"}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Policies Triggered</div>
                  {testResult.matched.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <Shield size={10} className={testResult.blocked ? "text-red-500" : "text-emerald-500"} />
                      <span className="text-[11px] text-foreground">{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "simulation" && (
            <div>
              <div className="text-sm font-bold text-foreground mb-4">Policy Simulation</div>
              <div className="bg-white border border-border rounded-sm p-4 mb-4">
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Simulate policy enforcement for a business unit over 24h</div>
                <div className="flex items-center gap-3 mb-3">
                  <select className="border border-border rounded-sm px-3 py-2 text-sm bg-white outline-none" value={simBu} onChange={e => setSimBu(e.target.value)}>
                    {BU_LIST.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <Button size="sm" className="bg-primary text-white" onClick={runSimulation} disabled={simRunning}>
                    {simRunning ? "Running…" : <><FlaskConical size={11} className="mr-1" /> Run Simulation</>}
                  </Button>
                </div>
                {simRunning && (
                  <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Simulating 24h policy enforcement window…
                  </div>
                )}
                {simResult && (
                  <div className="space-y-1.5 mt-2">
                    {simResult.map((r, i) => (
                      <div key={i} className={cn("flex items-start gap-2 text-[11px] px-3 py-2 rounded-sm",
                        i === 0 ? "bg-primary/5 border border-primary/20 font-bold text-primary" :
                        r.includes("blocked") || r.includes("escalation") ? "bg-amber-50 border border-amber-200 text-amber-800" :
                        "bg-muted/40 border border-border text-foreground"
                      )}>
                        {i === 0 ? <Settings size={11} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={11} className="mt-0.5 shrink-0" />}
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "dependencies" && (
            <div>
              <div className="text-sm font-bold text-foreground mb-4">Policy Dependencies</div>
              <div className="space-y-3">
                {[
                  { from: "New Vendor Approval", to: "Procurement Spend Gate", type: "requires", note: "Spend gate must be satisfied before vendor onboarding" },
                  { from: "Contract Generation Limits", to: "New Vendor Approval", type: "requires", note: "Vendor must be approved before contract generation" },
                  { from: "Agent Autonomy Boundary v2.4", to: "PII Data Access Governance", type: "extends", note: "Autonomy boundary inherits PII restrictions" },
                  { from: "Compliance — SOX", to: "Human Approval — Financial Threshold", type: "enforces", note: "SOX mandates financial thresholds per materiality limits" },
                  { from: "PII Data Fence (Security)", to: "PII Data Access Governance", type: "enforces", note: "Security policy implements the governance requirement" },
                  { from: "Financial Close Approval Gate", to: "Human Approval — Financial Threshold", type: "extends", note: "Close gate inherits and tightens financial approval rules" },
                ].map((d, i) => (
                  <div key={i} className="bg-white border border-border rounded-sm p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-primary">{d.from}</span>
                      <span className={cn("mx-2 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm",
                        d.type === "requires" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                        d.type === "extends" ? "bg-violet-50 text-violet-600 border border-violet-200" :
                        "bg-amber-50 text-amber-600 border border-amber-200"
                      )}>{d.type}</span>
                      <span className="text-[11px] font-bold text-foreground">{d.to}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground max-w-xs text-right">{d.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "templates" && (
            <div>
              <div className="text-sm font-bold text-foreground mb-4">Policy Templates</div>
              <div className="grid grid-cols-2 gap-3">
                {POLICY_TEMPLATES.map((t) => (
                  <div key={t.name} className="bg-white border border-border rounded-sm p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-[11px] text-foreground mb-0.5">{t.name}</div>
                        <div className="text-[9px] bg-muted border border-border px-1.5 py-0.5 rounded-sm text-muted-foreground uppercase tracking-widest inline-block">{t.category}</div>
                      </div>
                      <span className="text-[9px] text-muted-foreground">{t.useCount}x used</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-3">{t.description}</p>
                    <Button size="sm" variant="outline" className="h-6 text-[9px] uppercase tracking-widest" onClick={() => {
                      setForm({ title: t.name, category: t.category, scope: "All AI Employees", rule: t.description });
                      setEditPolicy(null);
                      setShowForm(true);
                      setActiveTab("enterprise");
                    }}>
                      Use Template →
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
