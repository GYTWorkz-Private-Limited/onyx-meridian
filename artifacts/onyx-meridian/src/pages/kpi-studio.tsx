import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { KpiCard } from "@/components/shared/KpiCard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { KPI_CATALOG, ENTERPRISE_HEALTH_CARDS, BU_LIST, type KpiEntry } from "@/data/enterprise-data";
import { GOAL_TREE } from "@/data/goals-data";
import { GraphView } from "@/components/kpi-studio/graph-view";
import { ForecastCenter } from "@/components/kpi-studio/forecast-center";
import { AlertsTimeline } from "@/components/kpi-studio/alerts-timeline";
import { Operations } from "@/components/kpi-studio/operations";
import { KpiBuilder } from "@/components/kpi-studio/kpi-builder";
import { AskAi } from "@/components/kpi-studio/ask-ai";
import {
  Sparkles, Plus, Upload, FileBarChart, Download, Share2, Settings,
  Search, X, ChevronRight, Target, TrendingUp, TrendingDown, LayoutGrid,
  Table2, Link2, GitBranch, AlertTriangle, Info, ArrowUpDown, Gauge, Wrench,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────

function statusFor(healthScore: number): "on-track" | "watch" | "critical" {
  if (healthScore >= 85) return "on-track";
  if (healthScore >= 70) return "watch";
  return "critical";
}

function healthColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
}
function healthBar(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}

function kpiById(id: string) {
  return KPI_CATALOG.find((k) => k.id === id);
}
function buName(id: string) {
  return BU_LIST.find((b) => b.id === id)?.name ?? id;
}

const CATEGORY_COLORS: Record<string, string> = {
  Manufacturing: "bg-blue-50 text-blue-700 border-blue-200",
  "Supply Chain": "bg-amber-50 text-amber-700 border-amber-200",
  Procurement: "bg-orange-50 text-orange-700 border-orange-200",
  Finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Revenue: "bg-violet-50 text-violet-700 border-violet-200",
  Sustainability: "bg-teal-50 text-teal-700 border-teal-200",
  Safety: "bg-rose-50 text-rose-700 border-rose-200",
  Enterprise: "bg-primary/10 text-primary border-primary/20",
};
const categoryCls = (c: string) => CATEGORY_COLORS[c] ?? "bg-muted text-muted-foreground border-border";

// ─── Hero action row ────────────────────────────────────────────

