import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { KPI_CATALOG, BU_LIST, type KpiEntry } from "@/data/enterprise-data";
import {
  useTwinCanvas, CanvasStage, TwinMinimap, CanvasBtn, ringLayout, type Pos, type MiniNode,
} from "@/components/twin/twin-canvas";
import { GitBranch, Network, Move } from "lucide-react";

const kpiById = (id: string) => KPI_CATALOG.find((k) => k.id === id);
const healthColor = (s: number) => (s >= 85 ? "#10b981" : s >= 70 ? "#f59e0b" : "#ef4444");
const healthText = (s: number) => (s >= 85 ? "text-emerald-600" : s >= 70 ? "text-amber-600" : "text-red-600");

type Mode = "tree" | "relationship";

// ─── Metric Tree ──────────────────────────────────────────────

const TREE_WORLD = { w: 1080, h: 680 };
const LAYER_H = 118;
const NODE_W = 170;

function buildChain(focusId: string) {
  const seen = new Set([focusId]);
  const upLayers: string[][] = [];
  let frontier = kpiById(focusId)?.dependsOn ?? [];
  for (let d = 0; d < 3 && frontier.length; d++) {
    const layer = Array.from(new Set(frontier.filter((id) => !seen.has(id) && kpiById(id))));
    if (!layer.length) break;
    layer.forEach((id) => seen.add(id));
    upLayers.push(layer);
    frontier = layer.flatMap((id) => kpiById(id)?.dependsOn ?? []);
  }
  seen.clear();
  seen.add(focusId);
  const downLayers: string[][] = [];
  frontier = kpiById(focusId)?.feeds ?? [];
  for (let d = 0; d < 3 && frontier.length; d++) {
    const layer = Array.from(new Set(frontier.filter((id) => !seen.has(id) && kpiById(id))));
    if (!layer.length) break;
    layer.forEach((id) => seen.add(id));
    downLayers.push(layer);
    frontier = layer.flatMap((id) => kpiById(id)?.feeds ?? []);
  }
  return { layers: [...[...upLayers].reverse(), [focusId], ...downLayers] };
}

function TreeCanvas({ focusId, onOpenKpi }: { focusId: string; onOpenKpi: (id: string) => void }) {
  const { layers } = useMemo(() => buildChain(focusId), [focusId]);

  const build = useCallback((): Record<string, Pos> => {
    const pos: Record<string, Pos> = {};
    const startY = 70;
    layers.forEach((layerIds, li) => {
      const y = startY + li * LAYER_H;
      const totalW = (layerIds.length - 1) * (NODE_W + 30);
      layerIds.forEach((id, i) => {
        pos[id] = { x: TREE_WORLD.w / 2 - totalW / 2 + i * (NODE_W + 30), y };
      });
    });
    return pos;
  }, [layers]);

  const cv = useTwinCanvas(build, TREE_WORLD);

  const edges: [string, string][] = [];
  layers.flat().forEach((id) => {
    const k = kpiById(id);
    if (!k) return;
    k.feeds.forEach((f) => { if (cv.positions[f]) edges.push([id, f]); });
  });

  const miniNodes: MiniNode[] = layers.flat().map((id) => ({
    id, color: id === focusId ? "hsl(228 71% 54%)" : healthColor(kpiById(id)?.healthScore ?? 80),
  }));

  return (
    <CanvasStage cv={cv} minimap={<TwinMinimap cv={cv} nodes={miniNodes} edges={edges} />}>
      <svg width={TREE_WORLD.w} height={TREE_WORLD.h} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {edges.map(([a, b], i) => {
          const pa = cv.positions[a], pb = cv.positions[b];
          if (!pa || !pb) return null;
          return (
            <line key={i} x1={pa.x} y1={pa.y + 30} x2={pb.x} y2={pb.y - 30} stroke="hsl(228 71% 54%)" strokeWidth={1.5} strokeOpacity={0.5} markerEnd="url(#tree-arrow)">
              <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.2s" repeatCount="indefinite" />
            </line>
          );
        })}
        <defs>
          <marker id="tree-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="hsl(228 71% 54%)" fillOpacity={0.6} />
          </marker>
        </defs>
      </svg>

      {layers.flat().map((id) => {
        const k = kpiById(id);
        if (!k) return null;
        const p = cv.positions[id];
        const isFocus = id === focusId;
        const dragging = cv.dragId === id;
        return (
          <div
            key={id}
            data-node
            onPointerDown={(e) => cv.startNodeDrag(id, e)}
            onClick={() => { if (!cv.movedRef.current) onOpenKpi(id); }}
            style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", zIndex: dragging ? 40 : isFocus ? 30 : 20, width: NODE_W }}
            className="cursor-grab active:cursor-grabbing"
          >
            <div className={cn(
              "bg-white border rounded-md overflow-hidden transition-shadow",
              dragging ? "shadow-2xl" : "shadow-sm hover:shadow-md",
              isFocus ? "border-primary ring-2 ring-primary/25" : "border-border"
            )}>
              <div className="flex items-center gap-1.5 px-2.5 py-2">
                <span className={cn("w-2 h-2 rounded-full shrink-0", isFocus ? "bg-primary" : "")} style={!isFocus ? { background: healthColor(k.healthScore) } : undefined} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-foreground truncate">{k.abbreviation ?? k.name}</div>
                  <div className="text-[8px] text-muted-foreground truncate">{k.fullName}</div>
                </div>
              </div>
              <div className="px-2.5 py-1.5 border-t border-border/60 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-foreground">{k.value}</span>
                <span className={cn("text-[9px] font-mono font-bold", healthText(k.healthScore))}>{k.healthScore}</span>
              </div>
            </div>
          </div>
        );
      })}
    </CanvasStage>
  );
}

