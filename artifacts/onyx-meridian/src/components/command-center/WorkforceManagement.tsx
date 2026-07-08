import { useState } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MFG_AGENTS } from "@/data/enterprise-data";
import {
  Bot, ChevronDown, ChevronRight, TrendingUp, TrendingDown,
  ArrowUpCircle, ArrowDownCircle, RotateCcw, PauseCircle, PlayCircle,
  UserX, Copy, ArrowRightLeft, RefreshCcw, BookOpen, X, Star,
  Brain, Shield, AlertTriangle, BarChart3, RotateCw, Ban, Trophy,
  ExternalLink, Clock, CheckCircle2, AlertCircle, FileText, DollarSign,
  Users, Zap,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

// ─── Extended agent data ─────────────────────────────────────────

const TIERS = ["Junior", "Standard", "Senior", "Lead", "Executive"] as const;
type Tier = typeof TIERS[number];

type LifecycleBadge = "high-performer" | "fast-learner" | "policy-compliant" | "under-observation" | "promotion-candidate" | "retraining" | "suspended" | "enterprise-certified";

interface WorkforceAgent {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  bu: string;
  abu: string;
  status: string;
  model: string;
  tier: Tier;
  health: number;
  trustScore: number;
  performanceScore: number;
  experienceLevel: string;
  lastEvaluation: string;
  supervisor: string;
  missionsCompleted: number;
  currentVersion: string;
  previousVersion: string;
  badges: LifecycleBadge[];
}

const WORKFORCE_AGENTS: WorkforceAgent[] = [
  {
    id: "ag1", name: "Production Planner", employeeId: "AIE-0101",
    role: "Production Scheduling Agent", department: "Manufacturing", bu: "manufacturing",
    abu: "Manufacturing Core ABU", status: "active", model: "GPT-4o",
    tier: "Senior", health: 96, trustScore: 97, performanceScore: 94,
    experienceLevel: "Expert", lastEvaluation: "Jun 20, 2026",
    supervisor: "Manufacturing OS Lead", missionsCompleted: 2841,
    currentVersion: "v3.2", previousVersion: "v3.1",
    badges: ["high-performer", "enterprise-certified", "policy-compliant"],
  },
  {
    id: "ag2", name: "OEE Optimizer", employeeId: "AIE-0102",
    role: "Equipment Efficiency Agent", department: "Manufacturing", bu: "manufacturing",
    abu: "Manufacturing Core ABU", status: "active", model: "GPT-4o",
    tier: "Standard", health: 92, trustScore: 88, performanceScore: 88,
    experienceLevel: "Intermediate", lastEvaluation: "Jun 18, 2026",
    supervisor: "Manufacturing OS Lead", missionsCompleted: 1423,
    currentVersion: "v2.8", previousVersion: "v2.6",
    badges: ["promotion-candidate", "policy-compliant"],
  },
  {
    id: "ag3", name: "Predictive Maintenance", employeeId: "AIE-0201",
    role: "Failure Prediction Agent", department: "Manufacturing", bu: "manufacturing",
    abu: "Asset Intelligence ABU", status: "active", model: "GPT-4o",
    tier: "Lead", health: 98, trustScore: 99, performanceScore: 96,
    experienceLevel: "Expert", lastEvaluation: "Jun 25, 2026",
    supervisor: "Manufacturing OS Lead", missionsCompleted: 4218,
    currentVersion: "v4.1", previousVersion: "v4.0",
    badges: ["high-performer", "fast-learner", "enterprise-certified", "policy-compliant"],
  },
  {
    id: "ag4", name: "Quality Inspector", employeeId: "AIE-0301",
    role: "Defect Detection Agent", department: "Manufacturing", bu: "manufacturing",
    abu: "Quality Intelligence ABU", status: "active", model: "Claude-3.5-Sonnet",
    tier: "Standard", health: 94, trustScore: 91, performanceScore: 90,
    experienceLevel: "Intermediate", lastEvaluation: "Jun 22, 2026",
    supervisor: "Manufacturing OS Lead", missionsCompleted: 2184,
    currentVersion: "v2.4", previousVersion: "v2.2",
    badges: ["policy-compliant", "promotion-candidate"],
  },
  {
    id: "ag5", name: "Inventory Optimizer", employeeId: "AIE-0401",
    role: "Stock Intelligence Agent", department: "Supply Chain", bu: "supply-chain",
    abu: "Supply Chain Core ABU", status: "watch", model: "GPT-4o-mini",
    tier: "Standard", health: 82, trustScore: 74, performanceScore: 76,
    experienceLevel: "Intermediate", lastEvaluation: "Jun 15, 2026",
    supervisor: "Supply Chain OS Lead", missionsCompleted: 984,
    currentVersion: "v1.9", previousVersion: "v1.7",
    badges: ["under-observation", "retraining"],
  },
  {
    id: "ag6", name: "Supplier Risk Agent", employeeId: "AIE-0501",
    role: "Supplier Intelligence Agent", department: "Procurement", bu: "procurement",
    abu: "Procurement Intelligence ABU", status: "watch", model: "GPT-4o-mini",
    tier: "Junior", health: 78, trustScore: 68, performanceScore: 72,
    experienceLevel: "Beginner", lastEvaluation: "Jun 10, 2026",
    supervisor: "Procurement OS Lead", missionsCompleted: 421,
    currentVersion: "v1.4", previousVersion: "v1.2",
    badges: ["under-observation"],
  },
  {
    id: "ag7", name: "Finance Analyst", employeeId: "AIE-0601",
    role: "Cost Analytics Agent", department: "Finance", bu: "finance",
    abu: "Finance Intelligence ABU", status: "active", model: "GPT-4o",
    tier: "Senior", health: 95, trustScore: 96, performanceScore: 93,
    experienceLevel: "Expert", lastEvaluation: "Jun 23, 2026",
    supervisor: "Finance OS Lead", missionsCompleted: 1842,
    currentVersion: "v3.0", previousVersion: "v2.8",
    badges: ["high-performer", "enterprise-certified", "policy-compliant"],
  },
  {
    id: "ag8", name: "Revenue Scout", employeeId: "AIE-0701",
    role: "Pipeline Intelligence Agent", department: "Revenue", bu: "revenue",
    abu: "Revenue Intelligence ABU", status: "active", model: "GPT-4o",
    tier: "Standard", health: 91, trustScore: 89, performanceScore: 87,
    experienceLevel: "Intermediate", lastEvaluation: "Jun 21, 2026",
    supervisor: "Revenue OS Lead", missionsCompleted: 1241,
    currentVersion: "v2.6", previousVersion: "v2.4",
    badges: ["policy-compliant"],
  },
  {
    id: "ag9", name: "Deal Closer AI", employeeId: "AIE-0702",
    role: "Sales Acceleration Agent", department: "Revenue", bu: "revenue",
    abu: "Revenue Intelligence ABU", status: "active", model: "GPT-4o",
    tier: "Standard", health: 88, trustScore: 84, performanceScore: 83,
    experienceLevel: "Intermediate", lastEvaluation: "Jun 19, 2026",
    supervisor: "Revenue OS Lead", missionsCompleted: 882,
    currentVersion: "v2.1", previousVersion: "v1.9",
    badges: ["fast-learner"],
  },
  {
    id: "ag10", name: "Energy Intelligence", employeeId: "AIE-0801",
    role: "EEI Optimization Agent", department: "Facilities & Sustainability", bu: "manufacturing",
    abu: "Sustainability ABU", status: "active", model: "GPT-4o",
    tier: "Standard", health: 95, trustScore: 93, performanceScore: 91,
    experienceLevel: "Intermediate", lastEvaluation: "Jun 24, 2026",
    supervisor: "Enterprise Infrastructure Lead", missionsCompleted: 1124,
    currentVersion: "v2.0", previousVersion: "v1.8",
    badges: ["enterprise-certified", "policy-compliant"],
  },
];

const BADGE_CONFIG: Record<LifecycleBadge, { label: string; icon: string; color: string }> = {
  "high-performer":       { label: "High Performer",        icon: "⭐", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "fast-learner":         { label: "Fast Learner",           icon: "🧠", color: "bg-violet-50 text-violet-700 border-violet-200" },
  "policy-compliant":     { label: "Policy Compliant",       icon: "🛡",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "under-observation":    { label: "Under Observation",      icon: "⚠",  color: "bg-red-50 text-red-700 border-red-200" },
  "promotion-candidate":  { label: "Promotion Candidate",    icon: "📈", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "retraining":           { label: "Retraining",             icon: "🔄", color: "bg-orange-50 text-orange-700 border-orange-200" },
  "suspended":            { label: "Suspended",              icon: "🚫", color: "bg-gray-100 text-gray-500 border-gray-200" },
  "enterprise-certified": { label: "Enterprise Certified",   icon: "🏆", color: "bg-primary/5 text-primary border-primary/20" },
};

const TIER_COLOR: Record<Tier, string> = {
  Junior:    "text-gray-600 bg-gray-50 border-gray-200",
  Standard:  "text-blue-600 bg-blue-50 border-blue-200",
  Senior:    "text-violet-600 bg-violet-50 border-violet-200",
  Lead:      "text-amber-600 bg-amber-50 border-amber-200",
  Executive: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

const PROMOTED_ROLES: Record<Tier, Tier> = {
  Junior: "Standard",
  Standard: "Senior",
  Senior: "Lead",
  Lead: "Executive",
  Executive: "Executive",
};

const DEMOTED_ROLES: Record<Tier, Tier> = {
  Junior: "Junior",
  Standard: "Junior",
  Senior: "Standard",
  Lead: "Senior",
  Executive: "Lead",
};

// ─── Timeline data ────────────────────────────────────────────────

const TIMELINE_EVENTS = [
  { time: "09:42", label: "Today", agent: "Production Planner", action: "promoted to Senior Production Planner", type: "promote" },
  { time: "08:15", label: "Today", agent: "Inventory Optimizer", action: "retraining queued after prediction accuracy fell to 81%", type: "retrain" },
  { time: "Yesterday", label: "Yesterday", agent: "Supplier Risk Agent", action: "rolled back to Version 1.2 after unstable deployment", type: "rollback" },
  { time: "Yesterday", label: "Yesterday", agent: "Finance Analyst", action: "granted Financial Forecasting Skill Pack", type: "upgrade" },
  { time: "2 Days Ago", label: "2 Days Ago", agent: "Energy Intelligence", action: "transferred to Sustainability ABU", type: "transfer" },
  { time: "3 Days Ago", label: "3 Days Ago", agent: "Deal Closer AI v1", action: "retired — replaced by Deal Closer AI Gen-2", type: "retire" },
];

const EVENT_STYLES: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
  promote:  { icon: TrendingUp,   color: "text-emerald-600", dot: "bg-emerald-500" },
  retrain:  { icon: BookOpen,     color: "text-blue-600",    dot: "bg-blue-500" },
  rollback: { icon: RotateCcw,    color: "text-amber-600",   dot: "bg-amber-500" },
  upgrade:  { icon: Zap,          color: "text-violet-600",  dot: "bg-violet-500" },
  transfer: { icon: ArrowRightLeft,color: "text-orange-600", dot: "bg-orange-500" },
  retire:   { icon: UserX,        color: "text-red-600",     dot: "bg-red-500" },
};

// ─── Chart data ───────────────────────────────────────────────────

const PROMO_TIMELINE_DATA = [
  { month: "Jan", promotions: 2, demotions: 0 },
  { month: "Feb", promotions: 1, demotions: 1 },
  { month: "Mar", promotions: 3, demotions: 0 },
  { month: "Apr", promotions: 2, demotions: 1 },
  { month: "May", promotions: 4, demotions: 1 },
  { month: "Jun", promotions: 2, demotions: 0 },
];

const WORKFORCE_DIST_DATA = [
  { bu: "Mfg",   Junior: 1, Standard: 2, Senior: 2, Lead: 1, Executive: 0 },
  { bu: "SC",    Junior: 0, Standard: 2, Senior: 1, Lead: 0, Executive: 0 },
  { bu: "Proc",  Junior: 1, Standard: 1, Senior: 0, Lead: 0, Executive: 0 },
  { bu: "Fin",   Junior: 0, Standard: 1, Senior: 1, Lead: 0, Executive: 0 },
  { bu: "Rev",   Junior: 0, Standard: 2, Senior: 0, Lead: 0, Executive: 0 },
];

const LIFECYCLE_DONUT_DATA = [
  { name: "Promotion",  value: 12, color: "#10b981" },
  { name: "Demotion",   value: 3,  color: "#ef4444" },
  { name: "Rollback",   value: 5,  color: "#f59e0b" },
  { name: "Retraining", value: 8,  color: "#3b82f6" },
  { name: "Transfer",   value: 6,  color: "#8b5cf6" },
  { name: "Retirement", value: 2,  color: "#6b7280" },
  { name: "Suspension", value: 1,  color: "#f97316" },
];

const GROWTH_DATA = [
  { month: "Jan", active: 48, retired: 4, training: 3, experimental: 2 },
  { month: "Feb", active: 51, retired: 5, training: 4, experimental: 3 },
  { month: "Mar", active: 54, retired: 6, training: 3, experimental: 4 },
  { month: "Apr", active: 58, retired: 7, training: 5, experimental: 3 },
  { month: "May", active: 61, retired: 8, training: 4, experimental: 4 },
  { month: "Jun", active: 62, retired: 9, training: 3, experimental: 5 },
];

const CHART_TOOLTIP_STYLE = {
  contentStyle: { fontSize: 10, border: "1px solid #e5e7eb", borderRadius: 4, background: "#fff" },
  labelStyle: { fontSize: 10, fontWeight: 600 },
};

// ─── Modal types ──────────────────────────────────────────────────

type ModalType = "promote" | "demote" | "rollback" | "suspend" | "resume" | "fire" | "clone" | "transfer" | "reset" | "retrain" | "explain" | null;

// ─── Sub-components ───────────────────────────────────────────────

function ModalShell({ title, subtitle, onClose, children, footer }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-sm border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-foreground">{title}</div>
            {subtitle && <div className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5"><X size={15} /></button>
        </div>
        <div className="px-6 py-4 overflow-auto flex-1 space-y-4 text-[11px]">{children}</div>
        <div className="px-6 py-3 border-t border-border flex justify-end gap-2 shrink-0 bg-[#FCFCFD]">{footer}</div>
      </div>
    </div>
  );
}

function ModalRow({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/40 last:border-b-0">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
      <span className={cn("text-[11px] font-semibold text-right max-w-[60%]", valueClass || "text-foreground")}>{value}</span>
    </div>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">{title}</div>
      <div className="bg-[#FCFCFD] border border-border rounded-sm px-3 py-1">{children}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, variant = "default" }: { label: string; onClick: () => void; variant?: "default" | "danger" | "success" | "outline" }) {
  const styles = {
    default: "bg-primary text-white hover:bg-primary/90",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-border text-muted-foreground hover:bg-muted/40",
  };
  return (
    <button onClick={onClick} className={cn("px-4 py-2 text-[9px] uppercase tracking-widest font-bold rounded-sm transition-colors", styles[variant])}>
      {label}
    </button>
  );
}

// ─── All lifecycle modals ─────────────────────────────────────────

function PromoteModal({ agent, onClose, onExplain }: { agent: WorkforceAgent; onClose: () => void; onExplain: () => void }) {
  const newTier = PROMOTED_ROLES[agent.tier];
  return (
    <ModalShell title="Promotion Review" subtitle={`${agent.name} · ${agent.employeeId}`} onClose={onClose}
      footer={<>
        <ActionBtn label="Explain Decision" onClick={onExplain} variant="outline" />
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Approve Promotion" onClick={onClose} variant="success" />
      </>}>
      <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-sm p-4">
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Current Rank</div>
          <div className="text-sm font-bold text-foreground">{agent.tier}</div>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-emerald-300" />
          <TrendingUp size={16} className="text-emerald-600" />
          <div className="h-px flex-1 bg-emerald-300" />
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Promoted To</div>
          <div className="text-sm font-bold text-emerald-600">{newTier}</div>
        </div>
      </div>
      <ModalSection title="Promotion Benefits">
        <ModalRow label="Responsibilities Gained" value="Autonomous scheduling across 3 additional lines" />
        <ModalRow label="Authority Level" value="+1 tier — up to $75K autonomous decisions" valueClass="text-emerald-600" />
        <ModalRow label="New Tools" value="Production Forecasting Suite, Capacity Optimizer v2" />
        <ModalRow label="Additional MCP Servers" value="ERP-Enterprise, Demand-Intelligence-API" />
        <ModalRow label="Knowledge Collections" value="+2 Manufacturing Excellence Libraries" />
        <ModalRow label="Additional Budget" value="+$12,500/mo autonomous spending authority" valueClass="text-emerald-600" />
      </ModalSection>
      <ModalSection title="Business Justification">
        <ModalRow label="Estimated Business Impact" value="+$420K/yr additional value unlocked" valueClass="text-emerald-600" />
        <ModalRow label="Estimated Productivity Gain" value="+18% throughput optimization" valueClass="text-emerald-600" />
        <ModalRow label="Promotion Confidence" value={`${agent.performanceScore}% — Strong`} valueClass="text-emerald-600" />
        <ModalRow label="Effective Date" value="Jul 01, 2026" />
        <ModalRow label="Manager Approval" value="Manufacturing OS Lead" />
        <ModalRow label="Promotion Notes" value="Consistently exceeded SLA for 90+ days. Top performance quartile." />
      </ModalSection>
    </ModalShell>
  );
}

function DemoteModal({ agent, onClose, onExplain }: { agent: WorkforceAgent; onClose: () => void; onExplain: () => void }) {
  const newTier = DEMOTED_ROLES[agent.tier];
  return (
    <ModalShell title="Performance Review — Demotion" subtitle={`${agent.name} · ${agent.employeeId}`} onClose={onClose}
      footer={<>
        <ActionBtn label="Explain Decision" onClick={onExplain} variant="outline" />
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Approve Demotion" onClick={onClose} variant="danger" />
      </>}>
      <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-sm p-4">
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Current Rank</div>
          <div className="text-sm font-bold text-foreground">{agent.tier}</div>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <div className="h-px flex-1 bg-red-300" />
          <TrendingDown size={16} className="text-red-600" />
          <div className="h-px flex-1 bg-red-300" />
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Demoted To</div>
          <div className="text-sm font-bold text-red-600">{newTier}</div>
        </div>
      </div>
      <ModalSection title="Performance Issues">
        <ModalRow label="Reason" value="Prediction accuracy below 85% threshold for 14 consecutive days" valueClass="text-red-600" />
        <ModalRow label="Recent Performance" value={`${agent.performanceScore}% — Below Tier Threshold`} valueClass="text-red-600" />
        <ModalRow label="Missed KPIs" value="Forecast Accuracy, Fill Rate, Inventory Turns" />
        <ModalRow label="Trust Degradation" value={`${agent.trustScore}% (Target: >80%)`} />
        <ModalRow label="Policy Violations" value="2 — Minor autonomy overreach (within rectifiable range)" />
        <ModalRow label="Business Impact" value="-$84K/mo from missed optimization targets" valueClass="text-red-600" />
      </ModalSection>
      <ModalSection title="Recovery Plan">
        <ModalRow label="Demotion Type" value="Temporary — 90-day review period" />
        <ModalRow label="Recovery Plan" value="Supervised mode for 60 days, weekly evaluation" />
        <ModalRow label="Suggested Training" value="Demand Forecasting Fundamentals, KPI Calibration Workshop" />
        <ModalRow label="Manager Comments" value="Supportive intervention — agent shows recovery potential." />
      </ModalSection>
    </ModalShell>
  );
}

function RollbackModal({ agent, onClose, onExplain }: { agent: WorkforceAgent; onClose: () => void; onExplain: () => void }) {
  return (
    <ModalShell title="Version Rollback" subtitle={`${agent.name} · Enterprise Safety Rollback`} onClose={onClose}
      footer={<>
        <ActionBtn label="Explain Decision" onClick={onExplain} variant="outline" />
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Confirm Rollback" onClick={onClose} variant="danger" />
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Current Version</div>
          <div className="text-base font-bold font-mono text-foreground">{agent.currentVersion}</div>
          <div className="text-[9px] text-red-600 mt-1">⚠ Unstable</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3 text-center">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Rollback Target</div>
          <div className="text-base font-bold font-mono text-emerald-600">{agent.previousVersion}</div>
          <div className="text-[9px] text-emerald-600 mt-1">✓ Certified Stable</div>
        </div>
      </div>
      <ModalSection title="Change Summary">
        <ModalRow label="Model Differences" value="Reverts to GPT-4o base checkpoint Oct 2025" />
        <ModalRow label="Prompt Differences" value="3 system prompt revisions removed" />
        <ModalRow label="Knowledge Differences" value="Removes 2 experimental knowledge injections" />
        <ModalRow label="Skill Differences" value="Advanced scheduling module reverted to v2 baseline" />
        <ModalRow label="Policy Differences" value="Autonomy ceiling returns to $50K from $75K" />
        <ModalRow label="Memory Snapshot" value={`Snapshot from ${agent.lastEvaluation} will be restored`} />
      </ModalSection>
      <ModalSection title="Risk Assessment">
        <ModalRow label="Expected Behaviour" value="Stable — matches certified production baseline" valueClass="text-emerald-600" />
        <ModalRow label="Rollback Risk" value="Low — previous version ran 240 days without incident" valueClass="text-emerald-600" />
        <ModalRow label="Rollback Timeline" value="Estimated 12 minutes — zero downtime via hot-swap" />
      </ModalSection>
    </ModalShell>
  );
}

function SuspendModal({ agent, onClose, onExplain }: { agent: WorkforceAgent; onClose: () => void; onExplain: () => void }) {
  return (
    <ModalShell title="Suspend Agent" subtitle={`${agent.name} · Temporary Disable`} onClose={onClose}
      footer={<>
        <ActionBtn label="Explain Decision" onClick={onExplain} variant="outline" />
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Confirm Suspension" onClick={onClose} variant="danger" />
      </>}>
      <ModalSection title="Suspension Details">
        <ModalRow label="Reason" value="Policy audit in progress — autonomous operations paused pending review" />
        <ModalRow label="Expected Duration" value="48–72 hours" />
        <ModalRow label="Resume Date" value="Jun 30, 2026 — pending audit clearance" />
        <ModalRow label="Escalation Required" value="Yes — Governance Officer notified" valueClass="text-amber-600" />
      </ModalSection>
      <ModalSection title="Task Reassignment">
        <ModalRow label="Open Tasks" value={`${Math.floor(agent.missionsCompleted / 100)} active workflows paused`} />
        <ModalRow label="Tasks to Reassign" value="14 critical workflows requiring reassignment" valueClass="text-red-600" />
        <ModalRow label="Assigned Replacement" value={`${agent.department} Backup Agent (AIE-9999)`} />
      </ModalSection>
    </ModalShell>
  );
}

function ResumeModal({ agent, onClose }: { agent: WorkforceAgent; onClose: () => void }) {
  return (
    <ModalShell title="Resume Agent" subtitle={`${agent.name} · Reinstate Operations`} onClose={onClose}
      footer={<>
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Confirm Resume" onClick={onClose} variant="success" />
      </>}>
      <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 text-[10px] text-emerald-700">
        ✓ All pre-resume checks passed. Agent is cleared to return to active operations.
      </div>
      <ModalSection title="Resume Summary">
        <ModalRow label="Suspension Reason" value="Policy audit complete — cleared" valueClass="text-emerald-600" />
        <ModalRow label="Audit Outcome" value="No policy violations found" valueClass="text-emerald-600" />
        <ModalRow label="Effective Immediately" value="Yes — hot-resume available" />
        <ModalRow label="Task Handover" value="14 workflows returned from backup agent" />
        <ModalRow label="Manager Approval" value={agent.supervisor} />
      </ModalSection>
    </ModalShell>
  );
}

function FireModal({ agent, onClose, onExplain }: { agent: WorkforceAgent; onClose: () => void; onExplain: () => void }) {
  return (
    <ModalShell title="Enterprise Workforce Retirement" subtitle={`${agent.name} · Permanent Retirement (Not Deletion)`} onClose={onClose}
      footer={<>
        <ActionBtn label="Explain Decision" onClick={onExplain} variant="outline" />
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Confirm Retirement" onClick={onClose} variant="danger" />
      </>}>
      <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-[10px] text-red-700">
        ⚠ Retirement is permanent. The agent's status will be set to <strong>RETIRED</strong>. All knowledge, memory, and audit records are preserved indefinitely.
      </div>
      <ModalSection title="Retirement Reason">
        <ModalRow label="Termination Reason" value="Superseded by next-generation replacement agent" />
        <ModalRow label="Business Justification" value="Gen-4 replacement delivers 2.4x ROI improvement" />
        <ModalRow label="Policy Violations" value="None — performance-based retirement" valueClass="text-emerald-600" />
        <ModalRow label="Failed Evaluations" value="2 of last 6 evaluations below tier threshold" />
        <ModalRow label="Business Cost" value="-$142K/yr opportunity cost of continued operation" valueClass="text-red-600" />
      </ModalSection>
      <ModalSection title="Archival & Migration">
        <ModalRow label="Replacement Agent" value={`${agent.name} Gen-4 (AIE-NEXT-001)`} />
        <ModalRow label="Knowledge Migration" value="Full knowledge transfer to replacement — 100% coverage" valueClass="text-emerald-600" />
        <ModalRow label="Memory Archive" value="Compressed to long-term enterprise vault" />
        <ModalRow label="Skill Archive" value="All certified skills archived for future deployment" />
        <ModalRow label="Audit Reference" value={`AUDIT-${agent.employeeId}-RET-2026`} />
        <ModalRow label="Retirement Summary" value="Agent contributed 3,200+ missions over 18 months of service." />
      </ModalSection>
    </ModalShell>
  );
}

function CloneModal({ agent, onClose }: { agent: WorkforceAgent; onClose: () => void }) {
  return (
    <ModalShell title="Clone Agent" subtitle={`${agent.name} → New Instance`} onClose={onClose}
      footer={<>
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Create Clone" onClick={onClose} variant="default" />
      </>}>
      <ModalSection title="Clone Configuration">
        <ModalRow label="Clone Name" value={`${agent.name} v2`} />
        <ModalRow label="Target Department" value={agent.department} />
        <ModalRow label="Target ABU" value={agent.abu} />
        <ModalRow label="Assigned Supervisor" value={agent.supervisor} />
        <ModalRow label="Deploy After Clone" value="Yes — auto-deploy to supervised mode" />
      </ModalSection>
      <ModalSection title="What Gets Copied">
        <ModalRow label="Knowledge Copy" value="Full — all verified knowledge collections" valueClass="text-emerald-600" />
        <ModalRow label="Memory Copy" value="Partial — operational memory only (not episodic)" />
        <ModalRow label="Skill Copy" value="Full — all certified skill packs" valueClass="text-emerald-600" />
        <ModalRow label="Prompt Copy" value="Full — system prompt + configuration" valueClass="text-emerald-600" />
        <ModalRow label="Tool Access" value="Mirrored from source — pending approval" />
      </ModalSection>
    </ModalShell>
  );
}

function TransferModal({ agent, onClose, onExplain }: { agent: WorkforceAgent; onClose: () => void; onExplain: () => void }) {
  return (
    <ModalShell title="Transfer Agent" subtitle={`${agent.name} · Cross-Unit Move`} onClose={onClose}
      footer={<>
        <ActionBtn label="Explain Decision" onClick={onExplain} variant="outline" />
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Approve Transfer" onClick={onClose} variant="default" />
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 border border-border rounded-sm p-3">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">From</div>
          <div className="text-[11px] font-bold">{agent.department}</div>
          <div className="text-[10px] text-muted-foreground">{agent.abu}</div>
          <div className="text-[10px] text-muted-foreground">Supervisor: {agent.supervisor}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-3">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">To</div>
          <div className="text-[11px] font-bold">Supply Chain</div>
          <div className="text-[10px] text-muted-foreground">Demand Intelligence ABU</div>
          <div className="text-[10px] text-muted-foreground">Supervisor: Supply Chain OS Lead</div>
        </div>
      </div>
      <ModalSection title="Transfer Details">
        <ModalRow label="Reason" value="Supply chain demand planning requires additional capacity" />
        <ModalRow label="Approval" value="Both department heads confirmed" valueClass="text-emerald-600" />
        <ModalRow label="Effective Date" value="Jul 01, 2026" />
        <ModalRow label="Migration Summary" value="All workflows transferred. Tool access updated within 2 hours." />
      </ModalSection>
    </ModalShell>
  );
}

function ResetLearningModal({ agent, onClose }: { agent: WorkforceAgent; onClose: () => void }) {
  return (
    <ModalShell title="Reset Learning" subtitle={`${agent.name} · Memory & Learning Reset`} onClose={onClose}
      footer={<>
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Confirm Reset" onClick={onClose} variant="danger" />
      </>}>
      <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 text-[10px] text-amber-700">
        ⚠ This will reset the agent's in-context learning and episodic memory. Certified knowledge and skills are preserved.
      </div>
      <ModalSection title="Reset Scope">
        <ModalRow label="Episodic Memory" value="CLEARED — all interaction history removed" valueClass="text-red-600" />
        <ModalRow label="In-context Learning" value="CLEARED — reinforcement feedback reset to baseline" valueClass="text-red-600" />
        <ModalRow label="Certified Knowledge" value="PRESERVED — not affected" valueClass="text-emerald-600" />
        <ModalRow label="Certified Skills" value="PRESERVED — not affected" valueClass="text-emerald-600" />
        <ModalRow label="System Prompt" value="PRESERVED — not affected" valueClass="text-emerald-600" />
        <ModalRow label="Estimated Recovery Time" value="48–72 hours to reach prior performance baseline" />
      </ModalSection>
    </ModalShell>
  );
}

function QueueRetrainingModal({ agent, onClose }: { agent: WorkforceAgent; onClose: () => void }) {
  return (
    <ModalShell title="Queue Retraining" subtitle={`${agent.name} · Targeted Improvement Programme`} onClose={onClose}
      footer={<>
        <ActionBtn label="Cancel" onClick={onClose} variant="outline" />
        <ActionBtn label="Queue Retraining" onClick={onClose} variant="default" />
      </>}>
      <ModalSection title="Performance Gaps Identified">
        <ModalRow label="Weak Skills" value="Demand Forecasting Accuracy, Stockout Prediction" valueClass="text-red-600" />
        <ModalRow label="Failed Evaluations" value="2 evaluations below threshold (May, Jun 2026)" valueClass="text-amber-600" />
        <ModalRow label="Prompt Drift" value="7.2% deviation from baseline prompt behaviour detected" valueClass="text-amber-600" />
        <ModalRow label="Knowledge Gap" value="Missing Q2 supplier disruption patterns (2 datasets)" />
      </ModalSection>
      <ModalSection title="Retraining Programme">
        <ModalRow label="Recommended Dataset" value="Demand Forecasting Excellence v4, Supplier Risk Corpus Q2-2026" />
        <ModalRow label="Recommended Policies" value="SC-ACCURACY-001, SC-REORDER-007" />
        <ModalRow label="Recommended Skills" value="Advanced Demand Sensing Module, Safety Stock Calculator" />
        <ModalRow label="Expected Improvement" value="+12–18% forecast accuracy over 30-day period" valueClass="text-emerald-600" />
        <ModalRow label="Training Duration" value="Estimated 6–8 days in supervised training mode" />
      </ModalSection>
    </ModalShell>
  );
}

function ExplainDecisionModal({ agent, onClose }: { agent: WorkforceAgent; onClose: () => void }) {
  return (
    <ModalShell title="Enterprise Decision Report" subtitle={`${agent.name} · Governance Transparency`} onClose={onClose}
      footer={<>
        <ActionBtn label="Export PDF" onClick={onClose} variant="outline" />
        <ActionBtn label="Close" onClick={onClose} variant="outline" />
      </>}>
      <ModalSection title="Business Justification">
        <ModalRow label="Primary Driver" value="Performance below tier threshold for >30 days — governance trigger activated" />
        <ModalRow label="Secondary Driver" value="Replacement agent available with 2.4x ROI improvement" />
        <ModalRow label="Expected ROI" value="+$284K/yr from optimised workforce configuration" valueClass="text-emerald-600" />
      </ModalSection>
      <ModalSection title="Performance Summary">
        <ModalRow label="Performance Score" value={`${agent.performanceScore}% (Tier Threshold: 85%)`} valueClass={agent.performanceScore >= 85 ? "text-emerald-600" : "text-red-600"} />
        <ModalRow label="Trust Score" value={`${agent.trustScore}%`} />
        <ModalRow label="SLA Compliance" value="14 breaches in last 90 days" valueClass="text-amber-600" />
        <ModalRow label="Missions Completed" value={agent.missionsCompleted.toLocaleString()} />
      </ModalSection>
      <ModalSection title="Governance Chain">
        <ModalRow label="Policy References" value="GOV-012 Agent Performance Standards, GOV-019 Workforce Evolution" />
        <ModalRow label="Governance Decision" value="Automated recommendation confirmed by Risk Center" />
        <ModalRow label="Affected KPIs" value="EEI, BU Health, Workforce Utilisation" />
        <ModalRow label="Risk Assessment" value="Low — no customer-facing impact during transition" valueClass="text-emerald-600" />
        <ModalRow label="Financial Impact" value="+$142K/yr net cost saving" valueClass="text-emerald-600" />
        <ModalRow label="Alternatives Considered" value="Retraining (rejected — 90-day timeline too long), Transfer (considered)" />
        <ModalRow label="Approval Chain" value={`${agent.supervisor} → CTO → Board AI Committee`} />
        <ModalRow label="Executive Notes" value="Decision logged in enterprise audit trail. Audit ref: GOV-2026-Q2-084." />
      </ModalSection>
    </ModalShell>
  );
}

// ─── Agent Workforce Card ─────────────────────────────────────────

function AgentWorkforceCard({ agent, onAction }: {
  agent: WorkforceAgent;
  onAction: (type: ModalType, agent: WorkforceAgent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();

  const lifecycleActions: Array<{ label: string; modal: ModalType; icon: React.ElementType; color: string }> = [
    { label: "Promote",             modal: "promote",  icon: ArrowUpCircle,   color: "text-emerald-600 border-emerald-200 hover:bg-emerald-50" },
    { label: "Demote",              modal: "demote",   icon: ArrowDownCircle, color: "text-red-600 border-red-200 hover:bg-red-50" },
    { label: "Rollback",            modal: "rollback", icon: RotateCcw,       color: "text-amber-600 border-amber-200 hover:bg-amber-50" },
    { label: "Suspend",             modal: "suspend",  icon: PauseCircle,     color: "text-orange-600 border-orange-200 hover:bg-orange-50" },
    { label: "Resume",              modal: "resume",   icon: PlayCircle,      color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
    { label: "Fire Agent",          modal: "fire",     icon: UserX,           color: "text-red-700 border-red-300 hover:bg-red-50" },
    { label: "Clone Agent",         modal: "clone",    icon: Copy,            color: "text-violet-600 border-violet-200 hover:bg-violet-50" },
    { label: "Transfer",            modal: "transfer", icon: ArrowRightLeft,  color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
    { label: "Reset Learning",      modal: "reset",    icon: RefreshCcw,      color: "text-gray-600 border-gray-200 hover:bg-gray-50" },
    { label: "Queue Retraining",    modal: "retrain",  icon: BookOpen,        color: "text-primary border-primary/20 hover:bg-primary/5" },
  ];

  return (
    <div className={cn("bg-white border border-border rounded-sm shadow-sm transition-all", expanded && "ring-1 ring-primary/20")}>
      {/* Card Header */}
      <button
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          <Bot size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-bold text-foreground">{agent.name}</span>
            <span className="font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded-sm border border-border">{agent.employeeId}</span>
            <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", TIER_COLOR[agent.tier])}>{agent.tier}</span>
            {agent.status === "watch" && (
              <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border bg-amber-50 text-amber-700 border-amber-200">Watch</span>
            )}
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">{agent.role} · {agent.department} · {agent.abu}</div>
        </div>
        {/* Badges */}
        <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-[240px] justify-end">
          {agent.badges.slice(0, 3).map(b => (
            <span key={b} className={cn("text-[9px] px-1.5 py-0.5 rounded-sm border font-semibold", BADGE_CONFIG[b].color)}>
              {BADGE_CONFIG[b].icon} {BADGE_CONFIG[b].label}
            </span>
          ))}
        </div>
        {/* Scores */}
        <div className="flex items-center gap-4 shrink-0 ml-2">
          <div className="text-center hidden md:block">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Perf</div>
            <div className={cn("text-[12px] font-bold font-mono", agent.performanceScore >= 90 ? "text-emerald-600" : agent.performanceScore >= 75 ? "text-amber-600" : "text-red-600")}>{agent.performanceScore}%</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Trust</div>
            <div className={cn("text-[12px] font-bold font-mono", agent.trustScore >= 90 ? "text-emerald-600" : agent.trustScore >= 75 ? "text-amber-600" : "text-red-600")}>{agent.trustScore}%</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Health</div>
            <div className={cn("text-[12px] font-bold font-mono", agent.health >= 90 ? "text-emerald-600" : agent.health >= 75 ? "text-amber-600" : "text-red-600")}>{agent.health}</div>
          </div>
          <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-4">
          {/* Agent Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Current Model",      value: agent.model },
              { label: "Experience Level",   value: agent.experienceLevel },
              { label: "Last Evaluation",    value: agent.lastEvaluation },
              { label: "Current Supervisor", value: agent.supervisor },
              { label: "Missions Completed", value: agent.missionsCompleted.toLocaleString() },
              { label: "Current Version",    value: agent.currentVersion },
              { label: "Department",         value: agent.department },
              { label: "ABU",                value: agent.abu },
            ].map(f => (
              <div key={f.label} className="bg-[#FCFCFD] border border-border/60 rounded-sm px-3 py-2">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{f.label}</div>
                <div className="text-[11px] font-semibold text-foreground mt-0.5">{f.value}</div>
              </div>
            ))}
          </div>

          {/* All badges */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Governance Badges</div>
            <div className="flex flex-wrap gap-1.5">
              {agent.badges.map(b => (
                <span key={b} className={cn("text-[10px] px-2 py-1 rounded-sm border font-semibold flex items-center gap-1", BADGE_CONFIG[b].color)}>
                  <span>{BADGE_CONFIG[b].icon}</span>{BADGE_CONFIG[b].label}
                </span>
              ))}
            </div>
          </div>

          {/* Lifecycle Actions */}
          <div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Lifecycle Actions</div>
            <div className="flex flex-wrap gap-2">
              {lifecycleActions.map(action => {
                const Icon = action.icon;
                return (
                  <button key={action.modal}
                    onClick={() => onAction(action.modal, agent)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-sm border transition-colors bg-white", action.color)}>
                    <Icon size={11} />{action.label}
                  </button>
                );
              })}
              <button
                onClick={() => onAction("explain", agent)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-sm border border-border text-muted-foreground bg-white hover:bg-muted/40 transition-colors">
                <FileText size={11} />Explain Decision
              </button>
            </div>
          </div>

          {/* Cross Navigation */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/40">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold self-center">Quick Nav:</span>
            {[
              { label: "Agent Overview",      path: "/workforce" },
              { label: "Agent Harness",       path: "/workforce" },
              { label: "Evaluation History",  path: "/governance" },
              { label: "Agent Logs",          path: "/workforce" },
            ].map(link => (
              <button key={link.label} onClick={() => navigate(link.path)}
                className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-primary font-semibold hover:underline">
                <ExternalLink size={9} />{link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────

function PromotionChart() {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Promotion & Demotion Timeline</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={PROMO_TIMELINE_DATA} {...CHART_TOOLTIP_STYLE}>
          <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip {...CHART_TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="promotions" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Promotions" />
          <Line type="monotone" dataKey="demotions" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Demotions" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WorkforceDistChart() {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Workforce Distribution by Tier</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={WORKFORCE_DIST_DATA} {...CHART_TOOLTIP_STYLE}>
          <XAxis dataKey="bu" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip {...CHART_TOOLTIP_STYLE} />
          <Bar dataKey="Junior"    fill="#9ca3af" stackId="a" />
          <Bar dataKey="Standard"  fill="#3b82f6" stackId="a" />
          <Bar dataKey="Senior"    fill="#8b5cf6" stackId="a" />
          <Bar dataKey="Lead"      fill="#f59e0b" stackId="a" />
          <Bar dataKey="Executive" fill="#10b981" stackId="a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LifecycleDonutChart() {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Agent Lifecycle Events</div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={LIFECYCLE_DONUT_DATA} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
              {LIFECYCLE_DONUT_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip {...CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
          {LIFECYCLE_DONUT_DATA.map(d => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-[9px] text-muted-foreground">{d.name}</span>
              <span className="text-[9px] font-bold text-foreground ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkforceGrowthChart() {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Workforce Growth</div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={GROWTH_DATA} {...CHART_TOOLTIP_STYLE}>
          <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <Tooltip {...CHART_TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="active"       fill="#d1fae5" stroke="#10b981" strokeWidth={1.5} name="Active" />
          <Area type="monotone" dataKey="retired"      fill="#fee2e2" stroke="#ef4444" strokeWidth={1.5} name="Retired" />
          <Area type="monotone" dataKey="training"     fill="#dbeafe" stroke="#3b82f6" strokeWidth={1.5} name="Training" />
          <Area type="monotone" dataKey="experimental" fill="#ede9fe" stroke="#8b5cf6" strokeWidth={1.5} name="Experimental" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Workforce Timeline ───────────────────────────────────────────

function WorkforceTimeline() {
  let lastLabel = "";
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm">
      <div className="px-4 py-3 border-b border-border/60">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Workforce Evolution Timeline</div>
      </div>
      <div className="divide-y divide-border/40">
        {TIMELINE_EVENTS.map((event, i) => {
          const showLabel = event.label !== lastLabel;
          lastLabel = event.label;
          const style = EVENT_STYLES[event.type];
          const Icon = style.icon;
          return (
            <div key={i}>
              {showLabel && (
                <div className="px-4 py-1.5 bg-muted/30 text-[8px] uppercase tracking-widest text-muted-foreground font-bold">{event.label}</div>
              )}
              <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-2 shrink-0 w-16">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", style.dot)} />
                  <span className="text-[9px] font-mono text-muted-foreground">{event.time.includes(":") ? event.time : ""}</span>
                </div>
                <div className={cn("w-7 h-7 rounded-sm flex items-center justify-center shrink-0 bg-muted/30", style.color)}>
                  <Icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-foreground">{event.agent}</span>
                  <span className="text-[10px] text-muted-foreground"> {event.action}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────

export function WorkforceManagement() {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [activeAgent, setActiveAgent] = useState<WorkforceAgent | null>(null);
  const [preExplain, setPreExplain] = useState<ModalType>(null);

  function openModal(type: ModalType, agent: WorkforceAgent) {
    setActiveAgent(agent);
    setModalType(type);
    setPreExplain(null);
  }

  function openExplainFromModal() {
    setPreExplain(modalType);
    setModalType("explain");
  }

  function closeModal() {
    if (preExplain) {
      setModalType(preExplain);
      setPreExplain(null);
    } else {
      setModalType(null);
      setActiveAgent(null);
    }
  }

  const agent = activeAgent || WORKFORCE_AGENTS[0];

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Workforce Management</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{WORKFORCE_AGENTS.length} agents · Enterprise Lifecycle Console</div>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Active", value: WORKFORCE_AGENTS.filter(a => a.status === "active").length, color: "text-emerald-600" },
            { label: "Watch",  value: WORKFORCE_AGENTS.filter(a => a.status === "watch").length,  color: "text-amber-600" },
          ].map(m => (
            <div key={m.label} className="bg-white border border-border rounded-sm px-3 py-1.5 text-center">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
              <div className={cn("text-sm font-bold font-mono", m.color)}>{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Cards */}
      <div className="space-y-2">
        {WORKFORCE_AGENTS.map(agent => (
          <AgentWorkforceCard key={agent.id} agent={agent} onAction={openModal} />
        ))}
      </div>

      {/* Evolution Timeline */}
      <WorkforceTimeline />

      {/* Analytics Charts */}
      <div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Enterprise Evolution Analytics</div>
        <div className="grid grid-cols-2 gap-4">
          <PromotionChart />
          <WorkforceDistChart />
          <LifecycleDonutChart />
          <WorkforceGrowthChart />
        </div>
      </div>

      {/* Modals */}
      {modalType === "promote"  && <PromoteModal      agent={agent} onClose={closeModal} onExplain={openExplainFromModal} />}
      {modalType === "demote"   && <DemoteModal       agent={agent} onClose={closeModal} onExplain={openExplainFromModal} />}
      {modalType === "rollback" && <RollbackModal     agent={agent} onClose={closeModal} onExplain={openExplainFromModal} />}
      {modalType === "suspend"  && <SuspendModal      agent={agent} onClose={closeModal} onExplain={openExplainFromModal} />}
      {modalType === "resume"   && <ResumeModal       agent={agent} onClose={closeModal} />}
      {modalType === "fire"     && <FireModal         agent={agent} onClose={closeModal} onExplain={openExplainFromModal} />}
      {modalType === "clone"    && <CloneModal        agent={agent} onClose={closeModal} />}
      {modalType === "transfer" && <TransferModal     agent={agent} onClose={closeModal} onExplain={openExplainFromModal} />}
      {modalType === "reset"    && <ResetLearningModal agent={agent} onClose={closeModal} />}
      {modalType === "retrain"  && <QueueRetrainingModal agent={agent} onClose={closeModal} />}
      {modalType === "explain"  && <ExplainDecisionModal agent={agent} onClose={closeModal} />}
    </div>
  );
}
