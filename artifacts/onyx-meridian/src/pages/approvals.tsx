import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, ShieldAlert,
  DollarSign, FileText, Database, Percent, ShoppingCart, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { CEO_LOCK_THRESHOLD } from "@/lib/rbac";
import { Lock } from "lucide-react";

type ApprovalStatus = "pending" | "escalated" | "approved" | "rejected" | "blocked";
type RiskLevel = "low" | "medium" | "high" | "critical";

const APPROVAL_QUEUE: {
  id: string; type: string; action: string; agent: string; risk: RiskLevel; cost: string; bu: string;
  businessImpact: string; approver: string; status: ApprovalStatus; age: string; deadline: string;
}[] = [
  { id: "apq1", type: "Purchase Approval",    action: "Procurement spend $28,400 — Supplier #084 (New vendor)",     agent: "Procurement Agent",  risk: "medium",  cost: "$28,400",  bu: "procurement", businessImpact: "Supply continuity risk if delayed >48h",  approver: "Procurement Manager", status: "pending",   age: "23m",  deadline: "4h" },
  { id: "apq2", type: "Contract Approval",    action: "Contract generation — Enterprise SaaS Renewal Q4",           agent: "Contract AI",         risk: "high",    cost: "$180,000", bu: "procurement", businessImpact: "Revenue recognition blocked until signed",    approver: "Legal Counsel",       status: "pending",   age: "1h",   deadline: "24h" },
  { id: "apq3", type: "Budget Approval",      action: "Budget reallocation: $65K from Engineering to Revenue",      agent: "FP&A Analyst AI",     risk: "high",    cost: "$65,000",  bu: "finance",      businessImpact: "Q3 pipeline capacity constrained",            approver: "CFO",                 status: "escalated", age: "3h",   deadline: "12h" },
  { id: "apq4", type: "Discount Approval",    action: "Discount authorization: 22% off enterprise deal APAC-114",   agent: "Deal Closer AI",      risk: "medium",  cost: "$41,000",  bu: "revenue",      businessImpact: "Deal at risk — competitor offering 20%",       approver: "Revenue Manager",     status: "approved",  age: "4h",   deadline: "—" },
  { id: "apq5", type: "Data Access Approval", action: "Request: PII dataset export — APAC customer cohort Q2",       agent: "Research Agent",      risk: "critical", cost: "—",       bu: "revenue",      businessImpact: "Compliance risk if unapproved access occurs",  approver: "DPO / CISO",          status: "blocked",   age: "6h",   deadline: "Blocked" },
  { id: "apq6", type: "Procurement Approval", action: "New supplier onboarding: LogiTech Solutions (5 contracts)",   agent: "Procurement Agent",  risk: "medium",  cost: "$340,000", bu: "procurement", businessImpact: "Q4 supplier diversification target at risk",   approver: "Procurement Director",status: "pending",   age: "8h",   deadline: "24h" },
];

