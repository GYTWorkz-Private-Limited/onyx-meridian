import { useState } from "react";
import { useParams, Link } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { MFG_AGENTS } from "@/data/enterprise-data";
import { buildMemoryBundle } from "@/data/memory-bundle-data";
import { cn } from "@/lib/utils";
import {
  Bot, ChevronRight, Activity, Terminal, FlaskConical, ShieldAlert,
  TrendingUp, Cpu, BookOpen, Zap, ScrollText, GitBranch, BarChart2,
  DollarSign, AlertTriangle, CheckCircle2, Clock, Layers, Settings,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const GROUPS = [
  {
    label: "Profile",
    items: ["Overview", "Identity", "Mission", "Business Context", "Business Impact", "Cognitive Graph"],
  },
  {
    label: "Build",
    items: ["Skills", "Knowledge", "Memory", "Tools", "MCP", "Prompt Studio", "Model", "Resources"],
  },
  {
    label: "Operate",
    items: ["Runtime", "Current Workflow", "Task Queue", "Execution Timeline", "Reasoning Replay", "Collaboration", "Active Missions"],
  },
  {
    label: "Observe",
    items: ["Observability", "Logs", "Traces", "Metrics", "Token Usage", "Cost Analytics", "Failure Analysis"],
  },
  {
    label: "Govern",
    items: ["SOPs", "Policies", "Human Approvals", "Security", "Audit", "Compliance", "Guardrails"],
  },
  {
    label: "Improve",
    items: ["Evaluations", "Reliability", "Learning", "Evolution", "Versions", "Deployments", "Recommendations"],
  },
];

const LOG_TYPES: Record<string, string> = {
  INFO: "text-blue-400", TOOL: "text-emerald-400", DATA: "text-purple-400",
  EVAL: "text-amber-400", ACT: "text-emerald-300", FAIL: "text-red-400",
};

export default function DigitalEmployee() {
  const { id } = useParams<{ id: string }>();
  const agent = MFG_AGENTS.find((a) => a.id === id) ?? MFG_AGENTS[0];
  const [activeGroup, setActiveGroup] = useState("Profile");
  const [activeItem, setActiveItem] = useState("Overview");
  const [memFile, setMemFile] = useState(0);

  const statusColor = agent.status === "active" ? "bg-emerald-500" : agent.status === "watch" ? "bg-amber-500" : "bg-muted-foreground";
  const healthColor = agent.health >= 90 ? "text-emerald-600" : agent.health >= 80 ? "text-amber-600" : "text-red-600";

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar moduleName={`AI WORKFORCE · ${agent.name.toUpperCase()}`} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-border text-[10px] text-muted-foreground shrink-0">
        <Link href="/workforce" className="hover:text-foreground">AI Workforce</Link>
        <ChevronRight size={10} />
        <Link href="/agent-studio" className="hover:text-foreground">Agent Studio</Link>
        <ChevronRight size={10} />
        <span className="text-foreground font-semibold">{agent.name}</span>
        <span className="ml-2 font-mono text-[9px] bg-muted px-1.5 py-0.5 rounded-sm">{agent.employeeId}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav */}
        <div className="w-[200px] shrink-0 bg-white border-r border-border flex flex-col overflow-y-auto">
          {/* Agent Card */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                <Bot size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-foreground truncate">{agent.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{agent.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColor)} />
              <span className="text-[9px] font-semibold capitalize text-muted-foreground">{agent.status}</span>
              <span className="text-[9px] text-muted-foreground ml-auto">{agent.version}</span>
            </div>
            <div className={cn("text-sm font-bold font-mono", healthColor)}>
              {agent.health}<span className="text-[9px] font-normal text-muted-foreground">/100 health</span>
            </div>
          </div>

          {/* Nav Groups */}
          <nav className="flex-1 py-2">
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-1">
                <div className="px-4 py-1.5">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground/50">{group.label}</span>
                </div>
                {group.items.map((item) => {
                  const isActive = activeGroup === group.label && activeItem === item;
                  return (
                    <button
                      key={item}
                      onClick={() => { setActiveGroup(group.label); setActiveItem(item); }}
                      className={cn(
                        "w-full flex items-center px-4 py-1.5 text-[10px] font-semibold text-left transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* PROFILE — Overview */}
          {activeGroup === "Profile" && activeItem === "Overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Health Score", value: `${agent.health}/100`, color: healthColor },
                  { label: "SLA Performance", value: `${agent.sla}%`, color: "text-emerald-600" },
                  { label: "Utilization", value: `${agent.utilization}%`, color: "text-primary" },
                  { label: "Cost / Day", value: `$${agent.costPerDay}`, color: "text-foreground" },
                ].map((m) => (
                  <div key={m.label} className="bg-white border border-border rounded-sm px-4 py-3">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                    <div className={cn("text-xl font-bold font-mono", m.color)}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-border rounded-sm p-4">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Identity</div>
                  <div className="space-y-2">
                    {[
                      { label: "Employee ID", value: agent.employeeId },
                      { label: "Role", value: agent.role },
                      { label: "Department", value: agent.department },
                      { label: "Business Unit", value: agent.bu.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()) },
                      { label: "Autonomy", value: agent.autonomy === "full" ? "Fully Autonomous" : agent.autonomy === "supervised" ? "Supervised" : "Assisted" },
                      { label: "Model", value: agent.model },
                      { label: "Version", value: agent.version },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{row.label}</span>
                        <span className="text-[10px] font-semibold text-foreground">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-border rounded-sm p-4">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Systems Connected</div>
                  <div className="space-y-2 mb-4">
                    {agent.systems.map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-foreground">{s}</span>
                        <span className="ml-auto text-[9px] text-emerald-600 font-mono">Connected</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">KPIs Owned</div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.kpisImproved.map((k) => (
                      <span key={k} className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-bold">{k}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-border rounded-sm p-4">
                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Skills</div>
                <div className="flex flex-wrap gap-2">
                  {agent.skills.map((s) => (
                    <span key={s} className="text-[10px] bg-primary/5 text-primary border border-primary/20 px-2.5 py-1 rounded-sm font-semibold">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE — Business Impact */}
          {activeGroup === "Profile" && activeItem === "Business Impact" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Hours Saved", value: `${agent.hoursSaved.toLocaleString()} hrs`, icon: Clock, color: "text-primary" },
                  { label: "Revenue Protected", value: agent.revenueProtected, icon: DollarSign, color: "text-emerald-600" },
                  { label: "Downtime Prevented", value: agent.downtimePrevented, icon: Activity, color: "text-blue-600" },
                  { label: "Cost Saved", value: agent.costSaved, icon: TrendingUp, color: "text-emerald-600" },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className="bg-white border border-border rounded-sm px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={11} className="text-muted-foreground" />
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{m.label}</span>
                      </div>
                      <div className={cn("text-xl font-bold font-mono", m.color)}>{m.value}</div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Automation %", value: `${agent.automationPct}%`, desc: "Tasks fully automated" },
                  { label: "ROI", value: agent.roi, desc: "Return on investment" },
                  { label: "EEI Contribution", value: agent.eeiContrib, desc: "Enterprise Efficiency Index delta" },
                ].map((m) => (
                  <div key={m.label} className="bg-white border border-border rounded-sm px-4 py-3">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                    <div className="text-2xl font-bold font-mono text-foreground mb-0.5">{m.value}</div>
                    <div className="text-[9px] text-muted-foreground">{m.desc}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white border border-border rounded-sm p-4">
                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">KPIs Improved</div>
                <div className="space-y-2">
                  {agent.kpisImproved.map((k) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold text-foreground w-32">{k}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.random() * 30 + 60}%` }} />
                      </div>
                      <ArrowUpRight size={12} className="text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OBSERVE — Observability */}
          {activeGroup === "Observe" && activeItem === "Observability" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Accuracy", value: `${agent.accuracy}%`, color: "text-emerald-600" },
                  { label: "Latency (p95)", value: `${agent.latencyMs}ms`, color: "text-primary" },
                  { label: "Hallucination Rate", value: `${agent.hallucination}%`, color: agent.hallucination < 1 ? "text-emerald-600" : "text-amber-600" },
                  { label: "Policy Compliance", value: `${agent.policyCompliance}%`, color: "text-emerald-600" },
                ].map((m) => (
                  <div key={m.label} className="bg-white border border-border rounded-sm px-4 py-3">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                    <div className={cn("text-xl font-bold font-mono", m.color)}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OBSERVE — Logs */}
          {activeGroup === "Observe" && activeItem === "Logs" && (
            <div className="bg-gray-950 rounded-sm border border-gray-800 p-4 font-mono">
              <div className="flex items-center gap-2 mb-3 border-b border-gray-800 pb-2">
                <Terminal size={12} className="text-gray-400" />
                <span className="text-[9px] text-gray-400 uppercase tracking-widest">Reasoning Trace · {agent.name}</span>
                <span className="ml-auto text-[9px] text-emerald-400 animate-pulse">● LIVE</span>
              </div>
              {[
                { ts: "14:32:01", type: "INFO", msg: `Initializing ${agent.name} — loading context and policies` },
                { ts: "14:32:02", type: "TOOL", msg: `Call: query_sensor_feed("${agent.systems[0]}", "last_15m")` },
                { ts: "14:32:04", type: "DATA", msg: `Sensor reading: anomaly_score=0.84 — threshold exceeded at 0.80` },
                { ts: "14:32:05", type: "EVAL", msg: `Confidence score: 0.93 — P1 Critical threshold met` },
                { ts: "14:32:06", type: "ACT", msg: `Generating recommendation → routing to enterprise intelligence` },
                { ts: "14:32:08", type: "INFO", msg: `Policy check: ${agent.policyCompliance}% compliance — all constraints satisfied` },
                { ts: "14:32:09", type: "TOOL", msg: `Call: create_work_order("${agent.department}", priority="HIGH")` },
                { ts: "14:32:11", type: "ACT", msg: `Work order generated → notifying supervisor via escalation channel` },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3 mb-1.5">
                  <span className="text-[9px] text-gray-500 shrink-0 font-mono">{log.ts}</span>
                  <span className={cn("text-[9px] font-bold w-8 shrink-0", LOG_TYPES[log.type] ?? "text-gray-400")}>{log.type}</span>
                  <span className="text-[9px] text-gray-300 break-all">{log.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* OBSERVE — Cost Analytics */}
          {activeGroup === "Observe" && activeItem === "Cost Analytics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Cost MTD", value: agent.costMtd, sub: "This month" },
                  { label: "Cost / Task", value: `$${(parseInt(agent.costMtd.replace(/[$,]/g,"")) / agent.tasks).toFixed(2)}`, sub: "Avg per task" },
                  { label: "Token Usage MTD", value: `${(agent.tokenUsage / 1_000_000).toFixed(1)}M`, sub: "Tokens consumed" },
                ].map((m) => (
                  <div key={m.label} className="bg-white border border-border rounded-sm px-4 py-3">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                    <div className="text-2xl font-bold font-mono text-foreground">{m.value}</div>
                    <div className="text-[9px] text-muted-foreground">{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GOVERN — Policies */}
          {activeGroup === "Govern" && (
            <div className="bg-white border border-border rounded-sm p-4">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">{activeItem}</div>
              {activeItem === "Policies" && (
                <div className="space-y-2">
                  {["MFG-001 Production Safety Threshold", "MFG-004 Human Approval >4hr Downtime", "GOV-001 Data Access Control", "GOV-004 PII Protection"].map((p) => (
                    <div key={p} className="flex items-center gap-3 px-3 py-2 bg-muted/30 border border-border rounded-sm">
                      <ShieldAlert size={11} className="text-primary shrink-0" />
                      <span className="text-[10px] font-semibold text-foreground flex-1">{p}</span>
                      <span className="text-[9px] text-emerald-600 font-bold">Active</span>
                    </div>
                  ))}
                </div>
              )}
              {activeItem !== "Policies" && (
                <div className="text-[11px] text-muted-foreground py-4 text-center">
                  {activeItem} configuration — available for editing in governance settings.
                </div>
              )}
            </div>
          )}

          {/* IMPROVE — Evaluations */}
          {activeGroup === "Improve" && activeItem === "Evaluations" && (
            <div className="space-y-3">
              {[
                { name: "Accuracy", score: agent.accuracy, threshold: 80, status: agent.accuracy >= 80 ? "pass" : "fail" },
                { name: "Policy Compliance", score: agent.policyCompliance, threshold: 90, status: agent.policyCompliance >= 90 ? "pass" : "fail" },
                { name: "Hallucination Detection", score: 100 - agent.hallucination * 10, threshold: 85, status: agent.hallucination < 2 ? "pass" : "fail" },
                { name: "SLA Compliance", score: agent.sla, threshold: 90, status: agent.sla >= 90 ? "pass" : "fail" },
              ].map((e) => (
                <div key={e.name} className="bg-white border border-border rounded-sm px-4 py-3 flex items-center gap-4">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", e.status === "pass" ? "bg-emerald-500" : "bg-red-500")} />
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-foreground">{e.name}</div>
                    <div className="text-[9px] text-muted-foreground">Threshold: {e.threshold}%</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("text-sm font-bold font-mono", e.status === "pass" ? "text-emerald-600" : "text-red-600")}>{e.score.toFixed(1)}%</div>
                    <div className={cn("text-[8px] uppercase tracking-widest font-bold", e.status === "pass" ? "text-emerald-600" : "text-red-600")}>{e.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BUILD — Memory Explorer */}
          {activeGroup === "Build" && activeItem === "Memory" && (() => {
            const bundle = buildMemoryBundle(agent);
            const file = bundle[memFile] ?? bundle[0];
            return (
              <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden flex" style={{ height: 420 }}>
                <div className="w-[200px] border-r border-border shrink-0 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-border text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                    Memory Bundle · {bundle.length} files
                  </div>
                  {bundle.map((f, i) => (
                    <button
                      key={f.name}
                      onClick={() => setMemFile(i)}
                      className={cn("w-full text-left px-3 py-2 text-[11px] border-b border-border/60 transition-colors",
                        i === memFile ? "bg-primary/5 text-primary font-semibold" : "text-foreground hover:bg-muted/40")}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-[10px] text-muted-foreground mb-2">Updated {file.updated}</div>
                  <pre className="text-[11px] leading-relaxed text-foreground whitespace-pre-wrap font-mono">{file.content}</pre>
                </div>
              </div>
            );
          })()}

          {/* Default fallback for other items */}
          {!(
            (activeGroup === "Profile" && (activeItem === "Overview" || activeItem === "Business Impact")) ||
            (activeGroup === "Observe" && (activeItem === "Observability" || activeItem === "Logs" || activeItem === "Cost Analytics")) ||
            activeGroup === "Govern" ||
            (activeGroup === "Improve" && activeItem === "Evaluations") ||
            (activeGroup === "Build" && activeItem === "Memory")
          ) && (
            <div className="bg-white border border-border rounded-sm p-8 text-center">
              <div className="text-2xl mb-3">
                {activeGroup === "Build" ? "🔧" : activeGroup === "Operate" ? "⚡" : activeGroup === "Improve" ? "📈" : "📋"}
              </div>
              <div className="text-[11px] font-bold text-foreground mb-2">{activeGroup} · {activeItem}</div>
              <div className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                Full {activeItem.toLowerCase()} configuration for {agent.name}. Access and edit in the configuration panel.
              </div>
              <button className="mt-4 text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/30 px-4 py-2 rounded-sm hover:bg-primary/5 transition-colors flex items-center gap-1.5 mx-auto">
                <Settings size={10} />
                Configure {activeItem}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
