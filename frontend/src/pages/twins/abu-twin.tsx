import { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { BU_LIST, ANOMALIES, departmentsForBu, buildDeptTwin } from "@/data/enterprise-data";
import {
  useTwinCanvas,
  CanvasStage,
  TwinMinimap,
  ringLayout,
  deptIcon,
  deptStatus,
  kindMeta,
  type Pos,
} from "@/components/twin/twin-canvas";
import { Network, Radio, Activity, ChevronRight, Building2, Move } from "lucide-react";

const WORLD = { w: 940, h: 640 };
const CX = WORLD.w / 2;
const CY = 300;

export default function AbuTwin() {
  const [, navigate] = useLocation();
  const { currentBuId, persona } = useAppContext();
  const bu = BU_LIST.find((b) => b.id === currentBuId) ?? BU_LIST[0];

  const departments = useMemo(() => departmentsForBu(bu.id), [bu.id]);
  const twins = useMemo(() => departments.map((d) => buildDeptTwin(bu.id, d)), [departments, bu.id]);
  const twinById = useMemo(() => Object.fromEntries(twins.map((t) => [t.id, t])), [twins]);

  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const build = useCallback((): Record<string, Pos> => {
    const ids = departments.map((d) => d.id);
    return { __abu__: { x: CX, y: CY }, ...ringLayout(ids, CX, CY, 220) };
  }, [departments]);

  const cv = useTwinCanvas(build, WORLD);

  const edges = departments.map((d) => ["__abu__", d.id] as [string, string]);
  const miniNodes = [
    { id: "__abu__", color: "hsl(228 71% 54%)", shape: "circle" as const, r: 4 },
    ...departments.map((d) => ({
      id: d.id,
      color: selected === d.id ? "hsl(228 71% 54%)" : d.status === "watch" ? "#f59e0b" : "#94a3b8",
    })),
  ];

  const avgAuto = Math.round(twins.reduce((s, t) => s + t.automation, 0) / twins.length);
  const openTasks = twins.reduce((s, t) => s + t.openTasks, 0);
  const anomalies = ANOMALIES.filter((a) => a.buId === bu.id);
  const activeTwin = selected ? twinById[selected] : null;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="ABU DIGITAL TWIN"
        metrics={[
          { label: "AI Agents", value: bu.agents },
          { label: "Departments", value: departments.length },
          { label: "Workflows", value: bu.workflows },
        ]}
      />

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Building2 size={13} className="text-primary shrink-0" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-foreground truncate">{bu.name} · ABU Twin</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            EEI <span className="text-primary font-bold">{bu.eei}</span>
          </span>
          <span className="text-[10px] text-muted-foreground hidden md:inline">·</span>
          <span className="text-[10px] text-muted-foreground hidden md:inline">
            Scoped to {persona.name}'s unit — {departments.length} departments
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
        {/* Left: department list */}
        <div className="w-[220px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border shrink-0 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Departments
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {twins.map((t) => {
              const Icon = deptIcon(t.role, t.name);
              const st = deptStatus(t.status);
              const isSel = selected === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(isSel ? null : t.id)}
                  onMouseEnter={() => setHovered(t.id)}
                  onMouseLeave={() => setHovered((h) => (h === t.id ? null : h))}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-sm border text-left transition-colors",
                    isSel ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", st.tint)}>
                    <Icon size={13} className={st.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-foreground truncate">{t.name}</div>
                    <div className="text-[8px] text-muted-foreground truncate">{t.role}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("text-[10px] font-mono font-bold", t.health >= 84 ? "text-emerald-600" : t.health >= 70 ? "text-amber-600" : "text-red-600")}>
                      {t.health}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: canvas */}
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <CanvasStage cv={cv} minimap={<TwinMinimap cv={cv} nodes={miniNodes} edges={edges} />}>
            {/* connections */}
            <svg width={WORLD.w} height={WORLD.h} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {departments.map((d) => {
                const a = cv.positions.__abu__;
                const p = cv.positions[d.id];
                if (!a || !p) return null;
                const on = selected === d.id || hovered === d.id;
                return (
                  <line
                    key={d.id}
                    x1={a.x}
                    y1={a.y}
                    x2={p.x}
                    y2={p.y}
                    stroke={on ? "hsl(228 71% 54%)" : d.status === "watch" ? "#f59e0b" : "#94a3b8"}
                    strokeWidth={on ? 2 : 1}
                    strokeOpacity={on ? 0.75 : 0.3}
                    strokeDasharray={on ? "none" : "5 5"}
                  >
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur={on ? "0.8s" : "1.6s"} repeatCount="indefinite" />
                  </line>
                );
              })}
            </svg>

            {/* ABU core */}
            <AbuCore cv={cv} bu={bu} onOpen={() => navigate(`/business-units/${bu.id}`)} />

            {/* Department nodes */}
            {twins.map((t) => (
              <DeptNode
                key={t.id}
                cv={cv}
                twin={t}
                selected={selected === t.id}
                hot={hovered === t.id}
                onSelect={() => {
                  if (cv.movedRef.current) return;
                  setSelected((s) => (s === t.id ? null : t.id));
                }}
                onHover={setHovered}
              />
            ))}
          </CanvasStage>
        </div>

        {/* Right: detail / intelligence */}
        <div className="w-[280px] shrink-0 border-l border-border bg-white flex flex-col overflow-hidden">
          {activeTwin ? (
            <>
              <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground truncate">{activeTwin.name}</span>
                <ChevronRight size={12} className="text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 grid grid-cols-2 gap-2 border-b border-border">
                  {[
                    { l: "Health", v: `${activeTwin.health}`, c: activeTwin.health >= 84 ? "text-emerald-600" : "text-amber-600" },
                    { l: "Automation", v: `${activeTwin.automation}%`, c: "text-foreground" },
                    { l: "AI Agents", v: `${activeTwin.agents}`, c: "text-foreground" },
                    { l: "Open Tasks", v: `${activeTwin.openTasks}`, c: activeTwin.openTasks > 12 ? "text-amber-600" : "text-foreground" },
                  ].map((m) => (
                    <div key={m.l} className="bg-muted/30 rounded-sm px-2 py-1.5 border border-border/40">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.l}</div>
                      <div className={cn("text-sm font-bold font-mono", m.c)}>{m.v}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Operating Nodes</div>
                  <div className="space-y-1.5">
                    {activeTwin.nodes.map((n) => {
                      const km = kindMeta(n.kind);
                      const KIcon = km.icon;
                      return (
                        <div key={n.id} className="flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border/60">
                          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", km.tint)}>
                            <KIcon size={12} className={km.text} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-semibold text-foreground truncate">{n.label}</div>
                            <div className="text-[8px] text-muted-foreground">{km.label}</div>
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground shrink-0">{n.metric}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Radio size={11} className="text-emerald-500" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">ABU Intelligence</span>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">• Live</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 border-b border-border grid grid-cols-2 gap-2">
                  {[
                    { l: "ABU Health", v: `${bu.health}%`, c: "text-emerald-600" },
                    { l: "Automation", v: `${avgAuto}%`, c: "text-emerald-600" },
                    { l: "Open Tasks", v: `${openTasks}`, c: openTasks > 40 ? "text-amber-600" : "text-foreground" },
                    { l: "Risk", v: bu.risk, c: bu.risk === "high" ? "text-amber-600" : "text-emerald-600" },
                  ].map((m) => (
                    <div key={m.l} className="bg-muted/30 rounded-sm px-2 py-1.5 border border-border/40">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{m.l}</div>
                      <div className={cn("text-sm font-bold font-mono uppercase", m.c)}>{m.v}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Activity size={11} className="text-muted-foreground" />
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Anomalies</span>
                  </div>
                  {anomalies.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground border border-dashed border-border rounded-sm px-3 py-4 text-center">
                      No active anomalies in this ABU.
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

function AbuCore({ cv, bu, onOpen }: { cv: ReturnType<typeof useTwinCanvas>; bu: (typeof BU_LIST)[number]; onOpen: () => void }) {
  const p = cv.positions.__abu__;
  const dragging = cv.dragId === "__abu__";
  return (
    <div
      data-node
      onPointerDown={(e) => cv.startNodeDrag("__abu__", e)}
      onDoubleClick={onOpen}
      style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", zIndex: dragging ? 40 : 20 }}
      className={cn("cursor-grab active:cursor-grabbing", dragging && "cursor-grabbing")}
    >
      <div className={cn("w-[212px] bg-primary/10 border-2 border-primary rounded-sm overflow-hidden transition-shadow", dragging ? "shadow-2xl ring-2 ring-primary/30" : "shadow-lg")}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-primary/20 bg-primary/5">
          <Network size={12} className="text-primary/60 shrink-0" />
          <span className="text-[9px] uppercase tracking-widest text-primary font-bold flex-1 truncate">{bu.name} · ABU</span>
          <Move size={11} className="text-primary/40" />
        </div>
        <div className="grid grid-cols-2 divide-x divide-primary/20">
          <div className="flex flex-col items-center justify-center py-2.5">
            <div className="text-[30px] font-bold tracking-tighter text-primary leading-none">{bu.eei}</div>
            <div className="text-[8px] uppercase tracking-widest text-primary/60 mt-0.5">EEI Score</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-primary/20">
            <Cell v={`${bu.health}%`} l="Health" />
            <Cell v={String(bu.agents)} l="Agents" />
            <Cell v={String(bu.workflows)} l="Flows" />
            <Cell v={bu.risk} l="Risk" upper />
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          data-control
          className="w-full text-[8px] uppercase tracking-widest font-bold text-primary bg-primary/5 border-t border-primary/20 py-1 hover:bg-primary/10 transition-colors"
        >
          Open ABU Detail →
        </button>
      </div>
    </div>
  );
}

function Cell({ v, l, upper }: { v: string; l: string; upper?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-1.5 px-1">
      <div className={cn("text-[12px] font-bold text-primary leading-none", upper && "uppercase")}>{v}</div>
      <div className="text-[7px] uppercase tracking-widest text-primary/60 mt-0.5">{l}</div>
    </div>
  );
}

function DeptNode({
  cv,
  twin,
  selected,
  hot,
  onSelect,
  onHover,
}: {
  cv: ReturnType<typeof useTwinCanvas>;
  twin: ReturnType<typeof buildDeptTwin>;
  selected: boolean;
  hot: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}) {
  const p = cv.positions[twin.id];
  if (!p) return null;
  const dragging = cv.dragId === twin.id;
  const Icon = deptIcon(twin.role, twin.name);
  const st = deptStatus(twin.status);
  return (
    <div
      data-node
      onPointerDown={(e) => cv.startNodeDrag(twin.id, e)}
      onMouseEnter={() => onHover(twin.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onSelect}
      style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", zIndex: dragging ? 40 : selected || hot ? 30 : 20 }}
      className={cn("cursor-grab active:cursor-grabbing")}
    >
      <div
        className={cn(
          "w-[158px] bg-white border rounded-md overflow-hidden transition-all",
          dragging ? "shadow-2xl scale-[1.03]" : hot ? "shadow-lg" : "shadow-sm",
          selected ? "border-primary ring-2 ring-primary/20" : "border-border"
        )}
      >
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border/60">
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", st.tint)}>
            <Icon size={14} className={st.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold text-foreground truncate leading-tight">{twin.name}</div>
            <div className="text-[8px] text-muted-foreground truncate leading-tight">{twin.role}</div>
          </div>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot, twin.status === "critical" && "animate-pulse")} />
        </div>
        <div className="grid grid-cols-3 divide-x divide-border/60">
          <Mini v={String(twin.health)} l="Health" c={twin.health >= 84 ? "text-emerald-600" : twin.health >= 70 ? "text-amber-600" : "text-red-600"} />
          <Mini v={String(twin.agents)} l="Agents" />
          <Mini v={String(twin.workflows)} l="Flows" />
        </div>
      </div>
    </div>
  );
}

function Mini({ v, l, c }: { v: string; l: string; c?: string }) {
  return (
    <div className="px-1 py-1 text-center">
      <div className={cn("text-[10px] font-mono font-bold", c ?? "text-foreground")}>{v}</div>
      <div className="text-[7px] uppercase tracking-widest text-muted-foreground">{l}</div>
    </div>
  );
}