function parseCost(cost: string): number {
  const n = Number(cost.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const riskStyle: Record<RiskLevel, string> = {
  low:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium:   "bg-amber-50 text-amber-700 border-amber-200",
  high:     "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const statusStyle: Record<ApprovalStatus, { cls: string; label: string }> = {
  pending:   { cls: "bg-blue-50 text-blue-700 border-blue-200",     label: "Pending" },
  escalated: { cls: "bg-orange-50 text-orange-700 border-orange-200", label: "Escalated" },
  approved:  { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Approved" },
  rejected:  { cls: "bg-red-50 text-red-700 border-red-200",        label: "Rejected" },
  blocked:   { cls: "bg-red-100 text-red-800 border-red-300",       label: "Blocked" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  "Purchase Approval":    DollarSign,
  "Contract Approval":    FileText,
  "Budget Approval":      DollarSign,
  "Discount Approval":    Percent,
  "Data Access Approval": Database,
  "Procurement Approval": ShoppingCart,
};

export default function Approvals() {
  const [queue, setQueue] = useState(APPROVAL_QUEUE);
  const { toast } = useToast();
  const { role, currentBuId } = useAppContext();

  const act = (id: string, newStatus: ApprovalStatus) => {
    const item = queue.find(i => i.id === id);
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    if (item) {
      toast({
        title: newStatus === "approved" ? "Approval Granted" : "Action Rejected",
        description: `"${item.action.substring(0, 60)}…" has been ${newStatus}.`,
      });
    }
  };

  // Employee/ABU Head only see their own BU's queue; CEO sees everything.
  const visibleQueue = role === "ceo" ? queue : queue.filter(i => i.bu === currentBuId);

  const pending   = visibleQueue.filter(a => a.status === "pending").length;
  const blocked   = visibleQueue.filter(a => a.status === "blocked").length;
  const escalated = visibleQueue.filter(a => a.status === "escalated").length;
  const approved  = visibleQueue.filter(a => a.status === "approved").length;
  const rejected  = visibleQueue.filter(a => a.status === "rejected").length;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="HUMAN APPROVAL CENTER"
        metrics={[
          { label: "PENDING",   value: pending },
          { label: "BLOCKED",   value: blocked },
          { label: "ESCALATED", value: escalated },
          { label: "APPROVED",  value: approved },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Mandatory rule banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-1">Mandatory Governance Rule</div>
            <p className="text-xs text-amber-700">All spending, contracts, procurement, payments, discounts, and budget allocations require human approval. No AI agent may autonomously execute financial or contractual actions. Blocked actions remain suspended until a qualified approver acts.</p>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Pending Approvals",   value: pending,   bg: "bg-blue-50 border-blue-200",     text: "text-blue-700" },
            { label: "Blocked Decisions",   value: blocked,   bg: "bg-red-50 border-red-200",        text: "text-red-700" },
            { label: "Escalated",           value: escalated, bg: "bg-orange-50 border-orange-200",  text: "text-orange-700" },
            { label: "Approved (today)",    value: approved,  bg: "bg-emerald-50 border-emerald-200",text: "text-emerald-700" },
            { label: "Rejected (today)",    value: rejected,  bg: "bg-red-50 border-red-200",        text: "text-red-700" },
          ].map(k => (
            <div key={k.label} className={cn("border rounded-sm p-3 text-center", k.bg)}>
              <div className={cn("text-2xl font-bold font-mono tabular-nums", k.text)}>{k.value}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Approval Queue */}
        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Approval Queue</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-700">{pending + escalated + blocked} awaiting action</span>
          </div>
          <div className="divide-y divide-border">
            {visibleQueue.map(item => {
              const Icon = TYPE_ICONS[item.type] || FileText;
              const ss = statusStyle[item.status];
              const isCeoLocked = (parseCost(item.cost) >= CEO_LOCK_THRESHOLD || item.risk === "critical") && role !== "ceo";
              const canAct = (item.status === "pending" || item.status === "escalated" || item.status === "blocked") && role !== "employee" && !isCeoLocked;
              return (
                <div key={item.id} className={cn("p-4 hover:bg-muted/20 transition-colors", item.status === "blocked" && "bg-red-50/30")}>
                  <div className="flex items-start gap-4">
                    {/* Type icon */}
                    <div className={cn("w-8 h-8 rounded-sm border flex items-center justify-center shrink-0",
                      riskStyle[item.risk]
                    )}>
                      <Icon size={14} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-1">
                        <span className="font-bold text-sm text-foreground leading-snug">{item.action}</span>
                        <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold shrink-0 mt-0.5", ss.cls)}>
                          {ss.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="uppercase tracking-widest">{item.type}</span>
                        <span>·</span>
                        <span>Agent: <span className="text-foreground font-medium">{item.agent}</span></span>
                        <span>·</span>
                        <span>Approver: <span className="text-foreground font-medium">{item.approver}</span></span>
                        <span>·</span>
                        <Clock size={9} />
                        <span>{item.age} ago · Deadline: <span className={cn("font-medium", item.deadline === "Blocked" ? "text-red-600" : "text-foreground")}>{item.deadline}</span></span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <div className="text-xs font-mono font-bold text-foreground">{item.cost}</div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Cost Impact</div>
                      </div>
                      <div className="text-center max-w-[160px]">
                        <div className="text-[9px] text-muted-foreground leading-snug">{item.businessImpact}</div>
                      </div>
                      <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", riskStyle[item.risk])}>
                        {item.risk} risk
                      </span>
                    </div>

                    {/* Actions */}
                    {isCeoLocked && (item.status === "pending" || item.status === "escalated" || item.status === "blocked") && (
                      <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-sm shrink-0">
                        <Lock size={10} /> Requires CEO
                      </span>
                    )}
                    {canAct && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="h-7 text-[9px] uppercase tracking-widest font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => act(item.id, "approved")}
                        >
                          <ThumbsUp size={10} className="mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[9px] uppercase tracking-widest font-semibold text-destructive border-red-200"
                          onClick={() => act(item.id, "rejected")}
                        >
                          <ThumbsDown size={10} className="mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                    {item.status === "approved" && (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    )}
                    {item.status === "rejected" && (
                      <XCircle size={18} className="text-red-600 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Avg Approval Time",     value: "2.4h",   sub: "Target <4h",          ok: true },
            { label: "SLA Compliance",        value: "91%",    sub: "3 SLA breaches today", ok: false },
            { label: "Financial at Risk",     value: "$314K",  sub: "Pending queue total",  ok: false },
          ].map(s => (
            <div key={s.label} className="bg-white border border-border rounded-sm p-4 shadow-sm">
              <div className="text-xl font-bold font-mono text-foreground mb-0.5">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className={cn("text-[9px] mt-1", s.ok ? "text-emerald-600" : "text-amber-600")}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
