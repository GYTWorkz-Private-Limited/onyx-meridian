import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from "recharts";
import {
  Maximize2, Filter, X, ChevronRight, AlertTriangle,
  TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  DAYS, COST_DATA, TASK_DATA, WORKFORCE_DATA, LATENCY_DATA,
  KNOWLEDGE_DATA, BUSINESS_VALUE_DATA, DEPT_PERF, RESOURCE_AGENTS,
  ACTIVITY_HEATMAP, FAILURE_HEATMAP, ALERTS, SYSTEM_LOGS,
  LIVE_EVENTS_INIT, RESOURCE_DASH, MODEL_ANALYTICS,
  KNOWLEDGE_SUMMARY, TOOL_SUMMARY, SECURITY, EXEC_INSIGHTS,
} from "@/data/dashboard-data";
import { useLocation } from "wouter";

// ─── Types ─────────────────────────────────────────────────────────────────
type Range = "7d" | "30d";

// ─── Helpers ───────────────────────────────────────────────────────────────
function sliceRange<T>(data: T[], range: Range) {
  return range === "7d" ? data.slice(-7) : data;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function RangeToggle({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-sm p-0.5">
      {(["7d", "30d"] as Range[]).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm transition-colors",
            range === r ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function ChartCard({
  title, children, range, onRangeChange, className, onExpand,
}: {
  title: string;
  children: React.ReactNode;
  range?: Range;
  onRangeChange?: (r: Range) => void;
  className?: string;
  onExpand?: () => void;
}) {
  return (
    <div className={cn("bg-white border border-border rounded-sm shadow-sm flex flex-col", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-xs font-bold text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {range && onRangeChange && <RangeToggle range={range} onChange={onRangeChange} />}
          <button
            onClick={onExpand}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

function MiniKpi({
  label, value, trend, trendColor, onClick,
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendColor?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-border rounded-sm px-3 py-2.5 flex flex-col gap-1",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
      )}
    >
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold leading-tight">
        {label}
      </span>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-bold font-mono text-foreground leading-none">{value}</span>
        {trend && (
          <span className={cn("text-[10px] font-semibold font-mono leading-none mb-0.5", trendColor ?? "text-muted-foreground")}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: {
    fontSize: 10,
    border: "1px solid hsl(var(--border))",
    borderRadius: 4,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "6px 10px",
  },
  itemStyle: { fontSize: 10, padding: "1px 0" },
};

const LEGEND_STYLE = {
  wrapperStyle: { fontSize: 10, paddingTop: 8 },
};

// ─── KPI Rows ─────────────────────────────────────────────────────────────
const KPI_ROW1 = [
  { label: "ENTERPRISE HEALTH", value: "98%",     trend: "↑2%",   tc: "text-emerald-600" },
  { label: "TOTAL AGENTS",      value: "486",     trend: "↓1%",   tc: "text-red-500" },
  { label: "ACTIVE AGENTS",     value: "421",     trend: "↑3%",   tc: "text-emerald-600" },
  { label: "SLEEPING AGENTS",   value: "38",      trend: "↑2%",   tc: "text-amber-500" },
  { label: "LEARNING AGENTS",   value: "19",      trend: "↑5%",   tc: "text-emerald-600" },
  { label: "BLOCKED AGENTS",    value: "8",       trend: "↑1%",   tc: "text-red-500" },
  { label: "OFFLINE AGENTS",    value: "5",       trend: "↓1%",   tc: "text-emerald-600" },
  { label: "TASKS TODAY",       value: "182,451", trend: "↑8%",   tc: "text-emerald-600" },
];

const KPI_ROW2 = [
  { label: "TASKS SUCCESSFUL",  value: "98.8%",   trend: "↑0.5%", tc: "text-emerald-600" },
  { label: "AVG RESPONSE",      value: "1.42s",   trend: "↓12%",  tc: "text-emerald-600" },
  { label: "AVG REASONING",     value: "14 Steps",trend: "↑1%",   tc: "text-amber-500" },
  { label: "KNOWLEDGE HIT",     value: "96%",     trend: "↑2%",   tc: "text-emerald-600" },
  { label: "MEMORY RECALL",     value: "93%",     trend: "↑3%",   tc: "text-emerald-600" },
  { label: "TOOL SUCCESS",      value: "97%",     trend: "↑1%",   tc: "text-emerald-600" },
  { label: "MCP AVAIL",         value: "99.96%",  trend: "↑0%",   tc: "text-emerald-600" },
  { label: "TOKEN USAGE",       value: "14.8M",   trend: "↑15%",  tc: "text-amber-500" },
];

const KPI_ROW3 = [
  { label: "TODAY'S COST",      value: "$3,482",  trend: "↑6%",   tc: "text-amber-500" },
  { label: "MONTHLY COST",      value: "$84,233", trend: "↑4%",   tc: "text-amber-500" },
  { label: "HOURS SAVED",       value: "12,914",  trend: "↑9%",   tc: "text-emerald-600" },
  { label: "BUSINESS VALUE",    value: "$2.8M",   trend: "↑12%",  tc: "text-emerald-600" },
  { label: "HUMAN INTERV.",     value: "1.8%",    trend: "↓0.3%", tc: "text-emerald-600" },
  { label: "CURRENT QUEUE",     value: "384 Jobs",trend: "↑18%",  tc: "text-amber-500" },
  { label: "CRITICAL ALERTS",   value: "6",       trend: "↓2%",   tc: "text-emerald-600" },
  { label: "COMPLIANCE",        value: "99%",     trend: "↑0.2%", tc: "text-emerald-600" },
];

// ─── Main Component ────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();

  // time ranges per chart
  const [costRange,       setCostRange]       = useState<Range>("30d");
  const [taskRange,       setTaskRange]       = useState<Range>("30d");
  const [workforceRange,  setWorkforceRange]  = useState<Range>("30d");
  const [latencyRange,    setLatencyRange]    = useState<Range>("30d");
  const [knowledgeRange,  setKnowledgeRange]  = useState<Range>("30d");
  const [bvRange,         setBvRange]         = useState<Range>("30d");

  // filters
  const [timeFilter,    setTimeFilter]    = useState("Last 1h");
  const [orgFilter,     setOrgFilter]     = useState("All Orgs");
  const [deptFilter,    setDeptFilter]    = useState("All Depts");
  const [abuFilter,     setAbuFilter]     = useState("All ABUs");
  const [envFilter,     setEnvFilter]     = useState("All Envs");
  const [tierFilter,    setTierFilter]    = useState("All Tiers");
  const [activeFilters, setActiveFilters] = useState(3);

  // live event feed
  const [liveEvents, setLiveEvents] = useState(LIVE_EVENTS_INIT);
  const [eventCounter, setEventCounter] = useState(37);

  // log search
  const [logSearch, setLogSearch] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setEventCounter((n) => n + 1);
      setLiveEvents((prev) => {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        return [
          { id: Date.now(), text: `New system event simulated ${eventCounter + 1}`, time: `${hh}:${mm}` },
          ...prev.slice(0, 14),
        ];
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [eventCounter]);

  const clearFilters = useCallback(() => {
    setTimeFilter("Last 1h");
    setOrgFilter("All Orgs");
    setDeptFilter("All Depts");
    setAbuFilter("All ABUs");
    setEnvFilter("All Envs");
    setTierFilter("All Tiers");
    setActiveFilters(0);
  }, []);

  const filteredLogs = SYSTEM_LOGS.filter(
    (l) =>
      logSearch === "" ||
      l.module.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.agent.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(logSearch.toLowerCase())
  );

  const costSlice      = sliceRange(COST_DATA, costRange);
  const taskSlice      = sliceRange(TASK_DATA, taskRange);
  const workforceSlice = sliceRange(WORKFORCE_DATA, workforceRange);
  const latencySlice   = sliceRange(LATENCY_DATA, latencyRange);
  const knowledgeSlice = sliceRange(KNOWLEDGE_DATA, knowledgeRange);
  const bvSlice        = sliceRange(BUSINESS_VALUE_DATA, bvRange);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="ENTERPRISE OVERVIEW"
        engineBadge="DEEPSIGHTS ENGINE V3.2"
        metrics={[
          { label: "ACTIVE AGENTS", value: "421" },
          { label: "TASKS TODAY",   value: "182,451" },
          { label: "COMPLIANCE",    value: "99%" },
          { label: "ALERTS",        value: "6" },
        ]}
      />

      <div className="p-5 space-y-4 max-w-[1800px] mx-auto w-full">

        {/* ── KPI ROWS ── */}
        {[KPI_ROW1, KPI_ROW2, KPI_ROW3].map((row, ri) => (
          <div key={ri} className="grid grid-cols-8 gap-2">
            {row.map((kpi) => (
              <MiniKpi
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                trend={kpi.trend}
                trendColor={kpi.tc}
                onClick={() => navigate("/kpi-studio")}
              />
            ))}
          </div>
        ))}

        {/* ── ROW: Cost + Task Execution + Executive Insights ── */}
        <div className="grid grid-cols-[1fr_1fr_280px] gap-4">
          {/* Enterprise Cost Over Time */}
          <ChartCard
            title="Enterprise Cost Over Time"
            range={costRange}
            onRangeChange={setCostRange}
            onExpand={() => navigate("/outcomes")}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={costSlice} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]}
                />
                <Legend {...LEGEND_STYLE} />
                <Line type="monotone" dataKey="OpenAI"    stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Azure"     stroke="#22c55e" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="AWS"       stroke="#f97316" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Anthropic" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="GCP"       stroke="#facc15" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Task Execution Status */}
          <ChartCard
            title="Task Execution Status"
            range={taskRange}
            onRangeChange={setTaskRange}
            onExpand={() => navigate("/outcomes")}
          >
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={taskSlice} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend {...LEGEND_STYLE} />
                <Area type="monotone" dataKey="Completed" stackId="1" stroke="#22c55e" fill="#86efac" strokeWidth={1} />
                <Area type="monotone" dataKey="Running"   stackId="1" stroke="#3b82f6" fill="#93c5fd" strokeWidth={1} />
                <Area type="monotone" dataKey="Queued"    stackId="1" stroke="#f59e0b" fill="#fcd34d" strokeWidth={1} />
                <Area type="monotone" dataKey="Retried"   stackId="1" stroke="#f97316" fill="#fdba74" strokeWidth={1} />
                <Area type="monotone" dataKey="Failed"    stackId="1" stroke="#ef4444" fill="#fca5a5" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Executive Insights */}
          <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Executive Insights</span>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {EXEC_INSIGHTS.map((ins, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-sm hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate("/intelligence")}
                >
                  <span className={cn("text-sm font-bold shrink-0 mt-0.5", ins.color)}>{ins.icon}</span>
                  <span className="text-[10px] text-foreground leading-snug">{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW: AI Workforce + Response Latency ── */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title="AI Workforce Activity"
            range={workforceRange}
            onRangeChange={setWorkforceRange}
            onExpand={() => navigate("/agentops")}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={workforceSlice} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend {...LEGEND_STYLE} />
                <Line type="monotone" dataKey="Active"   stroke="#22c55e" strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="Idle"     stroke="#374151" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Learning" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Blocked"  stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Response Latency Percentiles"
            range={latencyRange}
            onRangeChange={setLatencyRange}
            onExpand={() => navigate("/outcomes")}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={latencySlice} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}ms`}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [`${v}ms`, undefined]}
                />
                <Legend {...LEGEND_STYLE} />
                <Line type="monotone" dataKey="Max"     stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="P99"     stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="P95"     stroke="#f97316" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="P90"     stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Average" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── ROW: Knowledge Retrieval + Business Value ── */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard
            title="Knowledge Retrieval Performance"
            range={knowledgeRange}
            onRangeChange={setKnowledgeRange}
            onExpand={() => navigate("/knowledge-studio")}
          >
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={knowledgeSlice} margin={{ top: 4, right: 24, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left"  tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}ms`}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number, name: string) =>
                    name === "RetrievalTime" ? [`${v}ms`, "Retrieval Time"] : [v.toLocaleString(), "Requests"]
                  }
                />
                <Legend
                  {...LEGEND_STYLE}
                  formatter={(value) => value === "RetrievalTime" ? "Retrieval Time" : "Requests"}
                />
                <Bar yAxisId="left" dataKey="Requests" fill="#c4b5fd" barSize={6} />
                <Line yAxisId="right" type="monotone" dataKey="RetrievalTime" stroke="#22c55e" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[9px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold">Cache Hit: 78%</span>
              <span className="text-[9px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold">Vector Hit: 65%</span>
            </div>
          </ChartCard>

          <ChartCard
            title="Business Value Generated"
            range={bvRange}
            onRangeChange={setBvRange}
            onExpand={() => navigate("/outcomes")}
          >
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={bvSlice} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="bvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#86efac" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#86efac" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  {...TOOLTIP_STYLE}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue Saved (USD)"]}
                />
                <Legend {...LEGEND_STYLE} formatter={() => "Revenue Saved (USD)"} />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#bvGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── ROW: Dept Performance + Resource Agents + Heatmaps ── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top Performing Departments */}
          <ChartCard
            title="Top Performing Departments"
            onExpand={() => navigate("/business-units")}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={DEPT_PERF}
                margin={{ top: 0, right: 16, bottom: 0, left: 16 }}
              >
                <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 3, 3, 0]} barSize={10}
                  onClick={(d) => navigate(`/business-units`)} style={{ cursor: "pointer" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Resource Consuming Agents */}
          <ChartCard
            title="Top Resource Consuming Agents"
            onExpand={() => navigate("/agentops")}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={RESOURCE_AGENTS}
                margin={{ top: 0, right: 8, bottom: 24, left: -8 }}
              >
                <XAxis
                  dataKey="agent"
                  tick={{ fontSize: 8 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar
                  dataKey="value"
                  radius={[3, 3, 0, 0]}
                  barSize={24}
                  onClick={() => navigate("/agentops")}
                  style={{ cursor: "pointer" }}
                  isAnimationActive={false}
                >
                  {RESOURCE_AGENTS.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── ROW: Activity Heatmap + Failure Heatmap ── */}
        <div className="grid grid-cols-2 gap-4">
          <ActivityHeatmap />
          <FailureHeatmap />
        </div>

        {/* ── FILTER BAR ── */}
        <div className="bg-white border border-border rounded-sm shadow-sm px-4 py-2 flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-muted-foreground shrink-0" />
          {[
            { label: timeFilter,  opts: ["Last 1h", "Last 4h", "Last 24h", "Last 7d"],   set: setTimeFilter },
            { label: orgFilter,   opts: ["All Orgs", "North America", "EMEA", "APAC"],    set: setOrgFilter },
            { label: deptFilter,  opts: ["All Depts", "Finance", "HR", "Ops", "IT"],      set: setDeptFilter },
            { label: abuFilter,   opts: ["All ABUs", "Manufacturing", "Supply Chain"],     set: setAbuFilter },
            { label: envFilter,   opts: ["All Envs", "Production", "Staging", "Dev"],     set: setEnvFilter },
            { label: tierFilter,  opts: ["All Tiers", "Tier 1", "Tier 2", "Tier 3"],      set: setTierFilter },
          ].map(({ label, opts, set }) => (
            <select
              key={label}
              value={label}
              onChange={(e) => { set(e.target.value); setActiveFilters((n) => Math.max(0, n)); }}
              className="text-[10px] font-medium border border-border rounded-sm px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {activeFilters > 0 && (
            <>
              <span className="text-[9px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                {activeFilters} Active Filters
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={10} /> Clear All
              </button>
              <button className="ml-auto text-[9px] font-bold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded-sm transition-colors">
                Apply Filters
              </button>
            </>
          )}
        </div>

        {/* ── ROW: Resource Dashboard + Model Analytics + Knowledge Summary ── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Resource Dashboard */}
          <div
            className="bg-white border border-border rounded-sm shadow-sm p-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate("/outcomes")}
          >
            <h3 className="text-xs font-bold text-foreground mb-3">Resource Dashboard</h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(RESOURCE_DASH).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{k}</div>
                  <div className={cn("text-sm font-bold font-mono", v.color)}>{v.value}{typeof v.value === "number" ? "%" : ""}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Analytics */}
          <div
            className="bg-white border border-border rounded-sm shadow-sm p-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate("/agentops")}
          >
            <h3 className="text-xs font-bold text-foreground mb-3">Model Analytics</h3>
            <div className="grid grid-cols-3 gap-3">
              {MODEL_ANALYTICS.map((m) => (
                <div key={m.label}>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.label}</div>
                  <div className={cn("text-[11px] font-bold leading-tight", m.color ?? "text-foreground")}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW: Knowledge Summary + Tool Summary + Security ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* Knowledge Summary */}
          <div
            className="bg-white border border-border rounded-sm shadow-sm p-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate("/knowledge-studio")}
          >
            <h3 className="text-xs font-bold text-foreground mb-3">Knowledge Summary</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(KNOWLEDGE_SUMMARY).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5 leading-tight">{k}</div>
                  <div className={cn("text-xs font-bold", v.color || "text-foreground")}>{v.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tool & Integration Summary */}
          <div
            className="bg-white border border-border rounded-sm shadow-sm p-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate("/governance")}
          >
            <h3 className="text-xs font-bold text-foreground mb-3">Tool &amp; Integration Summary</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TOOL_SUMMARY).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5 leading-tight">{k}</div>
                  <div className={cn(
                    "text-xs font-bold",
                    v.status === "warn" ? "text-amber-500" : "text-foreground"
                  )}>
                    {v.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Compliance */}
          <div
            className="bg-red-50 border border-red-100 rounded-sm shadow-sm p-4 cursor-pointer hover:border-red-200 transition-colors"
            onClick={() => navigate("/governance")}
          >
            <h3 className="text-xs font-bold text-red-700 mb-3">Security &amp; Compliance</h3>
            <div className="grid grid-cols-3 gap-2">
              {SECURITY.map((s) => (
                <div key={s.label} className="bg-white border border-red-100 rounded-sm px-2 py-1.5">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5 leading-tight">{s.label}</div>
                  <div className={cn("text-sm font-bold font-mono", s.color || "text-foreground")}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW: Alert Center + Live Event Feed + System Logs ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* Alert Center */}
          <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-foreground">Alert Center</span>
              <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-sm ml-auto">
                {ALERTS.filter((a) => a.severity === "CRITICAL").length} Critical
              </span>
              <span className="text-[9px] font-bold bg-orange-400 text-white px-1.5 py-0.5 rounded-sm">
                {ALERTS.filter((a) => a.severity === "HIGH").length} High
              </span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {ALERTS.map((alert, i) => (
                <div
                  key={i}
                  className="px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors flex items-start gap-2"
                  onClick={() => navigate("/governance")}
                >
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5",
                    alert.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                    alert.severity === "HIGH"     ? "bg-orange-100 text-orange-700" :
                                                    "bg-amber-100 text-amber-700"
                  )}>
                    {alert.severity}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-foreground truncate">{alert.title}</div>
                    <div className="text-[9px] text-muted-foreground flex items-center justify-between">
                      <span className="truncate">{alert.source}</span>
                      <span className="shrink-0 ml-2 font-mono">{alert.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Event Feed */}
          <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-foreground">Live Event Feed</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {liveEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="px-4 py-2 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => navigate("/outcomes")}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    <span className="text-[10px] text-foreground">{ev.text}</span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">{ev.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent System Logs */}
          <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-foreground">Recent System Logs</span>
              <button
                onClick={() => navigate("/outcomes")}
                className="text-[9px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                View All Logs <ChevronRight size={10} />
              </button>
            </div>
            <div className="px-3 pt-2 pb-1 shrink-0">
              <input
                placeholder="Search logs…"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full text-[10px] border border-border rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-[9px]">
                <thead className="sticky top-0 bg-muted/50 border-b border-border">
                  <tr>
                    {["Timestamp", "Severity", "Module", "Agent", "Action"].map((h) => (
                      <th key={h} className="text-left px-3 py-1.5 font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLogs.map((log, i) => (
                    <tr
                      key={i}
                      className="hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={() => navigate("/outcomes")}
                    >
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{log.ts}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn(
                          "font-bold",
                          log.severity === "ERROR"   ? "text-red-600" :
                          log.severity === "WARNING" ? "text-amber-500" :
                                                       "text-blue-600"
                        )}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-foreground">{log.module}</td>
                      <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[80px]">{log.agent}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Activity Heatmap ──────────────────────────────────────────────────────
function ActivityHeatmap() {
  const [, navigate] = useLocation();
  const hourLabels = ["0:00", "4:00", "8:00", "12:00", "16:00", "20:00"];
  const hourIndices = [0, 4, 8, 12, 16, 20];

  return (
    <div
      className="bg-white border border-border rounded-sm shadow-sm p-4 cursor-pointer hover:border-primary/20 transition-colors"
      onClick={() => navigate("/agentops")}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-foreground">Agent Activity by Hour × Department</span>
        <Maximize2 size={12} className="text-muted-foreground" />
      </div>
      {/* hour axis */}
      <div className="flex ml-12 mb-1">
        {hourLabels.map((h, idx) => (
          <div key={h} className="text-[8px] text-muted-foreground" style={{ width: `${(hourIndices[idx + 1] || 25) - hourIndices[idx]}` + "%" }}>
            {h}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {ACTIVITY_HEATMAP.map((row) => (
          <div key={row.dept} className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground w-10 shrink-0 text-right pr-1">{row.dept}</span>
            <div className="flex gap-0.5 flex-1">
              {row.hours.map((cell) => (
                <div
                  key={cell.h}
                  title={`${row.dept} ${cell.h}:00 — Activity: ${cell.v}`}
                  className="h-4 rounded-sm flex-1 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: cell.v === 0
                      ? "#f1f5f9"
                      : `rgba(139, 92, 246, ${Math.min(1, 0.12 + cell.v * 0.088)})`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Failure Heatmap ──────────────────────────────────────────────────────
function FailureHeatmap() {
  const [, navigate] = useLocation();

  return (
    <div
      className="bg-white border border-border rounded-sm shadow-sm p-4 cursor-pointer hover:border-primary/20 transition-colors"
      onClick={() => navigate("/governance")}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-foreground">Failure Heatmap (Last 30 Days)</span>
        <Maximize2 size={12} className="text-muted-foreground" />
      </div>
      {/* day axis */}
      <div className="flex ml-12 mb-1 justify-between">
        {["Day 1", "Day 15", "Day 30"].map((d) => (
          <span key={d} className="text-[8px] text-muted-foreground">{d}</span>
        ))}
      </div>
      <div className="space-y-1">
        {FAILURE_HEATMAP.map((row) => (
          <div key={row.dept} className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground w-10 shrink-0 text-right pr-1">{row.dept}</span>
            <div className="flex gap-0.5 flex-1">
              {row.days.map((cell) => (
                <div
                  key={cell.day}
                  title={`${row.dept} ${cell.day} — Failures: ${cell.v}`}
                  className="h-4 rounded-sm flex-1 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: cell.v === 0
                      ? "#f1f5f9"
                      : `rgba(239, 68, 68, ${Math.min(1, 0.15 + cell.v * 0.17)})`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
