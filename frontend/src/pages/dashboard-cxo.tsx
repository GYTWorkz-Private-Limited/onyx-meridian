import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  COST_DATA, TASK_DATA, BUSINESS_VALUE_DATA, DEPT_PERF, ALERTS,
  EXEC_INSIGHTS, REVENUE_SNAPSHOT, CURRENT_STOCK,
} from "@/data/dashboard-data";

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

const LEGEND_STYLE = { wrapperStyle: { fontSize: 10, paddingTop: 8 } };

function Kpi({ label, value, trend, tc, onClick }: { label: string; value: string; trend?: string; tc?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-border rounded-sm px-3 py-2.5 flex flex-col gap-1",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
      )}
    >
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold leading-tight">{label}</span>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-bold font-mono text-foreground leading-none">{value}</span>
        {trend && <span className={cn("text-[10px] font-semibold font-mono leading-none mb-0.5", tc ?? "text-muted-foreground")}>{trend}</span>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, onExpand }: { title: string; children: React.ReactNode; onExpand?: () => void }) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-xs font-bold text-foreground">{title}</span>
        {onExpand && <button onClick={onExpand} className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground">View</button>}
      </div>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

export default function ExecutiveCommandCxo() {
  const [, navigate] = useLocation();

  const lastDay = TASK_DATA[TASK_DATA.length - 1];
  const tasksDone = lastDay.Completed;
  const tasksPending = lastDay.Running + lastDay.Queued + lastDay.Retried;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="EXECUTIVE COMMAND"
        metrics={[
          { label: "ENTERPRISE HEALTH", value: "98%" },
          { label: "COMPLIANCE", value: "99%" },
          { label: "ALERTS", value: String(ALERTS.length) },
        ]}
      />

      <div className="p-5 space-y-4 max-w-[1800px] mx-auto w-full">
        {/* ── KPI grid ── */}
        <div className="grid grid-cols-4 gap-2">
          <Kpi label="Enterprise Health" value="98%" trend="↑2%" tc="text-emerald-600" />
          <Kpi label="Tasks Done Today" value={String(tasksDone)} trend="↑8%" tc="text-emerald-600" onClick={() => navigate("/my-work")} />
          <Kpi label="Tasks Pending" value={String(tasksPending)} trend="↓3%" tc="text-emerald-600" onClick={() => navigate("/my-work")} />
          <Kpi label="Compliance" value="99%" trend="↑0.2%" tc="text-emerald-600" />
          <Kpi label="Business Value" value="$2.8M" trend="↑12%" tc="text-emerald-600" onClick={() => navigate("/business-impact")} />
          <Kpi label="Current Business Stock" value={CURRENT_STOCK.value} trend={CURRENT_STOCK.trend} tc="text-amber-500" />
          <Kpi label="Today's Business Expenses" value="$3,482" trend="↑6%" tc="text-amber-500" />
          <Kpi label="Monthly Business Expenses" value="$84,233" trend="↑4%" tc="text-amber-500" />
          <Kpi label="Today's Revenue" value={REVENUE_SNAPSHOT.today} trend={REVENUE_SNAPSHOT.todayTrend} tc="text-emerald-600" />
          <Kpi label="Monthly Revenue" value={REVENUE_SNAPSHOT.monthly} trend={REVENUE_SNAPSHOT.monthlyTrend} tc="text-emerald-600" />
          <Kpi label="Quarterly Revenue" value={REVENUE_SNAPSHOT.quarterly} trend={REVENUE_SNAPSHOT.quarterlyTrend} tc="text-emerald-600" />
        </div>

        {/* ── Enterprise Cost Over Time + Business Value Generated ── */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Enterprise Cost Over Time" onExpand={() => navigate("/business-impact")}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={COST_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} />
                <Legend {...LEGEND_STYLE} />
                <Line type="monotone" dataKey="OpenAI" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Azure" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="AWS" stroke="#f97316" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Anthropic" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="GCP" stroke="#facc15" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Business Value Generated" onExpand={() => navigate("/business-impact")}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={BUSINESS_VALUE_DATA} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="bvGradCxo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#86efac" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#86efac" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toLocaleString()}`, "Business Value"]} />
                <Legend {...LEGEND_STYLE} formatter={() => "Business Value (USD)"} />
                <Area type="monotone" dataKey="Revenue" stroke="#22c55e" strokeWidth={2} fill="url(#bvGradCxo)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Executive Insights + Top Performing Departments ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-border shrink-0">
              <span className="text-xs font-bold text-foreground">Executive Insights</span>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[240px]">
              {EXEC_INSIGHTS.map((ins, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-sm hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate("/intelligence")}>
                  <span className={cn("text-sm font-bold shrink-0 mt-0.5", ins.color)}>{ins.icon}</span>
                  <span className="text-[10px] text-foreground leading-snug">{ins.text}</span>
                </div>
              ))}
            </div>
          </div>

          <ChartCard title="Top Performing Departments" onExpand={() => navigate("/business-units")}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={DEPT_PERF} margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
                <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 3, 3, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Alert Center ── */}
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
          <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
            {ALERTS.map((alert, i) => (
              <div key={i} className="px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors flex items-start gap-2" onClick={() => navigate("/governance")}>
                <span className={cn(
                  "text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5",
                  alert.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                  alert.severity === "HIGH" ? "bg-orange-100 text-orange-700" :
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
      </div>
    </div>
  );
}
