import { useGetAuditLogs } from "@/lib/api";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Activity, CheckCircle2, ShieldAlert, ArrowUpRight } from "lucide-react";

const OUTCOME_STYLE: Record<string, string> = {
  approved: "text-emerald-600",
  "auto-approved": "text-emerald-600",
  rejected: "text-red-600",
  escalated: "text-amber-600",
};

export default function MyActivity() {
  const { persona } = useAppContext();
  const { data: logs, isLoading } = useGetAuditLogs();

  const mine = (Array.isArray(logs) ? logs : []).filter((l: any) => l.actor === persona.name);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="MY ACTIVITY" metrics={[{ label: "EVENTS", value: mine.length }]} />

      <div className="p-6 max-w-[1000px] mx-auto w-full space-y-4">
        <p className="text-xs text-muted-foreground">
          Your personal action history — not the enterprise audit log. Every action you took or approved shows up here.
        </p>

        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : mine.length === 0 ? (
            <div className="p-10 text-center">
              <Activity size={22} className="mx-auto text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">No personal activity recorded yet.</div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {mine.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    {log.riskLevel === "critical" || log.riskLevel === "high"
                      ? <ShieldAlert size={13} className="text-amber-600" />
                      : <CheckCircle2 size={13} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground">{log.action}</div>
                    <div className="text-[10px] text-muted-foreground">{log.businessUnit} · {new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                  <span className={cn("text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1", OUTCOME_STYLE[log.outcome] ?? "text-muted-foreground")}>
                    {log.outcome} <ArrowUpRight size={10} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
