import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RequestChangeModalProps {
  open: boolean;
  onClose: () => void;
  subject: string; // e.g. an agent name, "Enable Tool: SCADA Integration"
}

// Employee-role substitute for a direct edit — this is a session-only
// request that surfaces a toast and closes; there is no backend queue for
// it (prototype-fidelity), matching the "Employee is read-only, ABU Head+
// approves changes" RBAC rule for Agent Harness.
export function RequestChangeModal({ open, onClose, subject }: RequestChangeModalProps) {
  const [note, setNote] = useState("");
  const { toast } = useToast();
  if (!open) return null;

  const submit = () => {
    toast({
      title: "Change Requested",
      description: `Your request for "${subject}" was sent to your ABU Head for review.`,
    });
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-border rounded-sm shadow-xl w-[460px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Request Change</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          You don't have edit rights here. Describe the change you'd like — it routes to your ABU Head for approval.
        </p>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Subject</div>
        <div className="text-xs font-medium text-foreground bg-muted/40 border border-border rounded-sm px-3 py-2 mb-4">{subject}</div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
          What should change?
        </label>
        <textarea
          className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary min-h-[90px]"
          placeholder="e.g. Enable the SCADA Integration tool for this agent"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={submit} disabled={!note.trim()}>
            Send Request
          </Button>
        </div>
      </div>
    </div>
  );
}
