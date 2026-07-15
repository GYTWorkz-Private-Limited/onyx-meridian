import { Share2 } from "lucide-react";
import { collaborationEdges } from "@/data/workforce-intelligence-data";

const { nodes, edges } = collaborationEdges();

const W = 380;
const H = 260;
const CX = W / 2;
const CY = H / 2;
const R = 95;

const positions = nodes.map((n, i) => {
  const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
  return { ...n, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) };
});

export function CollaborationNetwork() {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Share2 size={13} className="text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Manager Collaboration Network</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {edges.map((e, i) => {
          const from = positions.find((p) => p.m === e.from);
          const to = positions.find((p) => p.m === e.to);
          if (!from || !to) return null;
          return (
            <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="hsl(228 71% 54%)" strokeOpacity={Math.min(0.6, e.weight / 12)} strokeWidth={Math.max(1, e.weight / 4)} />
          );
        })}
        {positions.map((p) => (
          <g key={p.m}>
            <circle cx={p.x} cy={p.y} r={16} fill="white" stroke="hsl(228 71% 54%)" strokeWidth={1.5} />
            <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="hsl(228 71% 54%)">
              {p.m.split(" ").map((s) => s[0]).join("")}
            </text>
            <text x={p.x} y={p.y + 28} textAnchor="middle" fontSize={8} fill="#6B7280">{p.m}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