function HeroActions() {
  const { toast } = useToast();
  const actions = [
    { icon: Plus, label: "Create KPI", primary: true, msg: "KPI creation wizard would open here." },
    { icon: Upload, label: "Import Library", msg: "Bring in a standard KPI library (e.g. APQC, SCOR)." },
    { icon: Sparkles, label: "Generate with AI", msg: "AI would draft a KPI from a plain-language description." },
    { icon: FileBarChart, label: "Executive Report", msg: "Compiling a board-ready performance report." },
    { icon: Download, label: "Export", msg: "Exporting the current KPI view as CSV." },
    { icon: Share2, label: "Share", msg: "Share link copied." },
    { icon: Settings, label: "Settings", msg: "KPI Studio settings would open here." },
  ];
  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-white flex-wrap">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => toast({ title: a.label, description: a.msg })}
          className={cn(
            "flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-sm border transition-colors",
            a.primary
              ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
              : "bg-white text-foreground border-border hover:bg-muted/40"
          )}
        >
          <a.icon size={11} />
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── Enterprise Health Overview ─────────────────────────────────

function HealthOverviewRow() {
  return (
    <div className="px-6 py-4 border-b border-border bg-[#FBFBFC]">
      <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2.5">
        Enterprise Health Overview
      </div>
      <div className="grid grid-cols-5 gap-3">
        {ENTERPRISE_HEALTH_CARDS.map((h) => (
          <div key={h.id} className="relative group" title={h.summary}>
            <KpiCard
              label={h.label}
              value={h.score}
              target={h.target}
              status={statusFor(h.score)}
              trendValue={h.trend[h.trend.length - 1] - h.trend[0]}
              history={h.trend.map((v) => ({ value: v }))}
            />
            <div className="absolute top-2 right-2 text-[8px] font-mono text-muted-foreground/60">{h.confidence}% conf</div>
            <div className="absolute inset-x-0 bottom-0 translate-y-full pt-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
              <div className="bg-foreground text-white text-[9px] leading-snug rounded-sm shadow-lg px-2.5 py-2 mx-1">
                {h.summary}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live KPI Wall ───────────────────────────────────────────────

function KpiWallCard({ k, onOpen }: { k: KpiEntry; onOpen: () => void }) {
  const st = statusFor(k.healthScore);
  return (
    <button
      onClick={onOpen}
      className="text-left bg-white border border-border rounded-sm p-3.5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {k.abbreviation && (
              <span className="text-[10px] font-bold font-mono text-primary">{k.abbreviation}</span>
            )}
            <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border shrink-0", categoryCls(k.category))}>
              {k.category}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={k.fullName}>{k.fullName}</div>
        </div>
        <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1", healthBar(k.healthScore), st === "critical" && "animate-pulse")} />
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{k.value}</span>
        <span className={cn("flex items-center gap-0.5 text-[10px] font-mono font-semibold", k.trend === "up" ? "text-emerald-600" : "text-red-600")}>
          {k.trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {k.delta}
        </span>
      </div>

      <div className="text-[9px] text-muted-foreground font-mono mb-2">TGT {k.target} · {k.variance}</div>

      <div className="w-full h-1 bg-border rounded-full overflow-hidden mb-2">
        <div className={cn("h-full rounded-full", healthBar(k.healthScore))} style={{ width: `${k.healthScore}%` }} />
      </div>

      <div className="text-[9px] text-muted-foreground leading-snug line-clamp-2 mb-2 flex-1">{k.aiSummary}</div>

      <div className="flex items-center justify-between text-[8px] text-muted-foreground uppercase tracking-widest pt-2 border-t border-border/60">
        <span className="truncate">{k.owner}</span>
        <span className="font-mono shrink-0">{k.forecastNext}</span>
      </div>
    </button>
  );
}

// ─── KPI Explorer table ──────────────────────────────────────────

type SortKey = "name" | "category" | "healthScore" | "owner" | "buIds";

function KpiExplorerTable({ kpis, onOpen }: { kpis: KpiEntry[]; onOpen: (id: string) => void }) {
  const [sortKey, setSortKey] = useState<SortKey>("healthScore");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    const arr = [...kpis];
    arr.sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (sortKey === "buIds") { av = a.buIds[0] ?? ""; bv = b.buIds[0] ?? ""; }
      else { av = (a as any)[sortKey]; bv = (b as any)[sortKey]; }
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
    return arr;
  }, [kpis, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };

  const Head = ({ label, sortBy }: { label: string; sortBy: SortKey }) => (
    <th className="text-left font-medium py-2 px-3 cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort(sortBy)}>
      <span className="flex items-center gap-1">{label}{sortKey === sortBy && <ArrowUpDown size={9} />}</span>
    </th>
  );

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-[#FCFCFD] border-b border-border text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
          <tr>
            <Head label="KPI" sortBy="name" />
            <Head label="Category" sortBy="category" />
            <th className="text-left font-medium py-2 px-3">Value</th>
            <th className="text-left font-medium py-2 px-3">Target</th>
            <th className="text-left font-medium py-2 px-3">Variance</th>
            <th className="text-left font-medium py-2 px-3">Forecast</th>
            <Head label="Owner" sortBy="owner" />
            <Head label="Business Unit" sortBy="buIds" />
            <Head label="Health" sortBy="healthScore" />
            <th className="py-2 px-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {sorted.map((k) => (
            <tr key={k.id} className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => onOpen(k.id)}>
              <td className="py-2.5 px-3">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  {k.abbreviation && <span className="font-mono text-primary text-[10px]">{k.abbreviation}</span>}
                  {k.fullName}
                </div>
              </td>
              <td className="py-2.5 px-3">
                <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", categoryCls(k.category))}>{k.category}</span>
              </td>
              <td className="py-2.5 px-3 font-mono text-foreground">{k.value}</td>
              <td className="py-2.5 px-3 font-mono text-muted-foreground">{k.target}</td>
              <td className="py-2.5 px-3 font-mono text-muted-foreground">{k.variance}</td>
              <td className="py-2.5 px-3 font-mono text-muted-foreground">{k.forecastNext}</td>
              <td className="py-2.5 px-3 text-muted-foreground">{k.owner}</td>
              <td className="py-2.5 px-3 text-muted-foreground">{k.buIds.map(buName).join(", ")}</td>
              <td className="py-2.5 px-3">
                <span className={cn("font-mono font-bold", healthColor(k.healthScore))}>{k.healthScore}</span>
              </td>
              <td className="py-2.5 px-3 text-right"><ChevronRight size={12} className="text-muted-foreground" /></td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">No KPIs match the current filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── KPI Details drawer ──────────────────────────────────────────

function KpiDetailDrawer({ kpi, onClose }: { kpi: KpiEntry; onClose: () => void }) {
  const goals = GOAL_TREE.filter((g) => kpi.goalIds.includes(g.id));
  const dependsOn = kpi.dependsOn.map(kpiById).filter(Boolean) as KpiEntry[];
  const feeds = kpi.feeds.map(kpiById).filter(Boolean) as KpiEntry[];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-[440px] max-w-full h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 z-10">
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", categoryCls(kpi.category))}>{kpi.category}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="flex items-baseline gap-2">
            {kpi.abbreviation && <span className="text-lg font-bold font-mono text-primary">{kpi.abbreviation}</span>}
            <h2 className="text-sm font-bold text-foreground">{kpi.fullName}</h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Value row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-muted/30 rounded-sm px-2 py-2 border border-border/40">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Current</div>
              <div className="text-sm font-bold font-mono text-foreground">{kpi.value}</div>
            </div>
            <div className="bg-muted/30 rounded-sm px-2 py-2 border border-border/40">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Target</div>
              <div className="text-sm font-bold font-mono text-foreground">{kpi.target}</div>
            </div>
            <div className="bg-muted/30 rounded-sm px-2 py-2 border border-border/40">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Health</div>
              <div className={cn("text-sm font-bold font-mono", healthColor(kpi.healthScore))}>{kpi.healthScore}</div>
            </div>
            <div className="bg-muted/30 rounded-sm px-2 py-2 border border-border/40">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Forecast</div>
              <div className="text-[10px] font-bold font-mono text-foreground leading-tight">{kpi.forecastNext}</div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">{kpi.variance}</div>

          {/* AI Executive Summary */}
          <div className="border border-primary/20 bg-primary/5 rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={11} className="text-primary" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-primary">AI Executive Summary</span>
            </div>
            <p className="text-[11px] text-foreground leading-relaxed">{kpi.aiSummary}</p>
          </div>

          {/* Root cause */}
          {kpi.rootCauses.length > 0 && (
            <div className="border border-border rounded-sm p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={11} className="text-amber-600" />
                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Root Cause Analysis</span>
              </div>
              <div className="space-y-2">
                {kpi.rootCauses.map((rc, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-foreground">{rc.cause}</span>
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0 ml-2">{rc.confidence}%</span>
                    </div>
                    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${rc.confidence}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goal Alignment */}
          <div className="border border-border rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Target size={11} className="text-muted-foreground" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Aligned Strategic Goals</span>
            </div>
            {goals.length === 0 ? (
              <div className="text-[10px] text-muted-foreground">Not yet mapped to a strategic goal.</div>
            ) : (
              <div className="space-y-1.5">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-start gap-2 bg-muted/30 rounded-sm px-2 py-1.5">
                    <span className="text-emerald-600 text-[10px] mt-0.5">✓</span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-foreground leading-snug">{g.title}</div>
                      <div className="text-[9px] text-muted-foreground">{g.status} · due {g.targetDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dependencies / Related KPIs */}
          {(dependsOn.length > 0 || feeds.length > 0) && (
            <div className="border border-border rounded-sm p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <GitBranch size={11} className="text-muted-foreground" />
                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Dependencies</span>
              </div>
              {dependsOn.length > 0 && (
                <div className="mb-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Depends on</div>
                  <div className="flex flex-wrap gap-1">
                    {dependsOn.map((d) => (
                      <span key={d.id} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted border border-border text-foreground font-mono">{d.abbreviation ?? d.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {feeds.length > 0 && (
                <div>
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Feeds into</div>
                  <div className="flex flex-wrap gap-1">
                    {feeds.map((f) => (
                      <span key={f.id} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted border border-border text-foreground font-mono">{f.abbreviation ?? f.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="border border-border rounded-sm p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Info size={11} className="text-muted-foreground" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Definition & Metadata</span>
            </div>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Formula</span><span className="text-foreground text-right">{kpi.formula}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Data Source</span><span className="text-foreground text-right">{kpi.dataSource}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Update Frequency</span><span className="text-foreground text-right">{kpi.updateFrequency}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Owner</span><span className="text-foreground text-right">{kpi.owner}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Business Unit</span><span className="text-foreground text-right">{kpi.buIds.map(buName).join(", ")}</span></div>
              {kpi.linked.length > 0 && (
                <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Linked AI Agents</span><span className="text-foreground text-right">{kpi.linked.length}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

type StudioTab = "overview" | "graph" | "forecast" | "alerts" | "operations" | "builder" | "ask-ai";
const TABS: { id: StudioTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "graph", label: "Graph", icon: GitBranch },
  { id: "forecast", label: "Forecast Center", icon: TrendingUp },
  { id: "alerts", label: "Alerts & Events", icon: AlertTriangle },
  { id: "operations", label: "Operations", icon: Gauge },
  { id: "builder", label: "KPI Builder", icon: Wrench },
  { id: "ask-ai", label: "Ask AI", icon: Sparkles },
];

export default function KpiStudio() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [tab, setTab] = useState<StudioTab>("overview");
  const [view, setView] = useState<"wall" | "explorer">("wall");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [buFilter, setBuFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const kpi = params.get("kpi");
    if (kpi && kpiById(kpi)) setSelectedId(kpi);
  }, [search]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(KPI_CATALOG.map((k) => k.category)))], []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return KPI_CATALOG.filter((k) =>
      (category === "all" || k.category === category) &&
      (buFilter === "all" || k.buIds.includes(buFilter)) &&
      (qq === "" || k.fullName.toLowerCase().includes(qq) || k.name.toLowerCase().includes(qq) || (k.abbreviation ?? "").toLowerCase().includes(qq))
    );
  }, [q, category, buFilter]);

  const selected = selectedId ? kpiById(selectedId) : null;
  const avgHealth = Math.round(KPI_CATALOG.reduce((s, k) => s + k.healthScore, 0) / KPI_CATALOG.length);
  const critical = KPI_CATALOG.filter((k) => k.healthScore < 70).length;

  const openKpi = (id: string) => {
    setSelectedId(id);
    navigate(`/kpi-studio?kpi=${id}`, { replace: true });
  };
  const closeKpi = () => {
    setSelectedId(null);
    navigate("/kpi-studio", { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="KPI STUDIO"
        metrics={[
          { label: "TRACKED KPIS", value: KPI_CATALOG.length },
          { label: "AVG HEALTH", value: avgHealth },
          { label: "CRITICAL", value: critical },
        ]}
      />

      <HeroActions />

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 border-b border-border bg-white shrink-0 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] uppercase tracking-widest font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap",
                isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon size={12} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="flex-1 overflow-y-auto">
          <HealthOverviewRow />

          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-border bg-white flex flex-wrap items-center gap-2 sticky top-0 z-10">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Search KPIs…"
                className="pl-7 pr-3 py-1.5 text-[11px] border border-border rounded-sm bg-white w-56 focus:outline-none focus:border-primary"
              />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white text-muted-foreground">
              {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
            <select value={buFilter} onChange={(e) => setBuFilter(e.target.value)} className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white text-muted-foreground">
              <option value="all">All Business Units</option>
              {BU_LIST.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>

            <div className="flex-1" />

            <div className="flex items-center gap-1 border border-border rounded-sm p-0.5 bg-white">
              <button onClick={() => setView("wall")} className={cn("flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm transition-colors", view === "wall" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
                <LayoutGrid size={11} /> Wall
              </button>
              <button onClick={() => setView("explorer")} className={cn("flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm transition-colors", view === "explorer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
                <Table2 size={11} /> Explorer
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                {view === "wall" ? "Live KPI Wall" : "KPI Explorer"}
              </div>
              <div className="text-[10px] text-muted-foreground">{filtered.length} of {KPI_CATALOG.length} KPIs</div>
            </div>

            {view === "wall" ? (
              <div className="grid grid-cols-4 gap-3">
                {filtered.map((k) => <KpiWallCard key={k.id} k={k} onOpen={() => openKpi(k.id)} />)}
                {filtered.length === 0 && (
                  <div className="col-span-4 text-center text-muted-foreground text-sm py-12">No KPIs match the current filters.</div>
                )}
              </div>
            ) : (
              <KpiExplorerTable kpis={filtered} onOpen={openKpi} />
            )}
          </div>
        </div>
      )}

      {tab === "graph" && <div className="flex-1 min-h-0"><GraphView onOpenKpi={openKpi} /></div>}
      {tab === "forecast" && <div className="flex-1 min-h-0"><ForecastCenter onOpenKpi={openKpi} /></div>}
      {tab === "alerts" && <div className="flex-1 min-h-0"><AlertsTimeline onOpenKpi={openKpi} /></div>}
      {tab === "operations" && <div className="flex-1 min-h-0"><Operations /></div>}
      {tab === "builder" && <div className="flex-1 min-h-0"><KpiBuilder /></div>}
      {tab === "ask-ai" && <div className="flex-1 min-h-0"><AskAi /></div>}

      {selected && <KpiDetailDrawer kpi={selected} onClose={closeKpi} />}
    </div>
  );
}
