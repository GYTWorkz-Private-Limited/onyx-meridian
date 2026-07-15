import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { KPI_CATALOG, ANOMALIES, BU_LIST } from "@/data/enterprise-data";
import { BUSINESS_EVENTS, type BusinessEventKind } from "@/data/kpi-studio-data";
import {
  AlertTriangle, Activity, Wrench, Truck, Database, Building2, Rocket,
  Users, CalendarDays, Zap, PackagePlus, Factory,
} from "lucide-react";

const EVENT_ICON: Record<BusinessEventKind, React.ElementType> = {
  shutdown: Factory, maintenance: Wrench, installation: PackagePlus, supplier: Truck,
  erp: Database, expansion: Building2, launch: Rocket, strike: Users, holiday: CalendarDays, power: Zap,
};

const IMPACT_CLS: Record<string, string> = {
  info: "border-border bg-white text-muted-foreground",
  watch: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

function buName(id: string | null) {
  return id ? BU_LIST.find((b) => b.id === id)?.name ?? id : "Enterprise-wide";
}

export function AlertsTimeline({ onOpenKpi }: { onOpenKpi: (id: string) => void }) {
  const [, navigate] = useLocation();
  const thresholdAlerts = KPI_CATALOG.filter((k) => k.healthScore < 75).sort((a, b) => a.healthScore - b.healthScore);
  const events = [...BUSINESS_EVENTS].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex h-full overflow-hidden">
      {/* Intelligent Alerts */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <Activity size={13} className="text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Active Incidents</span>
        </div>
        <div className="space-y-2 mb-6">
          {ANOMALIES.map((a) => (
            <div key={a.id} className={cn(
              "border rounded-sm p-3",
              a.severity === "critical" ? "border-red-200 bg-red-50/50" : a.severity === "warning" ? "border-amber-200 bg-amber-50/50" : "border-border bg-white"
            )}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-[9px] font-bold uppercase tracking-widest", a.severity === "critical" ? "text-red-600" : a.severity === "warning" ? "text-amber-600" : "text-blue-600")}>{a.severity}</span>
                <span className="text-[9px] text-muted-foreground">{a.age}</span>
              </div>
              <div className="text-[11px] font-semibold text-foreground leading-snug mb-1">{a.title}</div>
              <div className="text-[10px] text-muted-foreground mb-2">{a.impact}</div>
              <button onClick={() => navigate(`/incident/${a.id}`)} className="text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                Deep Dive →
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <AlertTriangle size={13} className="text-amber-600" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">KPI Threshold Alerts</span>
          <span className="text-[9px] text-muted-foreground">{thresholdAlerts.length} below health threshold</span>
        </div>
        <div className="space-y-2">
          {thresholdAlerts.map((k) => (
            <button key={k.id} onClick={() => onOpenKpi(k.id)} className={cn(
              "w-full text-left border rounded-sm p-3 transition-colors hover:border-primary/40",
              k.healthScore < 60 ? "border-red-200 bg-red-50/40" : "border-amber-200 bg-amber-50/40"
            )}>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  {k.abbreviation && <span className="text-[10px] font-mono font-bold text-primary">{k.abbreviation}</span>}
                  <span className="text-[10px] font-semibold text-foreground">{k.fullName}</span>
                </span>
                <span className={cn("text-[9px] font-mono font-bold", k.healthScore < 60 ? "text-red-600" : "text-amber-600")}>{k.healthScore}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{k.value} vs target {k.target} · {k.variance}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Business Event Timeline */}
      <div className="w-[380px] shrink-0 overflow-y-auto p-6 bg-[#FBFBFC]">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-3">Business Event Timeline</div>
        <div className="relative pl-5">
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
          <div className="space-y-4">
            {events.map((ev) => {
              const Icon = EVENT_ICON[ev.kind];
              return (
                <div key={ev.id} className="relative">
                  <div className={cn(
                    "absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center",
                    ev.impact === "critical" ? "border-red-400" : ev.impact === "watch" ? "border-amber-400" : "border-border"
                  )}>
                    <Icon size={7} className="text-muted-foreground" />
                  </div>
                  <div className={cn("border rounded-sm px-3 py-2", IMPACT_CLS[ev.impact])}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground">{ev.date}</span>
                      <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{buName(ev.buId)}</span>
                    </div>
                    <div className="text-[10px] font-semibold leading-snug">{ev.title}</div>
                    <div className="text-[9px] mt-0.5 opacity-80 leading-snug">{ev.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
