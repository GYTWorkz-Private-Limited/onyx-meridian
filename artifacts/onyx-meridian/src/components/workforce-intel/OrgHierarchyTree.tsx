import { useState } from "react";
import { ChevronRight, ChevronDown, Network } from "lucide-react";
import { BlurGate } from "@/components/shared/BlurGate";
import type { OrgNode } from "@/data/workforce-intelligence-data";

function TreeRow({ node, depth, onSelectBu, scopedBuId }: { node: OrgNode; depth: number; onSelectBu: (buId: string | null) => void; scopedBuId: string | null }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const blurred = scopedBuId !== null && node.buId !== null && node.buId !== scopedBuId;
  return (
    <div>
      <BlurGate active={blurred}>
        <div
          style={{ marginLeft: depth * 14 }}
          className="flex items-center gap-1.5 py-1.5 px-2 rounded-sm hover:bg-muted/40 cursor-pointer group"
          onClick={() => (hasChildren ? setOpen((o) => !o) : onSelectBu(node.buId))}
        >
          {hasChildren ? (
            open ? <ChevronDown size={11} className="text-muted-foreground shrink-0" /> : <ChevronRight size={11} className="text-muted-foreground shrink-0" />
          ) : <span className="w-[11px] shrink-0" />}
          <span className="text-[10px] font-semibold text-foreground truncate flex-1">{node.name}</span>
          <span className="text-[9px] text-muted-foreground shrink-0">{node.title}</span>
          <span className="text-[9px] font-mono font-bold text-primary shrink-0">{node.headcount}</span>
        </div>
      </BlurGate>
      {open && node.children.map((c) => <TreeRow key={c.id} node={c} depth={depth + 1} onSelectBu={onSelectBu} scopedBuId={scopedBuId} />)}
    </div>
  );
}

export function OrgHierarchyTree({ root, onSelectBu, scopedBuId = null }: { root: OrgNode; onSelectBu: (buId: string | null) => void; scopedBuId?: string | null }) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Network size={13} className="text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organization Hierarchy</span>
      </div>
      <div className="max-h-[260px] overflow-y-auto">
        <TreeRow node={root} depth={0} onSelectBu={onSelectBu} scopedBuId={scopedBuId} />
      </div>
    </div>
  );
}
