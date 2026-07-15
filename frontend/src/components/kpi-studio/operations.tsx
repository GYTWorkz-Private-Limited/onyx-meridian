import { useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { KPI_CATALOG, MFG_AGENTS, type KpiEntry } from "@/data/enterprise-data";
import { CONNECTOR_CATALOG } from "@/data/connectors-data";
import { RECOMMENDATIONS, type Recommendation } from "@/pages/intelligence";
import { PRESET_SCENARIOS } from "@/pages/simulation";
import {
  Sparkles, ArrowRight, FlaskConical, Bot, Plug, CheckCircle2,
  AlertCircle, XCircle, ChevronRight,
} from "lucide-react";

function kpiTagsFor(rec: Recommendation): KpiEntry[] {
  const matches = new Set<string>();
  rec.kpis.forEach((rk) => {
    const nameLower = rk.name.toLowerCase();
    KPI_CATALOG.forEach((k) => {
      if (nameLower.includes(k.name.toLowerCase()) || (k.abbreviation && nameLower.includes(k.abbreviation.toLowerCase()))) {
        matches.add(k.id);
      }
    });
  });
  return Array.from(matches).map((id) => KPI_CATALOG.find((k) => k.id === id)!).filter(Boolean);
}

const PRIORITY_CLS: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-gray-50 text-gray-600 border-gray-200",
};

const CONN_STATUS_ICON: Record<string, { icon: React.ElementType; cls: string }> = {
  connected: { icon: CheckCircle2, cls: "text-emerald-600" },
  warning: { icon: AlertCircle, cls: "text-amber-600" },
  disconnected: { icon: XCircle, cls: "text-muted-foreground" },
};

export function Operations() {
  const [, navigate] = useLocation();

  const recTags = useMemo(() => {
    const map = new Map<string, KpiEntry[]>();
    RECOMMENDATIONS.forEach((r) => map.set(r.id, kpiTagsFor(r)));
    return map;
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      {/* AI Recommendations tied to KPIs */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">AI Recommendations — KPI Linked</span>
          </div>
          <button onClick={() => navigate("/intelligence")} className="text-[9px] uppercase tracking-widest font-bold text-primary flex items-center gap-1 hover:underline">
            Open Recommendations <ArrowRight size={10} />
          </button>
        </div>
        <div className="space-y-3">
          {RECOMMENDATIONS.map((r) => {
            const tags = recTags.get(r.id) ?? [];
            return (
              <button key={r.id} onClick={() => navigate(`/intelligence/recommendation/${r.id}`)}
                className="w-full text-left bg-white border border-border rounded-sm p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", PRIORITY_CLS[r.priority])}>{r.priority}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{r.confidence}% confidence</span>
                  <span className="text-[9px] text-muted-foreground">·</span>
                  <span className="text-[9px] text-muted-foreground">{r.expectedROI}</span>
                </div>
                <div className="text-[11px] font-semibold text-foreground leading-snug mb-1.5">{r.title}</div>
                <div className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">{r.executiveSummary}</div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((k) => (
                      <span key={k.id} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-primary/5 border border-primary/20 text-primary font-mono">{k.abbreviation ?? k.name}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Link-out summary cards: Simulator / Agent Performance / Connector Gallery */}
      <div className="w-[380px] shrink-0 overflow-y-auto p-6 bg-[#FBFBFC] space-y-5">
        {/* Scenario Simulator */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5"><FlaskConical size={12} className="text-muted-foreground" /><span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground">Scenario Simulator</span></div>
            <button onClick={() => navigate("/simulation")} className="text-muted-foreground hover:text-primary"><ChevronRight size={13} /></button>
          </div>
          <div className="space-y-1.5">
            {PRESET_SCENARIOS.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border/60">
                <s.icon size={12} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold text-foreground truncate">{s.name}</div>
                  <div className="text-[8px] text-muted-foreground truncate">{s.impactSummary}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/simulation")} className="w-full mt-2.5 text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/20 rounded-sm py-1.5 hover:bg-primary/5 transition-colors">
            Open Simulator →
          </button>
        </div>

        {/* Agent Performance */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5"><Bot size={12} className="text-muted-foreground" /><span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground">Agent Performance</span></div>
            <button onClick={() => navigate("/workforce")} className="text-muted-foreground hover:text-primary"><ChevronRight size={13} /></button>
          </div>
          <div className="space-y-1.5">
            {[...MFG_AGENTS].sort((a, b) => b.health - a.health).slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center justify-between px-2 py-1.5 rounded-sm border border-border/60">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-foreground truncate">{a.name}</div>
                  <div className="text-[8px] text-muted-foreground truncate">{a.roi} ROI · {a.costSaved} saved</div>
                </div>
                <span className={cn("text-[10px] font-mono font-bold shrink-0", a.health >= 90 ? "text-emerald-600" : a.health >= 75 ? "text-amber-600" : "text-red-600")}>{a.health}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/workforce")} className="w-full mt-2.5 text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/20 rounded-sm py-1.5 hover:bg-primary/5 transition-colors">
            Open AI Workforce →
          </button>
        </div>

        {/* Connector Gallery */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5"><Plug size={12} className="text-muted-foreground" /><span className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground">Connector Gallery</span></div>
            <button onClick={() => navigate("/connectors")} className="text-muted-foreground hover:text-primary"><ChevronRight size={13} /></button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CONNECTOR_CATALOG.slice(0, 8).map((c) => {
              const st = CONN_STATUS_ICON[c.connected ? "connected" : "disconnected"];
              return (
                <div key={c.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm border border-border/60">
                  <st.icon size={11} className={cn("shrink-0", st.cls)} />
                  <div className="min-w-0">
                    <div className="text-[9px] font-semibold text-foreground truncate">{c.name}</div>
                    <div className="text-[8px] text-muted-foreground truncate">{c.category}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate("/connectors")} className="w-full mt-2.5 text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/20 rounded-sm py-1.5 hover:bg-primary/5 transition-colors">
            Open Connectors →
          </button>
        </div>
      </div>
    </div>
  );
}
