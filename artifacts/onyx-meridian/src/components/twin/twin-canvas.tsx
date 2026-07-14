import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  RotateCcw,
  Move,
  Hand,
  Gauge,
  Wrench,
  Boxes,
  LineChart,
  Warehouse,
  Route,
  ShieldAlert,
  ShoppingCart,
  FileText,
  Calculator,
  ClipboardCheck,
  Target,
  Zap,
  Users,
  CalendarClock,
  ScanSearch,
  Cpu,
  Activity,
  Workflow,
  Plug,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

export type Pos = { x: number; y: number };
export type World = { w: number; h: number };

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;

type DragCtx = {
  id: string | "__canvas__";
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  moved: boolean;
};

export interface TwinCanvas {
  zoom: number;
  pan: Pos;
  positions: Record<string, Pos>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>;
  dragId: string | null;
  isPanning: boolean;
  world: World;
  containerRef: React.RefObject<HTMLDivElement | null>;
  drag: React.MutableRefObject<DragCtx | null>;
  movedRef: React.MutableRefObject<boolean>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  startNodeDrag: (id: string, e: React.PointerEvent) => void;
  startPan: (e: React.PointerEvent) => void;
  resetView: () => void;
  resetLayout: () => void;
}

// ─── Interaction hook ─────────────────────────────────────────
// Shared pan / zoom / node-drag engine used by every twin. World-space is a
// fixed logical box (world.w × world.h) centered in its container; the inner
// wrapper carries `translate(pan) scale(zoom)` with a center-top origin.

