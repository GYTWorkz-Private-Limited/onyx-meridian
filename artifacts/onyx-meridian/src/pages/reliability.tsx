import React, { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import {
  HeartPulse, AlertTriangle, XCircle, CheckCircle2, RefreshCw,
  Zap, TrendingDown, BarChart2, ChevronDown, ChevronRight,
  ArrowRight, BrainCircuit, Wrench, Database, Lock, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

const AGENTS = [
  { name: "Revenue Scout AI",  bu: "Revenue",      healthScore: 92, stabilityScore: 94, failureTrend: -2,  regressionTrend: -1, escalationFreq: 0.3, failedEvals: 0, status: "healthy",  lastFailure: null,
    failureDetail: "No active failures. Last incident resolved 18 days ago (tool timeout, auto-recovered).",
    rootCause: "N/A", impactedWorkflows: 0, businessImpact: "None", mttr: "—", actions: ["Schedule quarterly eval", "Review context window usage"] },
  { name: "Deal Closer AI",    bu: "Revenue",      healthScore: 81, stabilityScore: 83, failureTrend: +3,  regressionTrend: +2, escalationFreq: 1.1, failedEvals: 1, status: "warning",  lastFailure: "4h ago",
    failureDetail: "Reasoning quality dropped 4 points this week. Confidence calibration drift detected.",
    rootCause: "Context Failure (52%), Reasoning Failure (48%)", impactedWorkflows: 2, businessImpact: "Estimated $24K delayed deal risk", mttr: "22m", actions: ["Fine-tune on latest deal outcomes", "Expand context window", "Adjust confidence threshold"] },
  { name: "Finance Reconciler",bu: "Finance",      healthScore: 96, stabilityScore: 97, failureTrend: -3,  regressionTrend: -2, escalationFreq: 0.1, failedEvals: 0, status: "healthy",  lastFailure: null,
    failureDetail: "No active failures. Operating at peak performance. Month-end close fully autonomous.",
    rootCause: "N/A", impactedWorkflows: 0, businessImpact: "None", mttr: "—", actions: ["Eligible for autonomy upgrade", "Add intercompany entity coverage"] },
  { name: "FP&A Analyst AI",   bu: "Finance",      healthScore: 85, stabilityScore: 86, failureTrend: +1,  regressionTrend: +1, escalationFreq: 0.7, failedEvals: 0, status: "warning",  lastFailure: "8h ago",
    failureDetail: "Low confidence flag on Q4 revenue forecast (61% confidence vs 75% threshold). Human escalation triggered.",
    rootCause: "Reasoning Failure (100%)", impactedWorkflows: 1, businessImpact: "CFO review cycle extended by 4h", mttr: "14m", actions: ["Retrain on Q3 actuals", "Adjust confidence threshold to 70%"] },
  { name: "Procurement Agent", bu: "Procurement",  healthScore: 67, stabilityScore: 70, failureTrend: +12, regressionTrend: +8, escalationFreq: 3.8, failedEvals: 3, status: "critical", lastFailure: "30m ago",
    failureDetail: "Supplier API tool call timeout rate 38% over last 24h. Three failed eval runs. Supplier risk scoring degraded.",
    rootCause: "Tool Failure (58%), Context Failure (28%), Policy Failure (14%)", impactedWorkflows: 5, businessImpact: "Estimated $68K procurement backlog risk", mttr: "41m", actions: ["Retrain on supplier data (high priority)", "Replace Supplier API integration", "Reduce autonomy to Supervised"] },
  { name: "Contract AI",       bu: "Procurement",  healthScore: 65, stabilityScore: 67, failureTrend: +18, regressionTrend: +13,escalationFreq: 6.4, failedEvals: 4, status: "failing",  lastFailure: "15m ago",
    failureDetail: "Memory context overflow. Unauthorized external API attempt blocked by policy. Accuracy below eval threshold.",
    rootCause: "Memory Failure (44%), Policy Failure (33%), Tool Failure (23%)", impactedWorkflows: 6, businessImpact: "3 contracts blocked, ~$180K at risk", mttr: "58m", actions: ["Replace with Contract AI v4.2 (critical)", "Block production actions", "Human review all queued contracts"] },
  { name: "Logistics Optimizer",bu: "Supply Chain",healthScore: 90, stabilityScore: 92, failureTrend: -1,  regressionTrend:  0, escalationFreq: 0.4, failedEvals: 0, status: "healthy",  lastFailure: null,
    failureDetail: "Healthy. Last route optimization cycle completed with 4.2% efficiency improvement.",
    rootCause: "N/A", impactedWorkflows: 0, businessImpact: "None", mttr: "—", actions: ["Add real-time traffic integration", "Expand to APAC routes"] },
  { name: "Maintenance AI",    bu: "Engineering",  healthScore: 86, stabilityScore: 88, failureTrend: +2,  regressionTrend: +1, escalationFreq: 0.6, failedEvals: 0, status: "warning",  lastFailure: "5h ago",
    failureDetail: "Minor prediction confidence drop on non-standard equipment. Self-corrected, no human escalation required.",
    rootCause: "Reasoning Failure (100%)", impactedWorkflows: 1, businessImpact: "1 maintenance alert delayed 2h", mttr: "8m", actions: ["Add Q2 maintenance dataset to training", "Review prediction confidence bounds"] },
];

const FAILURE_CATEGORIES = [
  { name: "Context Failure",   count: 12, pct: 28, color: "#6366f1", icon: BrainCircuit },
  { name: "Tool Failure",      count: 9,  pct: 21, color: "#f59e0b", icon: Wrench },
  { name: "Reasoning Failure", count: 8,  pct: 19, color: "#ef4444", icon: HelpCircle },
  { name: "Memory Failure",    count: 6,  pct: 14, color: "#8b5cf6", icon: Database },
  { name: "Policy Failure",    count: 5,  pct: 12, color: "#f97316", icon: Lock },
  { name: "Unknown Failure",   count: 3,  pct: 7,  color: "#6b7280", icon: AlertTriangle },
];

const healthTrend = Array.from({ length: 14 }, (_, i) => ({ value: 70 + Math.sin(i * 0.5) * 10 + i * 0.8 }));

const statusStyle: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  healthy:  { text: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", dot: "bg-emerald-500" },
  warning:  { text: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   dot: "bg-amber-500"   },
  critical: { text: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200",  dot: "bg-orange-500"  },
  failing:  { text: "text-red-700",     bg: "bg-red-50",      border: "border-red-200",     dot: "bg-red-500"     },
};

function ScoreBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-emerald-500" : value >= 75 ? "bg-amber-500" : value >= 65 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono font-bold">{value}</span>
    </div>
  );
}

export default function Reliability() {
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENTS[0] | null>(null);
  const [queued, setQueued] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const queue = (key: string, label: string) => {
    setQueued(prev => { const n = new Set(prev); n.add(key); return n; });
    toast({ title: label + " Initiated", description: `Action queued for ${key.split("-")[0]}.` });
  };

  const healthy  = AGENTS.filter(a => a.status === "healthy").length;
  const warning  = AGENTS.filter(a => a.status === "warning").length;
  const critical = AGENTS.filter(a => a.status === "critical").length;
  const failing  = AGENTS.filter(a => a.status === "failing").length;
  const avgHealth = Math.round(AGENTS.reduce((s, a) => s + a.healthScore, 0) / AGENTS.length);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="AGENT RELIABILITY CENTER"
        metrics={[
          { label: "HEALTHY",  value: healthy },
          { label: "WARNING",  value: warning },
          { label: "CRITICAL", value: critical },
          { label: "FAILING",  value: failing },
          { label: "AVG HEALTH", value: `${avgHealth}%` },
        ]}
      />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-6">

        {/* Health overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 bg-white border border-border rounded-sm shadow-sm p-5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
              <HeartPulse size={12} /> Fleet Health Trend
            </div>
            <div className="h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthTrend}>
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#healthGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{avgHealth}%</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Fleet avg health</div>
          </div>

          {/* Failure breakdown */}
          <div className="col-span-3 bg-white border border-border rounded-sm shadow-sm p-5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-4 flex items-center gap-2">
              <TrendingDown size={12} /> Failure Category Breakdown (30d)
            </div>
            <div className="grid grid-cols-3 gap-3">
              {FAILURE_CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.name} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 bg-muted">
                      <CatIcon size={12} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-foreground">{cat.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{cat.count}</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{cat.pct}% of failures</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agent health table */}
        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-[#FCFCFD] flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart2 size={14} className="text-primary" /> Agent Health Registry
            </h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Click row to expand · Deep Dive for full investigation</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium w-8"></th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Health</th>
                <th className="px-4 py-3 font-medium">Stability</th>
                <th className="px-4 py-3 font-medium">Failure Trend</th>
                <th className="px-4 py-3 font-medium">Escalation Freq</th>
                <th className="px-4 py-3 font-medium">Failed Evals</th>
                <th className="px-4 py-3 font-medium">Last Failure</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {AGENTS.map(agent => {
                const ss = statusStyle[agent.status];
                const isOpen = selectedAgent?.name === agent.name;
                return (
                  <React.Fragment key={agent.name}>
                    <tr
                      className={cn("hover:bg-muted/20 transition-colors cursor-pointer", isOpen && "bg-primary/5",
                        agent.status === "failing" && "bg-red-50/30",
                        agent.status === "critical" && "bg-orange-50/20"
                      )}
                      onClick={() => setSelectedAgent(isOpen ? null : agent)}
                    >
                      <td className="px-4 py-3">
                        {isOpen ? <ChevronDown size={13} className="text-primary" /> : <ChevronRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm text-foreground">{agent.name}</div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{agent.bu}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold inline-flex items-center gap-1", ss.bg, ss.text, ss.border)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ss.dot)} />
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3"><ScoreBar value={agent.healthScore} /></td>
                      <td className="px-4 py-3"><ScoreBar value={agent.stabilityScore} /></td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-mono font-bold", agent.failureTrend > 0 ? "text-red-600" : "text-emerald-600")}>
                          {agent.failureTrend > 0 ? `+${agent.failureTrend}` : agent.failureTrend}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-mono", agent.escalationFreq > 2 ? "text-red-600 font-bold" : agent.escalationFreq > 0.5 ? "text-amber-600" : "text-muted-foreground")}>
                          {agent.escalationFreq}/day
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-mono font-bold", agent.failedEvals > 0 ? "text-red-600" : "text-emerald-600")}>{agent.failedEvals}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{agent.lastFailure ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {queued.has(agent.name + "-retrain") ? (
                            <span className="text-[8px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">Queued</span>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-6 text-[9px] uppercase tracking-widest" onClick={() => queue(agent.name + "-retrain", "Retrain")}>
                              <RefreshCw size={8} className="mr-1" /> Retrain
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] uppercase tracking-widest text-primary"
                            onClick={() => navigate(`/anomaly-deep-dive/${encodeURIComponent(agent.name.toLowerCase().replace(/\s+/g, "-"))}`)}
                          >
                            <Zap size={8} className="mr-1" /> Deep Dive
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {isOpen && (
                      <tr>
                        <td colSpan={10} className="px-6 py-4 bg-[#FAFBFC] border-b border-border">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Failure Detail</div>
                              <p className="text-xs text-foreground leading-relaxed">{agent.failureDetail}</p>
                              {agent.rootCause !== "N/A" && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-sm">
                                  <div className="text-[9px] text-red-600 font-bold uppercase tracking-widest mb-0.5">Root Cause</div>
                                  <p className="text-[10px] text-red-700">{agent.rootCause}</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Business Impact</div>
                              <div className="space-y-1.5">
                                {[
                                  { l: "Impact", v: agent.businessImpact },
                                  { l: "Workflows Affected", v: agent.impactedWorkflows.toString() },
                                  { l: "MTTR", v: agent.mttr },
                                ].map(m => (
                                  <div key={m.l} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">{m.l}</span>
                                    <span className="font-semibold text-foreground">{m.v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Recommended Actions</div>
                              <div className="space-y-1">
                                {agent.actions.map((a, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <ArrowRight size={10} className="text-primary mt-0.5 shrink-0" />
                                    <span className="text-[10px] text-foreground">{a}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-[9px] uppercase tracking-widest bg-primary text-white"
                              onClick={() => navigate(`/anomaly-deep-dive/${encodeURIComponent(agent.name.toLowerCase().replace(/\s+/g, "-"))}`)}
                            >
                              <Zap size={10} className="mr-1" /> Full Deep Dive Investigation
                            </Button>
                            {!queued.has(agent.name + "-retrain") && (
                              <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest" onClick={() => queue(agent.name + "-retrain", "Retrain")}>
                                <RefreshCw size={10} className="mr-1" /> Queue Retrain
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
