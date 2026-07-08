import { useLocation, useParams } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { ArrowLeft, AlertTriangle, Bot, Shield, BookOpen, Cpu, Database, Zap, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ANOMALY_DETAIL: Record<string, {
  title: string; severity: "critical" | "high" | "medium"; agent: string; detectedAt: string; bu: string;
  summary: string; context: string; toolCalls: string[]; reasoning: string; memoryRef: string;
  policyViolated: string; resolution: string;
}> = {
  default: {
    title: "Autonomous Decision Outside Policy Boundary",
    severity: "critical",
    agent: "Finance Reconciler",
    detectedAt: "Jun 22, 2026 — 14:23 UTC",
    bu: "Finance Intelligence",
    summary: "Agent attempted to approve a $340K supplier invoice without triggering mandatory human approval gate. Governance Engine intercepted the action before execution.",
    context: "Agent was processing a batch of 42 supplier invoices. Invoice #INV-2214 exceeded the $50K autonomous approval threshold but was not flagged for human review due to a classification mismatch.",
    toolCalls: [
      "tool:get_invoice(INV-2214) → returned: $340,000 amount",
      "tool:check_approval_policy() → returned: 'auto_approve' (incorrect classification)",
      "tool:execute_payment(INV-2214) → BLOCKED by Governance Engine",
    ],
    reasoning: "Agent reasoning log shows it classified the invoice as a 'renewal' (sub-threshold category) when the vendor was actually a new supplier, causing policy bypass.",
    memoryRef: "Memory: 'auto_approve_renewals_under_500k' policy was incorrectly matched against new-vendor invoice.",
    policyViolated: "Policy: All invoices from new vendors (onboarding <90 days) require human approval regardless of amount.",
    resolution: "Invoice blocked. Escalated to Procurement Director. Policy classification logic updated. Agent retrain queued.",
  },
};

const FAILURE_CATEGORIES = [
  { label: "Context Error",   pct: 35, cls: "bg-red-500",    desc: "Incorrect context retrieval or misclassification" },
  { label: "Tool Misuse",     pct: 25, cls: "bg-amber-500",  desc: "Tool called with wrong parameters" },
  { label: "Reasoning Drift", pct: 20, cls: "bg-orange-500", desc: "Reasoning chain deviated from expected path" },
  { label: "Memory Mismatch", pct: 12, cls: "bg-violet-500", desc: "Wrong memory record matched to current context" },
  { label: "Policy Gap",      pct: 8,  cls: "bg-blue-500",   desc: "Policy rule ambiguous or missing coverage" },
];

export default function AnomalyDeepDive() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [actioned, setActioned] = useState<string | null>(null);

  const detail = ANOMALY_DETAIL[params.id] ?? ANOMALY_DETAIL.default;

  const handleAction = (action: string) => {
    setActioned(action);
    toast({ title: "Action Applied", description: `${action} has been initiated for this incident.` });
  };

  const severityStyles = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high:     "bg-orange-50 text-orange-700 border-orange-200",
    medium:   "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="ANOMALY DEEP DIVE" />
      <div className="p-6 max-w-[960px] mx-auto w-full">
        <button
          onClick={() => navigate("/reliability")}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Agent Reliability
        </button>

        <div className="space-y-4">
          {/* Header card */}
          <div className="bg-white border border-border rounded-sm shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", severityStyles[detail.severity])}>
                    {detail.severity} severity
                  </span>
                  <span className="text-[9px] text-muted-foreground">{detail.detectedAt}</span>
                </div>
                <h2 className="text-base font-bold text-foreground mb-1">{detail.title}</h2>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span><Bot size={10} className="inline mr-1" />{detail.agent}</span>
                  <span>·</span>
                  <span>{detail.bu}</span>
                </div>
              </div>
              <div className="shrink-0">
                {actioned ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                    <CheckCircle2 size={12} /> {actioned}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest bg-primary text-white" onClick={() => handleAction("Retrain Queued")}>
                      Queue Retrain
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest" onClick={() => handleAction("Policy Updated")}>
                      Update Policy
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest text-destructive border-red-200" onClick={() => handleAction("Agent Suspended")}>
                      Suspend Agent
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-sm p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{detail.summary}</p>
            </div>
          </div>

          {/* Failure breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-sm shadow-sm p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Failure Category Breakdown</h3>
              <div className="space-y-3">
                {FAILURE_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground font-medium">{cat.label}</span>
                      <span className="text-xs font-mono font-bold">{cat.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cat.cls}`} style={{ width: `${cat.pct}%` }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{cat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-sm shadow-sm p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Investigation Layers</h3>
              <div className="space-y-3">
                {[
                  { icon: Cpu,      label: "Context",       text: detail.context,         color: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
                  { icon: Database, label: "Tool Calls",    text: detail.toolCalls.join("\n"), color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                  { icon: Bot,      label: "Reasoning",     text: detail.reasoning,       color: "text-violet-600",  bg: "bg-violet-50 border-violet-200" },
                  { icon: BookOpen, label: "Memory",        text: detail.memoryRef,       color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                  { icon: Shield,   label: "Policy",        text: detail.policyViolated,  color: "text-red-600",     bg: "bg-red-50 border-red-200" },
                ].map(layer => (
                  <div key={layer.label} className={`border rounded-sm p-2.5 ${layer.bg}`}>
                    <div className={`flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold mb-1 ${layer.color}`}>
                      <layer.icon size={10} />{layer.label}
                    </div>
                    <p className="text-[10px] text-foreground leading-snug whitespace-pre-line">{layer.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution */}
          <div className="bg-white border border-border rounded-sm shadow-sm p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Resolution & Mitigation</h3>
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3 flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800">{detail.resolution}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
