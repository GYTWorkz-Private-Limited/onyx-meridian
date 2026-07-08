import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const p = priority.toLowerCase();
  
  if (p === 'p1' || p === 'urgent' || p === 'critical') {
    return (
      <Badge variant="outline" className={cn("bg-red-50 text-red-700 border-red-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
        {p === 'p1' ? 'P1 CRITICAL' : p.toUpperCase()}
      </Badge>
    );
  }
  
  if (p === 'p2' || p === 'high') {
    return (
      <Badge variant="outline" className={cn("bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
        {p === 'p2' ? 'P2 HIGH' : p.toUpperCase()}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className={cn("bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
      {p === 'p3' ? 'P3 NORMAL' : p.toUpperCase()}
    </Badge>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = status.toLowerCase();
  
  if (['done', 'completed', 'resolved', 'healthy', 'safe', 'active', 'on-track', 'surplus'].includes(s)) {
    return (
      <Badge variant="outline" className={cn("bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
        {s.toUpperCase().replace('-', ' ')}
      </Badge>
    );
  }
  
  if (['in-progress', 'running', 'analyzing', 'deployed'].includes(s)) {
    return (
      <Badge variant="outline" className={cn("bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
        {s.toUpperCase().replace('-', ' ')}
      </Badge>
    );
  }
  
  if (['blocked', 'critical', 'failed', 'offline', 'quarantined', 'rejected', 'suspended'].includes(s)) {
    return (
      <Badge variant="outline" className={cn("bg-red-50 text-red-700 border-red-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
        {s.toUpperCase().replace('-', ' ')}
      </Badge>
    );
  }
  
  if (['watch', 'at-risk', 'degraded', 'paused', 'mitigating', 'draft', 'pending'].includes(s)) {
    return (
      <Badge variant="outline" className={cn("bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
        {s.toUpperCase().replace('-', ' ')}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className={cn("bg-gray-50 text-gray-700 border-gray-200 uppercase tracking-widest text-[9px] rounded-sm", className)}>
      {s.toUpperCase().replace('-', ' ')}
    </Badge>
  );
}
