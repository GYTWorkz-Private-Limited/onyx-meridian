import React, { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, TrendingDown, RefreshCw, Zap, ArrowUp, RotateCcw,
  BrainCircuit, BookOpen, Lightbulb, Dumbbell, ChevronDown, ChevronRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

type EvoStatus = "Learning" | "Stable" | "Improving" | "Degrading" | "Replacement Recommended";

const AGENTS: {
  name: string; bu: string;
  accuracy: number; accDelta: number;
  knowledge: number; knwDelta: number;
  reasoning: number; reasDelta: number;
  skill: number; sklDelta: number;
  evolutionStatus: EvoStatus;
  retrainingJobs: number; isUpgradeCandidate: boolean; isReplaceCandidate: boolean;
  currentVersion: string; suggestedReplacement: string | null; expectedImprovement: string | null;
}[] = [
  { name: "Revenue Scout AI",   bu: "Revenue",      accuracy: 87, accDelta: +3,  knowledge: 84, knwDelta: +4, reasoning: 89, reasDelta: +2, skill: 86, sklDelta: +3, evolutionStatus: "Improving",               retrainingJobs: 0, isUpgradeCandidate: false, isReplaceCandidate: false, currentVersion: "v3.1", suggestedReplacement: null,              expectedImprovement: null },
  { name: "Deal Closer AI",     bu: "Revenue",      accuracy: 81, accDelta: +4,  knowledge: 78, knwDelta: +3, reasoning: 83, reasDelta: +3, skill: 80, sklDelta: +4, evolutionStatus: "Improving",               retrainingJobs: 1, isUpgradeCandidate: true,  isReplaceCandidate: false, currentVersion: "v2.4", suggestedReplacement: null,              expectedImprovement: "+6% accuracy with model upgrade" },
  { name: "Finance Reconciler", bu: "Finance",      accuracy: 94, accDelta: +1,  knowledge: 93, knwDelta: +1, reasoning: 95, reasDelta:  0, skill: 94, sklDelta: +1, evolutionStatus: "Stable",                  retrainingJobs: 0, isUpgradeCandidate: false, isReplaceCandidate: false, currentVersion: "v4.0", suggestedReplacement: null,              expectedImprovement: null },
  { name: "FP&A Analyst AI",    bu: "Finance",      accuracy: 84, accDelta: +2,  knowledge: 81, knwDelta: +3, reasoning: 83, reasDelta: +2, skill: 82, sklDelta: +2, evolutionStatus: "Learning",                retrainingJobs: 0, isUpgradeCandidate: false, isReplaceCandidate: false, currentVersion: "v1.8", suggestedReplacement: null,              expectedImprovement: null },
  { name: "Procurement Agent",  bu: "Procurement",  accuracy: 78, accDelta: -3,  knowledge: 75, knwDelta: -2, reasoning: 76, reasDelta: -3, skill: 74, sklDelta: -2, evolutionStatus: "Degrading",               retrainingJobs: 2, isUpgradeCandidate: false, isReplaceCandidate: false, currentVersion: "v2.1", suggestedReplacement: "Procurement AI v3.0", expectedImprovement: "+12% accuracy, −40% tool failure rate" },
  { name: "Contract AI",        bu: "Procurement",  accuracy: 76, accDelta: -5,  knowledge: 73, knwDelta: -4, reasoning: 74, reasDelta: -6, skill: 72, sklDelta: -5, evolutionStatus: "Replacement Recommended", retrainingJobs: 3, isUpgradeCandidate: false, isReplaceCandidate: true,  currentVersion: "v1.9", suggestedReplacement: "Contract AI v4.2",    expectedImprovement: "+11% accuracy, −65% error rate" },
  { name: "Logistics Optimizer",bu: "Supply Chain", accuracy: 88, accDelta: +2,  knowledge: 86, knwDelta: +2, reasoning: 90, reasDelta: +1, skill: 87, sklDelta: +2, evolutionStatus: "Stable",                  retrainingJobs: 0, isUpgradeCandidate: false, isReplaceCandidate: false, currentVersion: "v3.5", suggestedReplacement: null,              expectedImprovement: null },
  { name: "Maintenance AI",     bu: "Engineering",  accuracy: 85, accDelta: +3,  knowledge: 83, knwDelta: +2, reasoning: 86, reasDelta: +3, skill: 84, sklDelta: +3, evolutionStatus: "Improving",               retrainingJobs: 0, isUpgradeCandidate: true,  isReplaceCandidate: false, currentVersion: "v2.7", suggestedReplacement: null,              expectedImprovement: "+5% accuracy with Q2 dataset" },
];

const evoStyle: Record<EvoStatus, string> = {
  "Learning":                "bg-blue-50 text-blue-700 border-blue-200",
  "Stable":                  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Improving":               "bg-green-50 text-green-700 border-green-200",
  "Degrading":               "bg-amber-50 text-amber-700 border-amber-200",
  "Replacement Recommended": "bg-red-50 text-red-700 border-red-200",
};

const GROWTH_TREND = Array.from({ length: 8 }, (_, i) => ({
  wk: `W${i + 1}`,
  accuracy:  76 + i * 1.4 + Math.sin(i) * 1.2,
  knowledge: 72 + i * 1.8 + Math.sin(i * 1.2) * 1.0,
  reasoning: 78 + i * 1.2 + Math.sin(i * 0.8) * 1.4,
  skill:     74 + i * 1.6 + Math.sin(i * 1.1) * 1.1,
}));

function DeltaBadge({ v }: { v: number }) {
  if (v === 0) return <span className="text-[9px] font-mono text-muted-foreground">0%</span>;
  return (
    <span className={cn("text-[9px] font-mono font-bold flex items-center gap-0.5", v > 0 ? "text-emerald-600" : "text-red-600")}>
      {v > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
      {v > 0 ? `+${v}` : v}%
    </span>
  );
}

export default function Evolution() {
  const [selected, setSelected] = useState<string | null>(null);
  const [queued, setQueued] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queue = (key: string) => {
    setQueued(prev => { const n = new Set(prev); n.add(key); return n; });
    const [agentName, action] = key.split("-");
    const labels: Record<string, string> = { retrain: "Retrain Queued", promote: "Promotion Scheduled", rollback: "Rollback Initiated", replace: "Replacement Initiated" };
    toast({ title: labels[action] || "Action Queued", description: `${agentName} — ${action} scheduled.` });
  };

  const improving    = AGENTS.filter(a => a.evolutionStatus === "Improving").length;
  const degrading    = AGENTS.filter(a => a.evolutionStatus === "Degrading" || a.evolutionStatus === "Replacement Recommended").length;
  const retraining   = AGENTS.reduce((s, a) => s + a.retrainingJobs, 0);
  const upgrades     = AGENTS.filter(a => a.isUpgradeCandidate).length;
  const replacements = AGENTS.filter(a => a.isReplaceCandidate).length;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="AGENT EVOLUTION CENTER"
        metrics={[
          { label: "IMPROVING",          value: improving },
          { label: "REGRESSING",         value: degrading },
          { label: "RETRAINING",         value: retraining },
          { label: "UPGRADE CANDIDATES", value: upgrades },
          { label: "REPLACE",            value: replacements },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Improving",              value: improving,    bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
            { label: "Regressing",             value: degrading,    bg: "bg-red-50 border-red-200",         text: "text-red-700" },
            { label: "Retraining Jobs",        value: retraining,   bg: "bg-amber-50 border-amber-200",     text: "text-amber-700" },
            { label: "Upgrade Candidates",     value: upgrades,     bg: "bg-blue-50 border-blue-200",       text: "text-blue-700" },
            { label: "Replacement Candidates", value: replacements, bg: "bg-red-50 border-red-200",         text: "text-red-700" },
          ].map(k => (
            <div key={k.label} className={cn("border rounded-sm p-3 text-center", k.bg)}>
              <div className={cn("text-2xl font-bold font-mono tabular-nums", k.text)}>{k.value}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Growth chart */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={12} /> Fleet Growth Tracking (8-week window)
          </h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_TREND}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="accuracy"  stroke="#6366f1" fill="url(#accGrad)" strokeWidth={2} name="Accuracy" />
                <Area type="monotone" dataKey="knowledge" stroke="#10b981" fill="none"           strokeWidth={1.5} strokeDasharray="4 2" name="Knowledge" />
                <Area type="monotone" dataKey="reasoning" stroke="#f59e0b" fill="none"           strokeWidth={1.5} strokeDasharray="2 2" name="Reasoning" />
                <Area type="monotone" dataKey="skill"     stroke="#8b5cf6" fill="none"           strokeWidth={1.5} name="Skill" />
                <Tooltip />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-2 justify-end">
            {[
              { label: "Accuracy",  color: "bg-indigo-500" },
              { label: "Knowledge", color: "bg-emerald-500" },
              { label: "Reasoning", color: "bg-amber-500" },
              { label: "Skill",     color: "bg-violet-500" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase tracking-widest">
                <div className={cn("w-3 h-0.5 rounded", l.color)} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Evolution dashboard */}
        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-[#FCFCFD] flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BrainCircuit size={15} className="text-primary" /> Evolution Dashboard
            </h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Click row for growth breakdown</span>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FCFCFD] border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Accuracy</th>
                <th className="px-4 py-3 font-medium">Knowledge</th>
                <th className="px-4 py-3 font-medium">Reasoning</th>
                <th className="px-4 py-3 font-medium">Skill</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {AGENTS.map(agent => {
                const isOpen = selected === agent.name;
                return (
                  <React.Fragment key={agent.name}>
                    <tr
                      className={cn("hover:bg-muted/30 transition-colors cursor-pointer", isOpen && "bg-primary/5")}
                      onClick={() => setSelected(isOpen ? null : agent.name)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{agent.name}</div>
                        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{agent.bu}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-semibold", evoStyle[agent.evolutionStatus])}>
                          {agent.evolutionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{agent.accuracy}</span>
                          <DeltaBadge v={agent.accDelta} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{agent.knowledge}</span>
                          <DeltaBadge v={agent.knwDelta} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{agent.reasoning}</span>
                          <DeltaBadge v={agent.reasDelta} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold">{agent.skill}</span>
                          <DeltaBadge v={agent.sklDelta} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground">{agent.currentVersion}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          {queued.has(agent.name + "-retrain") ? (
                            <span className="text-[8px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">Retrain Queued</span>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold" onClick={() => queue(agent.name + "-retrain")}>
                              <RefreshCw size={10} className="mr-1" /> Retrain
                            </Button>
                          )}
                          {queued.has(agent.name + "-promote") ? (
                            <CheckCircle2 size={13} className="text-emerald-500 mx-1" />
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold" onClick={() => queue(agent.name + "-promote")}>
                              <ArrowUp size={10} className="mr-1" /> Promote
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold text-amber-600" onClick={() => queue(agent.name + "-rollback")}>
                            <RotateCcw size={10} className="mr-1" /> Rollback
                          </Button>
                          {agent.isReplaceCandidate && (
                            queued.has(agent.name + "-replace") ? (
                              <span className="text-[8px] text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-widest">Replace Initiated</span>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold text-destructive" onClick={() => queue(agent.name + "-replace")}>
                                <Zap size={10} className="mr-1" /> Replace
                              </Button>
                            )
                          )}
                          {isOpen ? <ChevronDown size={12} className="ml-1 text-muted-foreground" /> : <ChevronRight size={12} className="ml-1 text-muted-foreground" />}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="bg-muted/20 px-6 py-4 border-b border-border">
                          <div className="grid grid-cols-4 gap-4">
                            {[
                              { icon: TrendingUp, label: "Accuracy Growth",  value: `${agent.accuracy}`,  delta: agent.accDelta,  color: "text-indigo-600" },
                              { icon: BookOpen,   label: "Knowledge Growth", value: `${agent.knowledge}`, delta: agent.knwDelta,  color: "text-emerald-600" },
                              { icon: Lightbulb,  label: "Reasoning Growth", value: `${agent.reasoning}`, delta: agent.reasDelta, color: "text-amber-600" },
                              { icon: Dumbbell,   label: "Skill Growth",     value: `${agent.skill}`,     delta: agent.sklDelta,  color: "text-violet-600" },
                            ].map(g => {
                              const GIcon = g.icon;
                              return (
                                <div key={g.label} className="bg-white border border-border rounded-sm p-3">
                                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
                                    <GIcon size={10} className={g.color} /> {g.label}
                                  </div>
                                  <div className={cn("text-xl font-bold font-mono", g.color)}>{g.value}</div>
                                  <DeltaBadge v={g.delta} />
                                </div>
                              );
                            })}
                          </div>
                          {agent.suggestedReplacement && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-sm flex items-center justify-between">
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-0.5">Replacement Recommendation</div>
                                <div className="text-xs text-red-700">
                                  Current: <strong>{agent.currentVersion}</strong> → Suggested: <strong>{agent.suggestedReplacement}</strong>
                                  {agent.expectedImprovement && <span className="ml-2 text-emerald-700 font-semibold">Expected: {agent.expectedImprovement}</span>}
                                </div>
                              </div>
                              {queued.has(agent.name + "-replace") ? (
                                <span className="text-[9px] text-red-700 bg-red-100 border border-red-300 px-2 py-1 rounded-sm font-bold uppercase tracking-widest">Replacement Initiated</span>
                              ) : (
                                <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest font-semibold bg-red-600 hover:bg-red-700 text-white" onClick={() => queue(agent.name + "-replace")}>
                                  <Zap size={10} className="mr-1" /> Initiate Replacement
                                </Button>
                              )}
                            </div>
                          )}
                          {agent.isUpgradeCandidate && agent.expectedImprovement && !agent.suggestedReplacement && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-sm flex items-center justify-between">
                              <div className="text-xs text-blue-700">
                                <span className="font-bold text-[10px] uppercase tracking-widest block mb-0.5">Upgrade Available</span>
                                Model upgrade available for {agent.currentVersion} — {agent.expectedImprovement}
                              </div>
                              {queued.has(agent.name + "-promote") ? (
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-sm font-bold uppercase tracking-widest">Upgrade Queued</span>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest font-semibold border-blue-300 text-blue-700" onClick={() => queue(agent.name + "-promote")}>
                                  <ArrowUp size={10} className="mr-1" /> Upgrade Model
                                </Button>
                              )}
                            </div>
                          )}
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


