import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import {
  Milestone, CheckCircle2, Clock, ArrowRight, ChevronDown, ChevronRight, Bot,
  GitCommit, GitBranch, History, Layers, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LIFECYCLE_STAGES = [
  "Design",
  "Testing",
  "Evaluation",
  "Approval",
  "Production",
  "Monitoring",
  "Evolution",
  "Retirement",
] as const;
type Stage = typeof LIFECYCLE_STAGES[number];

const stageStyle: Record<Stage, { bg: string; text: string; border: string; dot: string }> = {
  "Design":     { bg: "bg-muted",       text: "text-muted-foreground", border: "border-border",       dot: "bg-gray-400" },
  "Testing":    { bg: "bg-blue-50",     text: "text-blue-700",        border: "border-blue-200",      dot: "bg-blue-500" },
  "Evaluation": { bg: "bg-amber-50",    text: "text-amber-700",       border: "border-amber-200",     dot: "bg-amber-500" },
  "Approval":   { bg: "bg-orange-50",   text: "text-orange-700",      border: "border-orange-200",    dot: "bg-orange-500" },
  "Production": { bg: "bg-emerald-50",  text: "text-emerald-700",     border: "border-emerald-200",   dot: "bg-emerald-500" },
  "Monitoring": { bg: "bg-violet-50",   text: "text-violet-700",      border: "border-violet-200",    dot: "bg-violet-500" },
  "Evolution":  { bg: "bg-primary/5",   text: "text-primary",         border: "border-primary/30",    dot: "bg-primary" },
  "Retirement": { bg: "bg-red-50",      text: "text-red-700",         border: "border-red-200",       dot: "bg-red-400" },
};

const AGENTS: {
  name: string; bu: string; version: string; stage: Stage;
  stageEntered: string; testingDuration: string; productionDuration: string;
  versions: { v: string; date: string; note: string; stage: Stage }[];
  deployments: { env: string; date: string; status: string }[];
  evaluations: { name: string; date: string; result: string; score: number }[];
}[] = [
  {
    name: "Revenue Scout AI", bu: "Revenue", version: "v3.1", stage: "Monitoring",
    stageEntered: "Jun 1", testingDuration: "14 days", productionDuration: "47 days",
    versions: [
      { v: "v3.1", date: "Jun 1",  note: "Context window expanded, tool usage improved", stage: "Monitoring" },
      { v: "v3.0", date: "May 12", note: "Major reasoning upgrade, new skills added", stage: "Production" },
      { v: "v2.8", date: "Apr 3",  note: "Hotfix: hallucination guard added", stage: "Production" },
    ],
    deployments: [
      { env: "Production", date: "Jun 1",  status: "active" },
      { env: "Staging",    date: "May 28", status: "retired" },
      { env: "Production", date: "May 12", status: "retired" },
    ],
    evaluations: [
      { name: "Sales Quality",    date: "Jun 24", result: "passed", score: 94 },
      { name: "Compliance Audit", date: "Jun 18", result: "passed", score: 91 },
    ],
  },
  {
    name: "Contract AI", bu: "Procurement", version: "v1.9", stage: "Evaluation",
    stageEntered: "Jun 14", testingDuration: "21 days", productionDuration: "62 days",
    versions: [
      { v: "v1.9", date: "Jun 14", note: "Emergency retrain — accuracy regression detected", stage: "Evaluation" },
      { v: "v1.8", date: "May 2",  note: "Policy compliance additions", stage: "Production" },
    ],
    deployments: [
      { env: "Production",  date: "May 2",  status: "active" },
      { env: "Evaluation",  date: "Jun 14", status: "active" },
    ],
    evaluations: [
      { name: "Procurement Risk",   date: "Jun 24", result: "failed", score: 64 },
      { name: "Compliance Audit",   date: "Jun 18", result: "failed", score: 71 },
    ],
  },
  {
    name: "Maintenance AI", bu: "Engineering", version: "v2.7", stage: "Evolution",
    stageEntered: "Jun 20", testingDuration: "10 days", productionDuration: "38 days",
    versions: [
      { v: "v2.7", date: "Jun 20", note: "Knowledge base expansion — Q2 maintenance dataset", stage: "Evolution" },
      { v: "v2.6", date: "May 15", note: "Predictive accuracy improved +5%", stage: "Production" },
    ],
    deployments: [
      { env: "Production", date: "May 15", status: "active" },
    ],
    evaluations: [
      { name: "Reliability Check", date: "Jun 22", result: "passed", score: 88 },
    ],
  },
  {
    name: "Finance Reconciler", bu: "Finance", version: "v4.0", stage: "Production",
    stageEntered: "Apr 2", testingDuration: "18 days", productionDuration: "83 days",
    versions: [
      { v: "v4.0", date: "Apr 2",  note: "Full autonomous close — no human review needed at <$1M", stage: "Production" },
      { v: "v3.9", date: "Mar 1",  note: "Extended compliance checks", stage: "Production" },
    ],
    deployments: [
      { env: "Production", date: "Apr 2",  status: "active" },
      { env: "Staging",    date: "Mar 28", status: "retired" },
    ],
    evaluations: [
      { name: "Finance Accuracy",  date: "Jun 24", result: "passed", score: 97 },
      { name: "Compliance Audit",  date: "Jun 20", result: "passed", score: 99 },
    ],
  },
];

export default function Lifecycle() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const stageCounts = LIFECYCLE_STAGES.reduce((acc, s) => {
    acc[s] = AGENTS.filter(a => a.stage === s).length;
    return acc;
  }, {} as Record<Stage, number>);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="AGENT LIFECYCLE MANAGEMENT"
        metrics={[
          { label: "PRODUCTION",  value: stageCounts["Production"] },
          { label: "MONITORING",  value: stageCounts["Monitoring"] },
          { label: "EVALUATION",  value: stageCounts["Evaluation"] },
          { label: "EVOLUTION",   value: stageCounts["Evolution"] },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Lifecycle pipeline */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Milestone size={12} /> Enterprise Agent Lifecycle Pipeline
          </h3>
          <div className="flex items-center gap-0 overflow-x-auto">
            {LIFECYCLE_STAGES.map((stage, i) => {
              const s = stageStyle[stage];
              const count = stageCounts[stage];
              return (
                <div key={stage} className="flex items-center">
                  <div className={cn("rounded-sm border px-3 py-2 text-center min-w-[90px]", s.bg, s.border)}>
                    <div className={cn("text-[9px] font-bold uppercase tracking-widest mb-1", s.text)}>{stage}</div>
                    <div className={cn("text-lg font-mono font-bold", s.text)}>{count}</div>
                    <div className="text-[8px] text-muted-foreground">agents</div>
                  </div>
                  {i < LIFECYCLE_STAGES.length - 1 && (
                    <ArrowRight size={14} className="mx-1 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent list */}
        <div className="space-y-3">
          {AGENTS.map(agent => {
            const s = stageStyle[agent.stage];
            const isOpen = expanded === agent.name;
            return (
              <div key={agent.name} className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : agent.name)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{agent.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{agent.version}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{agent.bu} · Stage entered: {agent.stageEntered}</div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-xs font-mono text-foreground">{agent.testingDuration}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Testing Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono text-foreground">{agent.productionDuration}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Production Duration</div>
                    </div>
                    <span className={cn("text-[9px] uppercase tracking-widest px-2 py-1 rounded-sm border font-bold flex items-center gap-1.5", s.bg, s.text, s.border)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />{agent.stage}
                    </span>
                    {isOpen ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border px-5 py-4 bg-muted/10">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Version History */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <History size={11} /> Version History
                        </h4>
                        <div className="space-y-2">
                          {agent.versions.map(v => {
                            const vs = stageStyle[v.stage];
                            return (
                              <div key={v.v} className="flex gap-2 text-xs">
                                <div className="flex flex-col items-center shrink-0">
                                  <GitCommit size={12} className="text-muted-foreground" />
                                  <div className="w-px flex-1 bg-border mt-1" />
                                </div>
                                <div className="pb-2">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-mono font-bold text-foreground">{v.v}</span>
                                    <span className="text-[9px] text-muted-foreground">{v.date}</span>
                                    <span className={cn("text-[8px] uppercase tracking-widest px-1 py-0.5 rounded-sm border font-bold", vs.bg, vs.text, vs.border)}>{v.stage}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">{v.note}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Deployment History */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <GitBranch size={11} /> Deployment History
                        </h4>
                        <div className="space-y-2">
                          {agent.deployments.map((d, i) => (
                            <div key={i} className="flex items-center justify-between bg-white border border-border rounded-sm px-3 py-2 text-xs">
                              <div>
                                <span className="font-semibold text-foreground">{d.env}</span>
                                <span className="text-muted-foreground ml-2">{d.date}</span>
                              </div>
                              <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold",
                                d.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground border-border"
                              )}>{d.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Evaluation History */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Layers size={11} /> Evaluation History
                        </h4>
                        <div className="space-y-2">
                          {agent.evaluations.map((e, i) => (
                            <div key={i} className="flex items-center justify-between bg-white border border-border rounded-sm px-3 py-2 text-xs">
                              <div>
                                <div className="font-semibold text-foreground">{e.name}</div>
                                <div className="text-[9px] text-muted-foreground">{e.date}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("text-xs font-mono font-bold", e.result === "passed" ? "text-emerald-600" : "text-red-600")}>{e.score}%</span>
                                {e.result === "passed" ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} className="text-red-500" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
