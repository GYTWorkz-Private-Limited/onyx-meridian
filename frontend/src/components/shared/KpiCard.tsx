import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: string | number;
  status: "on-track" | "watch" | "critical" | "surplus";
  trendValue?: number;
  history?: { value: number }[];
  className?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  target,
  status,
  trendValue,
  history,
  className
}: KpiCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "critical": return "bg-destructive";
      case "watch": return "bg-amber-400";
      case "surplus": return "bg-emerald-500";
      case "on-track": return "bg-emerald-500";
      default: return "bg-muted-foreground";
    }
  };

  const getTrendColor = () => {
    if (!trendValue) return "text-muted-foreground";
    if (trendValue > 0) return status === "critical" ? "text-destructive" : "text-emerald-500";
    if (trendValue < 0) return status === "critical" ? "text-destructive" : "text-emerald-500";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("bg-white border border-border rounded-sm p-4 flex flex-col relative overflow-hidden group hover:border-primary/20 transition-colors", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold truncate pr-4">
          {label}
        </div>
        <div className={cn("w-2 h-2 rounded-full shrink-0", getStatusColor())} />
      </div>

      <div className="flex items-baseline gap-1 mt-1 mb-1">
        <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4">
        {target && (
          <div className="text-[10px] text-muted-foreground tracking-wider font-mono">
            TGT: {target}
          </div>
        )}
        
        {trendValue !== undefined && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium font-mono", getTrendColor())}>
            {trendValue > 0 ? <ArrowUp size={12} /> : trendValue < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>

      {history && history.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history.map((v, i) => ({ ...v, index: i }))}>
              <defs>
                <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={status === "critical" ? "hsl(var(--destructive))" : "hsl(var(--primary))"} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={status === "critical" ? "hsl(var(--destructive))" : "hsl(var(--primary))"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={status === "critical" ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
                fillOpacity={1} 
                fill={`url(#gradient-${label.replace(/\s+/g, '-')})`} 
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
