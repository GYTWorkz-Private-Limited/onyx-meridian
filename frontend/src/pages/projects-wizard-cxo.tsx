import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GOAL_TREE } from "@/data/goals-data";
import { BU_LIST } from "@/data/enterprise-data";
import type { Project } from "@/data/projects-data";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, FileText } from "lucide-react";

const STEPS = ["Project Basics", "Select ABUs", "Key Documents", "Review & Publish"];

const DOC_SLOTS = [
  { type: "prd", label: "PRD", hint: "Product Requirements Document" },
  { type: "pr-faq", label: "PR/FAQ", hint: "Press Release / Frequently Asked Questions" },
  { type: "hld", label: "High-Level System Design", hint: "Architecture and system design overview" },
];

interface CxoProjectWizardProps {
  onClose: () => void;
  onCreate: (project: Project) => void;
}

export function CxoProjectWizard({ onClose, onCreate }: CxoProjectWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState({ name: "", description: "", goalId: "", targetDate: "" });
  const [selectedBus, setSelectedBus] = useState<string[]>([]);
  const [docs, setDocs] = useState<Record<string, { title: string; summary: string }>>(
    Object.fromEntries(DOC_SLOTS.map((d) => [d.type, { title: "", summary: "" }]))
  );

  const toggleBu = (id: string) => setSelectedBus((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));

  const canContinue = () => {
    if (step === 0) return basics.name.trim().length > 0;
    if (step === 1) return selectedBus.length > 0;
    return true;
  };

  const publish = () => {
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: basics.name,
      description: basics.description,
      leadAgentId: "",
      goalId: basics.goalId,
      buId: selectedBus[0] ?? "manufacturing",
      buIds: selectedBus,
      keyDocuments: DOC_SLOTS.map((d) => ({ type: d.type, title: docs[d.type].title, summary: docs[d.type].summary })).filter((d) => d.title.trim()),
      status: "planning",
      color: "#3a86d4",
      targetDate: basics.targetDate || "—",
      progress: 0,
    };
    onCreate(project);
    toast({ title: "Project Created", description: `"${project.name}" published across ${selectedBus.length} ABU${selectedBus.length === 1 ? "" : "s"}.` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-white border border-border rounded-sm shadow-2xl w-full max-w-[800px] max-h-full overflow-auto">
        <HeaderBar moduleName="NEW PROJECT" metrics={[{ label: "STEP", value: `${step + 1} / ${STEPS.length}` }]} />

        {/* Stepper */}
        <div className="flex items-center border-b border-border px-4 py-3 gap-1 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 shrink-0">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {i < step ? <Check size={11} /> : i + 1}
              </div>
              <span className={cn("text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight size={12} className="text-muted-foreground mx-1 shrink-0" />}
            </div>
          ))}
        </div>

        <div className="p-6 min-h-[340px]">
          {step === 0 && (
            <div className="space-y-3 max-w-[480px]">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Project Name *</label>
                <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={basics.name} onChange={(e) => setBasics((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Description</label>
                <textarea className="w-full border border-border rounded-sm px-3 py-2 text-sm min-h-[70px]" value={basics.description} onChange={(e) => setBasics((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Target Date</label>
                  <input type="date" className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={basics.targetDate} onChange={(e) => setBasics((f) => ({ ...f, targetDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Linked Goal (optional)</label>
                  <select className="w-full border border-border rounded-sm px-3 py-2 text-sm" value={basics.goalId} onChange={(e) => setBasics((f) => ({ ...f, goalId: e.target.value }))}>
                    <option value="">— None —</option>
                    {GOAL_TREE.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">Which ABUs are involved in this project?</p>
              <div className="grid grid-cols-2 gap-2">
                {BU_LIST.map((bu) => (
                  <label key={bu.id} className={cn("flex items-center gap-2 border rounded-sm px-3 py-2.5 text-xs cursor-pointer transition-colors",
                    selectedBus.includes(bu.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                    <input type="checkbox" checked={selectedBus.includes(bu.id)} onChange={() => toggleBu(bu.id)} className="accent-primary" />
                    <span className="font-medium text-foreground">{bu.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Attach the key documents for this project (title + summary — full drafts can be added later in Documents).</p>
              {DOC_SLOTS.map((d) => (
                <div key={d.type} className="border border-border rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText size={12} className="text-primary" />
                    <span className="text-[11px] font-bold text-foreground">{d.label}</span>
                    <span className="text-[10px] text-muted-foreground">— {d.hint}</span>
                  </div>
                  <input
                    className="w-full border border-border rounded-sm px-3 py-1.5 text-sm mb-2"
                    placeholder="Title"
                    value={docs[d.type].title}
                    onChange={(e) => setDocs((prev) => ({ ...prev, [d.type]: { ...prev[d.type], title: e.target.value } }))}
                  />
                  <textarea
                    className="w-full border border-border rounded-sm px-3 py-1.5 text-xs min-h-[50px]"
                    placeholder="Summary"
                    value={docs[d.type].summary}
                    onChange={(e) => setDocs((prev) => ({ ...prev, [d.type]: { ...prev[d.type], summary: e.target.value } }))}
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">Review</div>
              <div className="space-y-2 text-xs mb-4">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-semibold text-foreground">{basics.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Target Date:</span> <span className="font-semibold text-foreground">{basics.targetDate || "—"}</span></div>
                <div><span className="text-muted-foreground">ABUs:</span> <span className="font-semibold text-foreground">{selectedBus.map((id) => BU_LIST.find((b) => b.id === id)?.name).join(", ") || "—"}</span></div>
                <div><span className="text-muted-foreground">Documents:</span> <span className="font-semibold text-foreground">{DOC_SLOTS.filter((d) => docs[d.type].title.trim()).map((d) => d.label).join(", ") || "None attached"}</span></div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-sm px-3 py-2.5 text-xs text-blue-800 mb-4">
                Publishing will create the project and notify the ABU Heads of the selected business units.
              </div>
              <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={publish}>Publish Project</Button>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <Button variant="outline" size="sm" className="text-xs" onClick={step === 0 ? onClose : () => setStep((s) => Math.max(0, s - 1))}>
            <ChevronLeft size={14} className="mr-1" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < STEPS.length - 1 && (
            <Button size="sm" className="text-xs bg-foreground text-background hover:bg-foreground/90" disabled={!canContinue()} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              Continue <ChevronRight size={14} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
