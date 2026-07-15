import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CONNECTOR_CATALOG } from "@/data/connectors-data";
import { UNIT_OF_WORK_CATALOG, effectivenessFor } from "@/data/unit-of-work-data";
import { KPI_CATALOG } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { Check, RefreshCw, Boxes, ChevronRight, ChevronLeft } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

const stepsFor = (isDept: boolean) =>
  [isDept ? "Department Basics" : "ABU Basics", "Connect Systems", "Discover Units of Work", "KPI Inventory", "Effectiveness Mapping", "Review & Publish"];

const PHASES = [
  "Authenticating with connected systems",
  "Crawling API surface & object schemas",
  "Extracting candidate Units of Work",
  "Scoring confidence & de-duplicating",
  "Re-ranking by leverage & frequency",
  "Mapping manual time & cost",
  "Finalizing the Unit-of-Work catalog",
];

export default function AbuOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { role } = useAppContext();
  const isDept = role === "abu_head";
  const STEPS = stepsFor(isDept);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", region: "", description: "" });
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>(CONNECTOR_CATALOG.filter(c => c.connected).map(c => c.id));

  const [discoveryStarted, setDiscoveryStarted] = useState(false);
  const [phase, setPhase] = useState(0);
  const [discoveryDone, setDiscoveryDone] = useState(false);
  const [candidates, setCandidates] = useState<typeof UNIT_OF_WORK_CATALOG>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const candidatePool = UNIT_OF_WORK_CATALOG.slice(0, 9);

  useEffect(() => {
    if (!discoveryStarted || discoveryDone) return;
    let phaseIdx = 0;
    let candidateIdx = 0;
    setPhase(0);
    setCandidates([]);
    timerRef.current = setInterval(() => {
      candidateIdx++;
      if (candidateIdx <= candidatePool.length) {
        setCandidates(candidatePool.slice(0, candidateIdx));
      }
      phaseIdx = Math.min(PHASES.length - 1, Math.floor((candidateIdx / candidatePool.length) * PHASES.length));
      setPhase(phaseIdx);
      if (candidateIdx >= candidatePool.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDiscoveryDone(true);
      }
    }, 450);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoveryStarted]);

  const toggleConnector = (id: string) => setSelectedConnectors(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const canContinue = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 2) return discoveryDone;
    return true;
  };

  const publish = () => {
    toast({
      title: isDept ? "Department Onboarded" : "ABU Onboarded",
      description: `${form.name || (isDept ? "New department" : "New ABU")} published — ${candidates.length} Units of Work available.`,
    });
    navigate("/business-units");
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName={isDept ? "DEPARTMENT ONBOARDING" : "ABU ONBOARDING"} metrics={[{ label: "STEP", value: `${step + 1} / ${STEPS.length}` }]} />

      <div className="p-6 max-w-[1200px] mx-auto w-full">
        <div className="bg-white border border-border rounded-sm shadow-sm">
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

          <div className="p-6 min-h-[380px]">
            {step === 0 && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Autonomous Business Unit *</label>
                  <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" placeholder="e.g. Field Service Intelligence"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Region / Plant</label>
                  <input className="w-full border border-border rounded-sm px-3 py-2 text-sm" placeholder="e.g. Midwest Plants"
                    value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">What does this ABU do?</label>
                  <textarea className="w-full border border-border rounded-sm px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Describe its scope in plain language…"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-4">Select the ERP and industrial systems this ABU works through.</p>
                <div className="grid grid-cols-2 gap-3">
                  {CONNECTOR_CATALOG.map(c => {
                    const checked = selectedConnectors.includes(c.id);
                    return (
                      <label key={c.id} className={cn("flex items-center gap-3 border rounded-sm px-3 py-2.5 cursor-pointer transition-colors", checked ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40")}>
                        <input type="checkbox" checked={checked} onChange={() => toggleConnector(c.id)} className="accent-primary" />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-foreground">{c.name}</div>
                          <div className="text-[10px] text-muted-foreground">{c.category}</div>
                        </div>
                        {c.connected && <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold">connected</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                {!discoveryStarted ? (
                  <div className="text-center py-12">
                    <Boxes size={28} className="mx-auto text-primary mb-3" />
                    <p className="text-sm text-foreground mb-4">Run the Discovery Agent against {selectedConnectors.length} connected systems.</p>
                    <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={() => setDiscoveryStarted(true)}>Start Discovery</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {!discoveryDone && <RefreshCw size={13} className="text-primary animate-spin" />}
                        <span className="text-xs font-semibold text-foreground">
                          {discoveryDone ? "Discovery complete" : `Running Discovery Agent on ${form.name || "ABU"}…`}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {PHASES.map((p, i) => (
                          <div key={p} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-sm border text-[11px]",
                            i < phase || (i === phase && discoveryDone) ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : i === phase ? "border-primary/30 bg-primary/5 text-foreground" : "border-border text-muted-foreground")}>
                            {i < phase || (i === phase && discoveryDone) ? <Check size={11} /> : i === phase ? <RefreshCw size={11} className="animate-spin" /> : <span className="w-[11px] text-center">{i + 1}</span>}
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Discovered Candidates ({candidates.length})</div>
                      <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
                        {candidates.map(c => (
                          <div key={c.id} className="flex items-center gap-2 border border-border rounded-sm px-2 py-1.5">
                            <Boxes size={11} className="text-primary shrink-0" />
                            <span className="text-[11px] text-foreground flex-1">{c.name}</span>
                            <span className="text-[9px] font-mono text-emerald-600">92%</span>
                          </div>
                        ))}
                        {!discoveryDone && <div className="text-[10px] text-muted-foreground italic">scanning for more…</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-xs text-muted-foreground mb-3">KPIs identified from connected systems.</p>
                <div className="space-y-1.5">
                  {KPI_CATALOG.slice(0, 6).map(k => (
                    <div key={k.id} className="flex items-center justify-between border border-border rounded-sm px-3 py-2">
                      <span className="text-xs font-medium text-foreground">{k.name}</span>
                      <span className="text-[10px] text-muted-foreground">{k.category}</span>
                      <span className="text-xs font-mono font-semibold text-foreground">{k.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="text-xs text-muted-foreground mb-3">Review manual-vs-automated time and cost for each discovered Unit of Work.</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="text-left font-medium py-1.5">Unit of Work</th>
                      <th className="text-left font-medium py-1.5">Manual → Auto</th>
                      <th className="text-right font-medium py-1.5">Monthly Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {candidates.map(c => {
                      const eff = effectivenessFor(c);
                      return (
                        <tr key={c.id}>
                          <td className="py-2 font-medium text-foreground">{c.name}</td>
                          <td className="py-2 font-mono text-muted-foreground">{c.mapping.manualMinutes}m → {c.mapping.automatedMinutes}m</td>
                          <td className="py-2 text-right font-mono font-semibold text-emerald-600">${Math.round(eff.costSavedPerMonth).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {step === 5 && (
              <div className="max-w-lg">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "ABU", value: form.name || "—" },
                    { label: "Systems", value: selectedConnectors.length },
                    { label: "Units of Work", value: candidates.length },
                    { label: "KPIs", value: 6 },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/30 rounded-sm p-2.5 text-center">
                      <div className="text-sm font-bold font-mono text-foreground">{s.value}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-sm px-3 py-2.5 text-xs text-blue-800 mb-4">
                  Publishing will make {form.name || "this ABU"}'s connected systems, Units of Work, and KPI inventory available across the platform.
                </div>
                <Button className="bg-foreground text-background hover:bg-foreground/90" onClick={publish}>Publish ABU</Button>
              </div>
            )}
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <Button variant="outline" size="sm" className="text-xs" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
              <ChevronLeft size={14} className="mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 && (
              <Button size="sm" className="text-xs bg-foreground text-background hover:bg-foreground/90" disabled={!canContinue()} onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>
                {step === 2 && !discoveryDone ? "Discovering…" : "Continue"} <ChevronRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
