import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BU_LIST } from "@/data/enterprise-data";
import {
  abuCostSeries, abuValueSeries, abuRevenueSnapshot, abuStockSnapshot,
  abuTaskCounts, abuDeptPerf, abuExecInsights, abuAlerts, abuCompliance, abuExpenses,
} from "@/data/abu-dashboard-data";

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

// Same layout/widget set as the CXO's Executive Command (dashboard-cxo.tsx)
// — deliberately identical template, per the ask — but every number here is
// scoped to this ABU Head's own business unit, not the enterprise. None of
// the underlying data is shared with the CXO view or with any other ABU.
export default function ExecutiveCommandAbu({ buId }: { buId: string }) {
  const [, navigate] = useLocation();
  const bu = BU_LIST.find((b) => b.id === buId) ?? BU_LIST[0];

  const costData = abuCostSeries(bu.id);
  const valueData = abuValueSeries(bu.id);
  const revenue = abuRevenueSnapshot(bu.id);
  const stock = abuStockSnapshot(bu.id);
  const expenses = abuExpenses(bu.id);
  const { done: tasksDone, pending: tasksPending } = abuTaskCounts(bu.id);
  const deptPerf = abuDeptPerf(bu.id);
  const insights = abuExecInsights(bu.id);
  const alerts = abuAlerts(bu.id);
  const compliance = abuCompliance(bu.id);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName={`${bu.name.toUpperCase()} EXECUTIVE COMMAND`}
        metrics={[
          { label: "ABU HEALTH", value: `${bu.health}%` },
          { label: "COMPLIANCE", value: `${compliance}%` },
          { label: "ALERTS", value: String(alerts.length) },
        ]}
      />

      <div className="p-5 space-y-4 max-w-[1800px] mx-auto w-full">
        {/* ── KPI grid ── */}
        <div className="grid grid-cols-4 gap-2">
          <Kpi label="ABU Health" value={`${bu.health}%`} trend={bu.health >= 85 ? "↑2%" : "↓1%"} tc={bu.health >= 85 ? "text-emerald-600" : "text-amber-600"} />
          <Kpi label="Tasks Done Today" value={String(tasksDone)} trend="↑8%" tc="text-emerald-600" onClick={() => navigate("/my-work")} />
          <Kpi label="Tasks Pending" value={String(tasksPending)} trend="↓3%" tc="text-emerald-600" onClick={() => navigate("/my-work")} />
          <Kpi label="Compliance" value={`${compliance}%`} trend="↑0.2%" tc="text-emerald-600" />
          <Kpi label="Business Value" value={bu.revenueProtected} trend="↑12%" tc="text-emerald-600" onClick={() => navigate(`/business-units/${bu.id}`)} />
          <Kpi label="Current Stock" value={stock.value} trend={stock.trend} tc="text-amber-500" />
          <Kpi label="Today's Expenses" value={expenses.today} trend={expenses.todayTrend} tc="text-amber-500" />
          <Kpi label="Monthly Expenses" value={expenses.monthly} trend={expenses.monthlyTrend} tc="text-amber-500" />
          <Kpi label="Today's Revenue" value={revenue.today} trend={revenue.todayTrend} tc="text-emerald-600" />
          <Kpi label="Monthly Revenue" value={revenue.monthly} trend={revenue.monthlyTrend} tc="text-emerald-600" />
          <Kpi label="Quarterly Revenue" value={revenue.quarterly} trend={revenue.quarterlyTrend} tc="text-emerald-600" />
        </div>

        {/* ── ABU Cost Over Time + Business Value Generated ── */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard title={`${bu.name} Cost Over Time`} onExpand={() => navigate(`/business-units/${bu.id}`)}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={costData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} />
                <Legend {...LEGEND_STYLE} />
                <Line type="monotone" dataKey="Cost" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Business Value Generated" onExpand={() => navigate(`/business-units/${bu.id}`)}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={valueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="bvGradAbu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#86efac" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#86efac" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toLocaleString()}`, "Business Value"]} />
                <Legend {...LEGEND_STYLE} formatter={() => "Business Value (USD)"} />
                <Area type="monotone" dataKey="Value" stroke="#22c55e" strokeWidth={2} fill="url(#bvGradAbu)" dot={false} />
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
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-sm hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => navigate("/intelligence")}>
                  <span className={cn("text-sm font-bold shrink-0 mt-0.5", ins.color)}>{ins.icon}</span>
                  <span className="text-[10px] text-foreground leading-snug">{ins.text}</span>
                </div>
              ))}
              {insights.length === 0 && <div className="text-[10px] text-muted-foreground p-2">No active insights.</div>}
            </div>
          </div>

          <ChartCard title="Top Performing Departments" onExpand={() => navigate(`/business-units/${bu.id}`)}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={deptPerf} margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
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
              {alerts.filter((a) => a.severity === "CRITICAL").length} Critical
            </span>
            <span className="text-[9px] font-bold bg-orange-400 text-white px-1.5 py-0.5 rounded-sm">
              {alerts.filter((a) => a.severity === "HIGH").length} High
            </span>
          </div>
          <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
            {alerts.map((alert, i) => (
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
            {alerts.length === 0 && <div className="text-[10px] text-muted-foreground p-4 text-center">No active alerts.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
