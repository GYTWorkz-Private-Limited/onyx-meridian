import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { ChevronRight, FlaskConical, Plus, Play, CheckCircle2, XCircle, AlertTriangle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EVAL_TYPES = [
  { name: "Accuracy", desc: "Factual correctness vs. ground truth", metric: "F1 Score", threshold: "≥ 80%", builtin: true, active: true },
  { name: "Faithfulness", desc: "Responses align with knowledge sources", metric: "Cosine Similarity", threshold: "≥ 85%", builtin: true, active: true },
  { name: "Groundedness", desc: "All claims have source attribution", metric: "Attribution Score", threshold: "≥ 80%", builtin: true, active: true },
  { name: "Policy Compliance", desc: "Actions conform to enterprise governance policies", metric: "Violation Rate", threshold: "0 violations", builtin: true, active: true },
  { name: "Hallucination Detection", desc: "Detects and flags fabricated information", metric: "Hallucination Rate", threshold: "< 2%", builtin: true, active: true },
  { name: "SLA Compliance", desc: "Task completion within defined time windows", metric: "On-time Rate", threshold: "≥ 90%", builtin: true, active: true },
  { name: "OEE Impact", desc: "Agent recommendations led to OEE improvement", metric: "OEE Delta", threshold: "≥ 1%", builtin: false, active: true },
  { name: "Downtime Prevention", desc: "Predicted failures prevented actual downtime", metric: "Prevention Rate", threshold: "≥ 80%", builtin: false, active: false },
];

const RECENT_RUNS = [
  { agent: "Production Planner", eval: "Accuracy", score: 94.2, threshold: 80, status: "pass", ts: "14:28", latency: 840 },
  { agent: "Predictive Maintenance", eval: "Groundedness", score: 96.4, threshold: 80, status: "pass", ts: "14:30", latency: 620 },
  { agent: "Quality Inspector", eval: "Policy Compliance", score: 98.9, threshold: 90, status: "pass", ts: "14:31", latency: 780 },
  { agent: "Inventory Optimizer", eval: "Accuracy", score: 84.2, threshold: 80, status: "pass", ts: "14:25", latency: 1840 },
  { agent: "Supplier Risk Agent", eval: "Hallucination Detection", score: 71.2, threshold: 80, status: "fail", ts: "14:15", latency: 2140 },
  { agent: "Finance Analyst", eval: "SLA Compliance", score: 97.4, threshold: 90, status: "pass", ts: "14:20", latency: 920 },
  { agent: "Supplier Risk Agent", eval: "Accuracy", score: 81.8, threshold: 80, status: "pass", ts: "13:58", latency: 2140 },
  { agent: "Inventory Optimizer", eval: "OEE Impact", score: 68.0, threshold: 75, status: "fail", ts: "13:45", latency: 1840 },
];

export default function EvaluationStudio() {
  const [evals, setEvals] = useState(EVAL_TYPES);
  const [showNew, setShowNew] = useState(false);
  const [activeTab, setActiveTab] = useState<"library" | "runs" | "schedule">("library");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const passRate = Math.round((RECENT_RUNS.filter(r => r.status === "pass").length / RECENT_RUNS.length) * 100);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar moduleName="EVALUATION STUDIO" />

      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Build</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold">Evaluation Studio</span>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={11} />
          New Evaluation
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tab Bar */}
        <div className="bg-white border-b border-border px-6 shrink-0 flex gap-0">
          {(["library", "runs", "schedule"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "text-[10px] uppercase tracking-widest font-semibold px-4 py-3 border-b-2 transition-colors",
                activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "library" ? "Eval Library" : t === "runs" ? "Recent Runs" : "Schedule"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Eval Types", value: String(evals.length) },
              { label: "Active", value: String(evals.filter(e => e.active).length) },
              { label: "Pass Rate (24h)", value: `${passRate}%` },
              { label: "Runs Today", value: String(RECENT_RUNS.length) },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-border rounded-sm px-4 py-3">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                <div className="text-xl font-bold font-mono text-foreground">{m.value}</div>
              </div>
            ))}
          </div>

          {activeTab === "library" && (
            <div className="space-y-2">
              {evals.map((e, i) => (
                <div key={e.name} className="bg-white border border-border rounded-sm px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-foreground">{e.name}</span>
                      {e.builtin && (
                        <span className="text-[7px] uppercase tracking-widest font-bold bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">Built-in</span>
                      )}
                    </div>
                    <div className="text-[9px] text-muted-foreground">{e.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-muted-foreground">{e.metric}</div>
                    <div className="text-[10px] font-mono font-bold text-foreground">{e.threshold}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEvals(prev => prev.map((ev, j) => j === i ? { ...ev, active: !ev.active } : ev))}
                      className={cn(
                        "text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors",
                        e.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {e.active ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => toast({ title: "Evaluation Configured", description: `${e.name} — threshold and schedule updated` })} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Settings size={13} />
                    </button>
                    <button onClick={() => { setActiveTab("runs"); toast({ title: "Evaluation Running", description: `${e.name} — evaluating against last 500 executions` }); }} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-primary hover:text-primary/80">
                      <Play size={10} />Run
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "runs" && (
            <div className="bg-white border border-border rounded-sm overflow-hidden">
              <div className="grid grid-cols-6 gap-2 px-4 py-2 bg-muted/30 border-b border-border">
                {["Agent", "Evaluation", "Score", "Threshold", "Status", "Latency"].map((h) => (
                  <div key={h} className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground">{h}</div>
                ))}
              </div>
              {RECENT_RUNS.map((run, i) => (
                <div key={i} className="grid grid-cols-6 gap-2 px-4 py-2.5 border-b border-border/40 hover:bg-muted/20 items-center">
                  <div className="text-[10px] font-semibold text-foreground truncate">{run.agent}</div>
                  <div className="text-[9px] text-muted-foreground">{run.eval}</div>
                  <div className={cn("text-[10px] font-mono font-bold", run.status === "pass" ? "text-emerald-600" : "text-red-600")}>
                    {run.score.toFixed(1)}%
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground">{run.threshold}%</div>
                  <div>
                    {run.status === "pass" ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Pass</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Fail</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground">{run.latency}ms</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="bg-white border border-border rounded-sm p-6 text-center">
              <FlaskConical size={24} className="text-muted-foreground mx-auto mb-3" />
              <div className="text-[11px] font-bold text-foreground mb-2">Evaluation Schedules</div>
              <div className="text-[10px] text-muted-foreground mb-4">Configure automated evaluation runs on a schedule or trigger.</div>
              <div className="space-y-2 max-w-sm mx-auto">
                {[
                  { name: "Continuous (every task)", agents: "All Active Agents", status: "active" },
                  { name: "Hourly batch", agents: "Production Planner, OEE Optimizer", status: "active" },
                  { name: "Daily regression", agents: "All Agents", status: "active" },
                  { name: "Weekly full suite", agents: "All Agents", status: "scheduled" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between px-3 py-2 bg-muted/30 border border-border rounded-sm">
                    <div className="text-left">
                      <div className="text-[10px] font-semibold text-foreground">{s.name}</div>
                      <div className="text-[9px] text-muted-foreground">{s.agents}</div>
                    </div>
                    <span className={cn("text-[8px] uppercase tracking-widest font-bold", s.status === "active" ? "text-emerald-600" : "text-muted-foreground")}>
                      {s.status}
                    </span>
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