// ─── Relationship Graph ───────────────────────────────────────

const REL_WORLD = { w: 1440, h: 1040 };
const REL_CX = REL_WORLD.w / 2;
const REL_CY = 280;
const BU_RADIUS = 240;
// KPI leaves fan out from their BU as a 2-column grid along the outward
// radial direction (not a tight arc) — an arc at this radius packs card
// centers closer together than the cards are wide, so they overlap.
const KPI_OUT_BASE = 150;
const KPI_ROW_GAP = 74;
const KPI_COL_GAP = 128;

function RelationshipCanvas({ onOpenKpi }: { onOpenKpi: (id: string) => void }) {
  const buIds = BU_LIST.map((b) => b.id);
  const kpisByBu = useMemo(() => {
    const map: Record<string, KpiEntry[]> = {};
    buIds.forEach((id) => {
      map[id] = KPI_CATALOG.filter((k) => k.buIds.includes(id) && k.buIds.length === 1)
        .sort((a, b) => a.healthScore - b.healthScore)
        .slice(0, 5);
    });
    return map;
  }, []);

  const build = useCallback((): Record<string, Pos> => {
    const pos: Record<string, Pos> = { __core__: { x: REL_CX, y: REL_CY } };
    const buPos = ringLayout(buIds, REL_CX, REL_CY, BU_RADIUS);
    Object.assign(pos, buPos);
    buIds.forEach((buId) => {
      const bp = buPos[buId];
      const dx = bp.x - REL_CX, dy = bp.y - REL_CY;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len; // unit vector pointing outward from center, through this BU
      const px = -uy, py = ux; // perpendicular unit vector, for side-to-side spread

      kpisByBu[buId].forEach((k, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2 === 0 ? -0.5 : 0.5;
        const out = KPI_OUT_BASE + row * KPI_ROW_GAP;
        pos[`kpi:${k.id}`] = {
          x: bp.x + ux * out + px * col * KPI_COL_GAP,
          y: bp.y + uy * out + py * col * KPI_COL_GAP,
        };
      });
    });
    return pos;
  }, []);

  const cv = useTwinCanvas(build, REL_WORLD);

  const edges: [string, string][] = [];
  buIds.forEach((buId) => {
    edges.push(["__core__", buId]);
    kpisByBu[buId].forEach((k) => edges.push([buId, `kpi:${k.id}`]));
  });

  const miniNodes: MiniNode[] = [
    { id: "__core__", color: "hsl(228 71% 54%)", shape: "circle", r: 4 },
    ...buIds.map((id) => ({ id, color: "hsl(228 71% 54%)" })),
    ...buIds.flatMap((buId) => kpisByBu[buId].map((k) => ({ id: `kpi:${k.id}`, color: healthColor(k.healthScore) }))),
  ];

  return (
    <CanvasStage cv={cv} minimap={<TwinMinimap cv={cv} nodes={miniNodes} edges={edges} />}>
      <svg width={REL_WORLD.w} height={REL_WORLD.h} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {edges.map(([a, b], i) => {
          const pa = cv.positions[a], pb = cv.positions[b];
          if (!pa || !pb) return null;
          const isCore = a === "__core__";
          return (
            <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={isCore ? "hsl(228 71% 54%)" : "#94a3b8"}
              strokeWidth={isCore ? 1.75 : 1} strokeOpacity={isCore ? 0.6 : 0.35} strokeDasharray={isCore ? "none" : "4 4"} />
          );
        })}
      </svg>

      {/* Enterprise core */}
      <div data-node onPointerDown={(e) => cv.startNodeDrag("__core__", e)}
        style={{ position: "absolute", left: cv.positions.__core__.x, top: cv.positions.__core__.y, transform: "translate(-50%,-50%)", zIndex: 20 }}
        className="cursor-grab active:cursor-grabbing">
        <div className="w-[140px] bg-primary/10 border-2 border-primary rounded-sm shadow-lg px-3 py-2.5 text-center">
          <Network size={14} className="text-primary mx-auto mb-1" />
          <div className="text-[9px] uppercase tracking-widest font-bold text-primary">Enterprise</div>
        </div>
      </div>

      {/* BU nodes */}
      {buIds.map((buId) => {
        const bu = BU_LIST.find((b) => b.id === buId)!;
        const p = cv.positions[buId];
        const dragging = cv.dragId === buId;
        return (
          <div key={buId} data-node onPointerDown={(e) => cv.startNodeDrag(buId, e)}
            style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)", zIndex: dragging ? 40 : 20 }}
            className="cursor-grab active:cursor-grabbing">
            <div className={cn("w-[120px] bg-white border rounded-sm shadow-sm px-2.5 py-2 text-center", dragging && "shadow-2xl")}>
              <div className="text-[9px] uppercase tracking-widest font-bold text-foreground/80 truncate">{bu.name}</div>
              <div className="text-[13px] font-bold font-mono text-primary">{bu.eei}</div>
            </div>
          </div>
        );
      })}

      {/* KPI leaf nodes */}
      {buIds.flatMap((buId) => kpisByBu[buId].map((k) => {
        const key = `kpi:${k.id}`;
        const p = cv.positions[key];
        if (!p) return null;
        const dragging = cv.dragId === key;
        return (
          <div key={key} data-node onPointerDown={(e) => cv.startNodeDrag(key, e)}
            onClick={() => { if (!cv.movedRef.current) onOpenKpi(k.id); }}
            style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)", zIndex: dragging ? 40 : 15 }}
            className="cursor-grab active:cursor-grabbing">
            <div className={cn("w-[104px] bg-white border rounded-sm shadow-sm px-2 py-1.5 text-center hover:shadow-md transition-shadow", dragging && "shadow-2xl")}>
              <div className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: healthColor(k.healthScore) }} />
                <span className="text-[9px] font-bold font-mono text-foreground truncate">{k.abbreviation ?? k.name}</span>
              </div>
              <div className="text-[9px] font-mono text-muted-foreground">{k.value}</div>
            </div>
          </div>
        );
      }))}
    </CanvasStage>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export function GraphView({ onOpenKpi }: { onOpenKpi: (id: string) => void }) {
  const [mode, setMode] = useState<Mode>("relationship");
  const [focusId, setFocusId] = useState("k1");

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-border bg-white flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 border border-border rounded-sm p-0.5 bg-white">
          <button onClick={() => setMode("relationship")} className={cn("flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-sm transition-colors", mode === "relationship" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
            <Network size={11} /> Relationship Graph
          </button>
          <button onClick={() => setMode("tree")} className={cn("flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-sm transition-colors", mode === "tree" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
            <GitBranch size={11} /> Metric Tree
          </button>
        </div>
        {mode === "tree" && (
          <select value={focusId} onChange={(e) => setFocusId(e.target.value)} className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white text-muted-foreground">
            {KPI_CATALOG.map((k) => <option key={k.id} value={k.id}>{k.fullName}</option>)}
          </select>
        )}
        <div className="flex-1" />
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><Move size={10} /> Drag · Scroll to zoom · Click a KPI to open details</span>
      </div>
      <div className="flex-1 p-3 min-h-0">
        {mode === "tree" ? <TreeCanvas key={focusId} focusId={focusId} onOpenKpi={onOpenKpi} /> : <RelationshipCanvas key="rel" onOpenKpi={onOpenKpi} />}
      </div>
    </div>
  );
}
