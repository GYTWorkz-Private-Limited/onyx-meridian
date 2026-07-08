import { cn } from "@/lib/utils";

interface BlurGateProps {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

// Wraps content that should be visible-but-unreadable and non-interactive
// when `active` — used by Digital Twin to scope an ABU Head's view to their
// own business unit while other BUs stay present but blurred out.
export function BlurGate({ active, children, className }: BlurGateProps) {
  if (!active) return <>{children}</>;
  return (
    <div className={cn("pointer-events-none select-none opacity-50 blur-[3px] grayscale", className)}>
      {children}
    </div>
  );
}
