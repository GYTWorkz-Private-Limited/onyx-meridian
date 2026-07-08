import { useState, useRef } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Save, Copy, RotateCcw, Plus, ChevronDown, ChevronRight,
  GitBranch, Layers, Zap, Cpu, Database, BookOpen, Wrench, Brain,
  Upload, Clock, BarChart3, DollarSign, ArrowLeftRight, Settings,
  FileText, History, Download, FlaskConical, CheckCircle2, AlertTriangle,
} from "lucide-react";

// ─── Static data ──────────────────────────────────────────────

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", ctx: "128K" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", ctx: "128K" },
  { id: "claude-35-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", ctx: "200K" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic", ctx: "200K" },
  { id: "gemini-15-pro", name: "Gemini 1.5 Pro", provider: "Google", ctx: "2M" },
  { id: "llama-31-70b", name: "Llama 3.1 70B", provider: "Meta", ctx: "128K" },
];

const PROMPT_TEMPLATES = [
  { id: "t1", name: "OEE Root Cause Analyst", system: "You are an OEE (Overall Equipment Effectiveness) analyst for a manufacturing plant. Analyze production data and identify root causes of OEE losses. Always structure your response as: 1) Availability losses, 2) Performance losses, 3) Quality losses, 4) Recommended actions with estimated impact.", variables: ["{{line_id}}", "{{shift_data}}", "{{target_oee}}"] },
  { id: "t2", name: "Predictive Maintenance Advisor", system: "You are a predictive maintenance expert. Given sensor readings and maintenance history, assess asset health and recommend maintenance actions. Output format: health score, failure probability, recommended intervention, estimated cost if ignored.", variables: ["{{asset_id}}", "{{sensor_readings}}", "{{maintenance_history}}"] },
  { id: "t3", name: "Supplier Risk Evaluator", system: "You are a procurement risk specialist. Evaluate supplier risk based on financial health, delivery performance, and market signals. Output a risk score (0–100), key risk factors, and mitigation recommendations.", variables: ["{{supplier_name}}", "{{performance_data}}", "{{market_signals}}"] },
  { id: "t4", name: "Production Scheduler", system: "You are a production scheduling agent for a discrete manufacturing environment. Given capacity, demand, and constraints, generate an optimized production schedule. Prioritize: 1) On-time delivery, 2) OEE, 3) Setup minimization.", variables: ["{{capacity}}", "{{demand_orders}}", "{{constraints}}"] },
  { id: "t5", name: "Quality Defect Classifier", system: "You are a quality control agent using vision AI outputs and production context. Classify defects, identify probable root causes, and recommend disposition (pass/rework/scrap). Include confidence score.", variables: ["{{vision_output}}", "{{production_context}}", "{{spec_limits}}"] },
  { id: "t6", name: "Financial Variance Analyst", system: "You are a manufacturing finance analyst. Analyze cost variances against budget and standard costs. Identify drivers, assess materiality, and recommend corrective actions. Format: variance table, top 3 drivers, recommended actions.", variables: ["{{actual_costs}}", "{{budget}}", "{{standard_costs}}"] },
];

const PROMPT_VERSIONS = [
  { id: "v4", label: "v4 — Current", date: "Today, 06:14", tokens: "2,840", cost: "$0.042", score: 94, changes: "Added OEE loss categorization, improved root cause structure" },
  { id: "v3", label: "v3", date: "Yesterday, 14:22", tokens: "2,420", cost: "$0.036", score: 88, changes: "Refined output format, added confidence scores" },
  { id: "v2", label: "v2", date: "3 days ago", tokens: "1,980", cost: "$0.029", score: 81, changes: "Expanded variable support, added manufacturing context" },
  { id: "v1", label: "v1 — Initial", date: "1 week ago", tokens: "1,240", cost: "$0.018", score: 72, changes: "Initial prompt creation" },
];

const KNOWLEDGE_SOURCES = [
  { id: "k1", name: "MES Production SOPs", type: "SOP", size: "4.2 MB" },
  { id: "k2", name: "SCADA Alarm Matrix", type: "Reference", size: "1.8 MB" },
  { id: "k3", name: "Equipment Maintenance Manuals", type: "Manual", size: "28.4 MB" },
  { id: "k4", name: "Quality Control Plan v12", type: "SOP", size: "5.1 MB" },
];

