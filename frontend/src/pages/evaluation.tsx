import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import {
  ClipboardCheck, Play, Clock, Copy, Archive, Plus, CheckCircle2,
  XCircle, AlertTriangle, BarChart2, TrendingUp, ChevronDown, ChevronRight, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

const EVAL_LIBRARY = [
  {
    id: "ev1", name: "Sales Quality", category: "Revenue", agent: "Revenue Scout AI",
    lastRun: "2h ago", status: "passing", passRate: 94, coverage: 100,
    frequency: "Daily 06:00", nextRun: "Tomorrow 06:00",
    metrics: { accuracy: 94, consistency: 91, compliance: 96, hallucinationRate: 2.1, taskCompletion: 97, reasoningQuality: 89, faithfulness: 93, groundedness: 95 },
  },
  {
    id: "ev2", name: "Compliance Audit", category: "Compliance", agent: "All Agents",
    lastRun: "6h ago", status: "passing", passRate: 91, coverage: 94,
    frequency: "Daily 08:00", nextRun: "Tomorrow 08:00",
    metrics: { accuracy: 91, consistency: 90, compliance: 98, hallucinationRate: 1.4, taskCompletion: 93, reasoningQuality: 88, faithfulness: 92, groundedness: 94 },
  },
  {
    id: "ev3", name: "Finance Accuracy", category: "Finance", agent: "Finance Reconciler",
    lastRun: "1h ago", status: "passing", passRate: 97, coverage: 100,
    frequency: "Daily 07:00", nextRun: "Tomorrow 07:00",
    metrics: { accuracy: 97, consistency: 96, compliance: 99, hallucinationRate: 0.8, taskCompletion: 99, reasoningQuality: 94, faithfulness: 97, groundedness: 98 },
  },
  {
    id: "ev4", name: "Procurement Risk", category: "Procurement", agent: "Procurement Agent",
    lastRun: "30m ago", status: "failing", passRate: 78, coverage: 87,
    frequency: "Daily 09:00", nextRun: "Today 21:00 (auto-retry)",
    metrics: { accuracy: 78, consistency: 75, compliance: 84, hallucinationRate: 6.8, taskCompletion: 79, reasoningQuality: 76, faithfulness: 77, groundedness: 80 },
  },
  {
    id: "ev5", name: "Research Fidelity", category: "Research", agent: "Research Agent",
    lastRun: "3h ago", status: "passing", passRate: 89, coverage: 95,
    frequency: "Every 12h", nextRun: "Today 17:30",
    metrics: { accuracy: 89, consistency: 87, compliance: 91, hallucinationRate: 3.2, taskCompletion: 88, reasoningQuality: 90, faithfulness: 88, groundedness: 91 },
  },
  {
    id: "ev6", name: "Customer Support Quality", category: "Customer", agent: "Customer Agent",
    lastRun: "4h ago", status: "pending", passRate: 84, coverage: 81,
    frequency: "Daily 10:00", nextRun: "Tomorrow 10:00",
    metrics: { accuracy: 84, consistency: 82, compliance: 90, hallucinationRate: 4.1, taskCompletion: 85, reasoningQuality: 80, faithfulness: 83, groundedness: 85 },
  },
  {
    id: "ev7", name: "Supplier Scoring Quality", category: "Procurement", agent: "Procurement Agent",
    lastRun: "1d ago", status: "failing", passRate: 77, coverage: 76,
    frequency: "Weekly Mon 06:00", nextRun: "Mon Jun 29 06:00",
    metrics: { accuracy: 77, consistency: 74, compliance: 82, hallucinationRate: 7.4, taskCompletion: 78, reasoningQuality: 72, faithfulness: 75, groundedness: 76 },
  },
];

const evalTrend = Array.from({ length: 14 }, (_, i) => ({ value: 80 + Math.sin(i * 0.4) * 6 + i * 0.4 }));

const METRIC_LABELS: Record<string, string> = {
  accuracy:         "Accuracy",
  consistency:      "Consistency",
  compliance:       "Compliance",
  hallucinationRate:"Hallucination Rate",
  taskCompletion:   "Task Completion",
  reasoningQuality: "Reasoning Quality",
  faithfulness:     "Faithfulness",
  groundedness:     "Groundedness",
};

function MetricBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const score = invert ? 100 - value * 10 : value;
  const color = score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-[9px] font-mono font-bold w-10 text-right", score >= 85 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600")}>
        {invert ? `${value}%` : value}
      </span>
    </div>
  );
}

