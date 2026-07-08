import { cn } from "@/lib/utils";

interface HeaderBarProps {
  moduleName: string;
  engineBadge?: string;
  metrics?: { label: string; value: string | number }[];
}

export function HeaderBar({ 
  moduleName, 
  engineBadge = "DEEPSIGHTS ENGINE V3.2",
  metrics = []
}: HeaderBarProps) {
  const today = new Date();
  const dateRange = `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-white shrink-0 h-14">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight lowercase">onyx</span>
          <span className="text-muted-foreground font-light text-xl -mt-1">/</span>
          <span className="font-medium text-sm tracking-wide">{moduleName}</span>
        </div>
        
        <div className="h-4 w-[1px] bg-border mx-2" />
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-sm">
            {engineBadge}
          </span>
          <span className="text-[10px] tracking-widest text-muted-foreground uppercase ml-2">
            {dateRange}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-foreground font-semibold text-sm font-mono">{metric.value}</span>
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase">{metric.label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
