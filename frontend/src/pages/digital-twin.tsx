import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { BlurGate } from "@/components/shared/BlurGate";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { BU_LIST, ANOMALIES, ENTERPRISE_METRICS } from "@/data/enterprise-data";
import { deptStatus, DepartmentStack } from "@/components/twin/twin-canvas";
import AbuTwin from "@/pages/twins/abu-twin";
import DeptTwin from "@/pages/twins/dept-twin";
import {
  ChevronRight,
  ChevronDown,
  Activity,
  Network,
  ZoomIn,
  ZoomOut,
  Radio,
  Move,
  RotateCcw,
  Crosshair,
  Hand,
  Layers,
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

const CW = 1180;
const CH = 640;
const CX = CW / 2;
const CY = 150;
const WORLD_H = CH + 260;
const BU_SPACING = 214;

type Pos = { x: number; y: number };

// Default radial-ish layout: core at top-center, BUs fanned out below.
function buildDefaultPositions(): Record<string, Pos> {
  const pos: Record<string, Pos> = { __core__: { x: CX, y: CY } };
  const totalWidth = (BU_LIST.length - 1) * BU_SPACING;
  BU_LIST.forEach((bu, i) => {
    pos[bu.id] = { x: CX - totalWidth / 2 + i * BU_SPACING, y: CY + 190 };
  });
  return pos;
}

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;

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
  const [pan, setPan] = useState<Pos>({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<string, Pos>>(buildDefaultPositions);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [pulse, setPulse] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Mutable drag context shared with window listeners.
  const drag = useRef<
    | { id: string | "__canvas__"; startX: number; startY: number; origX: number; origY: number; moved: boolean }
    | null
  >(null);
  const movedRef = useRef(false);

  const core = positions.__core__;

  // ── Global pointer move / up so drags survive leaving the node ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      if (d.id === "__canvas__") {
        setPan({ x: d.origX + dx, y: d.origY + dy });
      } else {
        const z = zoomRef.current;
        setPositions((prev) => ({
          ...prev,
          [d.id]: { x: d.origX + dx / z, y: d.origY + dy / z },
        }));
      }
    };
    const onUp = () => {
      if (!drag.current) return;
      movedRef.current = drag.current.moved;
      const wasCanvas = drag.current.id === "__canvas__";
      drag.current = null;
      if (wasCanvas) setIsPanning(false);
      setDragId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // ── Scroll to zoom (non-passive so we can preventDefault) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => {
        const next = z - e.deltaY * 0.0015 * z;
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const startNodeDrag = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.stopPropagation();
      const p = positions[id];
      if (!p) return;
      drag.current = { id, startX: e.clientX, startY: e.clientY, origX: p.x, origY: p.y, moved: false };
      movedRef.current = false;
      setDragId(id);
    },
    [positions]
  );

  const startPan = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-node]") || target.closest("[data-control]")) return;
      drag.current = { id: "__canvas__", startX: e.clientX, startY: e.clientY, origX: pan.x, origY: pan.y, moved: false };
      setIsPanning(true);
    },
    [pan]
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const resetLayout = useCallback(() => {
    setPositions(buildDefaultPositions());
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const getRiskBorder = (risk: string, selected: boolean) => {
    if (selected) return "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20";
    if (risk === "high") return "border-amber-400 bg-amber-50/60";
    if (risk === "critical") return "border-red-400 bg-red-50/60";
    return "border-border bg-white";
  };

  const ctrlBtn =
    "w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors";

  return (
    <div className="flex-1 relative bg-white border border-border rounded-sm shadow-sm overflow-hidden flex flex-col select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Controls */}
      <div data-control className="absolute top-3 right-3 z-30 flex flex-col gap-1">
        <button title="Zoom in" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 0.15))} className={ctrlBtn}>
          <ZoomIn size={12} />
        </button>
        <button title="Zoom out" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 0.15))} className={ctrlBtn}>
          <ZoomOut size={12} />
        </button>
        <button title="Reset view" onClick={resetView} className={ctrlBtn}>
          <Crosshair size={12} />
        </button>
        <button title="Reset layout" onClick={resetLayout} className={ctrlBtn}>
          <RotateCcw size={12} />
        </button>
        <div className="h-px bg-border my-0.5" />
        <button
          title="Toggle connection pulse"
          onClick={() => setPulse((p) => !p)}
          className={cn(ctrlBtn, pulse && "bg-primary/10 border-primary/40 text-primary")}
        >
          <Radio size={12} />
        </button>
        <button
          title={expandAll ? "Collapse departments" : "Expand all departments"}
          onClick={() => setExpandAll((s) => !s)}
          className={cn(ctrlBtn, expandAll && "bg-primary/10 border-primary/40 text-primary")}
        >
          <Layers size={12} />
        </button>
      </div>

      {/* Zoom readout */}
      <div data-control className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <div className="px-2 py-1 bg-white/90 border border-border rounded-sm shadow-sm text-[9px] font-mono font-bold text-muted-foreground">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      <div
        ref={containerRef}
        onPointerDown={startPan}
        className={cn(
          "flex-1 overflow-hidden flex items-center justify-center touch-none",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center top",
            width: CW,
            height: WORLD_H,
            position: "relative",
            transition: drag.current ? "none" : "transform 0.12s ease-out",
          }}
        >
          {/* SVG connections */}
          <svg width={CW} height={WORLD_H} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker id="dt-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <circle cx="3" cy="3" r="2" fill="hsl(228 71% 54%)" />
              </marker>
            </defs>
            {BU_LIST.map((bu) => {
              const p = positions[bu.id];
              const isSelected = selectedBu === bu.id;
              const isHot = hovered === bu.id;
              const color = isSelected
                ? "hsl(228 71% 54%)"
                : bu.risk === "high"
                ? "#f59e0b"
                : "#94a3b8";
              return (
                <g key={bu.id}>
                  <line
                    x1={core.x}
                    y1={core.y + 60}
                    x2={p.x}
                    y2={p.y - 4}
                    stroke={color}
                    strokeWidth={isSelected || isHot ? 2 : 1}
                    strokeOpacity={isSelected || isHot ? 0.75 : 0.3}
                    strokeDasharray={isSelected ? "none" : "5 5"}
                  >
                    {pulse && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="20"
                        to="0"
                        dur={isSelected ? "0.8s" : "1.6s"}
                        repeatCount="indefinite"
                      />
                    )}
                  </line>
                </g>
              );
            })}
          </svg>

          {/* Enterprise Core Node */}
          <div
            data-node
            onPointerDown={(e) => startNodeDrag("__core__", e)}
            style={{
              position: "absolute",
              left: core.x,
              top: core.y,
              transform: "translate(-50%, -50%)",
              zIndex: dragId === "__core__" ? 40 : 20,
            }}
            className={cn("cursor-grab active:cursor-grabbing", dragId === "__core__" && "cursor-grabbing")}
          >
            <div
              className={cn(
                "w-[200px] bg-primary/10 border-2 border-primary rounded-sm overflow-hidden transition-shadow",
                dragId === "__core__" ? "shadow-2xl ring-2 ring-primary/30" : "shadow-lg"
              )}
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-primary/20 bg-primary/5">
                <Move size={11} className="text-primary/50 shrink-0" />
                <span className="text-[9px] uppercase tracking-widest text-primary font-bold flex-1">Enterprise Core</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                    <div className="text-[13px] font-bold text-primary leading-none">{ENTERPRISE_METRICS.totalAgents}</div>
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
          {BU_LIST.map((bu) => {
            const p = positions[bu.id];
            const isSelected = selectedBu === bu.id;
            const isHot = hovered === bu.id;
            const blurred = scopedBuId !== null && bu.id !== scopedBuId;
            const dragging = dragId === bu.id;
            const expanded = isSelected || expandAll;
            return (
              <div
                key={bu.id}
                data-node
                onPointerDown={(e) => startNodeDrag(bu.id, e)}
                onMouseEnter={() => setHovered(bu.id)}
                onMouseLeave={() => setHovered((h) => (h === bu.id ? null : h))}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  transform: "translate(-50%, 0)",
                  zIndex: dragging ? 40 : isHot ? 30 : 20,
                }}
                className={cn(dragging && "cursor-grabbing")}
              >
                <BlurGate active={blurred}>
                  {/* Hover tooltip */}
                  {isHot && !dragging && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-[168px] bg-foreground text-white rounded-sm shadow-xl px-2.5 py-2 z-50 pointer-events-none">
                      <div className="text-[10px] font-bold mb-1">{bu.name}</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                        <span className="text-white/60">EEI Contrib</span>
                        <span className="font-mono font-bold text-emerald-300 text-right">{bu.eeiContrib}</span>
                        <span className="text-white/60">ROI</span>
                        <span className="font-mono text-right">{bu.roi}</span>
                        <span className="text-white/60">Cost</span>
                        <span className="font-mono text-right">{bu.cost}</span>
                        <span className="text-white/60">Open Tasks</span>
                        <span className="font-mono text-right">{bu.openTasks}</span>
                        <span className="text-white/60">Automation</span>
                        <span className="font-mono text-right">{bu.automationPct}%</span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-white/15 text-[8px] uppercase tracking-widest text-white/40 flex items-center gap-1">
                        <Move size={8} /> drag · dbl-click to open
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foreground" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "w-[140px] border rounded-sm cursor-grab active:cursor-grabbing transition-all",
                      dragging ? "shadow-2xl scale-[1.03]" : isHot ? "shadow-lg" : "shadow-sm",
                      getRiskBorder(bu.risk, isSelected)
                    )}
                    onClick={() => {
                      if (movedRef.current) return;
                      onSelectBu(isSelected ? null : bu.id);
                    }}
                    onDoubleClick={() => navigate(`/business-units/${bu.id}`)}
                  >
                    <div className="px-2.5 pt-2 pb-1.5">
                      <div className="flex items-center gap-1 mb-1">
                        <Move size={9} className="text-muted-foreground/40 shrink-0" />
                        <div className="text-[9px] uppercase tracking-widest font-bold text-foreground/70 truncate flex-1">
                          {bu.name.replace(" Intelligence", "")}
                        </div>
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

                    {/* Department summary strip */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-t border-border/60 bg-muted/20">
                      <Layers size={9} className="text-muted-foreground/60 shrink-0" />
                      <div className="flex gap-0.5 flex-1">
                        {bu.employees.map((emp) => (
                          <span
                            key={emp.name}
                            className={cn("w-1.5 h-1.5 rounded-full", deptStatus(emp.status).dot)}
                            title={`${emp.name} · ${deptStatus(emp.status).label}`}
                          />
                        ))}
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-muted-foreground shrink-0">
                        {bu.employees.length} depts
                      </span>
                      {expanded ? (
                        <ChevronDown size={10} className="text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight size={10} className="text-muted-foreground shrink-0" />
                      )}
                    </div>

                    {isSelected && (
                      <button
                        data-control
                        onClick={(e) => { e.stopPropagation(); navigate(`/business-units/${bu.id}`); }}
                        className="w-full text-[8px] uppercase tracking-widest font-bold text-primary bg-primary/5 border-t border-primary/20 py-1 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1"
                      >
                        Open Detail →
                      </button>
                    )}
                  </div>

                  {/* Departments — clean vertical chain, revealed on focus */}
                  {expanded && (
                    <DepartmentStack
                      employees={bu.employees}
                      hovered={hoveredDept}
                      onHover={setHoveredDept}
                    />
                  )}
                </BlurGate>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interaction hint */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 px-2.5 py-1.5 bg-white/90 border border-border rounded-sm shadow-sm text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><Move size={10} /> Drag nodes</span>
        <span className="flex items-center gap-1"><Hand size={10} /> Pan canvas</span>
        <span className="flex items-center gap-1"><ZoomIn size={10} /> Scroll to zoom</span>
      </div>

      {/* Live Minimap — reflects real node positions + viewport */}
      <Minimap positions={positions} selectedBu={selectedBu} pan={pan} zoom={zoom} containerRef={containerRef} />
    </div>
  );
}

