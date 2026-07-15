import { Radio, Bell, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem { id: string; text: string; time: string }
export interface NotificationItem { id: string; type: string; detail: string; severity: "low" | "medium" | "high" }

const SEVERITY_CLS: Record<string, string> = {
  low: "border-l-gray-300",
  medium: "border-l-amber-400",
  high: "border-l-red-400",
};

export function LiveActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm flex flex-col" style={{ maxHeight: 260 }}>
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 shrink-0">
        <Radio size={12} className="text-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Activity</span>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {items.map((a) => (
          <div key={a.id} className="px-4 py-2 text-xs text-foreground flex items-center justify-between gap-2">
            <span className="truncate">{a.text}</span>
            <span className="text-[9px] text-muted-foreground shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationsPanel({ items }: { items: NotificationItem[] }) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-3">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={12} className="text-amber-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notifications</span>
      </div>
      <div className="space-y-1.5">
        {items.map((n) => (
          <div key={n.id} className={cn("border-l-2 pl-2.5 py-1", SEVERITY_CLS[n.severity])}>
            <div className="text-[10px] font-bold text-foreground">{n.type}</div>
            <div className="text-[10px] text-muted-foreground">{n.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIInsightsPanel({ insights }: { insights: string[] }) {
  return (
    <div className="bg-white border border-border rounded-sm shadow-sm p-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={12} className="text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Workforce Insights</span>
      </div>
      <ul className="space-y-2">
        {insights.map((s, i) => (
          <li key={i} className="text-[11px] text-foreground leading-snug flex gap-2">
            <AlertTriangle size={11} className="text-primary shrink-0 mt-0.5" />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
