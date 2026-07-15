import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, FlaskConical } from "lucide-react";

const AGENT_OPTIONS = [
  "Revenue Scout AI Employee",
  "Finance Reconciler",
  "Procurement Agent",
  "Customer Success AI",
  "Deal Closer AI",
  "Logistics Optimizer",
  "Engineering AI Employee",
  "Contract AI",
];

const EVAL_TYPES = [
  { value: "accuracy",    label: "Accuracy Benchmark",   desc: "Test task accuracy against golden dataset" },
  { value: "hallucination", label: "Hallucination Check", desc: "Test for factual drift and fabricated outputs" },
  { value: "latency",     label: "Latency & Throughput",  desc: "Measure response time under load" },
  { value: "compliance",  label: "Policy Compliance",     desc: "Verify agent operates within policy bounds" },
  { value: "reasoning",   label: "Multi-Step Reasoning",  desc: "Evaluate complex reasoning chain quality" },
];

const DATASET_OPTIONS = [
  "Golden Dataset — Revenue Ops Q2 2026",
  "Production Sample — 500 recent decisions",
  "Adversarial Dataset — Edge cases",
  "Regulatory Compliance Set",
  "Custom Upload",
];

interface EvalForm {
  name: string;
  agent: string;
  evalType: string;
  dataset: string;
  threshold: number;
  notes: string;
  schedule: "now" | "daily" | "weekly";
}

export default function EvaluationBuilder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<EvalForm>({
    name: "", agent: AGENT_OPTIONS[0], evalType: "accuracy",
    dataset: DATASET_OPTIONS[0], threshold: 85, notes: "", schedule: "now",
  });

  const submit = () => {
    if (!form.name.trim()) {
      toast({ title: "Missing name", description: "Please enter a name for this evaluation.", variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: "Evaluation Queued", description: `"${form.name}" has been queued for ${form.agent}.` });
    setTimeout(() => navigate("/evaluation"), 1800);
  };

  if (submitted) {
    return (
      <div className="flex flex-col h-full bg-[#F8F9FA] items-center justify-center">
        <div className="bg-white border border-emerald-200 rounded-sm p-10 shadow-sm text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-emerald-600" />
          </div>
          <div className="font-bold text-lg text-foreground mb-1">Evaluation Queued</div>
          <p className="text-sm text-muted-foreground">Redirecting back to Evaluation Center…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="EVALUATION BUILDER" />
      <div className="p-6 max-w-[760px] mx-auto w-full">
        <button
          onClick={() => navigate("/evaluation")}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground mb-5 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Evaluation Center
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["Configure", "Dataset & Thresholds", "Review"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => setStep(i + 1)}
                className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 border rounded-sm transition-colors ${
                  step === i + 1 ? "bg-primary text-white border-primary" :
                  step > i + 1 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  "bg-white text-muted-foreground border-border"
                }`}
              >
                {step > i + 1 ? <Check size={10} /> : <span>{i + 1}.</span>}
                {s}
              </button>
              {i < 2 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-border rounded-sm shadow-sm p-6 space-y-5">
          {step === 1 && (
            <>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                <FlaskConical size={14} className="text-primary" /> Configure Evaluation
              </h3>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Evaluation Name *</label>
                <input
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                  placeholder="e.g. Revenue Scout — Q3 Accuracy Benchmark"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Target Agent</label>
                <select
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                  value={form.agent}
                  onChange={e => setForm(f => ({ ...f, agent: e.target.value }))}
                >
                  {AGENT_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Evaluation Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {EVAL_TYPES.map(et => (
                    <button
                      key={et.value}
                      onClick={() => setForm(f => ({ ...f, evalType: et.value }))}
                      className={`text-left border rounded-sm px-3 py-2.5 transition-colors ${
                        form.evalType === et.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-white hover:border-primary/40"
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground">{et.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{et.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={() => setStep(2)}>
                  Next → Dataset
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Dataset &amp; Thresholds</h3>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Evaluation Dataset</label>
                <select
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                  value={form.dataset}
                  onChange={e => setForm(f => ({ ...f, dataset: e.target.value }))}
                >
                  {DATASET_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Pass Threshold: <span className="font-mono text-foreground">{form.threshold}%</span>
                </label>
                <input
                  type="range" min={60} max={99} step={1}
                  className="w-full accent-primary"
                  value={form.threshold}
                  onChange={e => setForm(f => ({ ...f, threshold: Number(e.target.value) }))}
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>60% (lenient)</span><span>99% (strict)</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Schedule</label>
                <div className="flex gap-2">
                  {(["now", "daily", "weekly"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, schedule: s }))}
                      className={`flex-1 border rounded-sm py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                        form.schedule === s ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"
                      }`}
                    >
                      {s === "now" ? "Run Now" : s === "daily" ? "Daily" : "Weekly"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Notes (optional)</label>
                <textarea
                  rows={3}
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary resize-none"
                  placeholder="Any context or special instructions for this eval..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-between">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setStep(1)}>← Back</Button>
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={() => setStep(3)}>
                  Next → Review
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Review &amp; Submit</h3>
              <div className="bg-muted/40 border border-border rounded-sm p-4 space-y-2.5">
                {[
                  { label: "Evaluation Name", value: form.name || "(untitled)" },
                  { label: "Target Agent",     value: form.agent },
                  { label: "Eval Type",        value: EVAL_TYPES.find(e => e.value === form.evalType)?.label ?? form.evalType },
                  { label: "Dataset",          value: form.dataset },
                  { label: "Pass Threshold",   value: `${form.threshold}%` },
                  { label: "Schedule",         value: form.schedule === "now" ? "Run immediately" : form.schedule === "daily" ? "Daily recurring" : "Weekly recurring" },
                ].map(r => (
                  <div key={r.label} className="flex items-start justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold w-36 shrink-0">{r.label}</span>
                    <span className="text-xs text-foreground font-medium text-right">{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setStep(2)}>← Back</Button>
                <Button size="sm" className="bg-primary text-white hover:bg-primary/90 text-xs px-6" onClick={submit}>
                  Launch Evaluation
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