// ─── Minimap ──────────────────────────────────────────────────

function Minimap({
  positions,
  selectedBu,
  pan,
  zoom,
  containerRef,
}: {
  positions: Record<string, Pos>;
  selectedBu: string | null;
  pan: Pos;
  zoom: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const MW = 120;
  const MH = 72;
  const sx = MW / CW;
  const sy = MH / WORLD_H;

  // Viewport rectangle in world coords → minimap coords.
  const el = containerRef.current;
  const vw = el ? el.clientWidth : CW;
  const vh = el ? el.clientHeight : WORLD_H;
  // World point at container center = (CW/2, 0) origin with translate(pan)+scale.
  // Visible world region top-left:
  const worldLeft = CX - vw / 2 / zoom - pan.x / zoom;
  const worldTop = -pan.y / zoom;
  const rectX = worldLeft * sx;
  const rectY = worldTop * sy;
  const rectW = (vw / zoom) * sx;
  const rectH = (vh / zoom) * sy;

  return (
    <div
      data-control
      className="absolute bottom-3 right-3 z-20 bg-white/95 border border-border rounded-sm shadow-sm overflow-hidden"
      style={{ width: MW, height: MH }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:8px_8px]" />
      <svg width={MW} height={MH} className="absolute inset-0">
        {/* connections */}
        {BU_LIST.map((bu) => {
          const p = positions[bu.id];
          const c = positions.__core__;
          return (
            <line
              key={bu.id}
              x1={c.x * sx}
              y1={c.y * sy}
              x2={p.x * sx}
              y2={p.y * sy}
              stroke="#cbd5e1"
              strokeWidth={0.75}
            />
          );
        })}
        {/* core */}
        <circle cx={positions.__core__.x * sx} cy={positions.__core__.y * sy} r={3} className="fill-primary" />
        {/* BUs */}
        {BU_LIST.map((bu) => {
          const p = positions[bu.id];
          const fill =
            selectedBu === bu.id ? "hsl(228 71% 54%)" : bu.risk === "high" ? "#f59e0b" : "#94a3b8";
          return <rect key={bu.id} x={p.x * sx - 3} y={p.y * sy - 2} width={6} height={4} rx={1} fill={fill} />;
        })}
        {/* viewport */}
        <rect
          x={Math.max(0, rectX)}
          y={Math.max(0, rectY)}
          width={Math.min(MW, rectW)}
          height={Math.min(MH, rectH)}
          fill="hsl(228 71% 54%)"
          fillOpacity={0.08}
          stroke="hsl(228 71% 54%)"
          strokeOpacity={0.6}
          strokeWidth={1}
        />
      </svg>
      <div className="absolute bottom-0.5 left-1 text-[7px] uppercase tracking-widest text-muted-foreground pointer-events-none">
        minimap
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

// Role-aware entry: each persona sees the twin at their own altitude.
//   ceo          → whole-enterprise topology (this file)
//   abu_head     → their single ABU + its departments  (AbuTwin)
//   dept_manager → their single department + operating nodes (DeptTwin)
//   employee     → their department twin, read-only feel (DeptTwin)
export default function DigitalTwin() {
  const { role } = useAppContext();
  if (role === "abu_head") return <AbuTwin />;
  if (role === "dept_manager" || role === "employee") return <DeptTwin />;
  return <EnterpriseTwin />;
}

function EnterpriseTwin() {
  const [selectedBu, setSelectedBu] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="ENTERPRISE DIGITAL TWIN"
        metrics={[
          { label: "AI Workforce", value: ENTERPRISE_METRICS.totalAgents },
          { label: "Human Workforce", value: 1840 },
          { label: "Total Decisions", value: "18.4K" },
        ]}
      />

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Enterprise Topology
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            EEI <span className="text-primary font-bold">{ENTERPRISE_METRICS.eeiScore}</span>
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
        <OrgNavigator selectedBu={selectedBu} onSelect={setSelectedBu} scopedBuId={null} />

        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <TopologyMap
            eeiScore={ENTERPRISE_METRICS.eeiScore}
            selectedBu={selectedBu}
            onSelectBu={setSelectedBu}
            scopedBuId={null}
          />
        </div>

        <LiveIntelligence />
      </div>
    </div>
  );
}
