import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { BlurGate } from "@/components/shared/BlurGate";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { BU_LIST, ANOMALIES } from "@/data/enterprise-data";
import {
  ChevronRight,
  ChevronDown,
  Activity,
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bot,
  Radio,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────

function TinySparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 72;
  const h = 24;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function HealthBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1 bg-border rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span
      className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1", {
        "bg-red-500 animate-pulse": severity === "critical",
        "bg-amber-500": severity === "warning",
        "bg-blue-400": severity === "watch",
      })}
    />
  );
}

// ─── Left Panel ───────────────────────────────────────────────

function OrgNavigator({
  selectedBu,
  onSelect,
  scopedBuId,
}: {
  selectedBu: string | null;
  onSelect: (id: string | null) => void;
  scopedBuId: string | null;
}) {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    revenue: true,
  });

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const enterpriseHealth = Math.round(
    BU_LIST.reduce((s, b) => s + b.health, 0) / BU_LIST.length
  );
  const totalAgents = BU_LIST.reduce((s, b) => s + b.agents, 0);
  const totalAlerts = 2;

  return (
    <div className="w-[232px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          Org Navigator
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Enterprise Root */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center gap-2 py-1.5 px-2 rounded-sm bg-primary/5 border border-primary/20 cursor-pointer">
            <Network size={12} className="text-primary shrink-0" />
            <span className="text-[11px] font-bold text-primary truncate flex-1">Enterprise</span>
            <span className="text-[10px] font-mono text-primary">{enterpriseHealth}/100</span>
          </div>
        </div>

        {/* BU rows */}
        <div className="px-3 pb-3 space-y-0.5">
          {BU_LIST.map((bu) => {
            const isOpen = expanded[bu.id];
            const isSelected = selectedBu === bu.id;
            const blurred = scopedBuId !== null && bu.id !== scopedBuId;
            return (
              <div key={bu.id}>
              <BlurGate active={blurred}>
                <div
                  className={cn(
                    "flex items-center gap-1.5 py-1.5 px-2 rounded-sm cursor-pointer group transition-colors",
                    isSelected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/60"
                  )}
                  onClick={() => {
                    onSelect(isSelected ? null : bu.id);
                    if (!isOpen) toggle(bu.id);
                  }}
                >
                  <button
                    className="shrink-0 text-muted-foreground"
                    onClick={(e) => { e.stopPropagation(); toggle(bu.id); }}
                  >
                    {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[10px] font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                      {bu.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "text-[10px] font-mono font-bold",
                      bu.health >= 85 ? "text-emerald-600" : bu.health >= 70 ? "text-amber-600" : "text-red-600"
                    )}>
                      {bu.health}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="ml-5 mb-1 px-2 py-1 bg-muted/30 rounded-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Health</span>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Agents</span>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">EEI</span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-semibold text-foreground">{bu.health}%</span>
                      <span className="text-[10px] font-mono font-semibold text-foreground">{bu.agents}</span>
                      <span className="text-[10px] font-mono font-semibold text-emerald-600">{bu.eeiContrib}</span>
                    </div>
                    <HealthBar value={bu.health} />
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/business-units/${bu.id}`); }}
                      className="mt-1.5 w-full text-[8px] uppercase tracking-widest font-bold text-primary py-1 border border-primary/20 rounded-sm hover:bg-primary/5 transition-colors"
                    >
                      Open Detail →
                    </button>
                  </div>
                )}

                {isOpen && bu.employees.map((emp) => (
                  <div key={emp.name} className="ml-6 flex items-center gap-2 py-1 px-2 hover:bg-muted/40 rounded-sm cursor-default">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", {
                      "bg-emerald-500": emp.status === "active",
                      "bg-amber-500": emp.status === "watch",
                      "bg-red-500": emp.status === "critical",
                    })} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold text-foreground truncate">{emp.name}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{emp.role}</div>
                    </div>
                  </div>
                ))}
              </BlurGate>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-muted/30 shrink-0">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center">
            <div className="text-sm font-bold text-foreground">{BU_LIST.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Divs</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-foreground">{totalAgents}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Agents</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-destructive">{totalAlerts}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Alerts</div>
          </div>
        </div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">System Health</div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">
            {enterpriseHealth}<span className="text-muted-foreground font-normal text-[10px]">/100</span>
          </span>
          <div className="flex-1"><HealthBar value={enterpriseHealth} /></div>
        </div>
      </div>
    </div>
  );
}

// ─── Center Topology ──────────────────────────────────────────

function TopologyMap({
  eeiScore,
  selectedBu,
  onSelectBu,
  scopedBuId,
}: {
  eeiScore: number;
  selectedBu: string | null;
  onSelectBu: (id: string | null) => void;
  scopedBuId: string | null;
}) {
  const [, navigate] = useLocation();
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const CW = 1100;
  const CH = 580;
  const CX = CW / 2;
  const CY = 170;

  const buPositions = BU_LIST.map((bu, i) => {
    const spacing = 200;
    const totalWidth = (BU_LIST.length - 1) * spacing;
    const x = CX - totalWidth / 2 + i * spacing;
    const y = CY + 200;
    return { ...bu, x, y };
  });

  const getRiskBorder = (risk: string, selected: boolean) => {
    if (selected) return "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20";
    if (risk === "high") return "border-amber-400 bg-amber-50/60";
    if (risk === "critical") return "border-red-400 bg-red-50/60";
    return "border-border bg-white";
  };

  return (
    <div className="flex-1 relative bg-white border border-border rounded-sm shadow-sm overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
          className="w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-muted/60 transition-colors"
        >
          <ZoomIn size={12} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-muted/60 transition-colors"
        >
          <ZoomOut size={12} />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-muted/60 transition-colors"
        >
          <Maximize2 size={11} />
        </button>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto flex items-center justify-center">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center top",
            width: CW,
            height: CH + 160,
            position: "relative",
            transition: "transform 0.2s ease",
          }}
        >
          {/* SVG connections */}
          <svg
            width={CW}
            height={CH + 160}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {buPositions.map((bu) => {
              const isSelected = selectedBu === bu.id;
              const color = isSelected
                ? "hsl(228 71% 54%)"
                : bu.risk === "high"
                ? "#f59e0b"
                : "#94a3b8";
              return (
                <g key={bu.id}>
                  <line
                    x1={CX}
                    y1={CY + 60}
                    x2={bu.x}
                    y2={bu.y - 4}
                    stroke={color}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 0.7 : 0.3}
                    strokeDasharray={isSelected ? "none" : "4 4"}
                  />
                  {bu.employees.map((_, ei) => {
                    const ew = 58;
                    const etotal = (bu.employees.length - 1) * (ew + 8);
                    const ex = bu.x - etotal / 2 + ei * (ew + 8);
                    const ey = bu.y + 68;
                    return (
                      <line
                        key={ei}
                        x1={bu.x}
                        y1={bu.y + 64}
                        x2={ex + ew / 2}
                        y2={ey}
                        stroke="#94a3b8"
                        strokeWidth={0.8}
                        strokeOpacity={0.3}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Enterprise Core Node */}
          <div
            style={{
              position: "absolute",
              left: CX,
              top: CY,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <div className="w-[200px] bg-primary/10 border-2 border-primary rounded-sm shadow-lg overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-primary/20 bg-primary/5">
                <Network size={12} className="text-primary opacity-70" />
                <span className="text-[9px] uppercase tracking-widest text-primary font-bold">Enterprise Core</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-primary/20">
                <div className="flex flex-col items-center justify-center py-2 px-2">
                  <div className="text-[28px] font-bold tracking-tighter text-primary leading-none">{eeiScore}</div>
                  <div className="text-[8px] uppercase tracking-widest text-primary/60 mt-0.5">EEI Score</div>
                </div>
                <div className="flex flex-col divide-y divide-primary/20">
                  <div className="flex flex-col items-center justify-center py-1.5 px-2">
                    <div className="text-[13px] font-bold text-primary leading-none">$4.2M</div>
                    <div className="text-[7px] uppercase tracking-widest text-primary/60 mt-0.5">Rev / Day</div>
                  </div>
                  <div className="flex flex-col items-center justify-center py-1.5 px-2">
                    <div className="text-[13px] font-bold text-primary leading-none">247</div>
                    <div className="text-[7px] uppercase tracking-widest text-primary/60 mt-0.5">AI Agents</div>
                  </div>
                  <div className="flex flex-col items-center justify-center py-1.5 px-2">
                    <div className="text-[13px] font-bold text-emerald-600 leading-none">98.7%</div>
                    <div className="text-[7px] uppercase tracking-widest text-primary/60 mt-0.5">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BU Nodes */}
          {buPositions.map((bu) => {
            const isSelected = selectedBu === bu.id;
            const blurred = scopedBuId !== null && bu.id !== scopedBuId;
            return (
              <div
                key={bu.id}
                style={{
                  position: "absolute",
                  left: bu.x,
                  top: bu.y,
                  transform: "translate(-50%, 0)",
                  zIndex: 10,
                }}
              >
              <BlurGate active={blurred}>
                <div
                  className={cn(
                    "w-[140px] border rounded-sm shadow-sm cursor-pointer transition-all",
                    getRiskBorder(bu.risk, isSelected)
                  )}
                  onClick={() => { onSelectBu(bu.id); }}
                  onDoubleClick={() => navigate(`/business-units/${bu.id}`)}
                >
                  <div className="px-2.5 pt-2 pb-1.5">
                    <div className="text-[9px] uppercase tracking-widest font-bold text-foreground/70 truncate mb-1">
                      {bu.name.replace(" Intelligence", "")}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className={cn("text-xl font-bold tracking-tighter", isSelected ? "text-primary" : "text-foreground")}>
                        {bu.eei}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">EEI</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-0 border-t border-border/60 divide-x divide-border/60">
                    <div className="px-2 py-1">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Health</div>
                      <div className={cn(
                        "text-[10px] font-mono font-bold",
                        bu.health >= 85 ? "text-emerald-600" : bu.health >= 70 ? "text-amber-600" : "text-red-600"
                      )}>
                        {bu.health}%
                      </div>
                    </div>
                    <div className="px-2 py-1">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Agents</div>
                      <div className="text-[10px] font-mono font-bold text-foreground">{bu.agents}</div>
                    </div>
                    <div className="px-2 py-1 border-t border-border/60">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Flows</div>
                      <div className="text-[10px] font-mono font-bold text-foreground">{bu.workflows}</div>
                    </div>
                    <div className="px-2 py-1 border-t border-border/60">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Risk</div>
                      <div className={cn("text-[10px] font-mono font-bold uppercase", {
                        "text-red-600": bu.risk === "critical",
                        "text-amber-600": bu.risk === "high",
                        "text-emerald-600": bu.risk === "low",
                        "text-blue-600": bu.risk === "medium",
                      })}>
                        {bu.risk}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/business-units/${bu.id}`); }}
                      className="w-full text-[8px] uppercase tracking-widest font-bold text-primary bg-primary/5 border-t border-primary/20 py-1 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1"
                    >
                      Open Detail →
                    </button>
                  )}
                </div>

                {/* AI Employees */}
                <div className="flex gap-1.5 mt-2 justify-center">
                  {bu.employees.map((emp) => (
                    <div key={emp.name} className="w-[58px] bg-white border border-border rounded-sm px-1.5 py-1 shadow-sm">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={cn("w-1 h-1 rounded-full shrink-0", {
                          "bg-emerald-500": emp.status === "active",
                          "bg-amber-500": emp.status === "watch",
                        })} />
                        <Bot size={8} className="text-muted-foreground" />
                      </div>
                      <div className="text-[8px] font-semibold text-foreground leading-tight truncate">{emp.name}</div>
                    </div>
                  ))}
                </div>
              </BlurGate>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimap */}
      <div className="absolute bottom-3 right-3 z-20 w-[100px] h-[60px] bg-white/90 border border-border rounded-sm shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:8px_8px]" />
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
          <div className="w-4 h-4 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <div className="flex gap-1">
            {BU_LIST.map((bu) => (
              <div
                key={bu.id}
                className={cn(
                  "w-2.5 h-2 rounded-sm border",
                  bu.risk === "high" ? "border-amber-400 bg-amber-100"
                    : selectedBu === bu.id ? "border-primary bg-primary/20"
                    : "border-border bg-muted"
                )}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-1 left-1 text-[7px] uppercase tracking-widest text-muted-foreground">
          minimap
        </div>
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────

function LiveIntelligence() {
  const [deepDive, setDeepDive] = useState<string | null>(null);
  const [, navigate] = useLocation();

  return (
    <div className="w-[272px] shrink-0 border-l border-border bg-white flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Radio size={11} className="text-emerald-500" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Live Intelligence
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">• Live</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Operational Snapshot */}
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">
            Operational Snapshot — Now
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Enterprise Health", value: "84/100", sub: "TOT: 88%", color: "text-emerald-600" },
              { label: "AI Workforce", value: "97.2%", sub: "TOT: 95%", color: "text-emerald-600" },
              { label: "Governance", value: "91.4%", sub: "TOT: 90%", color: "text-emerald-600" },
              { label: "Active Risks", value: "3", sub: "1 critical", color: "text-amber-600" },
            ].map((item) => (
              <div key={item.label} className="bg-muted/30 rounded-sm px-2 py-1.5 border border-border/40">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground leading-tight mb-0.5">{item.label}</div>
                <div className={cn("text-sm font-bold font-mono", item.color)}>{item.value}</div>
                <div className="text-[9px] text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 bg-red-50 border border-red-100 rounded-sm px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-widest text-red-600 font-bold">Active Escalations</span>
              <span className="text-[10px] font-mono font-bold text-red-600">2</span>
            </div>
            <div className="text-[9px] text-red-500 mt-0.5 leading-tight">Revenue forecast · Procurement SLA</div>
          </div>
        </div>

        {/* Anomaly Command Center */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity size={11} className="text-muted-foreground" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
              Anomaly Command Center
            </span>
          </div>

          <div className="space-y-2">
            {ANOMALIES.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "border rounded-sm p-2.5 transition-all",
                  deepDive === a.id ? "border-primary/40 bg-primary/5"
                    : a.severity === "critical" ? "border-red-200 bg-red-50/50"
                    : a.severity === "warning" ? "border-amber-200 bg-amber-50/50"
                    : "border-border bg-white"
                )}
              >
                <div className="flex items-start gap-1.5 mb-1.5">
                  <SeverityDot severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest", {
                        "text-red-600": a.severity === "critical",
                        "text-amber-600": a.severity === "warning",
                        "text-blue-600": a.severity === "watch",
                      })}>
                        {a.severity}
                      </span>
                      <span className="text-[9px] text-muted-foreground shrink-0">{a.age}</span>
                    </div>
                    <div className="text-[10px] font-semibold text-foreground leading-snug">{a.title}</div>
                  </div>
                </div>

                <div className="text-[9px] text-muted-foreground leading-tight mb-1.5">{a.context}</div>

                <div className="flex items-center justify-between mb-1.5">
                  <TinySparkline
                    values={a.trend}
                    color={a.severity === "critical" ? "#ef4444" : a.severity === "warning" ? "#f59e0b" : "#60a5fa"}
                  />
                  <div className="text-right">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Business Impact</div>
                    <div className="text-[9px] font-semibold text-foreground">{a.impact}</div>
                  </div>
                </div>

                <div className="bg-white/80 border border-border/60 rounded-sm px-2 py-1 mb-1.5">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Recommended Action</div>
                  <div className="text-[9px] text-foreground leading-snug">{a.action}</div>
                </div>

                <button
                  onClick={() => navigate(`/incident/${a.id}`)}
                  className="w-full text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors flex items-center justify-center gap-1 bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                >
                  <Activity size={9} />
                  Deep Dive →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

const TWIN_DATA = {
  aiWorkforce: 247,
  humanWorkforce: 1840,
  totalDecisions: "18.4K",
  eeiScore: 84,
};

export default function DigitalTwin() {
  const [selectedBu, setSelectedBu] = useState<string | null>(null);
  const { role, currentBuId } = useAppContext();
  const scopedBuId = role === "abu_head" ? currentBuId : null;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="DIGITAL TWIN"
        metrics={[
          { label: "AI Workforce", value: TWIN_DATA.aiWorkforce },
          { label: "Human Workforce", value: TWIN_DATA.humanWorkforce },
          { label: "Total Decisions", value: TWIN_DATA.totalDecisions },
        ]}
      />

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Enterprise Topology
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            EEI <span className="text-primary font-bold">{TWIN_DATA.eeiScore}</span>
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            {BU_LIST.length} Business Units · {BU_LIST.reduce((s, b) => s + b.agents, 0)} AI Agents · {BU_LIST.reduce((s, b) => s + b.workflows, 0)} Workflows
          </span>
        </div>
        {selectedBu && (
          <button
            onClick={() => setSelectedBu(null)}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border px-2 py-1 rounded-sm bg-white"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        <OrgNavigator selectedBu={selectedBu} onSelect={setSelectedBu} scopedBuId={scopedBuId} />

        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <TopologyMap
            eeiScore={TWIN_DATA.eeiScore}
            selectedBu={selectedBu}
            onSelectBu={setSelectedBu}
            scopedBuId={scopedBuId}
          />
        </div>

        <LiveIntelligence />
      </div>
    </div>
  );
}
