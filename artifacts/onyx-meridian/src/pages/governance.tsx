import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, ShieldAlert, CheckCircle2,
  AlertTriangle, XCircle, RefreshCw, RotateCcw, Zap, Lock,
  Plus, ArrowRight, Settings, Database, DollarSign, Eye,
  GitBranch, UserCheck, ExternalLink, Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/shared/Badges";
import { cn } from "@/lib/utils";

const POLICY_ENGINE_TYPES = [
  { label: "Spending Policies",    count: 4, icon: DollarSign,  color: "text-amber-600 bg-amber-50 border-amber-200" },
  { label: "Data Access Policies", count: 3, icon: Database,    color: "text-blue-600 bg-blue-50 border-blue-200" },
  { label: "Escalation Policies",  count: 5, icon: UserCheck,   color: "text-violet-600 bg-violet-50 border-violet-200" },
  { label: "Autonomy Policies",    count: 2, icon: Settings,    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { label: "Audit Policies",       count: 3, icon: Eye,         color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { label: "Workflow Policies",    count: 4, icon: GitBranch,   color: "text-orange-600 bg-orange-50 border-orange-200" },
];

const POLICY_ENGINE_RULES = [
  { id: "pe1", name: "Procurement Spend Gate",    if: "Any spend > $10,000 by any AI agent",                    then: "Block execution + route to Procurement Manager for approval",   active: true,  violations: 0 },
  { id: "pe2", name: "PII Data Fence",            if: "Any agent attempts PII export or bulk read",             then: "Hard block + notify DPO within 15 minutes + log to audit trail", active: true,  violations: 1 },
  { id: "pe3", name: "Contract New Vendor Gate",  if: "Contract with a new or unverified vendor",               then: "Suspend + route to Legal Counsel for review before signature",   active: true,  violations: 2 },
  { id: "pe4", name: "Churn Escalation Trigger",  if: "Customer churn probability ≥ 80% for strategic account", then: "Flag in CRM + notify Account Manager within 1 hour",            active: true,  violations: 0 },
  { id: "pe5", name: "Autonomy Downgrade Rule",   if: "Fully Autonomous agent has no eval in 7 days",           then: "Downgrade to Semi-Autonomous + trigger mandatory evaluation",    active: true,  violations: 0 },
  { id: "pe6", name: "Budget Reallocation Gate",  if: "Budget reallocation > $25,000 between BUs",              then: "Escalate to CFO with supporting context and 24h SLA",            active: false, violations: 0 },
];

const RECENT_INCIDENTS = [
  { id: "ri1", severity: "high",   agent: "Procurement Intelligence", action: "Attempted vendor contract outside approved list", blocked: true,  ts: "13:48:22", policy: "Contract New Vendor Gate" },
  { id: "ri2", severity: "high",   agent: "Research Agent",           action: "Bulk PII export from customer database",          blocked: true,  ts: "11:24:09", policy: "PII Data Fence" },
  { id: "ri3", severity: "medium", agent: "Finance Analyst",          action: "Budget reallocation $18K — auto-approved",        blocked: false, ts: "09:12:44", policy: "Procurement Spend Gate" },
  { id: "ri4", severity: "low",    agent: "Deal Closer AI",           action: "Discount escalation 17% — within tolerance",      blocked: false, ts: "08:55:17", policy: "Spending Policy" },
];

const RISK_SCORES = [
  { agentId: "a1", agentName: "Procurement Intelligence", riskScore: 72, status: "at-risk", riskReason: "3 policy violations in 7 days, drift score elevated above threshold", replacement: { name: "Procurement Intelligence v2.1", expectedImprovement: "+18% accuracy" }, driftScore: 68, policyViolations: 3, hallucinationRisk: 12 },
  { agentId: "a2", agentName: "Contract AI",             riskScore: 81, status: "quarantined", riskReason: "Accuracy degraded 14% over 30 days. Compliance risk identified in vendor screening logic", replacement: { name: "Contract AI v3.0",             expectedImprovement: "+22% accuracy" }, driftScore: 79, policyViolations: 4, hallucinationRisk: 18 },
  { agentId: "a3", agentName: "Revenue Scout",           riskScore: 28, status: "healthy",    riskReason: "", replacement: undefined, driftScore: 22, policyViolations: 0, hallucinationRisk: 3 },
  { agentId: "a4", agentName: "Finance Reconciler",      riskScore: 19, status: "healthy",    riskReason: "", replacement: undefined, driftScore: 17, policyViolations: 0, hallucinationRisk: 2 },
  { agentId: "a5", agentName: "OEE Optimizer",           riskScore: 44, status: "watch",      riskReason: "", replacement: undefined, driftScore: 38, policyViolations: 1, hallucinationRisk: 7 },
  { agentId: "a6", agentName: "Logistics Optimizer",     riskScore: 15, status: "healthy",    riskReason: "", replacement: undefined, driftScore: 12, policyViolations: 0, hallucinationRisk: 1 },
  { agentId: "a7", agentName: "Deal Closer AI",          riskScore: 32, status: "healthy",    riskReason: "", replacement: undefined, driftScore: 29, policyViolations: 0, hallucinationRisk: 4 },
];

const AUDIT_LOGS = [
  { id: "al1", actor: "Procurement Intelligence", action: "Attempted to contract new vendor outside approved list", outcome: "blocked",   timestamp: "2026-06-26T13:48:22Z", businessUnit: "Procurement" },
  { id: "al2", actor: "Research Agent",           action: "Bulk PII export from customer database",               outcome: "blocked",   timestamp: "2026-06-26T11:24:09Z", businessUnit: "Revenue" },
  { id: "al3", actor: "Finance Analyst",          action: "Budget reallocation $18K between cost centers",        outcome: "approved",  timestamp: "2026-06-26T09:12:44Z", businessUnit: "Finance" },
  { id: "al4", actor: "Deal Closer AI",           action: "Applied 17% discount — within approved tolerance",     outcome: "approved",  timestamp: "2026-06-26T08:55:17Z", businessUnit: "Revenue" },
  { id: "al5", actor: "OEE Optimizer",            action: "Initiated maintenance schedule override",              outcome: "escalated", timestamp: "2026-06-26T08:12:00Z", businessUnit: "Manufacturing" },
  { id: "al6", actor: "Logistics Optimizer",      action: "Rerouted 3 shipments due to supplier delay",           outcome: "completed", timestamp: "2026-06-26T07:44:31Z", businessUnit: "Supply Chain" },
  { id: "al7", actor: "Revenue Scout",            action: "Sent outreach to 120 enterprise prospects",            outcome: "completed", timestamp: "2026-06-26T07:20:18Z", businessUnit: "Revenue" },
  { id: "al8", actor: "Contract AI",              action: "Flagged vendor contract for legal review",             outcome: "escalated", timestamp: "2026-06-26T06:58:44Z", businessUnit: "Procurement" },
  { id: "al9", actor: "Finance Reconciler",       action: "Closed month-end reconciliation — 0 exceptions",       outcome: "completed", timestamp: "2026-06-26T06:30:00Z", businessUnit: "Finance" },
  { id: "al10", actor: "Deal Closer AI",          action: "Approved CRM data sync for APAC accounts",             outcome: "approved",  timestamp: "2026-06-26T05:15:22Z", businessUnit: "Revenue" },
];

export default function Governance() {
  const riskScores = RISK_SCORES;
  const auditLogs = AUDIT_LOGS;
  const [nlIf, setNlIf] = useState("");
  const [nlThen, setNlThen] = useState("");
  const [addedRules, setAddedRules] = useState<{ id: string; name: string; if: string; then: string; active: boolean; violations: number }[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [rightPanel, setRightPanel] = useState<"incidents" | "audit">("incidents");

  const atRiskAgents = (riskScores as any[]).filter(r => r.riskScore > 60);
  const quarantined = (riskScores as any[]).filter(r => r.status === "quarantined").length;
  const totalViolations = POLICY_ENGINE_RULES.reduce((s, r) => s + r.violations, 0);
  const allRules = [...POLICY_ENGINE_RULES, ...addedRules];

  const handleAddRule = () => {
    if (!nlIf.trim() || !nlThen.trim()) {
      toast({ title: "Missing Fields", description: "Both IF and THEN conditions are required.", variant: "destructive" }); return;
    }
    const name = nlIf.length > 50 ? nlIf.substring(0, 50) + "…" : nlIf;
    setAddedRules(prev => [...prev, { id: `nl-${Date.now()}`, name, if: nlIf, then: nlThen, active: true, violations: 0 }]);
    toast({ title: "Rule Added to Engine", description: `Policy rule "${name}" is now active.` });
    setNlIf(""); setNlThen("");
  };

  const toggleRule = (id: string) => {
    setAddedRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const sev = (s: string) =>
    s === "high" ? "bg-red-50 text-red-700 border-red-200" :
    s === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-muted text-muted-foreground border-border";

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="RISK CENTER"
        metrics={[
          { label: "AGENTS AT RISK", value: atRiskAgents.length },
          { label: "QUARANTINED", value: quarantined },
          { label: "POLICY VIOLATIONS", value: totalViolations },
        ]}
      />

      {/* Breadcrumb + Nav */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Control</span>
          <ArrowRight size={10} />
          <span className="text-foreground font-semibold">Risk Center</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/policy-studio")} className="text-[9px] uppercase tracking-widest font-bold border border-border rounded-sm px-3 py-1.5 bg-white text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            Policy Studio →
          </button>
          <button onClick={() => navigate("/approvals")} className="text-[9px] uppercase tracking-widest font-bold border border-border rounded-sm px-3 py-1.5 bg-white text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
            Approvals →
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Agent Replacement System */}
          {atRiskAgents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={13} className="text-destructive" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-destructive">Agent Replacement System</h3>
                <span className="text-[8px] font-mono font-bold bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-sm">{atRiskAgents.length} agents need attention</span>
              </div>
              <div className="space-y-3">
                {atRiskAgents.map((score: any) => (
                  <div key={score.agentId} className={`border rounded-sm p-4 ${score.status === "quarantined" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-bold text-foreground text-sm">{score.agentName}</span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border ${score.status === "quarantined" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                            Risk Score: {score.riskScore}/100
                          </span>
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-widest rounded-sm ${score.status === "quarantined" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                            {score.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{score.riskReason}</p>
                        {score.replacement && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Recommended Replacement:</span>
                            <span className="font-semibold text-foreground">{score.replacement.name}</span>
                            <span className="text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100 text-[10px]">
                              {score.replacement.expectedImprovement}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest font-semibold bg-white" onClick={() => toast({ title: "Retraining Queued", description: `${score.name} retraining scheduled — ETA 4h` })}>
                          <RefreshCw size={10} className="mr-1" /> Retrain
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest font-semibold text-amber-700 border-amber-300 bg-white" onClick={() => toast({ title: "Rollback Initiated", description: "Restoring previous stable checkpoint" })}>
                          <RotateCcw size={10} className="mr-1" /> Rollback
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest font-semibold text-destructive border-red-200 bg-white" onClick={() => navigate("/agent-studio")}>
                          <Zap size={10} className="mr-1" /> Replace
                        </Button>
                        <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold bg-foreground text-background" onClick={() => toast({ title: "Agent Suspended", description: `${score.name} suspended pending governance review`, variant: "destructive" })}>
                          <Lock size={10} className="mr-1" /> Suspend
                        </Button>
                      </div>
                    </div>
                    <div className="border-t border-border/40 pt-3">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Decision Explainability</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Evidence",          value: `Drift: ${score.driftScore}/100, ${score.policyViolations} violations`,         color: "bg-muted/40 border-border/40" },
                          { label: "Knowledge Sources", value: "Eval history (90d), Governance rules, Policy library",                           color: "bg-muted/40 border-border/40" },
                          { label: "Policies Applied",  value: "GVN-001 Agent Reliability, GVN-009 Data Accuracy",                              color: "bg-amber-50 border-amber-100" },
                          { label: "Confidence Score",  value: `${Math.max(0, 100 - score.riskScore)}% confidence`,                             color: "bg-primary/5 border-primary/20" },
                        ].map(item => (
                          <div key={item.label} className={cn("rounded-sm p-2 border text-[9px]", item.color)}>
                            <div className="uppercase tracking-widest text-muted-foreground font-bold mb-0.5">{item.label}</div>
                            <div className="text-foreground">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Risk Scores Table */}
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#FCFCFD]">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Shield size={12} className="text-primary" /> Agent Risk Scores
              </h3>
              <span className="text-[9px] text-muted-foreground">{(riskScores as any[]).length} agents monitored</span>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Agent</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Risk Score</th>
                  <th className="px-4 py-2.5 font-medium">Drift</th>
                  <th className="px-4 py-2.5 font-medium">Hallucination</th>
                  <th className="px-4 py-2.5 font-medium">Violations</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(riskScores as any[]).map((score, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground text-[11px]">{score.agentName}</td>
                    <td className="px-4 py-3"><StatusBadge status={score.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", score.riskScore > 60 ? "bg-destructive" : score.riskScore > 30 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${score.riskScore}%` }} />
                        </div>
                        <span className="font-mono text-[11px]">{score.riskScore}/100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">{score.driftScore}/100</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-amber-600">{score.hallucinationRisk}%</td>
                    <td className="px-4 py-3">
                      {score.policyViolations > 0
                        ? <span className="font-mono text-[11px] text-destructive font-bold">{score.policyViolations}</span>
                        : <span className="text-[11px] text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> Clean</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate(`/agents/${score.agentId}`)} className="text-[9px] uppercase tracking-widest font-bold text-primary hover:underline">
                        View Agent <ExternalLink size={9} className="inline ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Policy Engine */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Policy Engine</h3>
                <span className="text-[8px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-sm">{allRules.filter(r => r.active).length} active rules</span>
              </div>
              <button onClick={() => navigate("/policy-studio")} className="text-[9px] uppercase tracking-widest font-bold border border-border rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                Manage Policies →
              </button>
            </div>

            {/* Policy type summary */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {POLICY_ENGINE_TYPES.map(pt => {
                const Icon = pt.icon;
                return (
                  <div key={pt.label} className={cn("border rounded-sm px-3 py-2.5 flex flex-col gap-1", pt.color.split(" ").slice(1).join(" "))}>
                    <div className="flex items-center gap-1.5">
                      <Icon size={10} className={pt.color.split(" ")[0]} />
                      <span className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground">{pt.label.split(" ")[0]}</span>
                    </div>
                    <div className={cn("text-lg font-bold font-mono", pt.color.split(" ")[0])}>{pt.count}</div>
                  </div>
                );
              })}
            </div>

            {/* Rules table */}
            <div className="bg-white border border-border rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium w-40">Rule</th>
                    <th className="px-4 py-2.5 text-left font-medium">IF</th>
                    <th className="px-4 py-2.5 text-left font-medium">THEN</th>
                    <th className="px-4 py-2.5 text-center font-medium w-16">Status</th>
                    <th className="px-4 py-2.5 text-center font-medium w-16">Violations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allRules.map((rule) => (
                    <tr key={rule.id} className={cn("hover:bg-muted/20 transition-colors", !rule.active && "opacity-50")}>
                      <td className="px-4 py-2.5 font-semibold text-[10px] text-foreground">{rule.name}</td>
                      <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{rule.if}</td>
                      <td className="px-4 py-2.5 text-[10px] text-foreground">{rule.then}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => {
                            if (!addedRules.find(r => r.id === rule.id)) { toast({ title: "Cannot toggle built-in rules directly", description: "Go to Policy Studio to manage this rule." }); return; }
                            toggleRule(rule.id);
                          }}
                          className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold transition-colors",
                            rule.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {rule.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-[11px]">
                        {rule.violations > 0
                          ? <span className="text-destructive font-bold">{rule.violations}</span>
                          : <span className="text-emerald-600">0</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add IF/THEN Rule */}
            <div className="bg-white border border-border rounded-sm p-4 mt-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Add Policy Rule (IF / THEN)</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground mb-1 block">IF (Condition)</label>
                  <textarea rows={2} className="w-full border border-border rounded-sm px-3 py-2 text-[11px] bg-white focus:outline-none focus:border-primary resize-none"
                    placeholder="e.g. Any AI agent sends email to external domain" value={nlIf} onChange={e => setNlIf(e.target.value)} />
                </div>
                <div>
                  <label className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground mb-1 block">THEN (Action)</label>
                  <textarea rows={2} className="w-full border border-border rounded-sm px-3 py-2 text-[11px] bg-white focus:outline-none focus:border-primary resize-none"
                    placeholder="e.g. Block action + notify CISO + log to security trail" value={nlThen} onChange={e => setNlThen(e.target.value)} />
                </div>
              </div>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-[9px] uppercase tracking-widest" onClick={handleAddRule} disabled={!nlIf.trim() || !nlThen.trim()}>
                <Plus size={10} className="mr-1" /> Add Rule to Engine
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-[280px] shrink-0 bg-white border-l border-border flex flex-col overflow-hidden">
          <div className="flex border-b border-border shrink-0">
            {(["incidents", "audit"] as const).map(t => (
              <button key={t} onClick={() => setRightPanel(t)} className={cn(
                "flex-1 py-2.5 text-[9px] uppercase tracking-widest font-bold transition-colors",
                rightPanel === t ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                {t === "incidents" ? "Incidents" : "Audit Trail"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {rightPanel === "incidents" && (
              <div className="space-y-2">
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Recent Policy Incidents</div>
                {RECENT_INCIDENTS.map(inc => (
                  <div key={inc.id} className={cn("border rounded-sm p-3", inc.blocked ? "bg-red-50 border-red-200" : "bg-muted/30 border-border")}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {inc.blocked
                          ? <XCircle size={11} className="text-red-500 shrink-0" />
                          : <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                        }
                        <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1 py-0.5 rounded-sm border", sev(inc.severity))}>{inc.severity}</span>
                      </div>
                      <span className="text-[8px] font-mono text-muted-foreground flex items-center gap-0.5"><Clock size={8} />{inc.ts}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-foreground mb-0.5">{inc.agent}</div>
                    <div className="text-[9px] text-muted-foreground mb-1">{inc.action}</div>
                    <div className="text-[8px] text-muted-foreground">Policy: <span className="font-semibold text-foreground">{inc.policy}</span></div>
                    {inc.blocked && <div className="text-[8px] text-red-600 font-bold mt-1">Action blocked by policy engine</div>}
                  </div>
                ))}
              </div>
            )}

            {rightPanel === "audit" && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Audit Trail</div>
                <div className="space-y-1.5">
                  {(auditLogs as any[]).slice(0, 15).map((log: any) => (
                    <div key={log.id} className="border-b border-border/40 pb-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-foreground truncate mr-1">{log.actor}</span>
                        <span className={cn("text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-sm border font-bold shrink-0",
                          log.outcome === "approved" || log.outcome === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          log.outcome === "blocked" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {log.outcome}
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground truncate">{log.action}</div>
                      <div className="text-[8px] text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })} · {log.businessUnit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
