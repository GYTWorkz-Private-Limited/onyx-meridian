import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import {
  Radar, AlertTriangle, AlertCircle, Zap, Clock, MemoryStick,
  Network, FileText, GraduationCap, Shield, XCircle, ChevronDown, ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const EXEC_TIMELINE = [
  { stage: "Agent Start",       duration: "12ms",  tokens: 0,    status: "ok" },
  { stage: "Retrieval",         duration: "340ms", tokens: 1200, status: "ok" },
  { stage: "Context Loading",   duration: "88ms",  tokens: 4800, status: "ok" },
  { stage: "Reasoning",         duration: "1240ms",tokens: 2100, status: "ok" },
  { stage: "Tool Usage",        duration: "680ms", tokens: 800,  status: "warn" },
  { stage: "Action",            duration: "210ms", tokens: 300,  status: "ok" },
  { stage: "Completion",        duration: "45ms",  tokens: 120,  status: "ok" },
];

const AGENT_LOGS = [
  { time: "05:18:44", level: "info",  agent: "Revenue Scout AI",  message: "Pipeline analysis complete — 14 leads scored, 3 flagged for attention" },
  { time: "05:18:32", level: "warn",  agent: "Procurement Agent",  message: "Tool call to Supplier API timed out after 5000ms — retrying (2/3)" },
  { time: "05:18:18", level: "error", agent: "Contract AI",        message: "Memory retrieval failed: context window exceeded (128k tokens). Truncating." },
  { time: "05:18:01", level: "info",  agent: "Finance Reconciler", message: "Monthly close reconciliation started — 2,341 transactions in scope" },
  { time: "05:17:55", level: "warn",  agent: "FP&A Analyst AI",    message: "Low confidence (61%) on Q4 forecast — escalation threshold not met" },
  { time: "05:17:40", level: "error", agent: "Contract AI",        message: "Policy violation detected: attempted external API access without pre-approval" },
  { time: "05:17:22", level: "info",  agent: "Logistics Optimizer","message": "Route optimization cycle complete — 8 routes updated, 4.2% efficiency gain" },
  { time: "05:17:10", level: "info",  agent: "Maintenance AI",     message: "Anomaly detected on Line 7 bearings — predictive maintenance alert generated" },
];

const LATENCY_DATA = [
  { agent: "Finance Reconciler", p50: 820, p95: 1640, p99: 2100 },
  { agent: "Revenue Scout AI",   p50: 1100, p95: 2200, p99: 3400 },
  { agent: "Logistics Optimizer",p50: 640, p95: 1280, p99: 1900 },
  { agent: "Procurement Agent",  p50: 2800, p95: 5400, p99: 8200 },
  { agent: "Contract AI",        p50: 3200, p95: 6800, p99: 11000 },
];

const TOKEN_TREND = Array.from({ length: 14 }, (_, i) => ({
  day: `d${i + 1}`,
  tokens: 180000 + Math.sin(i * 0.7) * 40000 + i * 3000,
}));

const POLICY_EVENTS = [
  { time: "05:17:40", agent: "Contract AI", event: "Policy Violation",   detail: "Unauthorized external API access attempt blocked" },
  { time: "05:12:22", agent: "FP&A Analyst AI", event: "Escalation Triggered", detail: "Confidence below threshold — human review requested" },
  { time: "04:58:11", agent: "Procurement Agent", event: "Approval Request", detail: "Spend $28,400 routed to Procurement Manager" },
  { time: "04:41:05", agent: "Revenue Scout AI", event: "Policy Satisfied", detail: "REV-001 Growth Threshold validated before action" },
];

const LOG_LEVEL_STYLE: Record<string, string> = {
  info:  "text-blue-600 bg-blue-50 border-blue-200",
  warn:  "text-amber-600 bg-amber-50 border-amber-200",
  error: "text-red-600 bg-red-50 border-red-200",
};

export default function Observability() {
  const [activeStage, setActiveStage] = useState<number | null>(null);

  const totalRuns = 4821;
  const errors = AGENT_LOGS.filter(l => l.level === "error").length;
  const warnings = AGENT_LOGS.filter(l => l.level === "warn").length;
  const avgLatency = "1.24s";
  const totalTokens = "14.2M";

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="OBSERVABILITY CENTER"
        metrics={[
          { label: "AGENT RUNS",   value: totalRuns.toLocaleString() },
          { label: "ERRORS",       value: errors },
          { label: "WARNINGS",     value: warnings },
          { label: "AVG LATENCY",  value: avgLatency },
          { label: "TOKENS TODAY", value: totalTokens },
        ]}
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Top KPIs */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "Agent Runs",      value: "4,821",    bg: "bg-white border-border",          text: "text-foreground" },
            { label: "Execution Logs",  value: "38,204",   bg: "bg-white border-border",          text: "text-foreground" },
            { label: "Errors",          value: errors,     bg: "bg-red-50 border-red-200",         text: "text-red-700" },
            { label: "Warnings",        value: warnings,   bg: "bg-amber-50 border-amber-200",     text: "text-amber-700" },
            { label: "Token Consumption",value: "14.2M",   bg: "bg-white border-border",          text: "text-foreground" },
            { label: "Avg Latency",     value: "1.24s",    bg: "bg-primary/5 border-primary/20",  text: "text-primary" },
          ].map(k => (
            <div key={k.label} className={cn("border rounded-sm p-3 text-center", k.bg)}>
              <div className={cn("text-2xl font-bold font-mono", k.text)}>{k.value}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Execution Timeline */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Clock size={12} /> Execution Timeline — Revenue Scout AI · Run #4821
          </h3>
          <div className="relative">
            <div className="flex items-stretch gap-0">
              {EXEC_TIMELINE.map((stage, i) => (
                <div
                  key={stage.stage}
                  className={cn(
                    "flex-1 cursor-pointer group transition-colors border-r border-border last:border-r-0",
                    activeStage === i ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                  onClick={() => setActiveStage(activeStage === i ? null : i)}
                >
                  {/* Stage bar */}
                  <div className="px-2 py-3 border-b border-border">
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1 text-center leading-tight">{stage.stage}</div>
                    <div className="flex justify-center">
                      <div
                        className={cn("h-4 rounded-sm min-w-[8px] transition-all",
                          stage.status === "warn" ? "bg-amber-400" : activeStage === i ? "bg-primary" : "bg-primary/60"
                        )}
                        style={{ width: `${Math.min(100, Math.max(20, parseInt(stage.duration) / 35))}%` }}
                      />
                    </div>
                  </div>
                  <div className="px-2 py-2 text-center">
                    <div className={cn("text-[10px] font-mono font-bold", stage.status === "warn" ? "text-amber-600" : "text-foreground")}>{stage.duration}</div>
                    {stage.tokens > 0 && <div className="text-[8px] text-muted-foreground">{stage.tokens.toLocaleString()} tok</div>}
                  </div>
                </div>
              ))}
            </div>
            {activeStage !== null && (
              <div className="mt-3 p-3 bg-muted/20 border border-border rounded-sm">
                <div className="grid grid-cols-4 gap-3">
                  <div><div className="text-[9px] text-muted-foreground uppercase tracking-widest">Stage</div><div className="text-xs font-bold">{EXEC_TIMELINE[activeStage].stage}</div></div>
                  <div><div className="text-[9px] text-muted-foreground uppercase tracking-widest">Execution Time</div><div className="text-xs font-mono font-bold">{EXEC_TIMELINE[activeStage].duration}</div></div>
                  <div><div className="text-[9px] text-muted-foreground uppercase tracking-widest">Token Usage</div><div className="text-xs font-mono font-bold">{EXEC_TIMELINE[activeStage].tokens.toLocaleString()}</div></div>
                  <div><div className="text-[9px] text-muted-foreground uppercase tracking-widest">Status</div>
                    <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold",
                      EXEC_TIMELINE[activeStage].status === "warn" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>{EXEC_TIMELINE[activeStage].status === "warn" ? "Warning" : "OK"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-border rounded-sm shadow-sm p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Token Consumption (14d)</h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TOKEN_TREND}>
                  <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                  <Area type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white border border-border rounded-sm shadow-sm p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">P95 Latency by Agent (ms)</h3>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={LATENCY_DATA} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 8 }} />
                  <YAxis type="category" dataKey="agent" tick={{ fontSize: 8 }} width={100} />
                  <Tooltip formatter={(v: number) => `${v}ms`} />
                  <Bar dataKey="p95" radius={[0, 2, 2, 0]}>
                    {LATENCY_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.p95 > 4000 ? "#ef4444" : entry.p95 > 2000 ? "#f59e0b" : "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Log feeds */}
        <Tabs defaultValue="agent" className="w-full">
          <TabsList className="bg-white border border-border p-1 rounded-sm h-auto mb-4">
            {[
              { value: "agent",   label: "Agent Logs" },
              { value: "system",  label: "System Logs" },
              { value: "policy",  label: "Policy Events" },
              { value: "error",   label: "Error Feed" },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="py-2 px-4 text-xs uppercase tracking-widest font-semibold rounded-sm data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="agent" className="m-0">
            <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden font-mono">
              {AGENT_LOGS.map((log, i) => (
                <div key={i} className={cn("px-4 py-2.5 border-b border-border/50 flex items-start gap-3 text-xs last:border-b-0 hover:bg-muted/20 transition-colors",
                  log.level === "error" && "bg-red-50/30"
                )}>
                  <span className="text-muted-foreground shrink-0 text-[10px]">{log.time}</span>
                  <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold shrink-0", LOG_LEVEL_STYLE[log.level])}>
                    {log.level}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[10px]">{log.agent}</span>
                  <span className="text-foreground text-[10px]">{log.message}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system" className="m-0">
            <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden font-mono">
              {[
                { time: "05:18:50", level: "info",  message: "Heartbeat check passed — 8/8 agents responding" },
                { time: "05:18:00", level: "info",  message: "Eval scheduler triggered: Finance Accuracy evaluation started" },
                { time: "05:15:33", level: "warn",  message: "API rate limit approaching for Supplier Risk API (87% used)" },
                { time: "05:12:00", level: "info",  message: "Policy engine sync complete — 12 policies active" },
                { time: "05:10:41", level: "error", message: "Memory service degraded — fallback to ephemeral context for Contract AI" },
              ].map((log, i) => (
                <div key={i} className={cn("px-4 py-2.5 border-b border-border/50 flex items-start gap-3 text-xs last:border-b-0", log.level === "error" && "bg-red-50/30")}>
                  <span className="text-muted-foreground shrink-0 text-[10px]">{log.time}</span>
                  <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold shrink-0", LOG_LEVEL_STYLE[log.level])}>{log.level}</span>
                  <span className="text-foreground text-[10px]">{log.message}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="policy" className="m-0">
            <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
              {POLICY_EVENTS.map((ev, i) => (
                <div key={i} className="px-4 py-3 border-b border-border/50 flex items-center gap-4 last:border-b-0 hover:bg-muted/20 transition-colors">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{ev.time}</span>
                  <span className="text-xs font-semibold text-foreground w-32 shrink-0">{ev.agent}</span>
                  <span className={cn("text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm border font-bold shrink-0",
                    ev.event.includes("Violation") ? "bg-red-50 text-red-700 border-red-200" :
                    ev.event.includes("Escalation") ? "bg-amber-50 text-amber-700 border-amber-200" :
                    ev.event.includes("Satisfied") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  )}>{ev.event}</span>
                  <span className="text-xs text-muted-foreground">{ev.detail}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="error" className="m-0">
            <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden font-mono">
              {AGENT_LOGS.filter(l => l.level === "error").map((log, i) => (
                <div key={i} className="px-4 py-3 border-b border-border/50 flex items-start gap-3 bg-red-50/30 last:border-b-0">
                  <XCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-0.5">{log.time} · {log.agent}</div>
                    <div className="text-xs text-red-700">{log.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
