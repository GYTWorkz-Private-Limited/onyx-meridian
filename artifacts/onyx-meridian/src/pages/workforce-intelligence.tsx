import { useEffect, useMemo, useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BU_LIST } from "@/data/enterprise-data";
import {
  EMPLOYEES, computeKpis, departmentHeadcount, regionDistribution, HIRING_FUNNEL,
  GROWTH_HISTORY, PRODUCTIVITY_TIMELINE, attritionRiskBuckets, skillsMatrix, orgHierarchy,
  notificationsFor, AI_INSIGHTS, ACTIVITY_TEMPLATES, type Employee,
} from "@/data/workforce-intelligence-data";
import { OrgHierarchyTree } from "@/components/workforce-intel/OrgHierarchyTree";
import { CollaborationNetwork } from "@/components/workforce-intel/CollaborationNetwork";
import { EmployeeTable } from "@/components/workforce-intel/EmployeeTable";
import { EmployeeDrawer } from "@/components/workforce-intel/EmployeeDrawer";
import { LiveActivityFeed, NotificationsPanel, AIInsightsPanel, type ActivityItem } from "@/components/workforce-intel/SidePanels";
import { AdvancedVisualizations } from "@/components/workforce-intel/AdvancedViz";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter,
  FunnelChart, Funnel, LabelList, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Brush,
} from "recharts";
import {
  Search, Download, Share2, FileBarChart, Sparkles, RefreshCw, MapPin, Building2,
} from "lucide-react";

const TIME_RANGES = ["Live", "Today", "7D", "30D", "Quarter", "Year"] as const;
type TimeRange = (typeof TIME_RANGES)[number];

const RISK_COLORS: Record<string, string> = { low: "#10b981", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };

function windowFor(range: TimeRange) {
  switch (range) {
    case "Live": case "Today": return GROWTH_HISTORY.slice(-2);
    case "7D": return GROWTH_HISTORY.slice(-2);
    case "30D": return GROWTH_HISTORY.slice(-3);
    case "Quarter": return GROWTH_HISTORY.slice(-3);
    default: return GROWTH_HISTORY;
  }
}

interface Filters {
  department: string; buId: string; region: string; employmentType: string;
  manager: string; office: string; skillGroup: string; status: string; risk: string;
}
const EMPTY_FILTERS: Filters = { department: "all", buId: "all", region: "all", employmentType: "all", manager: "all", office: "all", skillGroup: "all", status: "all", risk: "all" };