const SKILLS = [
  { id: "s1", name: "MES Integration", category: "System" },
  { id: "s2", name: "OEE Calculation", category: "Analytics" },
  { id: "s3", name: "Statistical Process Control", category: "Analytics" },
  { id: "s4", name: "SCADA Data Ingestion", category: "System" },
];

const TOOLS = [
  { id: "to1", name: "query_mes", description: "Query MES production data" },
  { id: "to2", name: "read_scada_sensor", description: "Read SCADA sensor values" },
  { id: "to3", name: "create_work_order", description: "Create CMMS work order" },
  { id: "to4", name: "get_oee_history", description: "Retrieve OEE history for asset" },
];

const SAMPLE_INPUTS = [
  { id: "si1", name: "Line 7 OEE Drop — Shift A", variables: { line_id: "L7", shift_data: "Availability: 78%, Performance: 91%, Quality: 98%, OEE: 69.6%", target_oee: "90%" } },
  { id: "si2", name: "MX-0441 Bearing Alert", variables: { line_id: "L7", shift_data: "Vibration: 2.3σ, Temperature: +12°C, Acoustic: abnormal", target_oee: "85%" } },
];

type Mode = "chat" | "completion" | "agent";
type Panel = "single" | "compare";

// ─── Sub-components ────────────────────────────────────────────

function ModelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const m = MODELS.find(m => m.id === value) || MODELS[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-sm text-[10px] font-semibold hover:bg-muted/40 transition-colors w-full">
        <Cpu size={10} className="text-primary shrink-0" />
        <span className="flex-1 text-left text-foreground">{m.name}</span>
        <span className="text-muted-foreground">{m.ctx}</span>
        <ChevronDown size={10} className="text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-sm shadow-lg z-50 overflow-hidden">
          {MODELS.map(model => (
            <button key={model.id} onClick={() => { onChange(model.id); setOpen(false); }}
              className={cn("w-full flex items-center justify-between px-3 py-2 text-[10px] hover:bg-muted/40 transition-colors", model.id === value && "bg-primary/5 text-primary")}>
              <div>
                <span className="font-semibold">{model.name}</span>
                <span className="text-muted-foreground ml-2">{model.provider}</span>
              </div>
              <span className="text-muted-foreground">{model.ctx}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="text-[10px] font-mono font-bold text-foreground">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
    </div>
  );
}

function Toggle({ label, value, onChange, description }: { label: string; value: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-[10px] font-semibold text-foreground">{label}</div>
        {description && <div className="text-[9px] text-muted-foreground">{description}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        className={cn("w-8 h-4 rounded-full transition-colors shrink-0 relative", value ? "bg-primary" : "bg-border")}>
        <span className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all", value ? "right-0.5" : "left-0.5")} />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function PromptPlayground() {
  const [mode, setMode] = useState<Mode>("chat");
  const [panel, setPanel] = useState<Panel>("single");
  const [activeTab, setActiveTab] = useState<"prompt" | "history" | "compare" | "eval">("prompt");

  // Model & params
  const [modelA, setModelA] = useState("gpt-4o");
  const [modelB, setModelB] = useState("claude-35-sonnet");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [seed, setSeed] = useState(42);
  const [streaming, setStreaming] = useState(true);
  const [jsonMode, setJsonMode] = useState(false);
  const [toolCalling, setToolCalling] = useState(false);
  const [mcpToggle, setMcpToggle] = useState(false);

  // Prompt content
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_TEMPLATES[0].system);
  const [userMessage, setUserMessage] = useState("Analyze the OEE data for {{line_id}} during {{shift_data}}. Target OEE is {{target_oee}}. Identify root causes and recommend corrective actions.");
  const [assistantPrefill, setAssistantPrefill] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("t1");
  const [selectedVersion, setSelectedVersion] = useState("v4");

  // Attachments
  const [attachedKnowledge, setAttachedKnowledge] = useState<string[]>(["k1"]);
  const [attachedSkills, setAttachedSkills] = useState<string[]>(["s1", "s2"]);
  const [attachedTools, setAttachedTools] = useState<string[]>(["to1", "to4"]);
  const [selectedSampleInput, setSelectedSampleInput] = useState("si1");

  // Context selector
  const [contextBU, setContextBU] = useState("manufacturing");
  const [contextAgent, setContextAgent] = useState("Production Planner");

  const { toast } = useToast();

  // Output state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [outputB, setOutputB] = useState<string>("");
  const [runMetrics, setRunMetrics] = useState<{ tokens: number; latency: number; cost: string; evalScore: number } | null>(null);

  const SAMPLE_OUTPUT = `## OEE Root Cause Analysis — Line 7, Shift A

**Summary:** OEE at 69.6% is significantly below the 90% target. Primary driver is Availability at 78%.

### 1. Availability Losses (Primary Driver)
- **MX-0441 bearing vibration 2.3σ above baseline** → unplanned stop risk within 4–6 hours
- **Setup time overrun on tooling change** → 12-minute stop recorded at 05:52
- **Recommended:** Immediate predictive maintenance on MX-0441; review tooling change procedure

### 2. Performance Losses (Secondary)
- Micro-stoppages estimated at 6–8 per hour contributing ~5% performance gap
- **Recommended:** Review feeder mechanism alignment on Line 7; SCADA check on conveyor speed

### 3. Quality Losses (Minimal)
- Scrap rate 1.2% vs 1.0% target — batch QD-229 raw material variance identified
- **Recommended:** Quarantine remaining QD-229 inventory pending quality review

### Corrective Actions
| Priority | Action | Est. Impact | Owner |
|----------|--------|-------------|-------|
| P1 | Bearing replacement MX-0441 | +8% Availability | Predictive Maintenance |
| P2 | Micro-stoppage elimination | +3% Performance | OEE Optimizer |
| P3 | Batch QD-229 investigation | +0.5% Quality | Quality Inspector |

**Confidence:** 94% | **EEI Impact:** +2.8 pts if all actions taken`;

  const SAMPLE_OUTPUT_B = `## OEE Analysis Report — L7 Shift A

Current OEE: 69.6% | Target: 90% | Gap: 20.4 percentage points

**Root Cause Breakdown:**
The primary constraint is equipment availability (78%), likely attributable to the MX-0441 bearing anomaly. Vibration readings at 2.3σ indicate early bearing fatigue consistent with 4,200–4,800 hours of operation without replacement.

**Availability Analysis:**
- Unplanned stops: estimated 22% of shift
- MX-0441 fault: highest probability root cause (91% confidence)
- Tooling change: 12-minute documented stop

**Performance Analysis:**  
Performance at 91% is acceptable. Minor micro-stoppages are present but not the primary driver.

**Quality Analysis:**
Quality at 98% is strong. Scrap elevation in batch QD-229 is a material quality issue, not a process control failure.

**Recommendation Priority:**
1. Schedule bearing replacement immediately — cost of inaction: $480K
2. Review tooling change SOP for time reduction
3. Escalate QD-229 to Quality team

**Confidence Score:** 88%`;

  function handleRun() {
    setIsRunning(true);
    setOutput("");
    setOutputB("");
    setRunMetrics(null);
    const sample = SAMPLE_INPUTS.find(s => s.id === selectedSampleInput);
    let text = SAMPLE_OUTPUT;
    if (sample) {
      Object.entries(sample.variables).forEach(([k, v]) => {
        text = text.replaceAll(`{{${k}}}`, v);
      });
    }
    let i = 0;
    const interval = setInterval(() => {
      i += 12;
      setOutput(text.slice(0, i));
      if (panel === "compare") setOutputB(SAMPLE_OUTPUT_B.slice(0, Math.min(i, SAMPLE_OUTPUT_B.length)));
      if (i >= text.length) {
        clearInterval(interval);
        setIsRunning(false);
        setRunMetrics({ tokens: 2840, latency: 1240, cost: "$0.042", evalScore: 94 });
      }
    }, 16);
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="PROMPT PLAYGROUND"
        metrics={[
          { label: "ACTIVE VERSION", value: selectedVersion.toUpperCase() },
          { label: "MODEL", value: MODELS.find(m => m.id === modelA)?.name || "GPT-4o" },
          { label: "TOKENS MTD", value: "4.32M" },
        ]}
      />

      {/* Top toolbar */}
      <div className="px-4 py-2 border-b border-border bg-white flex items-center gap-2 shrink-0">
        {/* Mode */}
        <div className="flex bg-muted/40 border border-border rounded-sm p-0.5 gap-0.5">
          {(["chat", "completion", "agent"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("px-3 py-1 text-[9px] uppercase tracking-widest font-semibold rounded-sm transition-colors", mode === m ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {m}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Template select */}
        <select value={selectedTemplate} onChange={e => { setSelectedTemplate(e.target.value); const t = PROMPT_TEMPLATES.find(t => t.id === e.target.value); if (t) setSystemPrompt(t.system); }}
          className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white font-semibold text-foreground max-w-[200px]">
          {PROMPT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {/* Version */}
        <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)}
          className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white font-semibold text-foreground">
          {PROMPT_VERSIONS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Panel toggle */}
        <button onClick={() => setPanel(p => p === "single" ? "compare" : "single")}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold border rounded-sm transition-colors", panel === "compare" ? "bg-primary/5 border-primary/30 text-primary" : "border-border bg-white text-muted-foreground hover:text-foreground")}>
          <ArrowLeftRight size={10} />Compare
        </button>

        <div className="flex-1" />

        {/* Action buttons */}
        <button onClick={() => setOutput("")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors text-muted-foreground">
          <RotateCcw size={10} />Clear
        </button>
        <button onClick={() => toast({ title: "Draft Saved", description: `${PROMPT_TEMPLATES.find(t => t.id === selectedTemplate)?.name || "Prompt"} saved as draft.` })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors">
          <Save size={10} />Save Draft
        </button>
        <button onClick={() => toast({ title: "Prompt Exported", description: "Prompt exported as JSON." })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold border border-border rounded-sm bg-white hover:bg-muted/40 transition-colors">
          <Download size={10} />Export
        </button>
        <button onClick={() => toast({ title: "Published as v5", description: "Prompt version v5 is now live.", variant: "default" })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold border border-primary/30 rounded-sm bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
          <GitBranch size={10} />Publish v5
        </button>
        <button onClick={handleRun} disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-primary text-white rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
          {isRunning ? <><div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{panel === "compare" ? "Running A + B…" : "Running…"}</> : <><Play size={10} fill="white" />{panel === "compare" ? "Run A + B" : "Run"}</>}
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ─── Left: Config ─────────────────────────────── */}
        <div className="w-[260px] shrink-0 border-r border-border bg-white flex flex-col overflow-y-auto">

          {/* Model */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              {panel === "compare" ? "Model A" : "Model"}
            </div>
            <ModelSelect value={modelA} onChange={setModelA} />
            {panel === "compare" && (
              <>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2 mt-3">Model B</div>
                <ModelSelect value={modelB} onChange={setModelB} />
              </>
            )}
          </div>

          {/* Parameters */}
          <div className="px-4 py-3 border-b border-border space-y-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Parameters</div>
            <Slider label="Temperature" value={temperature} onChange={setTemperature} min={0} max={2} step={0.01} format={v => v.toFixed(2)} />
            <Slider label="Top-P" value={topP} onChange={setTopP} min={0} max={1} step={0.01} format={v => v.toFixed(2)} />
            <Slider label="Max Tokens" value={maxTokens} onChange={setMaxTokens} min={256} max={8192} step={64} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Seed</span>
                <input type="number" value={seed} onChange={e => setSeed(Number(e.target.value))}
                  className="w-16 text-[10px] font-mono border border-border rounded-sm px-1.5 py-0.5 bg-muted/30 text-right" />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="px-4 py-3 border-b border-border space-y-2.5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Options</div>
            <Toggle label="Streaming" value={streaming} onChange={setStreaming} description="Real-time token streaming" />
            <Toggle label="JSON Mode" value={jsonMode} onChange={setJsonMode} description="Force structured JSON output" />
            <Toggle label="Tool Calling" value={toolCalling} onChange={setToolCalling} description="Enable function/tool use" />
            <Toggle label="MCP" value={mcpToggle} onChange={setMcpToggle} description="Model Context Protocol" />
          </div>

          {/* Context */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Context</div>
            <div className="space-y-2">
              <div>
                <div className="text-[9px] text-muted-foreground mb-1">Business Unit</div>
                <select value={contextBU} onChange={e => setContextBU(e.target.value)}
                  className="w-full text-[10px] border border-border rounded-sm px-2 py-1.5 bg-muted/30 font-semibold">
                  {["manufacturing","maintenance","quality","supply-chain","procurement","finance","engineering","sales","logistics"].map(b => (
                    <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground mb-1">Agent Context</div>
                <select value={contextAgent} onChange={e => setContextAgent(e.target.value)}
                  className="w-full text-[10px] border border-border rounded-sm px-2 py-1.5 bg-muted/30 font-semibold">
                  {["Production Planner","OEE Optimizer","Predictive Maintenance","Quality Inspector","Inventory Optimizer"].map(a => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Knowledge */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1"><BookOpen size={9} />Knowledge</div>
            <div className="space-y-1.5">
              {KNOWLEDGE_SOURCES.map(k => (
                <label key={k.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={attachedKnowledge.includes(k.id)}
                    onChange={e => setAttachedKnowledge(prev => e.target.checked ? [...prev, k.id] : prev.filter(i => i !== k.id))}
                    className="w-3 h-3 rounded-sm accent-primary" />
                  <span className="text-[9px] text-foreground flex-1 truncate">{k.name}</span>
                  <span className="text-[8px] text-muted-foreground">{k.size}</span>
                </label>
              ))}
            </div>
            <button className="mt-2 w-full text-[9px] uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-1 py-1 border border-primary/20 rounded-sm hover:bg-primary/5 transition-colors">
              <Upload size={8} />Upload Doc
            </button>
          </div>

          {/* Skills */}
          <div className="px-4 py-3 border-b border-border">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1"><Zap size={9} />Skills</div>
            <div className="space-y-1.5">
              {SKILLS.map(s => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={attachedSkills.includes(s.id)}
                    onChange={e => setAttachedSkills(prev => e.target.checked ? [...prev, s.id] : prev.filter(i => i !== s.id))}
                    className="w-3 h-3 rounded-sm accent-primary" />
                  <span className="text-[9px] text-foreground flex-1 truncate">{s.name}</span>
                  <span className="text-[8px] text-muted-foreground bg-muted/40 border border-border/40 px-1 rounded-sm">{s.category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="px-4 py-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2 flex items-center gap-1"><Wrench size={9} />Tools</div>
            <div className="space-y-1.5">
              {TOOLS.map(t => (
                <label key={t.id} className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={attachedTools.includes(t.id)}
                    onChange={e => setAttachedTools(prev => e.target.checked ? [...prev, t.id] : prev.filter(i => i !== t.id))}
                    className="w-3 h-3 rounded-sm accent-primary mt-0.5" />
                  <div>
                    <div className="text-[9px] font-mono font-bold text-foreground">{t.name}</div>
                    <div className="text-[8px] text-muted-foreground">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Center: Prompt Editor ─────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Sub-tabs */}
          <div className="px-4 border-b border-border bg-white flex items-center gap-0 shrink-0">
            {(["prompt","history","compare","eval"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-2.5 text-[9px] uppercase tracking-widest font-semibold border-b-2 transition-colors", activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {tab === "eval" ? "Evaluations" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "prompt" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Prompt blocks */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Sample Inputs */}
                <div className="flex items-center gap-3">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold shrink-0">Sample Input:</div>
                  <select value={selectedSampleInput} onChange={e => setSelectedSampleInput(e.target.value)}
                    className="text-[10px] border border-border rounded-sm px-2 py-1 bg-white font-semibold">
                    {SAMPLE_INPUTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(SAMPLE_INPUTS.find(s => s.id === selectedSampleInput)?.variables || {}).map(([k, v]) => (
                      <span key={k} className="text-[9px] font-mono bg-primary/5 border border-primary/20 text-primary px-1.5 py-0.5 rounded-sm">{`{{${k}}}`}={String(v).substring(0, 20)}{String(v).length > 20 ? "…" : ""}</span>
                    ))}
                  </div>
                </div>

                {/* System prompt */}
                <div className="bg-white border border-border rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-400" />
                      <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">System</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {PROMPT_TEMPLATES.find(t => t.id === selectedTemplate)?.variables.map(v => (
                        <span key={v} className="text-[8px] font-mono bg-violet-50 border border-violet-200 text-violet-700 px-1 py-0.5 rounded-sm">{v}</span>
                      ))}
                    </div>
                  </div>
                  <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                    rows={4} placeholder="System prompt…"
                    className="w-full px-3 py-2.5 text-[11px] font-mono text-foreground resize-none bg-transparent outline-none leading-relaxed" />
                </div>

                {/* User message */}
                <div className="bg-white border border-border rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">User</span>
                    </div>
                  </div>
                  <textarea value={userMessage} onChange={e => setUserMessage(e.target.value)}
                    rows={3} placeholder="User message — use {{variable}} for placeholders…"
                    className="w-full px-3 py-2.5 text-[11px] font-mono text-foreground resize-none bg-transparent outline-none leading-relaxed" />
                </div>

                {/* Assistant prefill */}
                <div className="bg-white border border-border rounded-sm overflow-hidden">
                  <div className="flex items-center px-3 py-2 border-b border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Assistant Prefill</span>
                    </div>
                  </div>
                  <textarea value={assistantPrefill} onChange={e => setAssistantPrefill(e.target.value)}
                    rows={2} placeholder="Optional assistant prefill to steer response format…"
                    className="w-full px-3 py-2.5 text-[11px] font-mono text-foreground resize-none bg-transparent outline-none leading-relaxed" />
                </div>

                <button className="w-full flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-sm text-[9px] uppercase tracking-widest text-muted-foreground hover:bg-muted/30 transition-colors">
                  <Plus size={10} />Add Turn
                </button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Version History</div>
              {PROMPT_VERSIONS.map((v, i) => (
                <div key={v.id} className={cn("bg-white border rounded-sm p-4 shadow-sm", v.id === selectedVersion ? "border-primary/40 bg-primary/5" : "border-border")}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-foreground">{v.label}</span>
                        {v.id === selectedVersion && <span className="text-[9px] uppercase tracking-widest text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-sm border border-primary/20">Active</span>}
                      </div>
                      <div className="text-[9px] text-muted-foreground">{v.date} · {v.changes}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <div className="text-[8px] text-muted-foreground">Eval Score</div>
                        <div className={cn("text-[11px] font-bold font-mono", v.score >= 90 ? "text-emerald-600" : v.score >= 80 ? "text-amber-600" : "text-red-600")}>{v.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] text-muted-foreground">Tokens</div>
                        <div className="text-[11px] font-bold font-mono text-foreground">{v.tokens}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[8px] text-muted-foreground">Cost</div>
                        <div className="text-[11px] font-bold font-mono text-foreground">{v.cost}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedVersion(v.id)}
                      className="text-[9px] uppercase tracking-widest text-primary font-bold border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                      Load
                    </button>
                    <button onClick={() => toast({ title: "Version Cloned", description: `${v.label} cloned to draft.` })}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold border border-border rounded-sm px-2 py-1 hover:bg-muted/40 transition-colors flex items-center gap-1">
                      <Copy size={8} />Clone
                    </button>
                    {i > 0 && (
                      <button onClick={() => { setSelectedVersion(v.id); toast({ title: "Rolled Back", description: `Active version set to ${v.label}.` }); }}
                        className="text-[9px] uppercase tracking-widest text-amber-600 font-bold border border-amber-200 rounded-sm px-2 py-1 hover:bg-amber-50 transition-colors flex items-center gap-1">
                        <RotateCcw size={8} />Rollback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "compare" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Side-by-Side Comparison</div>
              {output && outputB ? (
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: `Model A — ${MODELS.find(m => m.id === modelA)?.name}`, content: output, score: 94, tokens: 2840, cost: "$0.042", latency: 1240 },
                    { label: `Model B — ${MODELS.find(m => m.id === modelB)?.name}`, content: outputB, score: 88, tokens: 2420, cost: "$0.036", latency: 820 }].map((side, i) => (
                    <div key={i} className="bg-white border border-border rounded-sm overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-foreground">{side.label}</span>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[9px] font-mono font-bold", side.score >= 90 ? "text-emerald-600" : "text-amber-600")}>Score: {side.score}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{side.tokens} tok · {side.cost}</span>
                        </div>
                      </div>
                      <div className="p-3 text-[10px] font-mono text-foreground leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">{side.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-[10px] text-muted-foreground">
                  Run A + B to see comparison. Enable "Compare" mode in the toolbar first.
                </div>
              )}
            </div>
          )}

          {activeTab === "eval" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Evaluation Scores</div>
              {[
                { name: "Factual Accuracy", score: 94, description: "Output aligns with MES/SCADA data" },
                { name: "Instruction Following", score: 98, description: "Response matches output format spec" },
                { name: "Manufacturing Domain Accuracy", score: 91, description: "Correct use of OEE, downtime terminology" },
                { name: "Hallucination Risk", score: 2, description: "Unverifiable claims (lower is better)", invert: true },
                { name: "Actionability", score: 88, description: "Recommendations are concrete and executable" },
                { name: "Conciseness", score: 82, description: "No unnecessary verbosity" },
              ].map((ev, i) => (
                <div key={i} className="bg-white border border-border rounded-sm p-3 shadow-sm flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold text-foreground mb-0.5">{ev.name}</div>
                    <div className="text-[9px] text-muted-foreground">{ev.description}</div>
                  </div>
                  <div className="w-32">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-1.5 flex-1 bg-border rounded-full overflow-hidden mr-2">
                        <div className={cn("h-full rounded-full", !ev.invert ? (ev.score >= 90 ? "bg-emerald-500" : ev.score >= 75 ? "bg-amber-500" : "bg-red-500") : (ev.score <= 5 ? "bg-emerald-500" : ev.score <= 10 ? "bg-amber-500" : "bg-red-500"))}
                          style={{ width: `${ev.invert ? (100 - ev.score * 10) : ev.score}%` }} />
                      </div>
                      <span className={cn("text-[10px] font-bold font-mono shrink-0", !ev.invert ? (ev.score >= 90 ? "text-emerald-600" : "text-amber-600") : (ev.score <= 5 ? "text-emerald-600" : "text-amber-600"))}>
                        {ev.invert ? ev.score + "%" : ev.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full text-[9px] uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-1 py-2 border border-primary/20 rounded-sm hover:bg-primary/5 transition-colors">
                <FlaskConical size={9} />Open in Evaluation Studio
              </button>
            </div>
          )}
        </div>

        {/* ─── Right: Output ─────────────────────────────── */}
        <div className="w-[380px] shrink-0 border-l border-border bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between shrink-0">
            <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
              {panel === "compare" ? "Output A" : "Output"}
            </span>
            <div className="flex items-center gap-2">
              {runMetrics && (
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-muted-foreground">{runMetrics.tokens} tok</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{runMetrics.latency}ms</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{runMetrics.cost}</span>
                  <span className="text-[9px] font-bold font-mono text-emerald-600">Eval: {runMetrics.evalScore}</span>
                </div>
              )}
              {output && (
                <button onClick={() => navigator.clipboard.writeText(output)}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <Copy size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isRunning && !output && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Generating…
              </div>
            )}
            {output ? (
              <div className="text-[10px] font-mono text-foreground whitespace-pre-wrap leading-relaxed">{output}{isRunning && <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 animate-pulse rounded-sm" />}</div>
            ) : !isRunning ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <Play size={16} className="text-muted-foreground" />
                </div>
                <div className="text-[10px] text-muted-foreground">Click Run to generate output</div>
                <div className="text-[9px] text-muted-foreground/60 mt-1">Output will stream here</div>
              </div>
            ) : null}
          </div>

          {/* Run metrics footer */}
          {runMetrics && (
            <div className="px-4 py-3 border-t border-border bg-muted/20 grid grid-cols-4 gap-2 shrink-0">
              {[
                { label: "Tokens", value: runMetrics.tokens.toLocaleString(), icon: Brain },
                { label: "Latency", value: `${runMetrics.latency}ms`, icon: Clock },
                { label: "Cost", value: runMetrics.cost, icon: DollarSign },
                { label: "Eval", value: String(runMetrics.evalScore), icon: BarChart3 },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                  <div className="text-[11px] font-bold font-mono text-foreground">{m.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
