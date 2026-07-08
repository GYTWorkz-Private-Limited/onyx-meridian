import { useState } from "react";
import { Link } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { KPI_CATALOG, BU_LIST, MFG_AGENTS } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { ChevronRight, Target, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, Filter, Bot, Briefcase } from "lucide-react";

export default function KpisPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selected, setSelected] = useState<string | null>("k1");

  const categories = ["All", ...Array.from(new Set(KPI_CATALOG.map((k) => k.category)))];
  const filtered = KPI_CATALOG.filter((k) => selectedCategory === "All" || k.category === selectedCategory);
  const selectedKpi = KPI_CATALOG.find((k) => k.id === selected);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar moduleName="KPI FRAMEWORK" />

      <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-border text-[10px] text-muted-foreground shrink-0">
        <span>Enterprise</span>
        <ChevronRight size={10} />
        <span className="text-foreground font-semibold">KPI Framework</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* KPI List */}
        <div className="w-[280px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors",
                    selectedCategory === cat ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((kpi) => {
              const isSelected = selected === kpi.id;
              const isUp = kpi.trend === "up";
              const onTarget = kpi.delta.startsWith("+") ? !kpi.name.toLowerCase().includes("down") && !kpi.name.toLowerCase().includes("scrap") && !kpi.name.toLowerCase().includes("cost") : true;
              return (
                <button
                  key={kpi.id}
                  onClick={() => setSelected(kpi.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 border-b border-border/40 transition-colors",
                    isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-[10px] font-bold", isSelected ? "text-primary" : "text-foreground")}>
                      {kpi.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {isUp ? <ArrowUp size={9} className={onTarget ? "text-emerald-500" : "text-red-500"} /> :
                               <ArrowDown size={9} className={onTarget ? "text-red-500" : "text-emerald-500"} />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-foreground">{kpi.value}</span>
                    <span className="text-[8px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{kpi.category}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Target: {kpi.target}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* KPI Detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedKpi ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={16} className="text-primary" />
                    <div className="text-2xl font-bold text-foreground">{selectedKpi.name}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{selectedKpi.category} KPI</div>
                </div>
                <div className={cn(
                  "text-sm font-bold font-mono px-3 py-1.5 rounded-sm border",
                  selectedKpi.trend === "up" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                )}>
                  {selectedKpi.delta}
                  {selectedKpi.trend === "up" ? <TrendingUp className="inline ml-1" size={12} /> : <TrendingDown className="inline ml-1" size={12} />}
                </div>
              </div>

              {/* Value Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-border rounded-sm px-4 py-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Current Value</div>
                  <div className="text-2xl font-bold font-mono text-foreground">{selectedKpi.value}</div>
                </div>
                <div className="bg-white border border-border rounded-sm px-4 py-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Target</div>
                  <div className="text-2xl font-bold font-mono text-primary">{selectedKpi.target}</div>
                </div>
                <div className="bg-white border border-border rounded-sm px-4 py-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">WoW Change</div>
                  <div className={cn("text-2xl font-bold font-mono", selectedKpi.trend === "up" ? "text-emerald-600" : "text-red-600")}>
                    {selectedKpi.delta}
                  </div>
                </div>
              </div>

              {/* Sparkline placeholder */}
              <div className="bg-white border border-border rounded-sm p-4">
                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3">Trend — Last 12 Weeks</div>
                <div className="h-20 flex items-end gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const base = 70;
                    const h = base + Math.sin(i / 2) * 15 + (selectedKpi.trend === "up" ? i * 1.5 : -i * 0.5);
                    return (
                      <div
                        key={i}
                        className={cn("flex-1 rounded-sm", i === 11 ? "bg-primary" : "bg-muted")}
                        style={{ height: `${Math.max(10, Math.min(100, h))}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] text-muted-foreground">12 weeks ago</span>
                  <span className="text-[8px] text-muted-foreground">Now</span>
                </div>
              </div>

              {/* Linked Business Units */}
              <div className="bg-white border border-border rounded-sm p-4">
                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Briefcase size={10} />Business Units
                </div>
                <div className="space-y-2">
                  {selectedKpi.buIds.map((buId) => {
                    const bu = BU_LIST.find((b) => b.id === buId);
                    if (!bu) return null;
                    return (
                      <Link
                        key={buId}
                        href={`/business-units/${buId}`}
                        className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-sm border border-border hover:border-primary/40 transition-colors"
                      >
                        <span className="text-[10px] font-semibold text-foreground">{bu.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-muted-foreground">EEI {bu.eei}</span>
                          <ChevronRight size={10} className="text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Linked Agents */}
              {selectedKpi.linked.length > 0 && (
                <div className="bg-white border border-border rounded-sm p-4">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Bot size={10} />AI Employees Responsible
                  </div>
                  <div className="space-y-2">
                    {selectedKpi.linked.map((agentId) => {
                      const agent = MFG_AGENTS.find((a) => a.id === agentId);
                      if (!agent) return null;
                      return (
                        <Link
                          key={agentId}
                          href={`/agents/${agentId}`}
                          className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-sm border border-border hover:border-primary/40 transition-colors"
                        >
                          <div>
                            <div className="text-[10px] font-bold text-foreground">{agent.name}</div>
                            <div className="text-[9px] text-muted-foreground">{agent.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[8px] font-bold", agent.status === "active" ? "text-emerald-600" : "text-amber-600")}>
                              {agent.status}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground">{agent.roi} ROI</span>
                            <ChevronRight size={10} className="text-muted-foreground" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a KPI to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
