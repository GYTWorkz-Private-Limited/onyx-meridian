import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Power } from "lucide-react";

// Developer-only emergency stop — overrides every individual agent cap/lock
// enterprise-wide. Rendered globally (floating, bottom-right) by AppLayout
// and again as a full status card inside Cost Control's Agents/Kill Switch
// view, both sharing this one component so the copy and confirm flow never
// drift apart.
export function KillSwitchButton({ variant }: { variant: "floating" | "card" }) {
  const { killSwitchActive, activateKillSwitch, deactivateKillSwitch } = useAppContext();
  const [pending, setPending] = useState<"activate" | "deactivate" | null>(null);
  const { toast } = useToast();

  const confirm = () => {
    if (pending === "activate") {
      activateKillSwitch();
      toast({ title: "Kill Switch Activated", description: "Every agent enterprise-wide has been halted.", variant: "destructive" });
    } else if (pending === "deactivate") {
      deactivateKillSwitch();
      toast({ title: "Agents Resumed", description: "Enterprise-wide halt lifted — each agent's individual cap/lock state is restored." });
    }
    setPending(null);
  };

  const dialog = (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending === "activate" ? "Halt every agent enterprise-wide?" : "Resume all agents?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {pending === "activate"
              ? "This immediately zeroes every spend cap and stops all agent activity across every business unit, overriding individual caps and locks. Use only in an emergency."
              : "Every agent returns to its own individual cap/lock state from before the halt."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPending(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} className={pending === "activate" ? "bg-red-600 hover:bg-red-700" : undefined}>
            {pending === "activate" ? "Halt All Agents" : "Resume"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "floating") {
    return (
      <>
        <button
          onClick={() => setPending(killSwitchActive ? "deactivate" : "activate")}
          title={killSwitchActive ? "Resume all agents" : "Emergency kill switch — halt all agents"}
          className={cn(
            "fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
            killSwitchActive ? "bg-foreground text-background" : "bg-red-600 text-white hover:scale-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.7)]"
          )}
        >
          {!killSwitchActive && <span className="absolute inset-0 rounded-full bg-red-500/50 animate-ping" />}
          <Power size={22} className="relative" />
        </button>
        {dialog}
      </>
    );
  }

  return (
    <div className={cn("bg-white border rounded-sm shadow-sm p-6 flex items-center gap-6", killSwitchActive ? "border-red-200" : "border-border")}>
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shrink-0", killSwitchActive ? "bg-red-100 text-red-600 animate-pulse" : "bg-muted text-muted-foreground")}>
        <Power size={26} />
      </div>
      <div className="flex-1">
        <div className="text-xs font-bold uppercase tracking-widest text-foreground">{killSwitchActive ? "Kill Switch Active" : "Kill Switch"}</div>
        <div className="text-[11px] text-muted-foreground mt-1">
          {killSwitchActive
            ? "Every agent enterprise-wide is halted, overriding individual caps. Resume to restore normal operation."
            : "Immediately halts every agent enterprise-wide, overriding all individual caps and locks. Use only in an emergency."}
        </div>
      </div>
      <button onClick={() => setPending(killSwitchActive ? "deactivate" : "activate")}
        className={cn("px-5 py-2.5 rounded-sm text-[10px] uppercase tracking-widest font-bold transition-colors shrink-0",
          killSwitchActive ? "bg-foreground text-background hover:bg-foreground/90" : "bg-red-600 text-white hover:bg-red-700")}>
        {killSwitchActive ? "Resume All Agents" : "Halt All Agents"}
      </button>
      {dialog}
    </div>
  );
}
