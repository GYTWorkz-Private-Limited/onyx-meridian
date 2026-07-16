import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSavedKpiChats, deleteSavedKpiChat, refreshSavedKpiChat } from "@/lib/api";
import { KpiChatChart } from "@/components/kpi-studio/kpi-chat-chart";
import { LayoutDashboard, Trash2, Loader2, RefreshCw } from "lucide-react";

export function KpiBuilderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: savedChats = [], isLoading } = useSavedKpiChats();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const remove = async (id: string) => {
    await deleteSavedKpiChat(id);
    queryClient.invalidateQueries({ queryKey: ["kpi-chat-saved"] });
  };

  const refresh = async (id: string) => {
    setRefreshingId(id);
    try {
      await refreshSavedKpiChat(id);
      queryClient.invalidateQueries({ queryKey: ["kpi-chat-saved"] });
    } catch (err) {
      toast({ title: "Refresh failed", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setRefreshingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-[11px] gap-2">
        <Loader2 size={14} className="animate-spin" /> Loading your pinned KPIs…
      </div>
    );
  }

  if (savedChats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-6">
        <LayoutDashboard size={28} className="text-muted-foreground/40" />
        <div className="text-[12px] font-semibold text-foreground">No pinned KPIs yet</div>
        <div className="text-[11px] text-muted-foreground max-w-xs">
          Ask a question in the Ask AI panel on the right and pin an answer — it'll show up here as a tile you can come back to.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {savedChats.map((c) => (
          <div key={c.id} className="bg-white border border-border rounded-sm p-3.5 group flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="text-[11px] font-bold text-foreground leading-snug">{c.question}</div>
              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => refresh(c.id)}
                  title="Refresh with latest data"
                  disabled={refreshingId === c.id}
                  className="text-muted-foreground hover:text-primary disabled:opacity-60"
                >
                  <RefreshCw size={12} className={refreshingId === c.id ? "animate-spin" : ""} />
                </button>
                <button onClick={() => remove(c.id)} title="Unpin" className="text-muted-foreground hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground leading-relaxed mb-1">{c.answer}</div>
            {c.chartSpec && c.resultData.length > 0 && (
              <KpiChatChart spec={c.chartSpec} data={c.resultData} />
            )}
            <div className="text-[9px] text-muted-foreground/70 mt-2 pt-2 border-t border-border/60">
              Pinned {new Date(c.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
