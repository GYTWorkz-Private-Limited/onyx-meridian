import { useState } from "react";
import { cn } from "@/lib/utils";
import { KPI_CATALOG } from "@/data/enterprise-data";
import { forecastHorizons } from "@/data/kpi-studio-data";
import { Search, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

function confColor(c: number) {
  if (c >= 85) return "text-emerald-600";
  if (c >= 65) return "text-amber-600";
  return "text-red-500";
}

export function ForecastCenter({ onOpenKpi }: { onOpenKpi: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState("k1");

  const filtered = KPI_CATALOG.filter((k) =>
    q.trim() === "" || k.fullName.toLowerCase().includes(q.toLowerCase()) || (k.abbreviation ?? "").toLowerCase().includes(q.toLowerCase())
  );
  const selected = KPI_CATALOG.find((k) => k.id === selectedId) ?? KPI_CATALOG[0];
  const points = forecastHorizons(selected);

  return (
    <div className="flex h-full">
      {/* KPI picker rail */}
      <div className="w-[260px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-border">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search KPI…"
              className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-border rounded-sm bg-white focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((k) => (
            <button key={k.id} onClick={() => setSelectedId(k.id)}
              className={cn("w-full text-left px-2.5 py-2 rounded-sm border transition-colors",
                selectedId === k.id ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-muted/50")}>
              <div className="flex items-center gap-1.5">
                {k.abbreviation && <span className="text-[10px] font-mono font-bold text-primary">{k.abbreviation}</span>}
                <span className="text-[10px] font-semibold text-foreground truncate">{k.fullName}</span>
              </div>
              <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{k.value} · {k.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Forecast cards */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              {selected.abbreviation && <span className="text-lg font-bold font-mono text-primary">{selected.abbreviation}</span>}
              <h3 className="text-sm font-bold text-foreground">{selected.fullName}</h3>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Current: {selected.value} · Target: {selected.target}</div>
          </div>
          <button onClick={() => onOpenKpi(selected.id)} className="text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/20 rounded-sm px-2.5 py-1.5 hover:bg-primary/5 transition-colors">
            Open Full Details →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {points.map((p, i) => (
            <div key={p.horizon} className="bg-white border border-border rounded-sm p-4 shadow-sm relative overflow-hidden">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">{p.horizon}</div>
              <div className="text-xl font-bold font-mono text-foreground tabular-nums mb-1">{p.value}</div>
              <div className="flex items-center justify-between">
                <span className={cn("flex items-center gap-0.5 text-[10px] font-mono font-semibold", selected.trend === "up" ? "text-emerald-600" : "text-red-600")}>
                  {selected.trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {selected.trend === "up" ? "improving" : "declining"}
                </span>
                <span className={cn("text-[9px] font-mono font-bold", confColor(p.confidence))}>{p.confidence}% conf</span>
              </div>
              <div className="absolute top-0 right-0 text-[8px] font-mono text-muted-foreground/40 px-1.5 py-0.5">H{i + 1}</div>
            </div>
          ))}
        </div>

        <div className="border border-primary/20 bg-primary/5 rounded-sm p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-primary" />
            <span className="text-[9px] uppercase tracking-widest font-bold text-primary">Forecast Narrative</span>
          </div>
          <p className="text-[11px] text-foreground leading-relaxed">{selected.aiSummary}</p>
        </div>
      </div>
    </div>
  );
}
