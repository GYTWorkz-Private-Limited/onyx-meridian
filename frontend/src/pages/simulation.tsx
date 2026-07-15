import { useState, useRef } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BU_LIST, IMPACT_MAP } from "@/data/enterprise-data";
import {
  ChevronRight, ChevronDown, ArrowDown, ArrowUp,
  Network, ZoomIn, ZoomOut, Maximize2, Bot, FlaskConical,
  RotateCcw, Zap, AlertTriangle, TrendingDown, Play, CheckCircle2,
  Clock, DollarSign, Loader2,
} from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────

function HealthBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Preset Scenarios ──────────────────────────────────────────

export const PRESET_SCENARIOS: Array<{
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  healthOverrides: Record<string, number>;
  eeiDelta: number;
  impactSummary: string;
  agentActions: Array<{ agent: string; action: string; status: "triggered" | "monitoring" | "escalated" }>;
}> = [
  {
    id: "machine-failure",
    name: "Machine Failure",
    icon: Zap,
    color: "text-red-600 bg-red-50 border-red-200",
    description: "Critical asset MX-0441 fails on Line 7 — 6-hr unplanned downtime, cascading throughput loss",
    healthOverrides: { manufacturing: 52, "supply-chain": 78, procurement: 80, finance: 85, revenue: 81 },
    eeiDelta: -9.2,
    impactSummary: "OEE: -18% · Throughput: -24% · Revenue at Risk: $480K · EEI: -9.2 pts",
    agentActions: [
      { agent: "Predictive Maintenance", action: "Emergency WO generated for MX-0441 bearing replacement", status: "triggered" },
      { agent: "Production Planner", action: "Rerouting 74% Line 7 output to Line 8 — schedule impact calculated", status: "triggered" },
      { agent: "OEE Optimizer", action: "Monitoring Line 8 capacity utilization — 91% and rising", status: "monitoring" },
      { agent: "Finance Analyst", action: "Downtime cost estimate: $480K — escalating to CFO dashboard", status: "escalated" },
    ],
  },
  {
    id: "supplier-delay",
    name: "Supplier Delay",
    icon: AlertTriangle,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    description: "Tier-1 supplier Supplier #084 delays delivery by 18 days — production schedule at risk",
    healthOverrides: { manufacturing: 76, "supply-chain": 58, procurement: 62, finance: 86, revenue: 77 },
    eeiDelta: -6.4,
    impactSummary: "Fill Rate: -12% · Cycle Time: +11 days · Revenue at Risk: $1.2M · EEI: -6.4 pts",
    agentActions: [
      { agent: "Supplier Risk Agent", action: "Alternate supplier protocol activated — 4 candidates identified", status: "triggered" },
      { agent: "Inventory Optimizer", action: "Safety stock review — SKU-8841 critical in 11 days", status: "escalated" },
      { agent: "Sourcing Agent", action: "Emergency RFQ sent to Suppliers #092, #107, #118", status: "triggered" },
      { agent: "Revenue Scout", action: "Flagging 3 accounts at delivery SLA risk — customer comms recommended", status: "monitoring" },
    ],
  },
  {
    id: "production-surge",
    name: "Production Surge",
    icon: TrendingDown,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "Unexpected +35% demand spike in APAC — production capacity constraint across all lines",
    healthOverrides: { manufacturing: 80, "supply-chain": 68, procurement: 72, finance: 88, revenue: 91 },
    eeiDelta: -3.8,
    impactSummary: "Throughput Gap: 1,040 u/hr · Inventory Pressure: +22% · Revenue Upside: +$2.4M · EEI: -3.8 pts",
    agentActions: [
      { agent: "Production Planner", action: "Extended shift schedule modeled — OT capacity +28% available", status: "triggered" },
      { agent: "Demand Planner", action: "Forecast model updated with APAC surge signal — reorder recommendations queued", status: "triggered" },
      { agent: "Revenue Scout", action: "Priority accounts identified — allocating available capacity to strategic deals", status: "triggered" },
      { agent: "Finance Analyst", action: "OT cost model vs revenue upside: +$2.4M net positive — CFO briefed", status: "monitoring" },
    ],
  },
  {
    id: "inventory-shortage",
    name: "Inventory Shortage",
    icon: FlaskConical,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    description: "WH-3 stockout of SKU-8841 projected in 11 days — delivery SLAs at risk for 18 accounts",
    healthOverrides: { manufacturing: 84, "supply-chain": 54, procurement: 69, finance: 83, revenue: 74 },
    eeiDelta: -5.1,
    impactSummary: "At-Risk Revenue: $1.2M · SLA Breach: 18 accounts · Fill Rate: -14% · EEI: -5.1 pts",
    agentActions: [
      { agent: "Inventory Optimizer", action: "Emergency reorder triggered for SKU-8841 — expedite flag set", status: "triggered" },
      { agent: "WMS Agent", action: "WH-1 and WH-2 reserve stock transfer initiated — 340 units in transit", status: "triggered" },
      { agent: "Procurement Agent", action: "Fast-track PO generated for alternate SKU-8841-B — approval pending", status: "escalated" },
      { agent: "Deal Closer AI", action: "18 at-risk accounts prioritized — proactive communication queued", status: "monitoring" },
    ],
  },
  {
    id: "quality-failure",
    name: "Quality Failure",
    icon: CheckCircle2,
    color: "text-violet-600 bg-violet-50 border-violet-200",
    description: "Batch QD-229 defect rate spikes to 4.8% — root cause unknown, inspection escalation active",
    healthOverrides: { manufacturing: 71, "supply-chain": 79, procurement: 77, finance: 82, revenue: 80 },
    eeiDelta: -4.6,
    impactSummary: "Scrap Rate: +3.6% · Yield Loss: $280K · Rework WOs: 14 open · EEI: -4.6 pts",
    agentActions: [
      { agent: "Quality Inspector", action: "Batch QD-229 quarantined — 286 units held for reinspection", status: "triggered" },
      { agent: "OEE Optimizer", action: "Root cause analysis: raw material variance identified in supplier lot", status: "triggered" },
      { agent: "Supplier Risk Agent", action: "Material supplier flagged — risk score updated to 74", status: "monitoring" },
      { agent: "Finance Analyst", action: "Scrap cost estimate $280K — warranty reserve adjustment recommended", status: "escalated" },
    ],
  },
];

