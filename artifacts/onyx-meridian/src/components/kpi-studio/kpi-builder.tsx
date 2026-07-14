import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { BU_LIST } from "@/data/enterprise-data";
import {
  BUILDER_METRICS, BUILDER_DIMENSIONS, BUILDER_OPERATORS, BUILDER_FUNCTIONS, BUILDER_TEMPLATES,
} from "@/data/kpi-studio-data";
import { X, Sparkles, Save, Upload, CheckCircle2, XCircle, GripVertical } from "lucide-react";

type ChipKind = "metric" | "dimension" | "operator" | "function";
interface Chip { uid: string; kind: ChipKind; label: string; }

const KIND_CLS: Record<ChipKind, string> = {
  metric: "bg-primary/10 border-primary/30 text-primary",
  dimension: "bg-violet-50 border-violet-200 text-violet-700",
  operator: "bg-amber-50 border-amber-200 text-amber-700",
  function: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

function PaletteChip({ kind, label, onAdd }: { kind: ChipKind; label: string; onAdd: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ kind, label }))}
      onClick={onAdd}
      className={cn("text-[10px] font-semibold px-2 py-1.5 rounded-sm border cursor-grab active:cursor-grabbing select-none hover:shadow-sm transition-shadow flex items-center gap-1", KIND_CLS[kind])}
    >
      <GripVertical size={9} className="opacity-40 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function KpiBuilder() {
  const { toast } = useToast();
  const [formula, setFormula] = useState<Chip[]>([]);
  const [meta, setMeta] = useState({ name: "", category: "Manufacturing", target: "", owner: "", buId: BU_LIST[0].id });

  const addChip = (kind: ChipKind, label: string) => setFormula((f) => [...f, { uid: `${kind}-${label}-${f.length}-${Date.now()}`, kind, label }]);
  const removeChip = (uid: string) => setFormula((f) => f.filter((c) => c.uid !== uid));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain")) as { kind: ChipKind; label: string };
      addChip(data.kind, data.label);
    } catch { /* ignore malformed drag payload */ }
  };

  const applyTemplate = (formulaStr: string) => {
    const parts = formulaStr.split(/\s+/);
    setFormula(parts.map((p, i) => ({
      uid: `tmpl-${i}-${Date.now()}`,
      kind: BUILDER_OPERATORS.includes(p) ? "operator" : BUILDER_FUNCTIONS.some((f) => p.startsWith(f)) ? "function" : "metric",
      label: p,
    })));
  };

  const hasMetric = formula.some((c) => c.kind === "metric");
  const notEmpty = formula.length > 0;
  const noTrailingOperator = formula.length === 0 || formula[formula.length - 1].kind !== "operator";
  const isValid = hasMetric && notEmpty && noTrailingOperator && meta.name.trim() !== "";

  const validations = [
    { label: "Formula is not empty", pass: notEmpty },
    { label: "Contains at least one metric", pass: hasMetric },
    { label: "Does not end on an operator", pass: noTrailingOperator },
    { label: "KPI name is set", pass: meta.name.trim() !== "" },
  ];

  const previewValue = hasMetric ? (72 + formula.length * 3.4).toFixed(1) : "—";

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left palette */}
      <div className="w-[240px] shrink-0 bg-white border-r border-border overflow-y-auto p-3 space-y-4">
        <div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Metrics</div>
          <div className="grid grid-cols-2 gap-1">
            {BUILDER_METRICS.map((m) => <PaletteChip key={m.id} kind="metric" label={m.label} onAdd={() => addChip("metric", m.label)} />)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Dimensions</div>
          <div className="grid grid-cols-1 gap-1">
            {BUILDER_DIMENSIONS.map((d) => <PaletteChip key={d.id} kind="dimension" label={d.label} onAdd={() => addChip("dimension", d.label)} />)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Operators</div>
          <div className="grid grid-cols-3 gap-1">
            {BUILDER_OPERATORS.map((o) => <PaletteChip key={o} kind="operator" label={o} onAdd={() => addChip("operator", o)} />)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Functions</div>
          <div className="grid grid-cols-2 gap-1">
            {BUILDER_FUNCTIONS.map((f) => <PaletteChip key={f} kind="function" label={f} onAdd={() => addChip("function", f)} />)}
          </div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Templates</div>
          <div className="space-y-1">
            {BUILDER_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t.formula)} className="w-full text-left text-[10px] px-2 py-1.5 rounded-sm border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
                <div className="font-semibold text-foreground">{t.label}</div>
                <div className="text-[9px] text-muted-foreground font-mono truncate">{t.formula}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">Visual Formula Builder</div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "min-h-[120px] border-2 border-dashed rounded-sm p-4 flex flex-wrap items-center gap-2 transition-colors",
            formula.length === 0 ? "border-border bg-white" : "border-primary/30 bg-primary/[0.02]"
          )}
        >
          {formula.length === 0 && (
            <div className="text-[11px] text-muted-foreground w-full text-center py-6">
              Drag metrics, operators, and functions here — or click a palette item to add it.
            </div>
          )}
          {formula.map((c) => (
            <div key={c.uid} className={cn("flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border", KIND_CLS[c.kind])}>
              {c.label}
              <button onClick={() => removeChip(c.uid)} className="opacity-50 hover:opacity-100"><X size={11} /></button>
            </div>
          ))}
        </div>

        <div className="mt-3 bg-muted/30 border border-border/50 rounded-sm px-3 py-2 font-mono text-[11px] text-foreground min-h-[32px]">
          {formula.length ? formula.map((c) => c.label).join(" ") : <span className="text-muted-foreground">Formula preview will appear here…</span>}
        </div>

        <div className="mt-6">
          <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">KPI Metadata</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Name *</label>
              <input value={meta.name} onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))} placeholder="e.g. Adjusted Throughput Index"
                className="w-full border border-border rounded-sm px-2.5 py-1.5 text-[11px]" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Owner</label>
              <input value={meta.owner} onChange={(e) => setMeta((m) => ({ ...m, owner: e.target.value }))} placeholder="e.g. Plant Manager"
                className="w-full border border-border rounded-sm px-2.5 py-1.5 text-[11px]" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Business Unit</label>
              <select value={meta.buId} onChange={(e) => setMeta((m) => ({ ...m, buId: e.target.value }))} className="w-full border border-border rounded-sm px-2.5 py-1.5 text-[11px] bg-white">
                {BU_LIST.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Target</label>
              <input value={meta.target} onChange={(e) => setMeta((m) => ({ ...m, target: e.target.value }))} placeholder="e.g. > 90%"
                className="w-full border border-border rounded-sm px-2.5 py-1.5 text-[11px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Right validation/preview */}
      <div className="w-[260px] shrink-0 bg-white border-l border-border overflow-y-auto p-4 space-y-4">
        <div>
          <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-2">Validation</div>
          <div className="space-y-1.5">
            {validations.map((v) => (
              <div key={v.label} className="flex items-center gap-1.5">
                {v.pass ? <CheckCircle2 size={12} className="text-emerald-600 shrink-0" /> : <XCircle size={12} className="text-muted-foreground shrink-0" />}
                <span className={cn("text-[10px]", v.pass ? "text-foreground" : "text-muted-foreground")}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-sm p-3">
          <div className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground mb-1.5">Preview</div>
          <div className="text-2xl font-bold font-mono text-foreground tabular-nums">{previewValue}</div>
          <div className="text-[9px] text-muted-foreground mt-1">Mock computed value based on the current formula — connect a data source to compute live.</div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => { if (isValid) toast({ title: "KPI Saved", description: `"${meta.name}" saved as a draft KPI.` }); else toast({ title: "Fix validation errors first", variant: "destructive" }); }}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded-sm border border-border bg-white hover:bg-muted/40 transition-colors"
          >
            <Save size={12} /> Save Draft
          </button>
          <button
            onClick={() => { if (isValid) toast({ title: "KPI Published", description: `"${meta.name}" is now live in the KPI Wall.` }); else toast({ title: "Fix validation errors first", variant: "destructive" }); }}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Upload size={12} /> Publish
          </button>
          <button
            onClick={() => toast({ title: "Generating with AI", description: "AI would draft a formula from a plain-language description." })}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded-sm border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <Sparkles size={12} /> Generate with AI
          </button>
        </div>
      </div>
    </div>
  );
}