const evalStatus: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  passing: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "PASSING" },
  failing: { cls: "bg-red-50 text-red-700 border-red-200",           icon: XCircle,      label: "FAILING" },
  pending: { cls: "bg-amber-50 text-amber-700 border-amber-200",     icon: Clock,         label: "PENDING" },
  running: { cls: "bg-blue-50 text-blue-700 border-blue-200",        icon: Play,          label: "RUNNING" },
};

export default function Evaluation() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [cloned, setCloned]   = useState<Set<string>>(new Set());
  const [scheduled, setScheduled] = useState<Set<string>>(new Set());
  const [evalList, setEvalList] = useState(EVAL_LIBRARY);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const runEval = (ev: typeof EVAL_LIBRARY[0]) => {
    if (running.has(ev.id)) return;
    setRunning(prev => { const n = new Set(prev); n.add(ev.id); return n; });
    toast({ title: "Evaluation Started", description: `"${ev.name}" is now running for ${ev.agent}.` });
    setTimeout(() => {
      setRunning(prev => { const n = new Set(prev); n.delete(ev.id); return n; });
      toast({ title: "Evaluation Complete", description: `"${ev.name}" finished — pass rate ${ev.passRate}%.` });
    }, 3500);
  };

  const cloneEval = (ev: typeof EVAL_LIBRARY[0]) => {
    if (cloned.has(ev.id)) return;
    setCloned(prev => { const n = new Set(prev); n.add(ev.id); return n; });
    const clone = { ...ev, id: `clone-${Date.now()}`, name: `${ev.name} (Clone)`, lastRun: "never", status: "pending" };
    setEvalList(prev => [clone, ...prev]);
    toast({ title: "Evaluation Cloned", description: `"${ev.name}" cloned. Review and launch it.` });
    setTimeout(() => setCloned(prev => { const n = new Set(prev); n.delete(ev.id); return n; }), 3000);
  };

  const scheduleEval = (ev: typeof EVAL_LIBRARY[0]) => {
    setScheduled(prev => { const n = new Set(prev); n.add(ev.id); return n; });
    toast({ title: "Schedule Updated", description: `"${ev.name}" scheduled: ${ev.frequency}.` });
    setTimeout(() => setScheduled(prev => { const n = new Set(prev); n.delete(ev.id); return n; }), 3000);
  };

  const passing  = evalList.filter(e => e.status === "passing").length;
  const failing  = evalList.filter(e => e.status === "failing").length;
  const pending  = evalList.filter(e => e.status === "pending").length;
  const avgPass  = Math.round(evalList.reduce((s, e) => s + e.passRate, 0) / evalList.length);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="EVALUATION CENTER"
        metrics={[
          { label: "PASSING",  value: passing },
          { label: "FAILING",  value: failing },
          { label: "PENDING",  value: pending },
          { label: "AVG PASS", value: `${avgPass}%` },
        ]}
      />

      <div className="p-6 max-w-[1400px] mx-auto w-full">
        <Tabs defaultValue="library" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-white border border-border p-1 rounded-sm h-auto">
              <TabsTrigger value="library" className="py-2 px-4 text-xs uppercase tracking-widest font-semibold rounded-sm data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                Eval Library
              </TabsTrigger>
              <TabsTrigger value="overview" className="py-2 px-4 text-xs uppercase tracking-widest font-semibold rounded-sm data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                Fleet Overview
              </TabsTrigger>
            </TabsList>
            <Button
              size="sm"
              className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium"
              onClick={() => navigate("/evaluation-builder")}
            >
              <Plus size={14} className="mr-2" /> NEW EVALUATION
            </Button>
          </div>

          <TabsContent value="library" className="m-0 space-y-3">
            {evalList.map(ev => {
              const ss = evalStatus[running.has(ev.id) ? "running" : ev.status] ?? evalStatus.pending;
              const Icon = ss.icon;
              const isOpen = expanded === ev.id;
              return (
                <div key={ev.id} className={cn("bg-white border border-border rounded-sm shadow-sm hover:border-primary/30 transition-colors", ev.status === "failing" && "border-red-200")}>
                  <div className="p-4 flex items-center gap-4">
                    {/* Status icon */}
                    <div className={cn("w-8 h-8 rounded-sm flex items-center justify-center border shrink-0", ss.cls)}>
                      <Icon size={14} className={running.has(ev.id) ? "animate-spin" : ""} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-foreground">{ev.name}</span>
                        <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold", ss.cls)}>{running.has(ev.id) ? "RUNNING" : ss.label}</span>
                        <span className="text-[9px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm">{ev.category}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>Agent: <span className="font-semibold text-foreground">{ev.agent}</span></span>
                        <span>·</span>
                        <span>Last Run: {ev.lastRun}</span>
                        <span>·</span>
                        <span>Pass Rate: <span className={cn("font-bold font-mono", ev.passRate >= 85 ? "text-emerald-600" : ev.passRate >= 70 ? "text-amber-600" : "text-red-600")}>{ev.passRate}%</span></span>
                        <span>·</span>
                        <span>Coverage: <span className="font-mono font-bold text-foreground">{ev.coverage}%</span></span>
                      </div>
                    </div>

                    {/* Pass bar */}
                    <div className="w-24 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-muted-foreground">Pass</span>
                        <span className={cn("text-[9px] font-mono font-bold", ev.passRate >= 85 ? "text-emerald-600" : "text-red-600")}>{ev.passRate}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className={ev.passRate >= 85 ? "h-full bg-emerald-500 rounded-full" : "h-full bg-red-500 rounded-full"} style={{ width: `${ev.passRate}%` }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[9px] uppercase tracking-widest font-semibold bg-white"
                        disabled={running.has(ev.id)}
                        onClick={() => runEval(ev)}
                      >
                        {running.has(ev.id) ? <><Play size={9} className="mr-1 animate-pulse" />Running…</> : <><Play size={9} className="mr-1" />Run</>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 text-[9px] uppercase tracking-widest font-semibold", scheduled.has(ev.id) && "text-emerald-600")}
                        onClick={() => scheduleEval(ev)}
                      >
                        {scheduled.has(ev.id) ? <><CheckCircle2 size={9} className="mr-1" />Scheduled</> : <><Calendar size={9} className="mr-1" />Schedule</>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 text-[9px] uppercase tracking-widest font-semibold", cloned.has(ev.id) && "text-emerald-600")}
                        onClick={() => cloneEval(ev)}
                      >
                        {cloned.has(ev.id) ? <><CheckCircle2 size={9} className="mr-1" />Cloned</> : <><Copy size={9} className="mr-1" />Clone</>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        onClick={() => setExpanded(isOpen ? null : ev.id)}
                      >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded metrics */}
                  {isOpen && (
                    <div className="border-t border-border bg-[#FAFBFC] p-4">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Evaluation Metrics</div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {Object.entries(ev.metrics).map(([key, value]) => (
                          <MetricBar key={key} label={METRIC_LABELS[key] ?? key} value={value as number} invert={key === "hallucinationRate"} />
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span><span className="font-bold text-foreground">Next Run:</span> {ev.nextRun}</span>
                        <span>·</span>
                        <span><span className="font-bold text-foreground">Frequency:</span> {ev.frequency}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="overview" className="m-0 space-y-4">
            <div className="bg-white border border-border rounded-sm shadow-sm p-5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <TrendingUp size={12} /> Fleet Pass Rate Trend (14-day)
              </h3>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evalTrend}>
                    <defs>
                      <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#evalGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Fleet Avg Pass Rate", value: `${avgPass}%`,   color: avgPass >= 85 ? "text-emerald-600" : "text-amber-600" },
                { label: "Passing Evals",        value: passing,         color: "text-emerald-600" },
                { label: "Failing Evals",         value: failing,        color: "text-red-600" },
                { label: "Evaluations Total",     value: evalList.length, color: "text-foreground" },
              ].map(m => (
                <div key={m.label} className="bg-white border border-border rounded-sm p-4 shadow-sm">
                  <div className={cn("text-2xl font-bold font-mono tabular-nums", m.color)}>{m.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-[#FCFCFD]">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BarChart2 size={14} className="text-primary" /> Per-Agent Evaluation Summary
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Evaluation</th>
                    <th className="px-4 py-3 text-left font-medium">Agent</th>
                    <th className="px-4 py-3 text-left font-medium">Pass Rate</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {evalList.map(ev => {
                    const ss = evalStatus[ev.status] ?? evalStatus.pending;
                    const Icon = ss.icon;
                    return (
                      <tr key={ev.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-foreground text-xs">{ev.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{ev.agent}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs font-mono font-bold", ev.passRate >= 85 ? "text-emerald-600" : ev.passRate >= 70 ? "text-amber-600" : "text-red-600")}>{ev.passRate}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold inline-flex items-center gap-1", ss.cls)}>
                            <Icon size={9} /> {ss.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{ev.frequency}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
