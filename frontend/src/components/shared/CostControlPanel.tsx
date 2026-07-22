import { useState } from "react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { CAP_PRESETS } from "@/data/cost-control-data";
import { cn } from "@/lib/utils";
import { Lock, Unlock } from "lucide-react";

export interface CostEntity {
  id: string;
  name: string;
  subtitle?: string;
  spend: number;
  cap: number | null; // null = unlimited
  locked: boolean;
}

interface PendingAction {
  entity: CostEntity;
  kind: "cap" | "lock" | "unlock";
  value?: number | null;
}

interface CostControlPanelProps {
  title: string;
  entityLabel: string; // e.g. "Business Unit" | "Department" | "Person" | "Agent"
  entities: CostEntity[];
  onSetCap: (id: string, cap: number | null) => void;
  onToggleLock: (id: string, locked: boolean) => void;
  compact?: boolean;
  presets?: { label: string; value: number | null }[];
}

function headroomPct(e: CostEntity): number {
  if (e.locked) return 0;
  if (e.cap == null) return 100;
  if (e.cap === 0) return 0;
  return Math.max(0, Math.min(100, 100 - (e.spend / e.cap) * 100));
}

function headroomColor(e: CostEntity): string {
  const pct = headroomPct(e);
  return pct >= 40 ? "bg-emerald-500" : pct >= 15 ? "bg-amber-500" : "bg-red-500";
}

export function CostControlPanel({
  title, entityLabel, entities, onSetCap, onToggleLock, compact = false, presets = CAP_PRESETS,
}: CostControlPanelProps) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [customId, setCustomId] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState("");

  const sorted = [...entities].sort((a, b) => b.spend - a.spend);
  const visible = compact ? sorted.slice(0, 5) : sorted;

  const totalSpend = entities.reduce((s, e) => s + e.spend, 0);
  const totalCap = entities.reduce((s, e) => s + (e.cap ?? 0), 0);
  const lockedCount = entities.filter((e) => e.locked).length;
  const unlimitedCount = entities.filter((e) => e.cap == null).length;

  const confirmTitle = (a: PendingAction) => {
    if (a.kind === "lock") return `Lock ${a.entity.name} to $0 spending?`;
    if (a.kind === "unlock") return `Unlock ${a.entity.name}?`;
    return `Set ${a.entity.name}'s cap to ${a.value == null ? "Unlimited" : `$${a.value}`}?`;
  };

  const confirmDesc = (a: PendingAction) => {
    if (a.kind === "lock") return `${a.entity.name} will be blocked from any further AI spend until you unlock it. This takes effect immediately.`;
    if (a.kind === "unlock") return `${a.entity.name} will be able to spend again, up to its existing cap.`;
    if (a.value === 0) return `${a.entity.name} will be blocked from any further AI spend — equivalent to locking.`;
    if (a.value == null) return `${a.entity.name} will have no spending limit.`;
    return `Current spend is $${a.entity.spend.toFixed(0)}. This takes effect immediately.`;
  };

  const runPending = () => {
    if (!pending) return;
    if (pending.kind === "lock") onToggleLock(pending.entity.id, true);
    else if (pending.kind === "unlock") onToggleLock(pending.entity.id, false);
    else onSetCap(pending.entity.id, pending.value ?? null);
    setPending(null);
  };

  const applyCustom = (e: CostEntity) => {
    const v = parseFloat(customValue);
    if (isNaN(v) || v < 0) return;
    setPending({ entity: e, kind: "cap", value: v });
    setCustomId(null);
    setCustomValue("");
  };

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        {!compact && (
          <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-muted-foreground">
            <span>Spend <span className="font-mono font-bold text-foreground">${totalSpend.toFixed(0)}</span></span>
            {totalCap > 0 && <span>Capped <span className="font-mono font-bold text-foreground">${totalCap.toFixed(0)}</span></span>}
            <span>Locked <span className="font-mono font-bold text-red-600">{lockedCount}</span></span>
            <span>Unlimited <span className="font-mono font-bold text-emerald-600">{unlimitedCount}</span></span>
          </div>
        )}
      </div>
      <div className="divide-y divide-border">
        {visible.map((e) => (
          <div key={e.id} className="flex items-center gap-4 px-4 py-3 flex-wrap">
            <div className="w-40 shrink-0">
              <div className="text-xs font-semibold text-foreground truncate">{e.name}</div>
              {e.subtitle && <div className="text-[10px] text-muted-foreground truncate">{e.subtitle}</div>}
            </div>
            <div className="flex-1 min-w-[100px]">
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", headroomColor(e))} style={{ width: `${headroomPct(e)}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="text-[9px] font-mono text-muted-foreground">${e.spend.toFixed(0)} spent</span>
                <span className={cn("text-[9px] font-mono font-bold", e.locked ? "text-red-600" : "text-muted-foreground")}>
                  {e.locked ? "LOCKED" : e.cap == null ? "Unlimited" : `$${e.cap} cap`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
              {!compact && presets.filter((p) => p.value !== 0).map((p) => (
                <button key={p.label} onClick={() => setPending({ entity: e, kind: "cap", value: p.value })}
                  className={cn(
                    "text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border transition-colors",
                    !e.locked && e.cap === p.value ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:bg-muted/60"
                  )}>
                  {p.label}
                </button>
              ))}
              {!compact && (
                customId === e.id ? (
                  <div className="flex items-center gap-1">
                    <input autoFocus type="number" min={0} placeholder="$" value={customValue}
                      onChange={(ev) => setCustomValue(ev.target.value)}
                      onKeyDown={(ev) => { if (ev.key === "Enter") applyCustom(e); if (ev.key === "Escape") setCustomId(null); }}
                      className="w-14 text-[9px] border border-border rounded-sm px-1.5 py-1 focus:outline-none focus:border-primary" />
                    <button onClick={() => applyCustom(e)} className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border border-primary/30 text-primary hover:bg-primary/5 transition-colors">Set</button>
                  </div>
                ) : (
                  <button onClick={() => { setCustomId(e.id); setCustomValue(""); }}
                    className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border border-border text-muted-foreground hover:bg-muted/60 transition-colors">
                    Custom
                  </button>
                )
              )}
              {e.locked ? (
                <button onClick={() => setPending({ entity: e, kind: "unlock" })}
                  className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                  <Unlock size={10} />Unlock
                </button>
              ) : (
                <button onClick={() => setPending({ entity: e, kind: "lock" })}
                  className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border border-border text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                  <Lock size={10} />Lock
                </button>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="px-4 py-6 text-center text-[11px] text-muted-foreground">No {entityLabel.toLowerCase()}s in scope.</div>
        )}
      </div>
      {compact && sorted.length > visible.length && (
        <div className="px-4 py-2 border-t border-border text-[9px] text-muted-foreground">
          +{sorted.length - visible.length} more {entityLabel.toLowerCase()}{sorted.length - visible.length === 1 ? "" : "s"} in Cost Control.
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          {pending && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmTitle(pending)}</AlertDialogTitle>
                <AlertDialogDescription>{confirmDesc(pending)}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPending(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={runPending}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