export default function WorkforceIntelligence() {
  const { role, currentBuId } = useAppContext();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("30D");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [insightsSeed, setInsightsSeed] = useState(0);
  const [liveOnlineDelta, setLiveOnlineDelta] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([
    { id: "a0", text: "Dashboard initialized", time: "just now" },
  ]);

  const baseEmployees = useMemo(
    () => (role === "abu_head" ? EMPLOYEES.filter((e) => e.buId === currentBuId) : EMPLOYEES),
    [role, currentBuId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseEmployees.filter((e) =>
      (filters.department === "all" || e.department === filters.department) &&
      (filters.buId === "all" || e.buId === filters.buId) &&
      (filters.region === "all" || e.region === filters.region) &&
      (filters.employmentType === "all" || e.employmentType === filters.employmentType) &&
      (filters.manager === "all" || e.managerName === filters.manager) &&
      (filters.office === "all" || e.office === filters.office) &&
      (filters.skillGroup === "all" || e.skills.includes(filters.skillGroup)) &&
      (filters.status === "all" || e.status === filters.status) &&
      (filters.risk === "all" || e.risk === filters.risk) &&
      (q === "" || e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.title.toLowerCase().includes(q))
    );
  }, [baseEmployees, filters, search]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

  const kpis = useMemo(() => {
    const base = computeKpis(filtered);
    return base.map((k) => (k.key === "online" ? { ...k, value: (parseInt(k.value.replace(/,/g, "")) + liveOnlineDelta).toLocaleString() } : k));
  }, [filtered, liveOnlineDelta]);

  const deptData = useMemo(() => departmentHeadcount(filtered), [filtered]);
  const regionData = useMemo(() => regionDistribution(filtered), [filtered]);
  const riskData = useMemo(() => attritionRiskBuckets(filtered), [filtered]);
  const skills = useMemo(() => skillsMatrix(), []);
  const org = useMemo(() => orgHierarchy(filtered), [filtered]);
  const notifications = useMemo(() => notificationsFor(filtered), [filtered]);
  const growthWindow = useMemo(() => windowFor(timeRange), [timeRange]);

  const departments = useMemo(() => Array.from(new Set(baseEmployees.map((e) => e.department))).sort(), [baseEmployees]);
  const regions = useMemo(() => Array.from(new Set(baseEmployees.map((e) => e.region))), [baseEmployees]);
  const managers = useMemo(() => Array.from(new Set(baseEmployees.map((e) => e.managerName))).sort(), [baseEmployees]);
  const offices = useMemo(() => Array.from(new Set(baseEmployees.map((e) => e.office))).sort(), [baseEmployees]);
  const skillGroups = useMemo(() => Array.from(new Set(baseEmployees.flatMap((e) => e.skills))).sort(), [baseEmployees]);

  // Live data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveOnlineDelta((d) => Math.max(-15, Math.min(15, d + (Math.random() > 0.5 ? 1 : -1))));
      const pool = filtered.length ? filtered : baseEmployees;
      const emp = pool[Math.floor(Math.random() * pool.length)];
      const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
      setActivity((prev) => [{ id: `a-${Date.now()}`, text: emp ? template(emp) : "System heartbeat", time: "just now" }, ...prev].slice(0, 30));
    }, 3500);
    return () => clearInterval(interval);
  }, [filtered, baseEmployees]);

  const setFilter = (key: keyof Filters, value: string) => setFilters((f) => ({ ...f, [key]: f[key] === value ? "all" : value }));
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setSearch(""); };

  const exportSummaryCsv = () => {
    const rows = kpis.map((k) => [k.label, k.value]);
    const csv = ["Metric,Value", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "workforce-kpi-summary.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#F5F6FB] to-[#F8F9FA] overflow-auto">
      <HeaderBar
        moduleName="WORKFORCE INTELLIGENCE"
        metrics={[
          { label: "TOTAL", value: filtered.length.toLocaleString() },
          { label: "ONLINE", value: kpis.find((k) => k.key === "online")?.value ?? "—" },
        ]}
      />

      {/* Toolbar: search, time range, filters, actions */}
      <div className="px-6 py-3 border-b border-border bg-white/70 backdrop-blur-sm flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="border border-border rounded-sm pl-7 pr-2 py-1.5 text-xs bg-white w-52" placeholder="Global search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex items-center gap-1 border border-border rounded-sm p-0.5 bg-white">
          {TIME_RANGES.map((r) => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={cn("text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm transition-colors", timeRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
              {r}
            </button>
          ))}
        </div>

        {([
          ["department", "Department", departments],
          ["buId", "Business Unit", BU_LIST.map((b: any) => b.id)],
          ["region", "Region", regions],
          ["employmentType", "Employment Type", ["Full-time", "Contract", "Intern"]],
          ["manager", "Manager", managers],
          ["office", "Office", offices],
          ["skillGroup", "Skill Group", skillGroups],
          ["status", "Status", ["active", "leave", "inactive"]],
        ] as [keyof Filters, string, string[]][]).map(([key, label, options]) => (
          <select key={key} className="text-[10px] border border-border rounded-sm px-1.5 py-1.5 bg-white text-muted-foreground max-w-[110px]"
            value={filters[key]} onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}>
            <option value="all">{label}</option>
            {options.map((o) => <option key={o} value={o}>{key === "buId" ? BU_LIST.find((b: any) => b.id === o)?.name : o}</option>)}
          </select>
        ))}

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-[9px] uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-2 py-1.5 bg-white">
            Clear ({activeFilterCount})
          </button>
        )}

        <div className="flex-1" />

        <button onClick={exportSummaryCsv} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-foreground border border-border px-2 py-1.5 rounded-sm bg-white hover:bg-muted/40">
          <Download size={11} /> Export
        </button>
        <button onClick={() => toast({ title: "Share link copied" })} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-foreground border border-border px-2 py-1.5 rounded-sm bg-white hover:bg-muted/40">
          <Share2 size={11} /> Share
        </button>
        <button onClick={() => toast({ title: "Report queued", description: "Your custom report is being generated." })} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-foreground border border-border px-2 py-1.5 rounded-sm bg-white hover:bg-muted/40">
          <FileBarChart size={11} /> Create Report
        </button>
        <button onClick={() => setInsightsSeed((s) => s + 1)} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-primary-foreground bg-primary px-2 py-1.5 rounded-sm hover:bg-primary/90">
          <Sparkles size={11} /> AI Insights
        </button>
        <button onClick={() => { setLiveOnlineDelta(0); toast({ title: "Refreshed" }); }} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-foreground border border-border px-2 py-1.5 rounded-sm bg-white hover:bg-muted/40">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      <div className="p-6 max-w-[1900px] mx-auto w-full space-y-5">
        {/* 12 KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.key} className="bg-white/90 backdrop-blur border border-border rounded-sm shadow-sm p-3.5 hover:shadow-md transition-shadow">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{k.label}</div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-bold font-mono text-foreground">{k.value}</span>
                <span className={cn("text-[10px] font-mono font-semibold", k.delta >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {k.delta >= 0 ? "+" : ""}{k.delta}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid: left / center / right + side panel */}
        <div className="grid grid-cols-4 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2"><MapPin size={13} className="text-primary" /><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workforce Distribution</span></div>
              <div className="space-y-1.5">
                {regionData.map((r) => (
                  <button key={r.region} onClick={() => setFilter("region", r.region)}
                    className={cn("w-full text-left px-2 py-1.5 rounded-sm border transition-colors", filters.region === r.region ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40")}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-foreground">{r.region}</span>
                      <span className="text-[10px] font-mono font-bold text-primary">{r.count}</span>
                    </div>
                    <div className="flex gap-1">
                      {r.offices.map((o) => (
                        <div key={o.office} title={`${o.office}: ${o.count}`} className="h-2 flex-1 rounded-sm bg-primary/20" style={{ opacity: 0.3 + Math.min(0.7, o.count / 40) }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2"><Building2 size={13} className="text-primary" /><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department Headcount</span></div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} cursor="pointer" onClick={(d: any) => setFilter("department", d.name)}>
                    {deptData.map((d) => <Cell key={d.name} fill={filters.department === d.name ? "hsl(228 71% 44%)" : "hsl(228 71% 54%)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <OrgHierarchyTree root={org} onSelectBu={(buId) => buId && setFilter("buId", buId)} scopedBuId={role === "abu_head" ? currentBuId : null} />
          </div>

          {/* Center column */}
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Workforce Growth</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growthWindow} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
                  <Line type="monotone" dataKey="headcount" stroke="hsl(228 71% 54%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hires" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="attrition" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                  <Brush dataKey="month" height={16} stroke="hsl(228 71% 54%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Hiring Funnel</div>
              <ResponsiveContainer width="100%" height={200}>
                <FunnelChart>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
                  <Funnel dataKey="value" data={HIRING_FUNNEL} isAnimationActive nameKey="stage">
                    {HIRING_FUNNEL.map((_, i) => <Cell key={i} fill={`hsl(228 71% ${70 - i * 8}%)`} />)}
                    <LabelList position="right" dataKey="stage" fill="#374151" fontSize={10} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Productivity Timeline</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={PRODUCTIVITY_TIMELINE.slice(-14)} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
                  <Area type="monotone" dataKey="productivity" stroke="hsl(228 71% 54%)" fill="hsl(228 71% 54%)" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="tasksCompleted" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Attrition Risk</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={riskData} dataKey="count" nameKey="tier" innerRadius={40} outerRadius={70} cursor="pointer"
                    onClick={(d: any) => setFilter("risk", d.tier)}>
                    {riskData.map((r) => <Cell key={r.tier} fill={RISK_COLORS[r.tier]} opacity={filters.risk === "all" || filters.risk === r.tier ? 1 : 0.35} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 -mt-2">
                {riskData.map((r) => (
                  <div key={r.tier} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[r.tier] }} /> {r.tier} ({r.count})
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Skills Matrix</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" dataKey="demand" name="Demand" tick={{ fontSize: 9 }} />
                  <YAxis type="number" dataKey="availability" name="Availability" tick={{ fontSize: 9 }} />
                  <ZAxis type="number" dataKey="gap" range={[40, 300]} name="Gap" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 2 }}
                    formatter={(v: any, n: any, p: any) => [v, n]} labelFormatter={() => ""}
                  />
                  <Scatter data={skills.slice(0, 12)} fill="hsl(228 71% 54%)" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-border rounded-sm shadow-sm p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Workforce Availability (30d)</div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const states = ["available", "busy", "leave", "training", "meeting"];
                  const s = states[(i * 7 + filtered.length) % states.length];
                  const colors: Record<string, string> = { available: "bg-emerald-400", busy: "bg-primary", leave: "bg-amber-400", training: "bg-violet-400", meeting: "bg-gray-300" };
                  return <div key={i} title={s} className={cn("h-4 rounded-sm", colors[s])} />;
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {["available", "busy", "leave", "training", "meeting"].map((s) => (
                  <span key={s} className="text-[9px] text-muted-foreground capitalize">{s}</span>
                ))}
              </div>
            </div>

            <CollaborationNetwork />
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <LiveActivityFeed items={activity} />
            <NotificationsPanel items={notifications} />
            <AIInsightsPanel insights={[...AI_INSIGHTS].sort(() => (insightsSeed % 2 === 0 ? 1 : -1)).slice(0, 5)} />
          </div>
        </div>

        {/* Employee table */}
        <EmployeeTable employees={filtered} onSelect={setSelectedEmployee} />

        {/* Advanced visualizations */}
        <AdvancedVisualizations employees={filtered} />
      </div>

      <EmployeeDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
