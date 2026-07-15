import { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { ANOMALIES, resolveDeptTwin } from "@/data/enterprise-data";
import {
  useTwinCanvas,
  CanvasStage,
  TwinMinimap,
  ringLayout,
  deptIcon,
  deptStatus,
  kindMeta,
  KIND_META,
  type Pos,
} from "@/components/twin/twin-canvas";
import { Radio, Activity, Building2, Move, ChevronRight } from "lucide-react";

const WORLD = { w: 1060, h: 740 };
const CX = WORLD.w / 2;
const CY = 360;
const RING_R = 285;

const KIND_ORDER = ["agent", "workflow", "integration", "kpi"] as const;

export default function DeptTwin() {
  const [, navigate] = useLocation();
  const { persona } = useAppContext();

  const twin = useMemo(() => resolveDeptTwin(persona.deptId, persona.buId), [persona.deptId, persona.buId]);

  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const build = useCallback((): Record<string, Pos> => {
    if (!twin) return { __dept__: { x: CX, y: CY } };
    const ids = twin.nodes.map((n) => n.id);
    return { __dept__: { x: CX, y: CY }, ...ringLayout(ids, CX, CY, RING_R) };
  }, [twin]);

  const cv = useTwinCanvas(build, WORLD);

  if (!twin) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FA]">
        <HeaderBar moduleName="DEPARTMENT DIGITAL TWIN" />
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No department is assigned to this persona.
        </div>
      </div>
    );
  }

  const edges = twin.nodes.map((n) => ["__dept__", n.id] as [string, string]);
  const miniNodes = [
    { id: "__dept__", color: "hsl(228 71% 54%)", shape: "circle" as const, r: 4 },
    ...twin.nodes.map((n) => ({ id: n.id, color: kindMeta(n.kind).color })),
  ];

  const anomalies = ANOMALIES.filter((a) => a.buId === twin.buId);
  const activeNode = selected ? twin.nodes.find((n) => n.id === selected) : null;
  const grouped = KIND_ORDER.map((k) => ({ kind: k, items: twin.nodes.filter((n) => n.kind === k) })).filter((g) => g.items.length);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="DEPARTMENT DIGITAL TWIN"
        metrics={[
          { label: "AI Agents", value: twin.agents },
          { label: "Workflows", value: twin.workflows },
          { label: "Open Tasks", value: twin.openTasks },
        ]}
      />

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Building2 size={13} className="text-primary shrink-0" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-foreground truncate">
            {twin.buName} / {twin.name}
          </span>
          <span className="text-[10px] text-muted-foreground hidden md:inline">·</span>
          <span className="text-[10px] text-muted-foreground hidden md:inline truncate">
            {persona.name} — {twin.nodes.length} operating nodes
          </span>
        </div>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border px-2 py-1 rounded-sm bg-white"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: node inspector grouped by kind */}
        <div className="w-[224px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Node Inspector
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {grouped.map((g) => {
              const km = kindMeta(g.kind);
              return (
                <div key={g.kind}>
                  <div className="flex items-center gap-1.5 px-1 mb-1">
                    <span className="w-2 h-2 rounded-sm" style={{ background: km.color }} />
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{km.label}s</span>
                    <span className="text-[9px] text-muted-foreground">{g.items.length}</span>
                  </div>
                  <div className="space-y-1">
                    {g.items.map((n) => {
                      const KIcon = km.icon;
                      const st = deptStatus(n.status);
                      const isSel = selected === n.id;
                      return (
                        <button
                          key={n.id}
                          onClick={() => setSelected(isSel ? null : n.id)}
                          onMouseEnter={() => setHovered(n.id)}
                          onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-sm border text-left transition-colors",
                            isSel ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-muted/50"
                          )}
                        >
                          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", km.tint)}>
                            <KIcon size={12} className={km.text} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-semibold text-foreground truncate">{n.label}</div>
                            <div className="text-[8px] text-muted-foreground truncate">{n.metric}</div>
                          </div>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: canvas */}
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <CanvasStage cv={cv} minimap={<TwinMinimap cv={cv} nodes={miniNodes} edges={edges} />}>
            <svg width={WORLD.w} height={WORLD.h} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {twin.nodes.map((n) => {
                const a = cv.positions.__dept__;
                const p = cv.positions[n.id];
                if (!a || !p) return null;
                const on = selected === n.id || hovered === n.id;
                const km = kindMeta(n.kind);
                return (
                  <line
                    key={n.id}
                    x1={a.x}
                    y1={a.y}
                    x2={p.x}
                    y2={p.y}
                    stroke={on ? km.color : "#cbd5e1"}
                    strokeWidth={on ? 2 : 1}
                    strokeOpacity={on ? 0.8 : 0.4}
                    strokeDasharray={on ? "none" : "5 5"}
                  >
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur={on ? "0.8s" : "1.8s"} repeatCount="indefinite" />
                  </line>
                );
              })}
            </svg>

            {/* Department core */}
            <DeptCore cv={cv} twin={twin} />

            {/* Operating nodes */}
            {twin.nodes.map((n) => (
              <OpNode
                key={n.id}
                cv={cv}
                node={n}
                selected={selected === n.id}
                hot={hovered === n.id}
                onSelect={() => {
                  if (cv.movedRef.current) return;
                  setSelected((s) => (s === n.id ? null : n.id));
                }}
                onHover={setHovered}
              />
            ))}
          </CanvasStage>
        </div>

        {/* Right: detail / feed */}
        <div className="w-[280px] shrink-0 border-l border-border bg-white flex flex-col overflow-hidden">
          {activeNode ? (
            <>
              <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground truncate">{activeNode.label}</span>
                <ChevronRight size={12} className="text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const km = kindMeta(activeNode.kind);
                    const KIcon = km.icon;
                    return (
                      <>
                        <div className={cn("w-9 h-9 rounded-md flex items-center justify-center", km.tint)}>
                          <KIcon size={16} className={km.text} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-foreground">{activeNode.label}</div>
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{km.label}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Stat l="Status" v={deptStatus(activeNode.status).label} c={deptStatus(activeNode.status).icon} />
                  <Stat l="Metric" v={activeNode.metric} />
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-sm px-3 py-2 text-[10px] text-muted-foreground leading-relaxed">
                  {activeNode.label} is an operating node in the <span className="font-semibold text-foreground">{twin.name}</span> department twin,
                  contributing to the {twin.buName} ABU. Live telemetry is mocked for this prototype.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Radio size={11} className="text-emerald-500" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Department Feed</span>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">• Live</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 border-b border-border grid grid-cols-2 gap-2">
                  {[
                    { l: "Health", v: `${twin.health}`, c: twin.health >= 84 ? "text-emerald-600" : "text-amber-600" },
                    { l: "Automation", v: `${twin.automation}%`, c: "text-emerald-600" },
                    { l: "AI Agents", v: `${twin.agents}`, c: "text-foreground" },
                    { l: "Open Tasks", v: `${twin.openTasks}`, c: twin.openTasks > 12 ? "text-amber-600" : "text-foreground" },
                  ].map((m) => (
                    <div key={m.l} className="bg-muted/30 rounded-sm px-2 py-1.5 border border-border/40">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.l}</div>
                      <div className={cn("text-sm font-bold font-mono", m.c)}>{m.v}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Activity size={11} className="text-muted-foreground" />
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Related Anomalies</span>
                  </div>
                  {anomalies.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground border border-dashed border-border rounded-sm px-3 py-4 text-center">
                      Nothing flagged for this department right now.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {anomalies.map((a) => (
                        <div
                          key={a.id}
                          className={cn(
                            "border rounded-sm p-2.5",
                            a.severity === "critical" ? "border-red-200 bg-red-50/50" : a.severity === "warning" ? "border-amber-200 bg-amber-50/50" : "border-border bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn("text-[9px] font-bold uppercase tracking-widest", a.severity === "critical" ? "text-red-600" : a.severity === "warning" ? "text-amber-600" : "text-blue-600")}>
                              {a.severity}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{a.age}</span>
                          </div>
                          <div className="text-[10px] font-semibold text-foreground leading-snug mb-1">{a.title}</div>
                          <button
                            onClick={() => navigate(`/incident/${a.id}`)}
                            className="w-full mt-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            Deep Dive →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kind legend */}
                  <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-1.5">
                    {KIND_ORDER.map((k) => {
                      const km = KIND_META[k];
                      return (
                        <div key={k} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-sm" style={{ background: km.color }} />
                          <span className="text-[9px] text-muted-foreground">{km.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Nodes ────────────────────────────────────────────────────

function DeptCore({ cv, twin }: { cv: ReturnType<typeof useTwinCanvas>; twin: NonNullable<ReturnType<typeof resolveDeptTwin>> }) {
  const p = cv.positions.__dept__;
  const dragging = cv.dragId === "__dept__";
  const Icon = deptIcon(twin.role, twin.name);
  const st = deptStatus(twin.status);
  return (
    <div
      data-node
      onPointerDown={(e) => cv.startNodeDrag("__dept__", e)}
      style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", zIndex: dragging ? 40 : 20 }}
      className={cn("cursor-grab active:cursor-grabbing", dragging && "cursor-grabbing")}
    >
      <div className={cn("w-[210px] bg-primary/10 border-2 border-primary rounded-sm overflow-hidden transition-shadow", dragging ? "shadow-2xl ring-2 ring-primary/30" : "shadow-lg")}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-primary/20 bg-primary/5">
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", st.tint)}>
            <Icon size={16} className={st.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-primary leading-tight truncate">{twin.name}</div>
            <div className="text-[8px] uppercase tracking-widest text-primary/60 truncate">{twin.role}</div>
          </div>
          <Move size={11} className="text-primary/40 shrink-0" />
        </div>
        <div className="grid grid-cols-3 divide-x divide-primary/20">
          <Core v={`${twin.health}`} l="Health" />
          <Core v={`${twin.automation}%`} l="Auto" />
          <Core v={`${twin.agents}`} l="Agents" />
        </div>
      </div>
    </div>
  );
}

function Core({ v, l }: { v: string; l: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="text-[15px] font-bold text-primary leading-none">{v}</div>
      <div className="text-[7px] uppercase tracking-widest text-primary/60 mt-0.5">{l}</div>
    </div>
  );
}

function OpNode({
  cv,
  node,
  selected,
  hot,
  onSelect,
  onHover,
}: {
  cv: ReturnType<typeof useTwinCanvas>;
  node: NonNullable<ReturnType<typeof resolveDeptTwin>>["nodes"][number];
  selected: boolean;
  hot: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}) {
  const p = cv.positions[node.id];
  if (!p) return null;
  const dragging = cv.dragId === node.id;
  const km = kindMeta(node.kind);
  const KIcon = km.icon;
  const st = deptStatus(node.status);
  return (
    <div
      data-node
      onPointerDown={(e) => cv.startNodeDrag(node.id, e)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onSelect}
      style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", zIndex: dragging ? 40 : selected || hot ? 30 : 20 }}
      className="cursor-grab active:cursor-grabbing"
    >
      <div
        className={cn(
          "w-[150px] bg-white border rounded-md overflow-hidden transition-all",
          dragging ? "shadow-2xl scale-[1.03]" : hot ? "shadow-lg" : "shadow-sm",
          selected ? "ring-2 ring-primary/20" : ""
        )}
        style={{ borderColor: selected ? km.color : undefined }}
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", km.tint)}>
            <KIcon size={13} className={km.text} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold text-foreground truncate leading-tight">{node.label}</div>
            <div className="text-[8px] text-muted-foreground truncate leading-tight">{km.label}</div>
          </div>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot, node.status === "critical" && "animate-pulse")} />
        </div>
        <div className="px-2 py-1 border-t border-border/60 flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{node.sub}</span>
          <span className="text-[9px] font-mono font-bold text-foreground">{node.metric}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ l, v, c }: { l: string; v: string; c?: string }) {
  return (
    <div className="bg-muted/30 rounded-sm px-2 py-1.5 border border-border/40">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{l}</div>
      <div className={cn("text-[11px] font-bold font-mono", c ?? "text-foreground")}>{v}</div>
    </div>
  );
}