const BASE_EEI = 82;

// ─── Left Panel: Scenario Controls ────────────────────────────

function ScenarioControls({
  scenarioHealth,
  onScenarioHealth,
  onReset,
  baseEEI,
  scenarioEEI,
  activePreset,
  onPreset,
}: {
  scenarioHealth: Record<string, number>;
  onScenarioHealth: (id: string, val: number) => void;
  onReset: () => void;
  baseEEI: number;
  scenarioEEI: number;
  activePreset: string | null;
  onPreset: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(BU_LIST.map((b) => [b.id, false]))
  );
  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const eeiDelta = scenarioEEI - baseEEI;

  return (
    <div className="w-[256px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
          Scenario Controls
        </div>
        <div className="text-[9px] text-muted-foreground leading-relaxed">
          Load a preset or adjust BU health sliders.
        </div>
      </div>

      {/* EEI impact summary */}
      <div className="px-4 py-3 border-b border-border shrink-0 bg-amber-50/60">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
          Simulated EEI
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tighter text-foreground">
            {scenarioEEI}
          </span>
          <span className={cn("text-[11px] font-mono font-bold", eeiDelta < 0 ? "text-red-600" : eeiDelta > 0 ? "text-emerald-600" : "text-muted-foreground")}>
            {eeiDelta > 0 ? "+" : ""}{eeiDelta.toFixed(1)}
          </span>
          <span className="text-[9px] text-muted-foreground">vs baseline {baseEEI}</span>
        </div>
        <HealthBar value={scenarioEEI} />
      </div>

      {/* Preset scenarios */}
      <div className="px-3 py-3 border-b border-border shrink-0">
        <div className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Preset Scenarios</div>
        <div className="space-y-1">
          {PRESET_SCENARIOS.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onPreset(preset.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-sm border text-left transition-colors",
                  isActive ? preset.color + " border-current" : "bg-muted/20 border-border hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <Icon size={10} className={isActive ? "" : "text-muted-foreground"} />
                <span className={cn("text-[10px] font-semibold flex-1 truncate", isActive ? "" : "text-foreground")}>
                  {preset.name}
                </span>
                {isActive && <span className="text-[8px] font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* BU sliders */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Manual Overrides</div>
        {BU_LIST.map((bu) => {
          const isOpen = expanded[bu.id];
          const currentHealth = scenarioHealth[bu.id] ?? bu.health;
          const delta = currentHealth - bu.health;
          return (
            <div key={bu.id} className="border border-border/60 rounded-sm overflow-hidden">
              <button
                className="w-full flex items-center gap-1.5 px-2.5 py-2 bg-muted/30 hover:bg-muted/60 transition-colors"
                onClick={() => toggle(bu.id)}
              >
                {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                <span className="flex-1 text-left text-[10px] font-semibold text-foreground truncate">{bu.name}</span>
                <span className={cn("text-[10px] font-mono font-bold shrink-0",
                  currentHealth >= 85 ? "text-emerald-600" : currentHealth >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {currentHealth}
                  {delta !== 0 && (
                    <span className={cn("ml-0.5 text-[8px]", delta > 0 ? "text-emerald-500" : "text-red-500")}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="px-2.5 py-2 bg-white">
                  <div className="text-[8px] uppercase tracking-widest text-amber-600 mb-1">Simulate Health</div>
                  <input
                    type="range" min={0} max={100} value={currentHealth}
                    onChange={(e) => onScenarioHealth(bu.id, Number(e.target.value))}
                    className="w-full h-1.5 accent-amber-500 cursor-pointer mb-1"
                  />
                  <div className="flex justify-between">
                    <span className="text-[8px] text-muted-foreground">0</span>
                    <span className="text-[8px] text-muted-foreground">Baseline: {bu.health}</span>
                    <span className="text-[8px] text-muted-foreground">100</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border rounded-sm py-1.5 hover:border-primary/40 hover:text-primary transition-colors"
        >
          <RotateCcw size={10} /> Reset to Baseline
        </button>
      </div>
    </div>
  );
}

// ─── Center: Simulation Topology ───────────────────────────────

function SimTopology({
  scenarioHealth,
  scenarioEEI,
  selectedBu,
  onSelectBu,
  activePreset,
}: {
  scenarioHealth: Record<string, number>;
  scenarioEEI: number;
  selectedBu: string | null;
  onSelectBu: (id: string | null) => void;
  activePreset: string | null;
}) {
  const [zoom, setZoom] = useState(1);
  const preset = PRESET_SCENARIOS.find(p => p.id === activePreset);

  const CW = 1100;
  const CY_ENTERPRISE = 100;
  const CY_BU = 320;

  const buPositions = BU_LIST.map((bu, i) => {
    const spacing = 200;
    const totalWidth = (BU_LIST.length - 1) * spacing;
    const x = CW / 2 - totalWidth / 2 + i * spacing;
    return { ...bu, x, y: CY_BU };
  });

  const getHealth = (bu: typeof BU_LIST[0]) =>
    scenarioHealth[bu.id] !== undefined ? scenarioHealth[bu.id] : bu.health;

  const eeiDelta = scenarioEEI - BASE_EEI;

  return (
    <div className="flex-1 relative bg-white border border-border rounded-sm shadow-sm overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Banner */}
      <div className="absolute top-3 left-3 z-30 bg-amber-50 border border-amber-200 rounded-sm px-3 py-1.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
          {activePreset ? `Scenario: ${PRESET_SCENARIOS.find(p => p.id === activePreset)?.name}` : "Simulation Active"}
        </span>
        <span className="text-[10px] text-amber-600 font-mono">
          EEI {scenarioEEI}
          {eeiDelta !== 0 && (
            <span className={cn("ml-1 font-bold", eeiDelta < 0 ? "text-red-600" : "text-emerald-600")}>
              ({eeiDelta > 0 ? "+" : ""}{eeiDelta.toFixed(1)})
            </span>
          )}
        </span>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1">
        <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-muted/60"><ZoomIn size={12} /></button>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-muted/60"><ZoomOut size={12} /></button>
        <button onClick={() => setZoom(1)} className="w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-muted/60"><Maximize2 size={11} /></button>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "center top", width: CW, height: 520, position: "relative", transition: "transform 0.2s ease" }}>
          {/* Enterprise node */}
          <div style={{ position: "absolute", left: CW / 2 - 72, top: CY_ENTERPRISE - 32 }} className="w-36 h-16 bg-white border-2 border-primary rounded-sm flex flex-col items-center justify-center shadow-md">
            <Network size={14} className="text-primary mb-0.5" />
            <div className="text-[10px] font-bold text-primary">Enterprise</div>
            <div className={cn("text-[11px] font-mono font-bold", eeiDelta < 0 ? "text-red-600" : eeiDelta > 0 ? "text-emerald-600" : "text-foreground")}>
              EEI {scenarioEEI}
            </div>
          </div>

          {/* SVG lines from enterprise to BUs */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: CW, height: 520, pointerEvents: "none" }} viewBox={`0 0 ${CW} 520`}>
            {buPositions.map((bu) => {
              const health = getHealth(bu);
              const isLow = health < 70;
              return (
                <line
                  key={bu.id}
                  x1={CW / 2} y1={CY_ENTERPRISE + 16}
                  x2={bu.x} y2={CY_BU}
                  stroke={isLow ? "#EF4444" : "#E2E8F0"}
                  strokeWidth={selectedBu === bu.id ? 2 : 1.5}
                  strokeDasharray={isLow ? "4,4" : "none"}
                  strokeOpacity={selectedBu && selectedBu !== bu.id ? 0.3 : 1}
                />
              );
            })}
          </svg>

          {/* BU cards */}
          {buPositions.map((bu) => {
            const health = getHealth(bu);
            const delta = health - bu.health;
            const isSelected = selectedBu === bu.id;
            const isLow = health < 70;
            const isMed = health < 85 && health >= 70;
            return (
              <div
                key={bu.id}
                onClick={() => onSelectBu(isSelected ? null : bu.id)}
                style={{ position: "absolute", left: bu.x - 72, top: bu.y }}
                className={cn(
                  "w-36 border-2 rounded-sm shadow-sm cursor-pointer transition-all duration-200 overflow-hidden",
                  isSelected ? "border-primary ring-2 ring-primary/20 shadow-lg" :
                  isLow ? "border-red-400" : isMed ? "border-amber-400" : "border-emerald-300",
                  "bg-white hover:shadow-md"
                )}
              >
                <div className={cn("h-1 w-full", isLow ? "bg-red-400" : isMed ? "bg-amber-400" : "bg-emerald-400")} />
                <div className="p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-foreground truncate">{bu.name}</span>
                    {delta !== 0 && (
                      <div className={cn("flex items-center gap-0.5 text-[8px] font-bold", delta < 0 ? "text-red-600" : "text-emerald-600")}>
                        {delta < 0 ? <ArrowDown size={8} /> : <ArrowUp size={8} />}
                        {Math.abs(delta)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span className={cn("text-xl font-bold font-mono leading-none", isLow ? "text-red-600" : isMed ? "text-amber-600" : "text-emerald-600")}>
                      {health}
                    </span>
                    <span className="text-[8px] text-muted-foreground">/ 100</span>
                  </div>
                  <HealthBar value={health} />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                      <Bot size={8} /> {bu.agents}
                    </span>
                    <span className={cn("text-[8px] font-bold uppercase tracking-widest",
                      bu.risk === "high" ? "text-red-600" : bu.risk === "medium" ? "text-amber-600" : "text-emerald-600"
                    )}>{bu.risk}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Agent action cards if preset active */}
          {preset && (
            <div style={{ position: "absolute", top: CY_BU + 160, left: 40, right: 40 }}>
              <div className="grid grid-cols-4 gap-3">
                {preset.agentActions.map((action, i) => (
                  <div key={i} className={cn("border rounded-sm p-2.5 text-[9px]",
                    action.status === "triggered" ? "bg-emerald-50 border-emerald-200" :
                    action.status === "escalated" ? "bg-orange-50 border-orange-200" :
                    "bg-blue-50 border-blue-200"
                  )}>
                    <div className="flex items-center gap-1 mb-1">
                      <Bot size={9} className={action.status === "triggered" ? "text-emerald-600" : action.status === "escalated" ? "text-orange-600" : "text-blue-600"} />
                      <span className="font-bold truncate">{action.agent}</span>
                    </div>
                    <div className="text-muted-foreground leading-snug">{action.action}</div>
                    <div className={cn("mt-1 font-bold uppercase tracking-widest text-[7px]",
                      action.status === "triggered" ? "text-emerald-600" : action.status === "escalated" ? "text-orange-600" : "text-blue-600"
                    )}>● {action.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Right Panel: Impact Analysis ─────────────────────────────

function ImpactPanel({
  selectedBu,
  scenarioHealth,
  scenarioEEI,
  activePreset,
}: {
  selectedBu: string | null;
  scenarioHealth: Record<string, number>;
  scenarioEEI: number;
  activePreset: string | null;
}) {
  const preset = PRESET_SCENARIOS.find(p => p.id === activePreset);
  const impact = selectedBu ? IMPACT_MAP[selectedBu] : null;
  const bu = selectedBu ? BU_LIST.find(b => b.id === selectedBu) : null;
  const currentHealth = selectedBu ? (scenarioHealth[selectedBu] ?? bu?.health ?? 100) : null;
  const eeiDelta = scenarioEEI - BASE_EEI;

  return (
    <div className="w-[260px] shrink-0 bg-white border-l border-border flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          {selectedBu && bu ? bu.name : "Enterprise Impact"}
        </div>
        {preset && (
          <div className="text-[9px] text-muted-foreground mt-0.5">{preset.name} Scenario</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* EEI Summary */}
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-3">
          <div className="text-[9px] uppercase tracking-widest text-amber-700 font-bold mb-2">EEI Impact</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-foreground">{scenarioEEI}</span>
            <span className={cn("text-sm font-bold font-mono", eeiDelta < 0 ? "text-red-600" : eeiDelta > 0 ? "text-emerald-600" : "text-muted-foreground")}>
              {eeiDelta > 0 ? "+" : ""}{eeiDelta.toFixed(1)}
            </span>
          </div>
          <HealthBar value={scenarioEEI} />
        </div>

        {/* Preset impact summary */}
        {preset && (
          <div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Scenario Impact</div>
            <div className={cn("border rounded-sm p-2.5 text-[10px] leading-relaxed", preset.color)}>
              {preset.impactSummary}
            </div>
            <div className="text-[9px] text-muted-foreground mt-2 leading-relaxed">{preset.description}</div>
          </div>
        )}

        {/* BU-specific cascade */}
        {selectedBu && impact ? (
          <div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Cascade Analysis</div>
            <div className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2.5 py-1.5 mb-2 font-semibold">
              {impact.trigger}
            </div>
            <div className="space-y-2">
              {impact.chain.map((item, i) => (
                <div key={i} className={cn("border rounded-sm p-2 flex items-start gap-2",
                  item.severity === "high" ? "border-red-200 bg-red-50/50" : item.severity === "medium" ? "border-amber-200 bg-amber-50/50" : "border-border bg-muted/20"
                )}>
                  <div className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 border rounded-sm shrink-0 mt-0.5",
                    item.severity === "high" ? "bg-red-100 border-red-200 text-red-700" : "bg-amber-100 border-amber-200 text-amber-700"
                  )}>{item.label}</div>
                  <div className="flex-1">
                    <div className="text-[9px] text-muted-foreground">{item.metric}</div>
                    <div className={cn("text-[10px] font-bold font-mono", item.dir === "down" && item.label !== "Outcome" ? "text-red-600" : "text-red-600")}>{item.change}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-sm px-2.5 py-1.5">
              Enterprise Outcome: {impact.enterpriseOutcome}
            </div>
          </div>
        ) : !preset ? (
          <div className="text-center py-8 text-muted-foreground text-[10px]">
            <FlaskConical size={20} className="mx-auto mb-2 opacity-30" />
            Select a BU or load a preset scenario to see cascade impact analysis.
          </div>
        ) : null}

        {/* BU metrics if selected */}
        {bu && currentHealth !== null && (
          <div>
            <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">BU Health</div>
            <div className="space-y-1.5">
              {[
                { label: "Health Score", value: `${currentHealth}/100`, color: currentHealth >= 85 ? "text-emerald-600" : currentHealth >= 70 ? "text-amber-600" : "text-red-600" },
                { label: "Delta", value: `${currentHealth - bu.health >= 0 ? "+" : ""}${currentHealth - bu.health}`, color: currentHealth >= bu.health ? "text-emerald-600" : "text-red-600" },
                { label: "EEI Contrib", value: bu.eeiContrib, color: "text-primary" },
                { label: "Agents", value: `${bu.agents}`, color: "text-foreground" },
                { label: "Open Tasks", value: `${bu.openTasks}`, color: "text-foreground" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn("font-mono font-bold", item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function Simulation() {
  const { toast } = useToast();
  const [scenarioHealth, setScenarioHealth] = useState<Record<string, number>>({});
  const [selectedBu, setSelectedBu] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const scenarioEEI = Math.round(
    BU_LIST.reduce((sum, bu) => {
      const h = scenarioHealth[bu.id] ?? bu.health;
      return sum + h * (bu.eeiContribution / 100);
    }, 0) + BASE_EEI * 0.3
  );

  const loadPreset = (id: string) => {
    const preset = PRESET_SCENARIOS.find(p => p.id === id);
    if (!preset) return;
    setIsRunning(true);
    setActivePreset(id);
    setTimeout(() => {
      setScenarioHealth(preset.healthOverrides);
      setIsRunning(false);
      toast({ title: `Scenario Loaded: ${preset.name}`, description: preset.description });
    }, 600);
  };

  const reset = () => {
    setScenarioHealth({});
    setSelectedBu(null);
    setActivePreset(null);
  };

  const activeCount = Object.values(scenarioHealth).filter((v, i) => {
    const bu = BU_LIST[i];
    return bu && v !== bu.health;
  }).length;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="SIMULATION"
        metrics={[
          { label: "SIMULATED EEI", value: scenarioEEI },
          { label: "BU OVERRIDES", value: Object.keys(scenarioHealth).length },
          { label: "SCENARIOS", value: PRESET_SCENARIOS.length },
        ]}
      />

      <div className="flex items-center gap-3 px-6 py-2.5 bg-white border-b border-border shrink-0">
        <FlaskConical size={13} className="text-amber-600" />
        <span className="text-[10px] text-muted-foreground">Adjust BU health sliders or load a preset scenario to model cascading enterprise impact on the EEI.</span>
        <div className="ml-auto flex items-center gap-2">
          {isRunning && <Loader2 size={13} className="animate-spin text-primary" />}
          <Button size="sm" variant="outline" onClick={reset} className="h-7 text-[9px] uppercase tracking-widest">
            <RotateCcw size={10} className="mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={() => toast({ title: "Simulation exported" })} className="h-7 text-[9px] uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90">
            Export Report
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <ScenarioControls
          scenarioHealth={scenarioHealth}
          onScenarioHealth={(id, val) => setScenarioHealth(prev => ({ ...prev, [id]: val }))}
          onReset={reset}
          baseEEI={BASE_EEI}
          scenarioEEI={scenarioEEI}
          activePreset={activePreset}
          onPreset={loadPreset}
        />

        <SimTopology
          scenarioHealth={scenarioHealth}
          scenarioEEI={scenarioEEI}
          selectedBu={selectedBu}
          onSelectBu={setSelectedBu}
          activePreset={activePreset}
        />

        <ImpactPanel
          selectedBu={selectedBu}
          scenarioHealth={scenarioHealth}
          scenarioEEI={scenarioEEI}
          activePreset={activePreset}
        />
      </div>
    </div>
  );
}