export function useTwinCanvas(build: () => Record<string, Pos>, world: World): TwinCanvas {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pos>({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<string, Pos>>(build);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const panRef = useRef(pan);
  panRef.current = pan;

  const drag = useRef<DragCtx | null>(null);
  const movedRef = useRef(false);

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
        setPositions((prev) => ({ ...prev, [d.id]: { x: d.origX + dx / z, y: d.origY + dy / z } }));
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z - e.deltaY * 0.0015 * z)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const startNodeDrag = useCallback((id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const p = positionsRef.current[id];
    if (!p) return;
    drag.current = { id, startX: e.clientX, startY: e.clientY, origX: p.x, origY: p.y, moved: false };
    movedRef.current = false;
    setDragId(id);
  }, []);

  const startPan = useCallback((e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-node]") || t.closest("[data-control]")) return;
    drag.current = { id: "__canvas__", startX: e.clientX, startY: e.clientY, origX: panRef.current.x, origY: panRef.current.y, moved: false };
    setIsPanning(true);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);
  const resetLayout = useCallback(() => {
    setPositions(build());
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [build]);

  return {
    zoom,
    pan,
    positions,
    setPositions,
    dragId,
    isPanning,
    world,
    containerRef,
    drag,
    movedRef,
    setZoom,
    startNodeDrag,
    startPan,
    resetView,
    resetLayout,
  };
}

// ─── Layout helper ────────────────────────────────────────────

export function ringLayout(
  ids: string[],
  cx: number,
  cy: number,
  radius: number,
  opts?: { startDeg?: number; sweepDeg?: number }
): Record<string, Pos> {
  const start = ((opts?.startDeg ?? -90) * Math.PI) / 180;
  const sweep = ((opts?.sweepDeg ?? 360) * Math.PI) / 180;
  const full = (opts?.sweepDeg ?? 360) === 360;
  const n = ids.length;
  const out: Record<string, Pos> = {};
  ids.forEach((id, i) => {
    const t = n === 1 ? 0 : full ? i / n : i / (n - 1);
    const a = start + sweep * t;
    out[id] = { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  });
  return out;
}

// ─── Shared chrome ────────────────────────────────────────────

export const canvasBtnCls =
  "w-7 h-7 bg-white border border-border rounded-sm shadow-sm flex items-center justify-center hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors";

export function CanvasBtn({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button title={title} onClick={onClick} className={cn(canvasBtnCls, active && "bg-primary/10 border-primary/40 text-primary")}>
      {children}
    </button>
  );
}

// Frame + transformed stage + standard controls/hint. Callers pass the
// world-space content as children and an optional minimap / extra controls.
export function CanvasStage({
  cv,
  controls,
  minimap,
  children,
}: {
  cv: TwinCanvas;
  controls?: React.ReactNode;
  minimap?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 relative bg-white border border-border rounded-sm shadow-sm overflow-hidden flex flex-col select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div data-control className="absolute top-3 right-3 z-30 flex flex-col gap-1">
        <CanvasBtn title="Zoom in" onClick={() => cv.setZoom((z) => Math.min(ZOOM_MAX, z + 0.15))}>
          <ZoomIn size={12} />
        </CanvasBtn>
        <CanvasBtn title="Zoom out" onClick={() => cv.setZoom((z) => Math.max(ZOOM_MIN, z - 0.15))}>
          <ZoomOut size={12} />
        </CanvasBtn>
        <CanvasBtn title="Reset view" onClick={cv.resetView}>
          <Crosshair size={12} />
        </CanvasBtn>
        <CanvasBtn title="Reset layout" onClick={cv.resetLayout}>
          <RotateCcw size={12} />
        </CanvasBtn>
        {controls && <><div className="h-px bg-border my-0.5" />{controls}</>}
      </div>

      <div data-control className="absolute top-3 left-3 z-30">
        <div className="px-2 py-1 bg-white/90 border border-border rounded-sm shadow-sm text-[9px] font-mono font-bold text-muted-foreground">
          {Math.round(cv.zoom * 100)}%
        </div>
      </div>

      <div
        ref={cv.containerRef}
        onPointerDown={cv.startPan}
        className={cn(
          "flex-1 overflow-hidden flex items-center justify-center touch-none",
          cv.isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        <div
          style={{
            transform: `translate(${cv.pan.x}px, ${cv.pan.y}px) scale(${cv.zoom})`,
            transformOrigin: "center top",
            width: cv.world.w,
            height: cv.world.h,
            position: "relative",
            transition: cv.drag.current ? "none" : "transform 0.12s ease-out",
          }}
        >
          {children}
        </div>
      </div>

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 px-2.5 py-1.5 bg-white/90 border border-border rounded-sm shadow-sm text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><Move size={10} /> Drag nodes</span>
        <span className="flex items-center gap-1"><Hand size={10} /> Pan</span>
        <span className="flex items-center gap-1"><ZoomIn size={10} /> Scroll zoom</span>
      </div>

      {minimap}
    </div>
  );
}

export interface MiniNode {
  id: string;
  color: string;
  shape?: "rect" | "circle";
  r?: number;
}

export function TwinMinimap({ cv, nodes, edges }: { cv: TwinCanvas; nodes: MiniNode[]; edges: [string, string][] }) {
  const { world, containerRef, pan, zoom, positions } = cv;
  const MW = 120;
  const MH = 72;
  const sx = MW / world.w;
  const sy = MH / world.h;

  const el = containerRef.current;
  const vw = el ? el.clientWidth : world.w;
  const vh = el ? el.clientHeight : world.h;
  const worldLeft = world.w / 2 - vw / 2 / zoom - pan.x / zoom;
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
        {edges.map(([a, b], i) => {
          const pa = positions[a];
          const pb = positions[b];
          if (!pa || !pb) return null;
          return <line key={i} x1={pa.x * sx} y1={pa.y * sy} x2={pb.x * sx} y2={pb.y * sy} stroke="#cbd5e1" strokeWidth={0.75} />;
        })}
        {nodes.map((n) => {
          const p = positions[n.id];
          if (!p) return null;
          return n.shape === "circle" ? (
            <circle key={n.id} cx={p.x * sx} cy={p.y * sy} r={n.r ?? 3} fill={n.color} />
          ) : (
            <rect key={n.id} x={p.x * sx - 3} y={p.y * sy - 2} width={6} height={4} rx={1} fill={n.color} />
          );
        })}
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

// ─── Department status + icons (shared across twins) ──────────

export const DEPT_STATUS: Record<string, { dot: string; tint: string; icon: string; ring: string; label: string }> = {
  active: { dot: "bg-emerald-500", tint: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-200", label: "Operational" },
  watch: { dot: "bg-amber-500", tint: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-200", label: "Watch" },
  critical: { dot: "bg-red-500", tint: "bg-red-50", icon: "text-red-600", ring: "ring-red-200", label: "Critical" },
};
export const deptStatus = (s: string) => DEPT_STATUS[s] ?? DEPT_STATUS.active;

export function deptIcon(role: string, name: string): LucideIcon {
  const s = `${role} ${name}`.toLowerCase();
  if (/schedul|plann|demand|forecast/.test(s)) return CalendarClock;
  if (/oee|equipment|efficien|throughput/.test(s)) return Gauge;
  if (/maintenance|failure|predict/.test(s)) return Wrench;
  if (/line|real-time|monitor/.test(s)) return Activity;
  if (/quality|defect|inspect|scan/.test(s)) return ScanSearch;
  if (/inventory|stock|boxes/.test(s)) return Boxes;
  if (/warehouse|wms/.test(s)) return Warehouse;
  if (/route|logistic|transport/.test(s)) return Route;
  if (/risk/.test(s)) return ShieldAlert;
  if (/audit|complian/.test(s)) return ClipboardCheck;
  if (/sourc|supplier|procure|purchas/.test(s)) return ShoppingCart;
  if (/contract|legal|document/.test(s)) return FileText;
  if (/cost|budget|finance|analyt/.test(s)) return Calculator;
  if (/pipeline|revenue|scout/.test(s)) return Target;
  if (/deal|sales|close|accelerat/.test(s)) return Zap;
  if (/account|customer|client/.test(s)) return Users;
  if (/model|intelligence/.test(s)) return LineChart;
  return Cpu;
}

// Department-twin child-node kinds (agent / workflow / integration / kpi).
export const KIND_META: Record<string, { icon: LucideIcon; color: string; tint: string; text: string; label: string }> = {
  agent: { icon: Sparkles, color: "hsl(228 71% 54%)", tint: "bg-primary/10", text: "text-primary", label: "AI Agent" },
  workflow: { icon: Workflow, color: "#8b5cf6", tint: "bg-violet-50", text: "text-violet-600", label: "Workflow" },
  integration: { icon: Plug, color: "#0891b2", tint: "bg-cyan-50", text: "text-cyan-600", label: "Integration" },
  kpi: { icon: LineChart, color: "#059669", tint: "bg-emerald-50", text: "text-emerald-600", label: "KPI" },
};
export const kindMeta = (k: string) => KIND_META[k] ?? KIND_META.agent;

// Clean vertical department chain used under an ABU node in the enterprise twin.
export function DepartmentStack({
  employees,
  hovered,
  onHover,
}: {
  employees: { name: string; role: string; status: string }[];
  hovered: string | null;
  onHover: (name: string | null) => void;
}) {
  return (
    <div className="mt-1 flex flex-col items-center">
      {employees.map((emp) => {
        const Icon = deptIcon(emp.role, emp.name);
        const st = deptStatus(emp.status);
        const isHot = hovered === emp.name;
        return (
          <div key={emp.name} className="flex flex-col items-center w-full">
            <div className="w-px h-2.5 bg-gradient-to-b from-border/40 to-border" />
            <div
              onMouseEnter={() => onHover(emp.name)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "w-[164px] bg-white border rounded-md overflow-hidden transition-all",
                isHot ? "border-primary/50 shadow-md -translate-y-px" : "border-border shadow-sm"
              )}
            >
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", st.tint)}>
                  <Icon size={13} className={st.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold text-foreground leading-tight truncate">{emp.name}</div>
                  <div className="text-[8px] text-muted-foreground leading-tight truncate">{emp.role}</div>
                </div>
                <span
                  className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot, emp.status === "critical" && "animate-pulse")}
                  title={st.label}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
