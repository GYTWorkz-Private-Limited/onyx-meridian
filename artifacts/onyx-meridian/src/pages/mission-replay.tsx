import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Circle, Clock, Zap, DollarSign, Database, BookOpen,
  Wrench, ShieldAlert, FileText, TrendingUp, Bot, ChevronRight, ChevronLeft,
  ChevronDown, ChevronUp, Play, Pause, SkipBack, SkipForward,
  Search, X, AlertTriangle, ArrowRight, Info, ExternalLink,
  Package, BarChart3, Users, RefreshCw, ChevronsLeft, ChevronsRight,
  GitBranch, ScrollText, Layers, Target, CheckSquare, AlertCircle,
  Cpu, MemoryStick, Activity, Star,
  Kanban,
} from "lucide-react";

// ─── Animation Primitives ─────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[4px] h-[4px] rounded-full bg-violet-500 animate-bounce"
          style={{ animationDelay: `${i * 130}ms`, animationDuration: "0.75s" }}
        />
      ))}
    </span>
  );
}

function useCountUp(target: number, duration = 900, trigger = true): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!trigger) { setValue(target); return; }
    setValue(0);
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const pct = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setValue(Math.round(eased * target));
      if (pct < 1) rafRef.current = requestAnimationFrame(step);
      else setValue(target);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, trigger]);
  return value;
}

function AnimatedBar({ pct, color = "violet", height = "h-1.5" }: { pct: number; color?: string; height?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 80); return () => clearTimeout(t); }, [pct]);
  const cls: Record<string, string> = { violet: "bg-violet-500", emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500", red: "bg-red-500" };
  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden", height)}>
      <div className={cn("h-full rounded-full", cls[color] ?? "bg-violet-500")} style={{ width: `${width}%`, transition: "width 700ms cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

const STAGE_CSS = `
@keyframes _ox_card { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
@keyframes _ox_fade  { from { opacity:0; } to { opacity:1; } }
@keyframes _ox_msg   { from { opacity:0; transform:translateX(-5px); } to { opacity:1; transform:translateX(0); } }
@keyframes _ox_kpi   { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
._ox_stage > * { animation: _ox_card 260ms ease both; }
._ox_stage > *:nth-child(1) { animation-delay:  30ms; }
._ox_stage > *:nth-child(2) { animation-delay: 130ms; }
._ox_stage > *:nth-child(3) { animation-delay: 230ms; }
._ox_stage > *:nth-child(n+4) { animation-delay: 310ms; }
._ox_decision { animation: _ox_fade 280ms ease both; }
._ox_msg { animation: _ox_msg 200ms ease both; }
._ox_kpi { animation: _ox_kpi 350ms ease both; }
`;

// ─── Mission Data ──────────────────────────────────────────────────────────

const MISSION = {
  id: "MSN-2026-0847",
  name: "A36 Structural Steel Procurement — 1T, Line B",
  objective: "Purchase 1 metric ton of A36 Structural Steel for Production Line B before Jun 27, 2026 (Friday) while minimizing total cost and supplier risk.",
  status: "COMPLETED",
  progress: 100,
  currentPhase: "Business Impact",
  activeAgent: "Procurement Agent (PROC-001)",
  confidence: 96.4,
  risk: 8,
  eta: "Delivered Jun 26",
  executionTime: "2h 33m 16s",
  costUsd: 0.2847,
  tokensUsed: 184320,
  tokensIn: 142880,
  tokensOut: 41440,
  humanApproval: "Approved — J. Martinez, VP Procurement (09:35:14)",
  startedAt: "Jun 24, 2026 · 09:14:22",
  completedAt: "Jun 24, 2026 · 11:47:38",
  model: "DeepSights-Enterprise-V3.2",
  department: "Manufacturing / Procurement",
  po: "PO-2026-18847",
  vendor: "Continental Steel Group",
  finalPrice: 891,
  budget: 1200,
};

// ─── Timeline Stages ───────────────────────────────────────────────────────

const STAGES = [
  { id: 0, key: "created",    label: "Mission Created",    time: "09:14:22", duration: "0s",     icon: Target,     status: "done"    },
  { id: 1, key: "planning",   label: "Planning",           time: "09:14:38", duration: "24s",    icon: GitBranch,  status: "done"    },
  { id: 2, key: "knowledge",  label: "Knowledge Retrieval",time: "09:15:02", duration: "1m 43s", icon: BookOpen,   status: "done"    },
  { id: 3, key: "discovery",  label: "Supplier Discovery", time: "09:16:45", duration: "5m 33s", icon: Search,     status: "done"    },
  { id: 4, key: "evaluation", label: "Vendor Evaluation",  time: "09:22:18", duration: "9m 26s", icon: BarChart3,  status: "done"    },
  { id: 5, key: "policy",     label: "Policy Validation",  time: "09:31:44", duration: "2m 28s", icon: ShieldAlert,status: "done"    },
  { id: 6, key: "budget",     label: "Budget Check",       time: "09:34:12", duration: "2m 43s", icon: DollarSign, status: "done"    },
  { id: 7, key: "purchase",   label: "Purchase Order",     time: "09:36:55", duration: "2m 27s", icon: FileText,   status: "done"    },
  { id: 8, key: "erp",        label: "ERP Update",         time: "09:39:22", duration: "1m 46s", icon: Database,   status: "done"    },
  { id: 9, key: "learning",   label: "Learning",           time: "09:41:08", duration: "1m 25s", icon: Cpu,        status: "done"    },
  { id: 10,key: "impact",     label: "Business Impact",    time: "09:42:33", duration: "—",      icon: TrendingUp, status: "done"    },
];

// ─── Execution Detail Content ──────────────────────────────────────────────

const STAGE_DETAILS: Record<string, React.FC<{ onDrillDown?: (item: AuditEntry) => void }>> = {
  created: () => (
    <div className="space-y-3">
      <DetailCard title="Mission Brief" icon={Target}>
        <KV k="Triggered By" v="Production Manager — Sarah Chen" />
        <KV k="Trigger Source" v="ERP Alert · SAP-PM-2026-18302" />
        <KV k="Priority" v={<Badge color="red">CRITICAL</Badge>} />
        <KV k="Deadline" v="Jun 27, 2026 17:00 EST (Friday EOD)" />
        <KV k="Material" v="A36 Structural Steel, ASTM A36/A36M-19" />
        <KV k="Quantity" v="1.000 metric ton (±2% tolerance)" />
        <KV k="Delivery Site" v="Plant 3 — Dock B, 4400 Industrial Pkwy, Detroit MI" />
        <KV k="Budget Ceiling" v="$1,200 / ton" />
        <KV k="Assigned Agent" v="Procurement Agent (PROC-001)" />
        <KV k="Mission ID" v={<span className="font-mono">MSN-2026-0847</span>} />
      </DetailCard>
      <DetailCard title="Mission Decomposition" icon={Layers}>
        <div className="space-y-1.5">
          {[
            { n: 1, text: "Retrieve material specifications and quality requirements" },
            { n: 2, text: "Identify approved vendors from enterprise registry" },
            { n: 3, text: "Request and evaluate competitive quotes" },
            { n: 4, text: "Validate against procurement policies and SOPs" },
            { n: 5, text: "Obtain finance budget clearance" },
            { n: 6, text: "Request human approval (>$500 threshold)" },
            { n: 7, text: "Issue purchase order and confirm delivery" },
            { n: 8, text: "Update ERP and notify stakeholders" },
            { n: 9, text: "Log learnings and update supplier intelligence" },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-2 text-[11px]">
              <span className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
              <span className="text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </DetailCard>
    </div>
  ),

  planning: () => (
    <div className="space-y-3">
      <DetailCard title="Planning Summary" icon={GitBranch}>
        <KV k="Planning Model" v="DeepSights-Enterprise-V3.2" />
        <KV k="Planning Time" v="24.1s" />
        <KV k="Tokens (Plan)" v="12,440 in / 3,820 out" />
        <KV k="Plan Confidence" v={<span className="text-emerald-600 font-bold">94.2%</span>} />
        <KV k="Alternatives Considered" v="3 plan variants" />
        <KV k="Selected Strategy" v="Multi-vendor quote with risk-weighted scoring" />
      </DetailCard>
      <DetailCard title="Goal & Objectives" icon={Target}>
        <div className="text-[11px] text-foreground mb-2 p-2 bg-violet-50 border border-violet-100 rounded-sm italic">
          "Secure 1T of A36 Structural Steel at lowest total cost of ownership while guaranteeing delivery by Jun 27 EOD and maintaining supplier risk below enterprise threshold of 30."
        </div>
        {[
          { obj: "Primary", text: "On-time delivery before Jun 27 17:00", weight: "40%" },
          { obj: "Secondary", text: "Minimize unit cost within $1,200 budget", weight: "35%" },
          { obj: "Tertiary", text: "Supplier risk score ≤ 30 (enterprise policy)", weight: "25%" },
        ].map(({ obj, text, weight }) => (
          <div key={obj} className="flex items-center gap-2 text-[11px] py-1">
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase",
              obj === "Primary" ? "bg-violet-100 text-violet-700" : obj === "Secondary" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            )}>{obj}</span>
            <span className="flex-1 text-foreground">{text}</span>
            <span className="text-muted-foreground font-mono text-[10px]">Weight: {weight}</span>
          </div>
        ))}
      </DetailCard>
      <DetailCard title="Plan Variants Considered" icon={Layers}>
        {[
          { v: "A", label: "Single-source expedited (highest speed)", chosen: false, reason: "Rejected: premium cost 28% above budget ceiling" },
          { v: "B", label: "Multi-vendor competitive quote + risk scoring", chosen: true, reason: "Selected: optimal balance of cost, speed, and risk" },
          { v: "C", label: "Framework agreement pull (no new RFQ)", chosen: false, reason: "Rejected: existing contracts expired Jun 12, 2026" },
        ].map(({ v, label, chosen, reason }) => (
          <div key={v} className={cn("p-2 rounded-sm border text-[11px] mb-1.5", chosen ? "border-emerald-200 bg-emerald-50" : "border-border bg-[#FAFAFA]")}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono font-bold text-[10px] text-muted-foreground">Variant {v}</span>
              <span className="flex-1 font-medium text-foreground">{label}</span>
              {chosen && <Badge color="green">SELECTED</Badge>}
            </div>
            <div className="text-muted-foreground">{reason}</div>
          </div>
        ))}
      </DetailCard>
    </div>
  ),

  knowledge: () => (
    <div className="space-y-3">
      <DetailCard title="Knowledge Sources Retrieved" icon={BookOpen}>
        <KV k="Total Documents" v="14 documents" />
        <KV k="Total Chunks" v="847 chunks indexed" />
        <KV k="Context Window Used" v="142,880 tokens (89.3% utilization)" />
        <KV k="Retrieval Latency" v="1,847ms (avg 132ms/doc)" />
        <KV k="Relevance Threshold" v="≥ 0.82 cosine similarity" />
        <KV k="RAG Strategy" v="Hybrid (dense + sparse BM25)" />
      </DetailCard>
      <DetailCard title="Documents Retrieved" icon={FileText}>
        {[
          { id: "SOP-PROC-2024-047", name: "Steel Procurement Standards & Grade Requirements", type: "SOP", relevance: 0.97, chunks: 43 },
          { id: "POLICY-FIN-2024-012", name: "Capital Purchase Approval Thresholds", type: "Policy", relevance: 0.95, chunks: 18 },
          { id: "SOP-QUAL-2024-089", name: "A36 Material Specification Requirements (ASTM A36/A36M-19)", type: "SOP", relevance: 0.96, chunks: 67 },
          { id: "VENDOR-REG-2026-Q2", name: "Approved Vendor Registry — Steel & Metals Category", type: "Registry", relevance: 0.94, chunks: 112 },
          { id: "RISK-MGR-2024-003", name: "Supplier Risk Management Framework v3", type: "Policy", relevance: 0.91, chunks: 34 },
          { id: "HIST-PROC-2026-Q1", name: "Q1 2026 Steel Procurement History & Pricing Benchmarks", type: "History", relevance: 0.88, chunks: 89 },
          { id: "PROD-SCHED-2026-W26", name: "Production Schedule Week 26 — Line B Requirements", type: "Operations", relevance: 0.93, chunks: 22 },
        ].map(({ id, name, type, relevance, chunks }) => (
          <div key={id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0 text-[11px]">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">{name}</div>
              <div className="font-mono text-muted-foreground text-[10px]">{id} · {chunks} chunks</div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm",
                type === "SOP" ? "bg-blue-100 text-blue-700" : type === "Policy" ? "bg-amber-100 text-amber-700" : type === "Registry" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"
              )}>{type}</span>
              <span className="text-emerald-600 font-mono font-bold text-[10px]">{(relevance * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </DetailCard>
    </div>
  ),

  discovery: () => (
    <div className="space-y-3">
      <DetailCard title="Supplier Discovery — Tool Calls" icon={Wrench}>
        {TOOL_CALLS.filter(t => t.stage === "discovery").map((tc, i) => <ToolCallRow key={i} {...tc} />)}
      </DetailCard>
      <DetailCard title="Vendors Identified" icon={Users}>
        <KV k="Registry Scanned" v="2,847 registered vendors" />
        <KV k="Category Match" v="Steel & Metals — A36 Grade" />
        <KV k="Pre-qualified" v="12 vendors (active status)" />
        <KV k="Capacity Available" v="4 vendors confirmed ≥1T stock" />
        <KV k="Quote Requested" v="4 vendors solicited at 09:17:02" />
        <KV k="Quotes Received" v="4 / 4 (100% response rate)" />
      </DetailCard>
    </div>
  ),

  evaluation: () => (
    <div className="space-y-3">
      <DetailCard title="Vendor Comparison Matrix" icon={BarChart3}>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA]">
                {["Vendor","$/ton","Lead","Risk","Quality","Score","Decision"].map(h => (
                  <th key={h} className="px-2 py-1.5 text-left text-[9px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VENDORS.map((v) => (
                <tr key={v.name} className={cn("border-b border-border/30", v.selected && "bg-emerald-50")}>
                  <td className="px-2 py-2 font-medium text-foreground whitespace-nowrap">{v.name}</td>
                  <td className="px-2 py-2 font-mono">${v.price.toLocaleString()}</td>
                  <td className="px-2 py-2 font-mono whitespace-nowrap">{v.leadDays}d</td>
                  <td className="px-2 py-2">
                    <span className={cn("font-bold font-mono", v.risk <= 15 ? "text-emerald-600" : v.risk <= 30 ? "text-amber-500" : "text-red-500")}>{v.risk}</span>
                  </td>
                  <td className="px-2 py-2 font-mono">{v.quality}%</td>
                  <td className="px-2 py-2 font-mono font-bold text-foreground">{v.score}</td>
                  <td className="px-2 py-2">
                    {v.selected
                      ? <Badge color="green">SELECTED</Badge>
                      : <span className="text-red-500 text-[9px] font-bold">REJECTED</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground italic">* Weighted score: 40% delivery, 35% cost, 25% risk. Minimum quality threshold: 88%.</div>
      </DetailCard>
      <DetailCard title="Rejection Analysis" icon={X}>
        {VENDORS.filter(v => !v.selected).map(v => (
          <div key={v.name} className="p-2 bg-red-50 border border-red-100 rounded-sm mb-1.5 text-[11px]">
            <div className="font-semibold text-foreground mb-0.5">{v.name} — <span className="text-red-600">REJECTED</span></div>
            <div className="text-muted-foreground">{v.rejectionReason}</div>
          </div>
        ))}
      </DetailCard>
      <DetailCard title="Evaluation Tool Calls" icon={Wrench}>
        {TOOL_CALLS.filter(t => t.stage === "evaluation").map((tc, i) => <ToolCallRow key={i} {...tc} />)}
      </DetailCard>
    </div>
  ),

  policy: () => (
    <div className="space-y-3">
      <DetailCard title="Policies Validated" icon={ShieldAlert}>
        {[
          { id: "POLICY-FIN-2024-012", name: "Capital Purchase Approval Thresholds", rule: "Purchases $500–$5,000 require VP Procurement approval", result: "COMPLIANT", note: "Human approval requested at 09:34:40, received at 09:35:14 (J. Martinez)" },
          { id: "POLICY-PROC-2024-008", name: "Approved Vendor Only Policy", rule: "All purchases must be from vendors in the enterprise registry", result: "COMPLIANT", note: "Continental Steel Group — Registry ID CSG-2019-0044, Active, Tier 1" },
          { id: "POLICY-RISK-2024-003", name: "Supplier Risk Threshold Policy", rule: "Vendor risk score must not exceed 30 at time of order", result: "COMPLIANT", note: "Continental Steel Group risk score: 8 (well within threshold)" },
          { id: "POLICY-QUAL-2024-015", name: "Material Quality Minimum Standards", rule: "A36 steel supplier quality score ≥ 88%", result: "COMPLIANT", note: "Continental Steel Group quality score: 97% (ISO 9001:2015 certified)" },
          { id: "POLICY-ENV-2024-002", name: "Sustainable Sourcing Policy", rule: "Preferred vendors with ESG score ≥ 70", result: "COMPLIANT", note: "Continental Steel Group ESG: 78 / 100 (Green Tier)" },
        ].map(({ id, name, rule, result, note }) => (
          <div key={id} className="p-2 border border-border rounded-sm mb-1.5 text-[11px] hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-muted-foreground text-[10px]">{id}</span>
              <Badge color={result === "COMPLIANT" ? "green" : "red"}>{result}</Badge>
            </div>
            <div className="font-semibold text-foreground mb-0.5">{name}</div>
            <div className="text-muted-foreground text-[10px] mb-0.5">Rule: {rule}</div>
            <div className="text-foreground text-[10px] italic">{note}</div>
          </div>
        ))}
      </DetailCard>
      <DetailCard title="SOPs Applied" icon={ScrollText}>
        {[
          { id: "SOP-PROC-2024-047", name: "Steel Procurement Standards", sections: "§3.2 Grade Verification, §4.1 Quote Solicitation, §5.3 PO Issuance" },
          { id: "SOP-QUAL-2024-089", name: "A36 Material Specification Requirements", sections: "§2.1 ASTM A36/A36M-19 Compliance, §3.4 Mill Certificate Requirement" },
        ].map(({ id, name, sections }) => (
          <div key={id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0 text-[11px]">
            <ScrollText size={12} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-foreground">{name}</div>
              <div className="font-mono text-muted-foreground text-[10px]">{id}</div>
              <div className="text-muted-foreground text-[10px]">{sections}</div>
            </div>
          </div>
        ))}
      </DetailCard>
      <DetailCard title="Human Approval Event" icon={CheckSquare}>
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-sm text-[11px]">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="font-bold text-emerald-700">APPROVED</span>
          </div>
          <KV k="Approver" v="J. Martinez, VP Procurement" />
          <KV k="Approval Time" v="Jun 24, 2026 · 09:35:14 EST" />
          <KV k="Response Time" v="34 seconds" />
          <KV k="Method" v="Onyx Mobile App — Biometric Confirmed" />
          <KV k="Comment" v="&quot;Approved. Continental Steel is our preferred vendor. Proceed.&quot;" />
          <KV k="Approval ID" v={<span className="font-mono">APPR-2026-09847</span>} />
        </div>
      </DetailCard>
    </div>
  ),

  budget: () => (
    <div className="space-y-3">
      <DetailCard title="Budget Validation" icon={DollarSign}>
        <KV k="Purchase Amount" v="$891.00 (1T × $891/ton)" />
        <KV k="Budget Ceiling" v="$1,200.00 / ton" />
        <KV k="Variance" v={<span className="text-emerald-600 font-bold">$309.00 under budget (25.75%)</span>} />
        <KV k="Department" v="Manufacturing — Production Line B" />
        <KV k="Cost Center" v="CC-MFG-PLB-2026" />
        <KV k="Budget Period" v="FY2026 Q2 (Apr–Jun)" />
        <KV k="Q2 Remaining Budget" v="$48,720 of $75,000 available" />
        <KV k="Budget Check Latency" v="1,204ms" />
        <KV k="System" v="SAP S/4HANA — FM Module" />
      </DetailCard>
      <DetailCard title="Budget Check Tool Call" icon={Wrench}>
        {TOOL_CALLS.filter(t => t.stage === "budget").map((tc, i) => <ToolCallRow key={i} {...tc} />)}
      </DetailCard>
      <DetailCard title="Financial Alternatives Considered" icon={BarChart3}>
        {[
          { option: "Full budget utilization ($1,200/ton)", saving: "$0", verdict: "Rejected — no value benefit" },
          { option: "Apex Metal @ $823/ton", saving: "$68 saved", verdict: "Rejected — misses delivery deadline" },
          { option: "Continental Steel @ $891/ton", saving: "$309 saved vs ceiling", verdict: "Selected — best total value" },
        ].map(({ option, saving, verdict }) => (
          <div key={option} className="text-[11px] flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
            <span className="flex-1 text-foreground">{option}</span>
            <span className="font-mono text-emerald-600">{saving}</span>
            <span className={cn("text-[9px] font-bold", verdict.startsWith("Selected") ? "text-emerald-600" : "text-red-500")}>{verdict.startsWith("Selected") ? "✓" : "✗"}</span>
          </div>
        ))}
      </DetailCard>
    </div>
  ),

  purchase: () => (
    <div className="space-y-3">
      <DetailCard title="Purchase Order Issued" icon={FileText}>
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-sm mb-2">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">PO CONFIRMED</div>
          <KV k="PO Number" v={<span className="font-mono font-bold">PO-2026-18847</span>} />
        </div>
        <KV k="Vendor" v="Continental Steel Group" />
        <KV k="Vendor ID" v="CSG-2019-0044" />
        <KV k="Material" v="A36 Structural Steel — ASTM A36/A36M-19" />
        <KV k="Quantity" v="1.000 metric ton" />
        <KV k="Unit Price" v="$891.00 / ton" />
        <KV k="Total Value" v="$891.00" />
        <KV k="Payment Terms" v="Net 30" />
        <KV k="Delivery Address" v="Plant 3 — Dock B, 4400 Industrial Pkwy, Detroit MI" />
        <KV k="Required By" v="Jun 26, 2026 17:00 EST" />
        <KV k="Confirmed Delivery" v={<span className="text-emerald-600 font-bold">Jun 26, 2026 10:30 EST ✓</span>} />
        <KV k="Mill Certificate Required" v="Yes — per SOP-QUAL-2024-089 §2.1" />
        <KV k="Issued At" v="Jun 24, 2026 · 09:36:55 EST" />
      </DetailCard>
      <DetailCard title="PO Creation Tool Calls" icon={Wrench}>
        {TOOL_CALLS.filter(t => t.stage === "purchase").map((tc, i) => <ToolCallRow key={i} {...tc} />)}
      </DetailCard>
    </div>
  ),

  erp: () => (
    <div className="space-y-3">
      <DetailCard title="ERP Update — SAP S/4HANA" icon={Database}>
        <KV k="System" v="SAP S/4HANA 2023.3 — Procurement Module" />
        <KV k="PO Synced" v={<span className="font-mono">PO-2026-18847</span>} />
        <KV k="MM Module" v="Materials Management — GR/GI posted" />
        <KV k="FI Posting" v="Account 300200 — Raw Materials Inventory" />
        <KV k="Commitment Posted" v="$891.00 · CC-MFG-PLB-2026" />
        <KV k="Delivery Expectation" v="Jun 26, 2026 10:30 EST — Dock B" />
        <KV k="QM Inspection Lot" v={<span className="font-mono">QI-2026-18847-001</span>} />
        <KV k="Sync Latency" v="4,820ms" />
      </DetailCard>
      <DetailCard title="Stakeholder Notifications" icon={Users}>
        {[
          { name: "Sarah Chen", role: "Production Manager", message: "PO-2026-18847 confirmed. 1T A36 steel delivers Jun 26, 10:30 EST. Line B cleared for Mon restart.", method: "Email + Slack" },
          { name: "J. Martinez", role: "VP Procurement", message: "Mission MSN-2026-0847 completed. $309 under budget. PO-2026-18847 with Continental Steel Group.", method: "Onyx App" },
          { name: "R. Patel", role: "Plant Manager", message: "Dock B receiving scheduled Jun 26, 10:30 EST. Mill certificate attached. QM lot QI-2026-18847-001 active.", method: "Email" },
        ].map(({ name, role, message, method }) => (
          <div key={name} className="py-1.5 border-b border-border/30 last:border-0 text-[11px]">
            <div className="font-semibold text-foreground">{name} — <span className="text-muted-foreground font-normal">{role}</span></div>
            <div className="text-muted-foreground mt-0.5 italic">"{message}"</div>
            <div className="text-[10px] text-blue-600 mt-0.5">{method}</div>
          </div>
        ))}
      </DetailCard>
      <DetailCard title="ERP Tool Calls" icon={Wrench}>
        {TOOL_CALLS.filter(t => t.stage === "erp").map((tc, i) => <ToolCallRow key={i} {...tc} />)}
      </DetailCard>
    </div>
  ),

  learning: () => (
    <div className="space-y-3">
      <DetailCard title="Memory Updates" icon={Cpu}>
        {[
          { type: "Supplier Intel", content: "Continental Steel Group confirmed as preferred A36 steel vendor for Detroit Plant 3. 2-day lead time, 97% quality, risk 8. Recommend priority status.", confidence: "HIGH" },
          { type: "Pricing Benchmark", content: "A36 structural steel market rate Jun 2026: $850–$920/ton for 1T lots. Q1 2026 avg was $881/ton. Current purchase at $891 is within +1.1% of benchmark.", confidence: "HIGH" },
          { type: "Process Learning", content: "Multi-vendor RFQ strategy completed 97% faster than single-source expedited (2h 33m vs est. 2 days). Recommend as default for steel procurements <5T.", confidence: "MEDIUM" },
        ].map(({ type, content, confidence }) => (
          <div key={type} className="p-2 bg-violet-50 border border-violet-100 rounded-sm mb-1.5 text-[11px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold text-violet-700 bg-violet-200 px-1.5 py-0.5 rounded-sm uppercase">{type}</span>
              <Badge color={confidence === "HIGH" ? "green" : "amber"}>{confidence}</Badge>
            </div>
            <div className="text-foreground">{content}</div>
          </div>
        ))}
      </DetailCard>
      <DetailCard title="Knowledge Base Updates" icon={BookOpen}>
        <KV k="Vendor Registry" v="Continental Steel Group — lead time updated to 2 days (was 3 days)" />
        <KV k="Pricing History" v="A36 benchmark updated: $891/ton, Jun 24, 2026" />
        <KV k="SOP Feedback" v="SOP-PROC-2024-047 §4.1 — quote response time 100% (all 4 vendors). No SOP revision needed." />
        <KV k="Risk Model" v="Supplier risk scores refreshed post-mission. No changes to CSG profile." />
      </DetailCard>
      <DetailCard title="Future Recommendations" icon={TrendingUp}>
        {[
          "Pre-negotiate blanket order with Continental Steel Group for Q3 2026 to lock in current pricing and reduce future procurement cycle to <30 min.",
          "Set automated reorder trigger in SAP when Line B steel inventory drops below 0.5T to prevent future emergency procurements.",
          "Review Harbor Industrial Supply (risk 41) — consider deprioritizing for time-sensitive orders due to 8-day lead time.",
        ].map((rec, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0 text-[11px]">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <span className="text-foreground">{rec}</span>
          </div>
        ))}
      </DetailCard>
    </div>
  ),

  impact: () => (
    <div className="space-y-3">
      <DetailCard title="Mission Summary" icon={Star}>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { label: "Mission Score", value: "94 / 100", color: "text-emerald-600" },
            { label: "Objectives Met", value: "3 / 3", color: "text-emerald-600" },
            { label: "On-time Delivery", value: "YES", color: "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-2 bg-emerald-50 border border-emerald-100 rounded-sm">
              <div className={cn("text-base font-bold font-mono", color)}>{value}</div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
        <KV k="Mission Duration" v="2h 33m 16s (est. 2 business days manual)" />
        <KV k="Automation Rate" v="97.8% (one human approval touch)" />
        <KV k="Total AI Cost" v="$0.2847 (0.032% of PO value)" />
        <KV k="Total Tokens" v="184,320 (in: 142,880 / out: 41,440)" />
      </DetailCard>
      <DetailCard title="Business Value Delivered" icon={TrendingUp}>
        {[
          { metric: "Direct Cost Saving", value: "$309.00", sub: "vs. $1,200 budget ceiling" },
          { metric: "Downtime Risk Prevented", value: "$180,000", sub: "Line B shutdown avoided" },
          { metric: "Speed vs Manual Process", value: "97.8% faster", sub: "2h 33m vs 2 business days" },
          { metric: "Supplier Risk Exposure", value: "↓ 73%", sub: "Risk score 8 vs dept avg 30" },
          { metric: "Lead Time Achieved", value: "2 days", sub: "4 days faster than category avg" },
        ].map(({ metric, value, sub }) => (
          <div key={metric} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 text-[11px]">
            <span className="text-foreground">{metric}</span>
            <div className="text-right">
              <div className="font-bold text-emerald-600">{value}</div>
              <div className="text-[10px] text-muted-foreground">{sub}</div>
            </div>
          </div>
        ))}
      </DetailCard>
    </div>
  ),
};

// ─── Supporting Data ───────────────────────────────────────────────────────

const VENDORS = [
  { name: "Continental Steel Group", price: 891, leadDays: 2, risk: 8, quality: 97, score: 96, selected: true, rejectionReason: "" },
  { name: "Midwest Steel Solutions", price: 847, leadDays: 3, risk: 12, quality: 94, score: 82, selected: false, rejectionReason: "3-day lead time risks Jun 27 deadline with zero buffer. Risk of missing production window outweighs $44/ton saving." },
  { name: "Apex Metal Distributors", price: 823, leadDays: 5, risk: 28, quality: 91, score: 61, selected: false, rejectionReason: "5-day lead time delivers Jun 29 — misses Friday deadline by 2 days. Disqualified on delivery constraint." },
  { name: "Harbor Industrial Supply", price: 812, leadDays: 8, risk: 41, quality: 88, score: 34, selected: false, rejectionReason: "8-day lead time (delivers Jul 2), risk score 41 exceeds enterprise threshold of 30. Disqualified on two criteria." },
];

type ToolCallItem = {
  stage: string;
  tool: string;
  args: string;
  result: string;
  latency: number;
  tokens: number;
  status: "success" | "error";
};

const TOOL_CALLS: ToolCallItem[] = [
  { stage: "discovery", tool: "search_approved_vendors", args: 'category="Steel", grade="A36", quantity="1T", location="Detroit"', result: "12 vendors found. 4 with confirmed stock ≥1T.", latency: 847, tokens: 1240, status: "success" },
  { stage: "discovery", tool: "get_vendor_details", args: 'vendor_ids=["CSG-0044","MWS-0112","AMD-0389","HIS-0271"]', result: "Details retrieved: certifications, contacts, addresses, payment terms.", latency: 1204, tokens: 3480, status: "success" },
  { stage: "evaluation", tool: "request_quotes", args: 'vendor_ids=["CSG-0044","MWS-0112","AMD-0389","HIS-0271"], qty="1T", delivery_by="2026-06-26"', result: "4 quotes received. CSG:$891, MWS:$847, AMD:$823, HIS:$812.", latency: 8420, tokens: 4120, status: "success" },
  { stage: "evaluation", tool: "get_supplier_risk_scores", args: 'vendor_ids=["CSG-0044","MWS-0112","AMD-0389","HIS-0271"]', result: "Risk scores: CSG:8, MWS:12, AMD:28, HIS:41.", latency: 1087, tokens: 980, status: "success" },
  { stage: "evaluation", tool: "score_vendors_weighted", args: 'weights={delivery:0.40, cost:0.35, risk:0.25}, vendors=[...]', result: "Scores: CSG:96, MWS:82, AMD:61, HIS:34. Continental Steel Group selected.", latency: 312, tokens: 2840, status: "success" },
  { stage: "budget", tool: "check_budget_availability", args: 'cost_center="CC-MFG-PLB-2026", amount=891, currency="USD"', result: "APPROVED. Available: $48,720. Commitment: $891.", latency: 1204, tokens: 840, status: "success" },
  { stage: "purchase", tool: "create_purchase_order", args: 'vendor="CSG-0044", material="A36-ST-1T", qty=1.0, price=891, delivery="2026-06-26", approval="APPR-2026-09847"', result: "PO-2026-18847 created. Vendor confirmed delivery 10:30 EST Jun 26.", latency: 3847, tokens: 5240, status: "success" },
  { stage: "purchase", tool: "send_po_confirmation", args: 'po_id="PO-2026-18847", method="email+edi"', result: "PO transmitted via EDI 860. Email confirmation received from Continental Steel Group at 09:37:44.", latency: 2140, tokens: 1820, status: "success" },
  { stage: "erp", tool: "update_erp_commitment", args: 'po_id="PO-2026-18847", system="SAP-S4H", module="MM-FI"', result: "ERP updated. GR/GI document 4900018847. Account 300200 committed $891.", latency: 4820, tokens: 2140, status: "success" },
  { stage: "erp", tool: "notify_stakeholders", args: 'po_id="PO-2026-18847", recipients=["s.chen","j.martinez","r.patel"]', result: "3 notifications sent via email + Onyx app. All delivered.", latency: 1480, tokens: 3200, status: "success" },
];

type AuditEntry = {
  id: string;
  ts: string;
  stage: string;
  agent: string;
  action: string;
  result: string;
  latencyMs: number;
  tokens: number;
  costUsd: number;
  status: "success" | "info" | "warning" | "error";
  detail: string;
};

const AUDIT_LOGS: AuditEntry[] = [
  { id: "AUD-0001", ts: "09:14:22", stage: "Mission Created", agent: "Orchestrator", action: "Mission instantiated from ERP alert SAP-PM-2026-18302", result: "Initialized", latencyMs: 142, tokens: 840, costUsd: 0.0008, status: "info", detail: "Mission MSN-2026-0847 created. Assigned to Procurement Agent PROC-001. Priority: CRITICAL. Deadline: Jun 27, 2026 17:00 EST." },
  { id: "AUD-0002", ts: "09:14:30", stage: "Mission Created", agent: "Orchestrator", action: "Context assembled — ERP, production schedule, budget data loaded", result: "Success", latencyMs: 847, tokens: 4200, costUsd: 0.0042, status: "success", detail: "14 context documents loaded. Production schedule Week 26 retrieved from SAP. Budget ceiling confirmed at $1,200/ton." },
  { id: "AUD-0003", ts: "09:14:38", stage: "Planning", agent: "Procurement Agent", action: "Strategic planning — 3 plan variants generated and evaluated", result: "Success", latencyMs: 24100, tokens: 16260, costUsd: 0.0163, status: "success", detail: "Plan Variant B (multi-vendor RFQ) selected with confidence 94.2%. Variants A and C rejected." },
  { id: "AUD-0004", ts: "09:15:02", stage: "Knowledge Retrieval", agent: "Knowledge Agent", action: "Semantic search across enterprise knowledge base — 14 documents retrieved", result: "Success", latencyMs: 1847, tokens: 12440, costUsd: 0.0124, status: "success", detail: "847 chunks indexed. Top relevance: SOP-PROC-2024-047 (97%). RAG: hybrid dense+sparse BM25." },
  { id: "AUD-0005", ts: "09:16:45", stage: "Supplier Discovery", agent: "Sourcing Agent", action: "search_approved_vendors() — 2,847 vendors scanned, 12 pre-qualified", result: "Success", latencyMs: 847, tokens: 1240, costUsd: 0.0012, status: "success", detail: "Category: Steel & Metals, A36 grade. 12 active pre-qualified vendors. 4 confirmed ≥1T stock." },
  { id: "AUD-0006", ts: "09:16:55", stage: "Supplier Discovery", agent: "Sourcing Agent", action: "get_vendor_details() — 4 vendors profiled", result: "Success", latencyMs: 1204, tokens: 3480, costUsd: 0.0035, status: "success", detail: "CSG, MWS, AMD, HIS profiles retrieved. Certifications, contacts, payment terms confirmed." },
  { id: "AUD-0007", ts: "09:17:02", stage: "Supplier Discovery", agent: "Sourcing Agent", action: "RFQ transmitted to 4 vendors via EDI 840", result: "Success", latencyMs: 2840, tokens: 2180, costUsd: 0.0022, status: "success", detail: "4 quote requests sent. Required: price, lead time, delivery confirmation for 1T A36 by Jun 26." },
  { id: "AUD-0008", ts: "09:22:18", stage: "Vendor Evaluation", agent: "Procurement Agent", action: "request_quotes() — 4 quotes received and parsed", result: "Success", latencyMs: 8420, tokens: 4120, costUsd: 0.0041, status: "success", detail: "All 4 vendors responded. CSG: $891/2d, MWS: $847/3d, AMD: $823/5d, HIS: $812/8d." },
  { id: "AUD-0009", ts: "09:22:40", stage: "Vendor Evaluation", agent: "Risk Agent", action: "get_supplier_risk_scores() — 4 vendors assessed", result: "Success", latencyMs: 1087, tokens: 980, costUsd: 0.0010, status: "success", detail: "Scores: CSG:8, MWS:12, AMD:28, HIS:41. HIS exceeds enterprise threshold of 30." },
  { id: "AUD-0010", ts: "09:22:52", stage: "Vendor Evaluation", agent: "Procurement Agent", action: "score_vendors_weighted() — winner selected: Continental Steel Group", result: "Success", latencyMs: 312, tokens: 2840, costUsd: 0.0028, status: "success", detail: "Score CSG:96. Delivery constraint eliminated AMD and HIS. Margins vs MWS: speed buffer +1 day, risk -33%." },
  { id: "AUD-0011", ts: "09:31:44", stage: "Policy Validation", agent: "Policy Agent", action: "5 policies validated — all COMPLIANT", result: "Compliant", latencyMs: 4820, tokens: 8240, costUsd: 0.0082, status: "success", detail: "POLICY-FIN-2024-012, POLICY-PROC-2024-008, POLICY-RISK-2024-003, POLICY-QUAL-2024-015, POLICY-ENV-2024-002." },
  { id: "AUD-0012", ts: "09:33:12", stage: "Policy Validation", agent: "Policy Agent", action: "Human approval workflow initiated — amount $891 exceeds $500 threshold", result: "Pending", latencyMs: 480, tokens: 1240, costUsd: 0.0012, status: "info", detail: "Approval request APPR-2026-09847 sent to J. Martinez via Onyx Mobile App." },
  { id: "AUD-0013", ts: "09:34:12", stage: "Budget Check", agent: "Finance Agent", action: "check_budget_availability() — CC-MFG-PLB-2026", result: "Approved", latencyMs: 1204, tokens: 840, costUsd: 0.0008, status: "success", detail: "Available $48,720 of $75,000 Q2 budget. Commitment $891 approved. $47,829 remaining." },
  { id: "AUD-0014", ts: "09:35:14", stage: "Budget Check", agent: "Orchestrator", action: "Human approval received — J. Martinez, VP Procurement", result: "Approved", latencyMs: 0, tokens: 420, costUsd: 0.0004, status: "success", detail: "APPR-2026-09847 approved. Comment: 'Continental Steel is our preferred vendor. Proceed.' Biometric confirmed." },
  { id: "AUD-0015", ts: "09:36:55", stage: "Purchase Order", agent: "Procurement Agent", action: "create_purchase_order() — PO-2026-18847 issued", result: "Success", latencyMs: 3847, tokens: 5240, costUsd: 0.0052, status: "success", detail: "PO-2026-18847 for 1T A36 @ $891 with Continental Steel Group. Delivery Jun 26, 10:30 EST, Dock B." },
  { id: "AUD-0016", ts: "09:37:44", stage: "Purchase Order", agent: "Procurement Agent", action: "PO confirmation received from Continental Steel Group via EDI 855", result: "Confirmed", latencyMs: 2140, tokens: 1820, costUsd: 0.0018, status: "success", detail: "Vendor confirmed all PO terms. Mill certificate to accompany shipment. Driver contact provided." },
  { id: "AUD-0017", ts: "09:39:22", stage: "ERP Update", agent: "ERP Agent", action: "update_erp_commitment() — SAP S/4HANA synchronized", result: "Success", latencyMs: 4820, tokens: 2140, costUsd: 0.0021, status: "success", detail: "GR/GI document 4900018847. Account 300200 committed $891. QM inspection lot QI-2026-18847-001 created." },
  { id: "AUD-0018", ts: "09:40:10", stage: "ERP Update", agent: "ERP Agent", action: "notify_stakeholders() — 3 stakeholders notified", result: "Success", latencyMs: 1480, tokens: 3200, costUsd: 0.0032, status: "success", detail: "S. Chen (email+Slack), J. Martinez (Onyx App), R. Patel (email). All delivered." },
  { id: "AUD-0019", ts: "09:41:08", stage: "Learning", agent: "Memory Agent", action: "Update supplier intelligence — Continental Steel Group preferred status", result: "Success", latencyMs: 840, tokens: 2840, costUsd: 0.0028, status: "success", detail: "Vendor profile updated: lead time 2 days, quality 97%, preferred for A36 Detroit Plant 3." },
  { id: "AUD-0020", ts: "09:41:42", stage: "Learning", agent: "Memory Agent", action: "Knowledge base update — pricing benchmark and process learning", result: "Success", latencyMs: 1240, tokens: 3480, costUsd: 0.0035, status: "success", detail: "3 memory records written. Pricing benchmark updated. Multi-vendor RFQ strategy recorded as best practice." },
  { id: "AUD-0021", ts: "09:42:33", stage: "Business Impact", agent: "Orchestrator", action: "Mission MSN-2026-0847 completed — score 94/100", result: "Completed", latencyMs: 240, tokens: 4200, costUsd: 0.0042, status: "success", detail: "All objectives met. $309 under budget. $180K downtime risk prevented. Delivery confirmed Jun 26. Mission closed." },
];

const AGENT_MESSAGES = [
  { from: "Orchestrator", to: "Procurement Agent", ts: "09:14:22", content: "Mission MSN-2026-0847 initiated. Objective: Purchase 1T A36 Structural Steel for Line B before Jun 27 EOD. Budget ceiling: $1,200/ton. Priority: CRITICAL.", type: "system" },
  { from: "Procurement Agent", to: "Knowledge Agent", ts: "09:14:38", content: "Retrieve material specifications for A36 Structural Steel, procurement SOPs, approved vendor registry, and supplier risk framework.", type: "request" },
  { from: "Knowledge Agent", to: "Procurement Agent", ts: "09:15:02", content: "Retrieved 14 documents (847 chunks). Key: SOP-PROC-2024-047 (steel procurement standards), ASTM A36/A36M-19 spec sheet, Q1 2026 pricing benchmarks — market range $850–$920/ton. Confidence: 97%.", type: "response" },
  { from: "Procurement Agent", to: "Sourcing Agent", ts: "09:16:40", content: "Identify approved A36 steel vendors with ≥1T stock, Detroit delivery capability. Solicit competitive quotes. Delivery required by Jun 26, 2026.", type: "request" },
  { from: "Sourcing Agent", to: "Procurement Agent", ts: "09:17:02", content: "12 pre-qualified vendors found. 4 confirmed stock ≥1T: Continental Steel Group, Midwest Steel Solutions, Apex Metal Distributors, Harbor Industrial Supply. RFQ transmitted via EDI 840.", type: "response" },
  { from: "Sourcing Agent", to: "Risk Agent", ts: "09:17:05", content: "Please assess supplier risk scores for CSG-0044, MWS-0112, AMD-0389, HIS-0271.", type: "request" },
  { from: "Risk Agent", to: "Procurement Agent", ts: "09:22:40", content: "Risk scores assessed: CSG: 8 (LOW), MWS: 12 (LOW), AMD: 28 (MODERATE), HIS: 41 (HIGH — EXCEEDS THRESHOLD). All 4 quotes received: CSG $891/2d, MWS $847/3d, AMD $823/5d, HIS $812/8d.", type: "response" },
  { from: "Procurement Agent", to: "Finance Agent", ts: "09:31:50", content: "Requesting budget clearance for $891 against cost center CC-MFG-PLB-2026, FY2026 Q2.", type: "request" },
  { from: "Finance Agent", to: "Procurement Agent", ts: "09:34:12", content: "Budget APPROVED. $48,720 available in Q2. Commitment $891 cleared. Remaining after commitment: $47,829. No escalation required.", type: "response" },
  { from: "Policy Agent", to: "Orchestrator", ts: "09:33:12", content: "POLICY-FIN-2024-012: purchase of $891 requires VP Procurement approval. Approval request APPR-2026-09847 sent to J. Martinez. All other policies: COMPLIANT.", type: "alert" },
  { from: "Orchestrator", to: "Procurement Agent", ts: "09:35:14", content: "Human approval received. J. Martinez approved APPR-2026-09847. Proceed to issue PO.", type: "system" },
  { from: "Procurement Agent", to: "ERP Agent", ts: "09:36:55", content: "Issue PO-2026-18847 to Continental Steel Group. 1T A36 @ $891. Delivery Jun 26, 10:30 EST, Dock B. Sync to SAP and notify stakeholders.", type: "request" },
  { from: "ERP Agent", to: "Orchestrator", ts: "09:40:10", content: "ERP synchronized. GR/GI posted. 3 stakeholders notified. Delivery confirmed by vendor via EDI 855. Mission objectives complete.", type: "response" },
  { from: "Procurement Agent", to: "Memory Agent", ts: "09:41:08", content: "Log mission learnings: Continental Steel Group preferred A36 vendor status, pricing benchmark update, multi-vendor RFQ best practice.", type: "request" },
  { from: "Memory Agent", to: "Orchestrator", ts: "09:41:42", content: "3 memory records written. Supplier intel updated. Pricing benchmark refreshed. Process recommendation stored. Knowledge base current.", type: "response" },
  { from: "Orchestrator", to: "All Agents", ts: "09:42:33", content: "Mission MSN-2026-0847 COMPLETED. Score: 94/100. $309 under budget. $180K production risk prevented. Delivery Jun 26, 10:30 EST confirmed. All agents dismissed.", type: "system" },
];

// ─── Sub-components ────────────────────────────────────────────────────────

function Badge({ color, children }: { color: "green" | "red" | "amber" | "blue" | "violet"; children: React.ReactNode }) {
  const colors = {
    green: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    red: "bg-red-100 text-red-700 border border-red-200",
    amber: "bg-amber-100 text-amber-700 border border-amber-200",
    blue: "bg-blue-100 text-blue-700 border border-blue-200",
    violet: "bg-violet-100 text-violet-700 border border-violet-200",
  };
  return (
    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest", colors[color])}>
      {children}
    </span>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 text-[11px]">
      <span className="text-muted-foreground w-36 shrink-0">{k}</span>
      <span className="text-foreground font-medium">{v}</span>
    </div>
  );
}

function DetailCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-border rounded-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
        <Icon size={12} className="text-violet-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function ToolCallRow({ tool, args, result, latency, tokens, status }: ToolCallItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border rounded-sm mb-1.5 text-[11px] cursor-pointer", status === "success" ? "border-emerald-200" : "border-red-200")} onClick={() => setOpen(!open)}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status === "success" ? "bg-emerald-500" : "bg-red-500")} />
        <span className="font-mono font-bold text-foreground">{tool}()</span>
        <span className="font-mono text-emerald-600 text-[10px] ml-auto">{latency}ms</span>
        <span className="font-mono text-muted-foreground text-[10px]">{tokens.toLocaleString()} tok</span>
        {open ? <ChevronUp size={11} className="text-muted-foreground" /> : <ChevronDown size={11} className="text-muted-foreground" />}
      </div>
      {open && (
        <div className="border-t border-border/40 px-2 py-1.5 bg-[#FAFAFA] space-y-1">
          <div><span className="text-muted-foreground">Args: </span><span className="font-mono text-[10px] text-foreground">{args}</span></div>
          <div><span className="text-muted-foreground">Result: </span><span className="font-mono text-[10px] text-emerald-700">{result}</span></div>
        </div>
      )}
    </div>
  );
}

// ─── Decision Intelligence Panel ──────────────────────────────────────────

const DECISIONS: Record<string, { decision: string; reason: string; confidence: number; impact: string; saving: string; riskReduction: string; sop: string; policy: string; dept: string; nextAction: string }> = {
  created: { decision: "Accept mission and initiate multi-vendor procurement", reason: "ERP signal indicates critical material shortage. Line B restart risk: $180K/day. Immediate action required.", confidence: 99, impact: "$180K downtime risk prevention", saving: "Up to $309 vs budget ceiling", riskReduction: "Production stoppage risk → 0", sop: "SOP-PROC-2024-047", policy: "POLICY-FIN-2024-012", dept: "Manufacturing / Procurement", nextAction: "Begin strategic planning phase" },
  planning: { decision: "Multi-vendor competitive RFQ with risk-weighted scoring", reason: "Variant B yields 97.8% faster execution vs manual. Single-source (Variant A) cost premium 28% above ceiling. Framework (Variant C) expired Jun 12.", confidence: 94, impact: "2h 33m vs 2 business days", saving: "$309 under ceiling (projected)", riskReduction: "Supplier concentration risk minimized", sop: "SOP-PROC-2024-047 §4.1", policy: "POLICY-PROC-2024-008", dept: "Procurement", nextAction: "Retrieve enterprise knowledge and vendor registry" },
  knowledge: { decision: "Proceed with 4 pre-qualified vendors only", reason: "97% relevance match in SOP confirms A36 procurement requires pre-qualified vendor status. Q1 pricing benchmark: $850–920/ton target range.", confidence: 97, impact: "Compliance risk: zero", saving: "Market-rate guidance limits overpay risk", riskReduction: "Non-compliant vendor risk eliminated", sop: "SOP-PROC-2024-047 §3.2", policy: "POLICY-PROC-2024-008", dept: "Procurement / Legal", nextAction: "Solicit competitive quotes from 4 vendors" },
  discovery: { decision: "Solicit competitive quotes from 4 vendors simultaneously", reason: "Parallel RFQ reduces wait time vs sequential. All 4 have confirmed A36 stock ≥1T. Response rate history: 100% for this vendor set.", confidence: 92, impact: "Time saving: ~4 hours vs sequential", saving: "Parallel process enables best-price selection", riskReduction: "Single-vendor dependency eliminated", sop: "SOP-PROC-2024-047 §4.1", policy: "POLICY-PROC-2024-008", dept: "Sourcing", nextAction: "Evaluate quotes with weighted scoring model" },
  evaluation: { decision: "Select Continental Steel Group @ $891/ton", reason: "Only vendor guaranteeing delivery before Friday with risk score below threshold. $44 premium vs Midwest Steel justified by 1-day delivery buffer and lower risk. AMD/HIS disqualified on delivery.", confidence: 96, impact: "$180K downtime risk eliminated", saving: "$309 under $1,200 ceiling", riskReduction: "73% below dept avg risk score", sop: "SOP-PROC-2024-047 §5.1", policy: "POLICY-RISK-2024-003", dept: "Procurement / Risk", nextAction: "Validate against 5 enterprise policies" },
  policy: { decision: "All 5 policies compliant. Trigger human approval for $891 purchase.", reason: "POLICY-FIN-2024-012 mandates VP Procurement approval for $500–$5,000. All other policies passed. Risk score 8 well below 30 threshold. Quality 97% above 88% minimum.", confidence: 99, impact: "Full enterprise compliance", saving: "Zero compliance remediation cost", riskReduction: "Audit and legal risk: zero", sop: "SOP-PROC-2024-047 §5.3", policy: "POLICY-FIN-2024-012", dept: "Compliance / Finance", nextAction: "Await VP approval before PO issuance" },
  budget: { decision: "Budget approved. $891 committed against Q2 allocation.", reason: "Q2 remaining: $48,720. Purchase at 1.8% of available budget. 25.75% under ceiling provides meaningful saving vs plan.", confidence: 100, impact: "$47,829 Q2 budget preserved", saving: "$309 direct saving", riskReduction: "Budget overrun risk: zero", sop: "SOP-PROC-2024-047 §5.3", policy: "POLICY-FIN-2024-012", dept: "Finance", nextAction: "Issue purchase order to Continental Steel Group" },
  purchase: { decision: "Issue PO-2026-18847 to Continental Steel Group", reason: "All prerequisites met: vendor selected, policies compliant, budget cleared, human approved. EDI 855 confirmation received — delivery locked Jun 26, 10:30 EST.", confidence: 99, impact: "Delivery guaranteed before deadline", saving: "$891 vs $1,200 ceiling", riskReduction: "Delivery risk eliminated", sop: "SOP-PROC-2024-047 §5.3", policy: "POLICY-FIN-2024-012", dept: "Procurement", nextAction: "Sync to ERP and notify stakeholders" },
  erp: { decision: "Post commitment to SAP and notify 3 stakeholders", reason: "PO confirmed. SAP commitment required for financial reporting. Stakeholder notification ensures production team can schedule receiving and QM inspection.", confidence: 99, impact: "Line B restart confirmed for Mon Jun 30", saving: "No late fees or expediting costs", riskReduction: "Production plan risk: zero", sop: "SOP-PROC-2024-047 §6.1", policy: "POLICY-FIN-2024-012", dept: "Operations / Finance", nextAction: "Log learnings and close mission" },
  learning: { decision: "Store 3 memory records. Flag Continental Steel as preferred vendor.", reason: "Mission performance validates CSG as reliable A36 supplier. Multi-vendor RFQ strategy outperformed benchmark by 97.8%. Data should influence future procurement decisions.", confidence: 98, impact: "Future missions 60% faster (estimated)", saving: "Blanket order could save $40–$60/ton in Q3", riskReduction: "Future supplier uncertainty reduced", sop: "SOP-PROC-2024-047 §7.1", policy: "POLICY-RISK-2024-003", dept: "Procurement", nextAction: "Close mission and generate business impact report" },
  impact: { decision: "Mission completed. Score 94/100.", reason: "All 3 objectives met: on-time delivery guaranteed, $309 under budget, supplier risk score 8 (enterprise low). One human touch required (policy compliant). Total AI cost: $0.28.", confidence: 94, impact: "$180,309 total business value", saving: "$309 direct + $180K risk prevention", riskReduction: "All risks resolved to zero", sop: "SOP-PROC-2024-047", policy: "All compliant", dept: "Manufacturing / Procurement", nextAction: "Initiate Q3 blanket order negotiation" },
};

// ─── Execution Board Data ──────────────────────────────────────────────────

type BoardColId = "backlog" | "planned" | "in-progress" | "waiting-tool" | "waiting-human" | "completed" | "blocked" | "failed";

interface BoardTask {
  id: string;
  name: string;
  agent: string;
  col: BoardColId;
  priority: "Critical" | "High" | "Medium" | "Low";
  confidence: number;
  startTime: string;
  duration: string;
  tokens: number;
  cost: number;
  stage: string;
  tool?: string;
  dept: string;
}

const BOARD_COLUMNS: { id: BoardColId; label: string; color: string; headerColor: string }[] = [
  { id: "backlog",        label: "Backlog",              color: "bg-slate-400",   headerColor: "bg-slate-50 border-slate-200"    },
  { id: "planned",        label: "Planned",              color: "bg-blue-400",    headerColor: "bg-blue-50 border-blue-200"      },
  { id: "in-progress",    label: "In Progress",          color: "bg-violet-500",  headerColor: "bg-violet-50 border-violet-200"  },
  { id: "waiting-tool",   label: "Waiting for Tool",     color: "bg-amber-400",   headerColor: "bg-amber-50 border-amber-200"    },
  { id: "waiting-human",  label: "Waiting for Human",    color: "bg-orange-400",  headerColor: "bg-orange-50 border-orange-200"  },
  { id: "completed",      label: "Completed",            color: "bg-emerald-500", headerColor: "bg-emerald-50 border-emerald-200" },
  { id: "blocked",        label: "Blocked",              color: "bg-red-400",     headerColor: "bg-red-50 border-red-200"        },
  { id: "failed",         label: "Failed",               color: "bg-rose-600",    headerColor: "bg-rose-50 border-rose-200"      },
];

const BOARD_TASKS: BoardTask[] = [
  { id: "TK-001", name: "Parse Procurement Request",       agent: "Orchestrator",      col: "completed",     priority: "High",     confidence: 99,  startTime: "09:14:22", duration: "14s",    tokens: 2847,  cost: 0.0041, stage: "Mission Created",    dept: "Procurement" },
  { id: "TK-002", name: "Validate Material Specification", agent: "Procurement Agent", col: "completed",     priority: "High",     confidence: 97,  startTime: "09:14:36", duration: "23s",    tokens: 3201,  cost: 0.0048, stage: "Mission Created",    tool: "Knowledge Base API",          dept: "Procurement" },
  { id: "TK-003", name: "Retrieve Historical Purchases",   agent: "Knowledge Agent",   col: "completed",     priority: "Medium",   confidence: 95,  startTime: "09:15:02", duration: "1m 43s", tokens: 8904,  cost: 0.0128, stage: "Knowledge Retrieval",tool: "Knowledge Search API",        dept: "Procurement" },
  { id: "TK-004", name: "Search Approved Vendor Registry", agent: "Sourcing Agent",    col: "completed",     priority: "High",     confidence: 92,  startTime: "09:16:45", duration: "2m 12s", tokens: 6340,  cost: 0.0091, stage: "Supplier Discovery", tool: "search_approved_vendors()",   dept: "Sourcing"    },
  { id: "TK-005", name: "Retrieve ERP Vendor Pricing",     agent: "Sourcing Agent",    col: "completed",     priority: "Medium",   confidence: 90,  startTime: "09:16:55", duration: "1m 47s", tokens: 4820,  cost: 0.0069, stage: "Supplier Discovery", tool: "get_vendor_details()",        dept: "Sourcing"    },
  { id: "TK-006", name: "Request Supplier Quotations",     agent: "Sourcing Agent",    col: "completed",     priority: "Critical", confidence: 94,  startTime: "09:17:02", duration: "5m 33s", tokens: 12440, cost: 0.0179, stage: "Supplier Discovery", tool: "request_quotes()",            dept: "Sourcing"    },
  { id: "TK-007", name: "Score & Rank Vendor Proposals",   agent: "Procurement Agent", col: "completed",     priority: "High",     confidence: 96,  startTime: "09:22:18", duration: "3m 14s", tokens: 9102,  cost: 0.0131, stage: "Vendor Evaluation",  tool: "score_vendors_weighted()",    dept: "Procurement" },
  { id: "TK-008", name: "Supplier Risk Assessment",        agent: "Risk Agent",        col: "completed",     priority: "High",     confidence: 91,  startTime: "09:22:40", duration: "2m 48s", tokens: 7630,  cost: 0.0110, stage: "Vendor Evaluation",  tool: "get_supplier_risk_scores()",  dept: "Risk"        },
  { id: "TK-009", name: "Policy Compliance Validation",    agent: "Policy Agent",      col: "in-progress",   priority: "Critical", confidence: 99,  startTime: "09:31:44", duration: "2m 28s", tokens: 5890,  cost: 0.0085, stage: "Policy Validation",  tool: "Policy Engine API",           dept: "Compliance"  },
  { id: "TK-010", name: "Budget Availability Check",       agent: "Finance Agent",     col: "in-progress",   priority: "High",     confidence: 100, startTime: "09:34:12", duration: "2m 43s", tokens: 4210,  cost: 0.0060, stage: "Budget Check",       tool: "check_budget_availability()", dept: "Finance"     },
  { id: "TK-011", name: "VP Procurement Approval",         agent: "Orchestrator",      col: "waiting-human", priority: "Critical", confidence: 99,  startTime: "09:33:12", duration: "8m 04s", tokens: 820,   cost: 0.0012, stage: "Policy Validation",  dept: "Procurement" },
  { id: "TK-012", name: "Generate Purchase Order",         agent: "Procurement Agent", col: "waiting-tool",  priority: "Critical", confidence: 99,  startTime: "09:36:55", duration: "2m 27s", tokens: 6780,  cost: 0.0097, stage: "Purchase Order",     tool: "create_purchase_order()",     dept: "Procurement" },
  { id: "TK-013", name: "Update SAP ERP Commitment",       agent: "ERP Agent",         col: "planned",       priority: "High",     confidence: 98,  startTime: "09:39:22", duration: "1m 14s", tokens: 3420,  cost: 0.0049, stage: "ERP Update",         tool: "update_erp_commitment()",     dept: "Operations"  },
  { id: "TK-014", name: "Notify Stakeholders",             agent: "ERP Agent",         col: "planned",       priority: "Medium",   confidence: 97,  startTime: "09:40:10", duration: "32s",    tokens: 2140,  cost: 0.0031, stage: "ERP Update",         tool: "notify_stakeholders()",       dept: "Operations"  },
  { id: "TK-015", name: "Archive Execution Logs",          agent: "Memory Agent",      col: "backlog",       priority: "Low",      confidence: 98,  startTime: "09:41:08", duration: "24s",    tokens: 1890,  cost: 0.0027, stage: "Learning",           tool: "Memory Store API",            dept: "Knowledge"   },
];

const STAGE_KEY_MAP: Record<string, number> = {
  "Mission Created": 0, "Planning": 1, "Knowledge Retrieval": 2,
  "Supplier Discovery": 3, "Vendor Evaluation": 4, "Policy Validation": 5,
  "Budget Check": 6, "Purchase Order": 7, "ERP Update": 8, "Learning": 9, "Business Impact": 10,
};

interface TaskDetail {
  objective: string;
  reasoningSummary: string;
  knowledgeRetrieved: string[];
  memoryAccessed: string[];
  toolCalls: { tool: string; args: string; result: string; latencyMs: number }[];
  documentsConsulted: string[];
  decisionTaken: string;
  outputGenerated: string;
  validationResults: { rule: string; result: string }[];
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  businessImpact: string;
  executionLogs: string[];
}

const TASK_DETAILS: Record<string, TaskDetail> = {
  "TK-001": {
    objective: "Parse and validate incoming ERP alert SAP-PM-2026-18302 and instantiate mission MSN-2026-0847 with correct parameters, priority, and agent assignment.",
    reasoningSummary: "ERP alert SAP-PM-2026-18302 identifies a critical material shortage for A36 Structural Steel on Line B. Parsing the alert extracts quantity (1T), material grade (A36/A36M-19), deadline (Jun 27 EOD), and budget ceiling ($1,200/ton). Mission parameters validated against production schedule Week 26.",
    knowledgeRetrieved: ["ERP Alert SAP-PM-2026-18302", "Production Schedule W26 — Line B"],
    memoryAccessed: ["Previous A36 procurement records Q1 2026", "Agent assignment matrix"],
    toolCalls: [{ tool: "parse_erp_alert", args: 'alert_id="SAP-PM-2026-18302"', result: "Material: A36, Qty: 1T, Deadline: 2026-06-27T17:00, Budget: $1200/ton", latencyMs: 142 }],
    documentsConsulted: ["SAP-PM-2026-18302 (ERP Alert)", "Prod Schedule W26"],
    decisionTaken: "Instantiate mission MSN-2026-0847. Assign Procurement Agent PROC-001. Priority: CRITICAL.",
    outputGenerated: "Mission record MSN-2026-0847 created with all parameters. Orchestration context assembled.",
    validationResults: [{ rule: "Alert authenticity", result: "VERIFIED" }, { rule: "Material code match", result: "VERIFIED — A36/A36M-19" }, { rule: "Budget within policy", result: "WITHIN RANGE" }],
    tokensIn: 1840, tokensOut: 1007, latencyMs: 142,
    businessImpact: "Mission instantiated 2m 14s after ERP alert — zero manual intervention required.",
    executionLogs: ["09:14:22 — ERP alert SAP-PM-2026-18302 received", "09:14:23 — Alert parsed: A36, 1T, $1200 ceiling, Jun 27 deadline", "09:14:24 — PROC-001 assigned. Mission MSN-2026-0847 created."],
  },
  "TK-002": {
    objective: "Validate that A36 Structural Steel specification (ASTM A36/A36M-19) meets enterprise quality requirements and confirm the exact grade and quantity for Line B.",
    reasoningSummary: "Cross-referenced ERP material code A36-ST-001 against the enterprise material master and A36/A36M-19 specification. Confirmed minimum yield strength 250 MPa, tensile 400–550 MPa, and that mill certificate is required per SOP-QUAL-2024-089 §2.1. Quantity 1.000 MT (±2% tolerance) confirmed against Line B bill of materials.",
    knowledgeRetrieved: ["SOP-QUAL-2024-089 §2.1 ASTM A36/A36M-19", "Enterprise Material Master — A36-ST-001"],
    memoryAccessed: ["Previous A36 spec validation records", "Line B material requirements"],
    toolCalls: [{ tool: "get_material_spec", args: 'material_code="A36-ST-001"', result: "Spec: ASTM A36/A36M-19. Yield ≥250MPa. Mill cert required.", latencyMs: 312 }],
    documentsConsulted: ["SOP-QUAL-2024-089", "ASTM A36/A36M-19 spec sheet", "Line B BOM"],
    decisionTaken: "Material specification confirmed. Quantity 1.000 MT (±2%). Mill certificate mandatory.",
    outputGenerated: "Procurement specification brief: A36, ASTM A36/A36M-19, 1T, mill cert required, delivery Dock B.",
    validationResults: [{ rule: "Grade match", result: "COMPLIANT" }, { rule: "Quality threshold", result: "COMPLIANT — min 88%" }, { rule: "Mill cert requirement", result: "MANDATORY — per SOP-QUAL §2.1" }],
    tokensIn: 2140, tokensOut: 1061, latencyMs: 312,
    businessImpact: "Spec validation prevents costly wrong-grade delivery or quality rejection at receiving.",
    executionLogs: ["09:14:36 — Fetching material spec for A36-ST-001", "09:14:37 — Spec retrieved: ASTM A36/A36M-19 confirmed", "09:14:59 — Validation complete. Mill cert requirement flagged."],
  },
  "TK-003": {
    objective: "Retrieve and index historical A36 steel purchases, pricing benchmarks, and supplier performance data from the enterprise knowledge base to inform vendor selection.",
    reasoningSummary: "Performed hybrid RAG search (dense + BM25 sparse) across enterprise knowledge base. Retrieved Q1 2026 pricing benchmarks ($850–920/ton for 1T lots), supplier performance history, and prior procurement SOP compliance records. Knowledge context provided pricing floor/ceiling guidance to the evaluation stage.",
    knowledgeRetrieved: ["HIST-PROC-2026-Q1 — Q1 2026 Steel Procurement History", "SOP-PROC-2024-047 §3.2 & §4.1", "Vendor Registry VENDOR-REG-2026-Q2"],
    memoryAccessed: ["Continental Steel Group: last order Feb 2026 $881/ton", "Apex Metal: delivery failure Jun 2025"],
    toolCalls: [{ tool: "semantic_search", args: 'query="A36 steel procurement pricing Detroit", top_k=50', result: "847 chunks retrieved. Q1 avg $881/ton. CSG preferred status noted.", latencyMs: 1847 }],
    documentsConsulted: ["HIST-PROC-2026-Q1", "SOP-PROC-2024-047", "VENDOR-REG-2026-Q2", "RISK-MGR-2024-003"],
    decisionTaken: "Historical data loaded. Q1 benchmark $881/ton. CSG prior preferred. AMD risk flag noted.",
    outputGenerated: "Enriched context package: pricing benchmarks, vendor history, risk flags — appended to agent working memory.",
    validationResults: [{ rule: "Benchmark currency", result: "CURRENT — Q1 2026" }, { rule: "Coverage completeness", result: "89.3% context utilization" }],
    tokensIn: 6840, tokensOut: 2064, latencyMs: 1847,
    businessImpact: "Historical data prevents repeat of Apex Metal delivery failure Jun 2025. Benchmark anchors negotiating floor.",
    executionLogs: ["09:15:02 — Initiating hybrid RAG search", "09:15:04 — 847 chunks indexed from 14 documents", "09:16:44 — Knowledge package compiled and passed to Procurement Agent"],
  },
  "TK-004": {
    objective: "Search enterprise vendor registry for approved A36 steel suppliers with confirmed Detroit delivery capability and ≥1T available stock.",
    reasoningSummary: "Queried vendor registry (2,847 vendors) with category filter: Steel & Metals, grade A36, location Detroit. Filtered to active/pre-qualified status. 12 vendors matched; capacity check narrowed to 4 with confirmed ≥1T stock.",
    knowledgeRetrieved: ["VENDOR-REG-2026-Q2 — Approved Vendor Registry"],
    memoryAccessed: ["Approved Vendor Only Policy — POLICY-PROC-2024-008"],
    toolCalls: [{ tool: "search_approved_vendors", args: 'category="Steel", grade="A36", qty="1T", location="Detroit"', result: "12 pre-qualified. 4 confirmed stock: CSG, MWS, AMD, HIS.", latencyMs: 847 }],
    documentsConsulted: ["VENDOR-REG-2026-Q2"],
    decisionTaken: "4 vendors shortlisted: Continental Steel Group, Midwest Steel Solutions, Apex Metal Distributors, Harbor Industrial Supply.",
    outputGenerated: "Shortlist of 4 vendors with IDs, contacts, delivery addresses, and payment terms.",
    validationResults: [{ rule: "Registry status", result: "All 4 ACTIVE" }, { rule: "A36 grade certification", result: "All 4 CERTIFIED" }, { rule: "Stock confirmation", result: "All 4 ≥ 1T confirmed" }],
    tokensIn: 4820, tokensOut: 1520, latencyMs: 847,
    businessImpact: "Parallel sourcing from 4 vendors enables competitive pricing. Approved-only policy mitigates compliance risk.",
    executionLogs: ["09:16:45 — Registry search initiated: 2,847 vendors scanned", "09:16:46 — 12 pre-qualified vendors identified", "09:16:56 — 4 vendors confirmed ≥1T stock"],
  },
  "TK-005": {
    objective: "Retrieve current ERP pricing records, contract terms, and historical transaction data for the 4 shortlisted vendors from SAP S/4HANA.",
    reasoningSummary: "Called ERP vendor API to retrieve last invoice prices, contract expiry dates, payment terms, and certification dates for CSG, MWS, AMD, and HIS. All vendor contracts confirmed active. No framework agreements in force (CSG framework expired Jun 12).",
    knowledgeRetrieved: ["ERP Vendor Master — CSG-0044, MWS-0112, AMD-0389, HIS-0271"],
    memoryAccessed: ["CSG framework agreement expiry Jun 12, 2026"],
    toolCalls: [{ tool: "get_vendor_details", args: 'vendor_ids=["CSG-0044","MWS-0112","AMD-0389","HIS-0271"]', result: "Profiles retrieved. All certs active. No framework agreements in force.", latencyMs: 1204 }],
    documentsConsulted: ["SAP Vendor Master records", "Certification files"],
    decisionTaken: "No framework pull available. Proceed with open-market RFQ for all 4 vendors.",
    outputGenerated: "Enriched vendor profiles with pricing history, payment terms, delivery contacts.",
    validationResults: [{ rule: "Vendor active status", result: "All 4 ACTIVE" }, { rule: "Certification current", result: "All 4 CURRENT" }],
    tokensIn: 3480, tokensOut: 1340, latencyMs: 1204,
    businessImpact: "Confirms no expired framework can be erroneously used, preventing policy violation.",
    executionLogs: ["09:16:55 — ERP vendor profile fetch initiated", "09:16:57 — 4 vendor profiles retrieved", "09:18:42 — Framework expiry for CSG noted. Open RFQ path confirmed."],
  },
  "TK-006": {
    objective: "Transmit simultaneous RFQ via EDI 840 to all 4 shortlisted vendors requesting price, lead time, and delivery confirmation for 1T A36 steel by Jun 26.",
    reasoningSummary: "Parallel RFQ dispatch to all 4 vendors using EDI 840 protocol. Required response window: 5 hours. All 4 vendors responded within 5 hours 16 minutes. Quotes parsed and normalized to per-ton-delivered pricing including standard freight.",
    knowledgeRetrieved: ["SOP-PROC-2024-047 §4.1 — Quote Solicitation Procedure"],
    memoryAccessed: ["Vendor EDI endpoint map", "CSG historical response time: 47 min avg"],
    toolCalls: [{ tool: "request_quotes", args: 'vendor_ids=["CSG-0044","MWS-0112","AMD-0389","HIS-0271"], qty="1T", delivery_by="2026-06-26"', result: "4 quotes received. CSG:$891/2d, MWS:$847/3d, AMD:$823/5d, HIS:$812/8d.", latencyMs: 8420 }],
    documentsConsulted: ["SOP-PROC-2024-047 §4.1", "EDI 840 template"],
    decisionTaken: "All 4 quotes received and parsed. Forward to vendor evaluation with risk scoring.",
    outputGenerated: "Normalized quote matrix: {CSG: $891, 2d}, {MWS: $847, 3d}, {AMD: $823, 5d}, {HIS: $812, 8d}",
    validationResults: [{ rule: "Response rate", result: "CONFIRMED — 4/4" }, { rule: "Quote completeness", result: "All 4 COMPLETE" }, { rule: "EDI acknowledgement", result: "All 4 ACKNOWLEDGED" }],
    tokensIn: 8840, tokensOut: 3600, latencyMs: 8420,
    businessImpact: "Parallel RFQ saves ~4 hours vs sequential. 100% response rate enables full competitive comparison.",
    executionLogs: ["09:17:02 — EDI 840 dispatched to 4 vendors", "09:22:10 — CSG quote: $891, 2-day delivery", "09:22:15 — MWS quote: $847, 3-day", "09:22:17 — AMD quote: $823, 5-day", "09:22:18 — HIS quote: $812, 8-day. All parsed."],
  },
  "TK-007": {
    objective: "Apply enterprise weighted scoring model (40% delivery, 35% cost, 25% risk) to rank all 4 vendors and select optimal procurement partner.",
    reasoningSummary: "Applied weighted scoring against enterprise procurement model. Delivery constraint (Jun 26 deadline) disqualified AMD (delivers Jun 29) and HIS (delivers Jul 2). Of remaining, CSG scored 96 vs MWS 82. $44/ton premium of CSG justified by 1-day delivery buffer and 4-point lower risk score.",
    knowledgeRetrieved: ["SOP-PROC-2024-047 §5.1 — Vendor Selection Criteria"],
    memoryAccessed: ["Enterprise scoring model weights: delivery 40%, cost 35%, risk 25%"],
    toolCalls: [{ tool: "score_vendors_weighted", args: "weights={delivery:0.40,cost:0.35,risk:0.25}", result: "CSG:96, MWS:82, AMD:61, HIS:34. Winner: Continental Steel Group.", latencyMs: 312 }],
    documentsConsulted: ["SOP-PROC-2024-047 §5.1", "Vendor comparison matrix"],
    decisionTaken: "SELECT Continental Steel Group @ $891/ton. Reject MWS (delivery risk), AMD (misses deadline), HIS (risk+deadline).",
    outputGenerated: "Vendor selection decision: CSG-0044. Score 96/100. Rationale documented for audit trail.",
    validationResults: [{ rule: "Scoring model applied", result: "CONFIRMED" }, { rule: "Delivery constraint", result: "CSG ONLY compliant" }, { rule: "Risk threshold", result: "CSG score 8 — PASS" }],
    tokensIn: 6840, tokensOut: 2262, latencyMs: 312,
    businessImpact: "$44 premium over cheapest quote justified by $180K downtime risk elimination and Jun 26 deadline compliance.",
    executionLogs: ["09:22:18 — Scoring model initialized", "09:22:20 — AMD, HIS disqualified: deadline breach", "09:22:22 — CSG 96 vs MWS 82. CSG selected."],
  },
  "TK-008": {
    objective: "Assess current supplier risk scores for all 4 shortlisted vendors against enterprise risk framework and flag any vendor exceeding threshold of 30.",
    reasoningSummary: "Queried enterprise risk intelligence system for live risk scores. HIS-0271 scored 41 — exceeds enterprise threshold of 30 (POLICY-RISK-2024-003). AMD-0389 scored 28, within threshold but approaching limit. CSG and MWS both low risk (8 and 12 respectively).",
    knowledgeRetrieved: ["RISK-MGR-2024-003 — Supplier Risk Management Framework v3"],
    memoryAccessed: ["HIS risk trend: increasing since Q4 2025", "CSG risk history: consistently low"],
    toolCalls: [{ tool: "get_supplier_risk_scores", args: 'vendor_ids=["CSG-0044","MWS-0112","AMD-0389","HIS-0271"]', result: "Scores: CSG:8, MWS:12, AMD:28, HIS:41. HIS exceeds threshold.", latencyMs: 1087 }],
    documentsConsulted: ["RISK-MGR-2024-003", "Supplier Risk Database"],
    decisionTaken: "HIS disqualified on risk grounds (score 41 > threshold 30). AMD flagged as approaching threshold.",
    outputGenerated: "Risk assessment report: CSG LOW (8), MWS LOW (12), AMD MODERATE (28), HIS HIGH (41 — DISQUALIFIED).",
    validationResults: [{ rule: "Risk threshold (≤30)", result: "CSG PASS · MWS PASS · AMD PASS · HIS FAIL" }, { rule: "Enterprise policy", result: "HIS DISQUALIFIED per POLICY-RISK-2024-003" }],
    tokensIn: 5480, tokensOut: 2150, latencyMs: 1087,
    businessImpact: "HIS disqualification prevents future delivery failure. Risk-weighted selection reduces supplier concentration risk by 73%.",
    executionLogs: ["09:22:40 — Risk score request sent", "09:22:41 — Scores: CSG:8, MWS:12, AMD:28, HIS:41", "09:22:42 — HIS flagged DISQUALIFIED. AMD flagged APPROACHING THRESHOLD."],
  },
  "TK-009": {
    objective: "Validate proposed $891 purchase against all 5 applicable enterprise procurement policies before PO issuance.",
    reasoningSummary: "Policy engine validated all 5 applicable policies: financial approval threshold, approved-vendor-only, supplier risk ceiling, material quality minimum, and sustainable sourcing. All 5 COMPLIANT. The $891 amount triggers POLICY-FIN-2024-012 requiring VP Procurement approval — flagged to Orchestrator for human approval workflow.",
    knowledgeRetrieved: ["POLICY-FIN-2024-012", "POLICY-PROC-2024-008", "POLICY-RISK-2024-003", "POLICY-QUAL-2024-015", "POLICY-ENV-2024-002"],
    memoryAccessed: ["Policy version cache — all current as of Jun 2026"],
    toolCalls: [{ tool: "validate_policies", args: 'vendor="CSG-0044", amount=891, material="A36-ST-001"', result: "5/5 policies COMPLIANT. Human approval required per POLICY-FIN-2024-012.", latencyMs: 4820 }],
    documentsConsulted: ["POLICY-FIN-2024-012", "POLICY-PROC-2024-008", "POLICY-RISK-2024-003", "POLICY-QUAL-2024-015", "POLICY-ENV-2024-002"],
    decisionTaken: "All policies passed. Trigger human approval workflow for J. Martinez (VP Procurement).",
    outputGenerated: "Policy compliance certificate. Human approval request APPR-2026-09847 generated.",
    validationResults: [
      { rule: "POLICY-FIN-2024-012 (Approval threshold)", result: "REQUIRES VP APPROVAL" },
      { rule: "POLICY-PROC-2024-008 (Approved vendor)", result: "COMPLIANT" },
      { rule: "POLICY-RISK-2024-003 (Risk ceiling)", result: "COMPLIANT — CSG score 8" },
      { rule: "POLICY-QUAL-2024-015 (Quality min)", result: "COMPLIANT — CSG 97%" },
      { rule: "POLICY-ENV-2024-002 (ESG ≥70)", result: "COMPLIANT — CSG ESG 78" },
    ],
    tokensIn: 4240, tokensOut: 1650, latencyMs: 4820,
    businessImpact: "Full policy compliance eliminates audit risk and ensures enterprise governance is maintained.",
    executionLogs: ["09:31:44 — Policy validation initiated", "09:31:48 — 5 policies evaluated", "09:31:52 — All COMPLIANT. Human approval flagged.", "09:33:12 — APPR-2026-09847 dispatched to J. Martinez."],
  },
  "TK-010": {
    objective: "Verify Q2 budget availability in cost center CC-MFG-PLB-2026 can support a $891 commitment without exceeding quarterly allocation.",
    reasoningSummary: "Queried SAP FM module for cost center CC-MFG-PLB-2026 Q2 2026 budget. Available: $48,720 of $75,000 allocated. $891 commitment represents 1.8% of remaining budget — well within limits. No escalation required. Purchase is 25.75% under $1,200 ceiling.",
    knowledgeRetrieved: ["POLICY-FIN-2024-012 — Budget thresholds"],
    memoryAccessed: ["Q2 budget utilization as of Jun 24: $26,280 spent"],
    toolCalls: [{ tool: "check_budget_availability", args: 'cost_center="CC-MFG-PLB-2026", amount=891, currency="USD"', result: "APPROVED. Available $48,720. Commitment: $891. Remaining: $47,829.", latencyMs: 1204 }],
    documentsConsulted: ["SAP FM Budget Report — CC-MFG-PLB-2026 Q2"],
    decisionTaken: "Budget APPROVED. Commit $891 to CC-MFG-PLB-2026. No escalation.",
    outputGenerated: "Budget commitment authorization. SAP reservation created for $891.",
    validationResults: [{ rule: "Budget availability", result: "PASS — $48,720 available" }, { rule: "Amount vs ceiling", result: "PASS — $309 under $1,200" }, { rule: "Quarterly headroom", result: "PASS — 1.8% of remaining" }],
    tokensIn: 3120, tokensOut: 1090, latencyMs: 1204,
    businessImpact: "$309 under budget preserves Q2 headroom for future Line B operational needs.",
    executionLogs: ["09:34:12 — Budget check initiated for CC-MFG-PLB-2026", "09:34:13 — SAP FM: $48,720 available", "09:34:14 — $891 APPROVED. $47,829 remaining."],
  },
  "TK-011": {
    objective: "Route approval request APPR-2026-09847 to J. Martinez (VP Procurement) for manual authorization of the $891 PO to Continental Steel Group.",
    reasoningSummary: "Per POLICY-FIN-2024-012, all purchases $500–$5,000 require VP Procurement approval. Approval request delivered via Onyx Mobile App with biometric confirmation. J. Martinez responded in 34 seconds with approval and comment. Human-in-the-loop step completed within SLA.",
    knowledgeRetrieved: ["POLICY-FIN-2024-012 — Approval routing rules"],
    memoryAccessed: ["J. Martinez mobile contact: Onyx App registered", "Previous approvals avg response: 4m 20s"],
    toolCalls: [{ tool: "send_approval_request", args: 'approver="j.martinez", amount=891, po_draft="PO-2026-18847-DRAFT"', result: "Delivered via Onyx Mobile. Approved 09:35:14. Comment: 'Continental Steel is our preferred vendor. Proceed.'", latencyMs: 0 }],
    documentsConsulted: ["POLICY-FIN-2024-012", "PO Draft — PO-2026-18847"],
    decisionTaken: "APPROVED by J. Martinez at 09:35:14. Biometric confirmed. Approval ID APPR-2026-09847.",
    outputGenerated: "Signed approval APPR-2026-09847. Authorization unlocks PO issuance.",
    validationResults: [{ rule: "Approver authority", result: "CONFIRMED — VP Procurement" }, { rule: "Biometric verification", result: "CONFIRMED" }, { rule: "Approval within SLA (30 min)", result: "PASS — 34 seconds" }],
    tokensIn: 620, tokensOut: 200, latencyMs: 0,
    businessImpact: "Human approval in 34s vs 30-min SLA — no mission delay. Governance maintained with zero friction.",
    executionLogs: ["09:33:12 — Approval request APPR-2026-09847 dispatched to J. Martinez", "09:35:14 — Approved. Method: Onyx Mobile + Biometric.", "09:35:14 — Authorization logged. PO issuance unblocked."],
  },
  "TK-012": {
    objective: "Issue formal purchase order PO-2026-18847 to Continental Steel Group for 1T A36 steel at $891/ton with delivery to Plant 3 Dock B by Jun 26, 10:30 EST.",
    reasoningSummary: "All prerequisites met: vendor selected, policies compliant, budget cleared, human approved. PO generated and transmitted via EDI 860. Continental Steel Group confirmed via EDI 855 at 09:37:44. Delivery commitment received: Jun 26, 10:30 EST, Dock B. Mill certificate to accompany shipment.",
    knowledgeRetrieved: ["SOP-PROC-2024-047 §5.3 — PO Issuance", "SOP-QUAL-2024-089 §2.1 — Mill cert requirement"],
    memoryAccessed: ["CSG EDI endpoint: X12-860", "PO template v4.2"],
    toolCalls: [
      { tool: "create_purchase_order", args: 'vendor="CSG-0044", material="A36-ST-1T", qty=1.0, price=891, delivery="2026-06-26"', result: "PO-2026-18847 created. Confirmed delivery 10:30 EST Jun 26.", latencyMs: 3847 },
      { tool: "send_po_confirmation", args: 'po_id="PO-2026-18847", method="email+edi"', result: "EDI 855 received from CSG. All terms confirmed.", latencyMs: 2140 },
    ],
    documentsConsulted: ["SOP-PROC-2024-047 §5.3", "PO-2026-18847 (generated)", "EDI 855 confirmation"],
    decisionTaken: "PO-2026-18847 issued and confirmed. Delivery locked Jun 26, 10:30 EST, Dock B.",
    outputGenerated: "PO-2026-18847 for 1T A36 @ $891 with Continental Steel Group. EDI 855 confirmation stored.",
    validationResults: [{ rule: "Approval prerequisite", result: "CONFIRMED — APPR-2026-09847" }, { rule: "Budget commitment", result: "CONFIRMED — $891 reserved" }, { rule: "Vendor EDI acknowledgement", result: "CONFIRMED — EDI 855 received" }],
    tokensIn: 5040, tokensOut: 1740, latencyMs: 5987,
    businessImpact: "PO-2026-18847 guarantees on-time delivery Jun 26, eliminating $180K Line B shutdown risk.",
    executionLogs: ["09:36:55 — PO-2026-18847 generated", "09:36:58 — EDI 860 dispatched to Continental Steel Group", "09:37:44 — EDI 855 received. Delivery confirmed Jun 26, 10:30 EST, Dock B."],
  },
  "TK-013": {
    objective: "Synchronize PO-2026-18847 commitment to SAP S/4HANA — Materials Management and Financial modules — and create QM inspection lot.",
    reasoningSummary: "ERP integration updated MM and FI modules: GR/GI document posted, account 300200 (Raw Materials Inventory) committed for $891, QM inspection lot QI-2026-18847-001 created for receiving. Commitment posted to cost center CC-MFG-PLB-2026 under Q2 FY2026.",
    knowledgeRetrieved: ["SAP MM/FI integration SOP"],
    memoryAccessed: ["ERP connection: SAP-S4H prod instance", "Account mapping: A36 steel → account 300200"],
    toolCalls: [{ tool: "update_erp_commitment", args: 'po_id="PO-2026-18847", system="SAP-S4H", module="MM-FI"', result: "GR/GI 4900018847. Account 300200 committed $891. QM lot created.", latencyMs: 4820 }],
    documentsConsulted: ["SAP MM/FI posting guide", "QM inspection lot template"],
    decisionTaken: "ERP commitment posted. QM lot QI-2026-18847-001 active for receiving inspection.",
    outputGenerated: "SAP GR/GI document 4900018847. QM lot QI-2026-18847-001. Commitment $891 on CC-MFG-PLB-2026.",
    validationResults: [{ rule: "ERP sync status", result: "SUCCESS — 4820ms" }, { rule: "Account coding", result: "CORRECT — 300200 Raw Materials" }, { rule: "QM lot created", result: "QI-2026-18847-001 ACTIVE" }],
    tokensIn: 2340, tokensOut: 1080, latencyMs: 4820,
    businessImpact: "ERP sync ensures financial accuracy and enables QM receiving inspection — preventing undetected quality issues.",
    executionLogs: ["09:39:22 — SAP S/4HANA commit initiated", "09:39:27 — GR/GI document 4900018847 posted", "09:39:27 — QM lot QI-2026-18847-001 created. Account 300200 committed."],
  },
  "TK-014": {
    objective: "Send PO confirmation and delivery schedule to 3 key stakeholders (Sarah Chen, J. Martinez, R. Patel) via appropriate channels.",
    reasoningSummary: "Orchestrated multi-channel notifications: Sarah Chen (Production Manager) via email + Slack, J. Martinez (VP Procurement) via Onyx App, R. Patel (Plant Manager) via email. All notifications tailored to recipient role. Delivery receipts confirmed for all 3.",
    knowledgeRetrieved: ["Stakeholder communication matrix"],
    memoryAccessed: ["Stakeholder channel preferences", "Notification templates v2.1"],
    toolCalls: [{ tool: "notify_stakeholders", args: 'po_id="PO-2026-18847", recipients=["s.chen","j.martinez","r.patel"]', result: "3 notifications sent. All delivered. Delivery receipts confirmed.", latencyMs: 1480 }],
    documentsConsulted: ["Communication matrix", "PO-2026-18847 summary"],
    decisionTaken: "3 stakeholders notified via appropriate channels. All delivery confirmed.",
    outputGenerated: "Notification log: S. Chen (email+Slack ✓), J. Martinez (Onyx App ✓), R. Patel (email ✓).",
    validationResults: [{ rule: "Notification delivery", result: "CONFIRMED — 3/3" }, { rule: "Channel compliance", result: "All per communication matrix" }],
    tokensIn: 1540, tokensOut: 600, latencyMs: 1480,
    businessImpact: "Line B team notified 36h before delivery — enables dock preparation and QM readiness.",
    executionLogs: ["09:40:10 — Notifications initiated for 3 stakeholders", "09:40:11 — S. Chen: email + Slack delivered", "09:40:11 — J. Martinez: Onyx App delivered", "09:40:11 — R. Patel: email delivered"],
  },
  "TK-015": {
    objective: "Archive full mission execution logs, agent communications, tool call records, and decision audit trail to enterprise knowledge store and write memory updates.",
    reasoningSummary: "Compile and persist complete execution record for MSN-2026-0847 including all agent communications, tool call logs with latencies, decision rationale, vendor comparison data, and policy compliance certificates. Memory updates written for future procurement intelligence.",
    knowledgeRetrieved: [],
    memoryAccessed: ["Mission context buffer MSN-2026-0847"],
    toolCalls: [{ tool: "archive_mission_logs", args: 'mission_id="MSN-2026-0847", include_all=true', result: "21 audit entries, 10 tool calls, 16 agent messages archived. Memory records: 3 written.", latencyMs: 840 }],
    documentsConsulted: ["Full audit trail AUD-0001 through AUD-0021"],
    decisionTaken: "All records archived. Continental Steel Group flagged as preferred vendor. Multi-vendor RFQ noted as best practice.",
    outputGenerated: "Archive record ARCH-2026-18847. 21 audit entries stored. 3 memory records written.",
    validationResults: [{ rule: "Archive completeness", result: "CONFIRMED — 21/21 entries" }, { rule: "Memory write success", result: "CONFIRMED — 3/3 records" }],
    tokensIn: 1380, tokensOut: 510, latencyMs: 840,
    businessImpact: "Mission intelligence stored — future A36 procurement expected 60% faster based on learned vendor preference and pricing.",
    executionLogs: ["09:41:08 — Archive initiated for MSN-2026-0847", "09:41:09 — 21 audit entries written to knowledge store", "09:41:10 — 3 memory records written. CSG preferred status updated. Mission closed."],
  },
};

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High:     "bg-amber-100 text-amber-700",
  Medium:   "bg-blue-100 text-blue-700",
  Low:      "bg-slate-100 text-slate-600",
};

const COL_BADGE_STYLES: Record<BoardColId, string> = {
  "backlog":       "bg-slate-100 text-slate-600",
  "planned":       "bg-blue-100 text-blue-700",
  "in-progress":   "bg-violet-100 text-violet-700",
  "waiting-tool":  "bg-amber-100 text-amber-700",
  "waiting-human": "bg-orange-100 text-orange-700",
  "completed":     "bg-emerald-100 text-emerald-700",
  "blocked":       "bg-red-100 text-red-700",
  "failed":        "bg-rose-100 text-rose-700",
};

// ─── Task Detail Drawer ────────────────────────────────────────────────────

function DrawerSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={10} className="text-violet-500 shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function DrawerKV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1 border-b border-border/20 last:border-0 text-[11px]">
      <span className="text-muted-foreground w-32 shrink-0">{k}</span>
      <span className="text-foreground font-medium">{v}</span>
    </div>
  );
}

function TaskDetailDrawer({ task, onClose }: { task: BoardTask; onClose: () => void }) {
  const detail = TASK_DETAILS[task.id];
  if (!detail) return null;
  const colLabel = BOARD_COLUMNS.find(c => c.id === task.col)?.label ?? task.col;
  return (
    <div className="absolute inset-y-0 right-0 w-[400px] bg-white border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-[#F8F9FA] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="font-mono text-[9px] text-muted-foreground">{task.id}</span>
            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase", PRIORITY_STYLES[task.priority])}>{task.priority}</span>
            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase", COL_BADGE_STYLES[task.col])}>{colLabel}</span>
          </div>
          <div className="font-bold text-[13px] text-foreground leading-snug">{task.name}</div>
          <div className="text-[10px] text-violet-600 mt-0.5 flex items-center gap-1"><Bot size={9} />{task.agent}</div>
        </div>
        <button onClick={onClose} className="shrink-0 p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground mt-0.5">
          <X size={14} />
        </button>
      </div>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
        {[
          { l: "CONFIDENCE", v: `${task.confidence}%`, c: "text-emerald-600" },
          { l: "LATENCY",    v: `${detail.latencyMs.toLocaleString()}ms` },
          { l: "AI COST",    v: `$${task.cost.toFixed(4)}` },
        ].map(({ l, v, c }) => (
          <div key={l} className="text-center px-3 py-2 border-r border-border last:border-r-0">
            <div className={cn("font-mono font-bold text-[12px]", c ?? "text-foreground")}>{v}</div>
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <DrawerSection title="Objective" icon={Target}>
            <p className="text-[11px] text-foreground leading-relaxed">{detail.objective}</p>
          </DrawerSection>
          <DrawerSection title="Assignment" icon={Bot}>
            <DrawerKV k="Assigned Agent" v={task.agent} />
            <DrawerKV k="Parent Mission" v="MSN-2026-0847 — A36 Structural Steel Procurement" />
            <DrawerKV k="Department" v={task.dept} />
            <DrawerKV k="Timeline Stage" v={task.stage} />
          </DrawerSection>
          <DrawerSection title="Execution Timeline" icon={Clock}>
            <DrawerKV k="Start Time" v={`Jun 24, 2026 · ${task.startTime} EST`} />
            <DrawerKV k="Duration" v={task.duration} />
            <DrawerKV k="Tokens In" v={detail.tokensIn.toLocaleString()} />
            <DrawerKV k="Tokens Out" v={detail.tokensOut.toLocaleString()} />
            <DrawerKV k="Total Tokens" v={task.tokens.toLocaleString()} />
            <DrawerKV k="Latency" v={`${detail.latencyMs.toLocaleString()}ms`} />
            <DrawerKV k="AI Cost" v={`$${task.cost.toFixed(4)}`} />
          </DrawerSection>
          <DrawerSection title="Reasoning Summary" icon={GitBranch}>
            <p className="text-[11px] text-foreground leading-relaxed">{detail.reasoningSummary}</p>
          </DrawerSection>
          {detail.knowledgeRetrieved.length > 0 && (
            <DrawerSection title="Knowledge Retrieved" icon={BookOpen}>
              {detail.knowledgeRetrieved.map((k, i) => (
                <div key={i} className="flex items-start gap-1.5 py-1 border-b border-border/20 last:border-0 text-[11px]">
                  <ChevronRight size={10} className="text-violet-400 shrink-0 mt-0.5" /><span className="text-foreground">{k}</span>
                </div>
              ))}
            </DrawerSection>
          )}
          {detail.memoryAccessed.length > 0 && (
            <DrawerSection title="Memory Accessed" icon={MemoryStick}>
              {detail.memoryAccessed.map((m, i) => (
                <div key={i} className="flex items-start gap-1.5 py-1 border-b border-border/20 last:border-0 text-[11px]">
                  <ChevronRight size={10} className="text-blue-400 shrink-0 mt-0.5" /><span className="text-foreground">{m}</span>
                </div>
              ))}
            </DrawerSection>
          )}
          {detail.toolCalls.length > 0 && (
            <DrawerSection title="Tool / API Calls" icon={Wrench}>
              {detail.toolCalls.map((tc, i) => (
                <div key={i} className="border border-emerald-200 rounded-sm mb-1.5 text-[11px] overflow-hidden">
                  <div className="px-2 py-1.5 bg-emerald-50 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono font-bold text-foreground flex-1">{tc.tool}()</span>
                    <span className="font-mono text-emerald-600 text-[10px]">{tc.latencyMs}ms</span>
                  </div>
                  <div className="px-2 py-1.5 bg-white space-y-1">
                    <div className="text-[10px]"><span className="text-muted-foreground">Args: </span><span className="font-mono text-foreground">{tc.args}</span></div>
                    <div className="text-[10px]"><span className="text-muted-foreground">Result: </span><span className="font-mono text-emerald-700">{tc.result}</span></div>
                  </div>
                </div>
              ))}
            </DrawerSection>
          )}
          {detail.documentsConsulted.length > 0 && (
            <DrawerSection title="Documents Consulted" icon={FileText}>
              {detail.documentsConsulted.map((d, i) => (
                <div key={i} className="flex items-start gap-1.5 py-1 border-b border-border/20 last:border-0 text-[11px]">
                  <FileText size={9} className="text-muted-foreground shrink-0 mt-0.5" /><span className="text-foreground">{d}</span>
                </div>
              ))}
            </DrawerSection>
          )}
          <DrawerSection title="Decision Taken" icon={CheckCircle2}>
            <p className="text-[11px] text-foreground font-medium leading-relaxed">{detail.decisionTaken}</p>
          </DrawerSection>
          <DrawerSection title="Output Generated" icon={ScrollText}>
            <p className="text-[11px] text-foreground leading-relaxed">{detail.outputGenerated}</p>
          </DrawerSection>
          {detail.validationResults.length > 0 && (
            <DrawerSection title="Validation Results" icon={ShieldAlert}>
              {detail.validationResults.map((vr, i) => (
                <div key={i} className="flex items-start justify-between gap-2 py-1 border-b border-border/20 last:border-0 text-[11px]">
                  <span className="text-muted-foreground flex-1">{vr.rule}</span>
                  <span className={cn("text-[9px] font-bold shrink-0",
                    vr.result.startsWith("COMPLIANT") || vr.result.startsWith("PASS") || vr.result.startsWith("CONFIRMED") || vr.result.startsWith("SUCCESS") || vr.result.startsWith("VERIFIED") || vr.result.startsWith("CURRENT") || vr.result.startsWith("All") ? "text-emerald-600"
                    : vr.result.startsWith("FAIL") || vr.result.startsWith("DISQUALIFIED") ? "text-red-500"
                    : "text-amber-600"
                  )}>{vr.result}</span>
                </div>
              ))}
            </DrawerSection>
          )}
          <DrawerSection title="Token Breakdown" icon={Cpu}>
            <DrawerKV k="Tokens In"  v={detail.tokensIn.toLocaleString()} />
            <DrawerKV k="Tokens Out" v={detail.tokensOut.toLocaleString()} />
            <DrawerKV k="Total"      v={task.tokens.toLocaleString()} />
            <DrawerKV k="Cost"       v={`$${task.cost.toFixed(4)}`} />
          </DrawerSection>
          <DrawerSection title="Business Impact" icon={TrendingUp}>
            <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">{detail.businessImpact}</p>
          </DrawerSection>
          <DrawerSection title="Execution Logs" icon={ScrollText}>
            <div className="bg-[#0F0F0F] rounded-sm p-2 font-mono text-[9px] space-y-0.5">
              {detail.executionLogs.map((log, i) => <div key={i} className="text-emerald-400">{log}</div>)}
            </div>
          </DrawerSection>
        </div>
      </div>
    </div>
  );
}

// ─── Board Card ────────────────────────────────────────────────────────────

function BoardCard({
  task, isDragging, onDragStart, onDragEnd, onClick, isSelected,
}: {
  task: BoardTask; isDragging: boolean;
  onDragStart: () => void; onDragEnd: () => void;
  onClick: () => void; isSelected: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "bg-white border rounded-sm p-2.5 space-y-2 transition-all cursor-pointer select-none",
        isDragging ? "opacity-40 scale-95" : "hover:shadow-sm",
        isSelected ? "border-violet-400 ring-1 ring-violet-200" : "border-border hover:border-violet-300",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="font-mono text-[9px] text-muted-foreground">{task.id}</span>
        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide shrink-0", PRIORITY_STYLES[task.priority])}>{task.priority}</span>
      </div>
      <div className="text-[11px] font-semibold text-foreground leading-snug">{task.name}</div>
      <div className="flex items-center gap-1">
        <Bot size={9} className="text-violet-500 shrink-0" />
        <span className="text-[10px] text-violet-600 truncate">{task.agent}</span>
      </div>
      <div>
        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide", COL_BADGE_STYLES[task.col])}>
          {BOARD_COLUMNS.find(c => c.id === task.col)?.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1"><Star size={8} className="text-muted-foreground shrink-0" /><span className="text-[9px] text-muted-foreground">{task.confidence}%</span></div>
        <div className="flex items-center gap-1"><Clock size={8} className="text-muted-foreground shrink-0" /><span className="text-[9px] text-muted-foreground">{task.startTime}</span></div>
        <div className="flex items-center gap-1"><Cpu size={8} className="text-muted-foreground shrink-0" /><span className="text-[9px] text-muted-foreground">{task.tokens.toLocaleString()} tok</span></div>
        <div className="flex items-center gap-1"><DollarSign size={8} className="text-muted-foreground shrink-0" /><span className="text-[9px] text-muted-foreground">${task.cost.toFixed(4)}</span></div>
      </div>
      {task.tool && (
        <div className="flex items-center gap-1 pt-0.5">
          <Wrench size={8} className="text-muted-foreground shrink-0" />
          <span className="text-[9px] font-mono text-muted-foreground truncate">{task.tool}</span>
        </div>
      )}
    </div>
  );
}

// ─── Execution Board ───────────────────────────────────────────────────────

function ExecutionBoard({ onSelectStage }: { onSelectStage?: (idx: number) => void }) {
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [filterAgent,     setFilterAgent]     = useState("all");
  const [filterPriority,  setFilterPriority]  = useState("all");
  const [filterDept,      setFilterDept]      = useState("all");
  const [sortBy,          setSortBy]          = useState("default");
  const [collapsedCols,   setCollapsedCols]   = useState<Set<BoardColId>>(new Set());
  const [dragTask,        setDragTask]        = useState<string | null>(null);
  const [dragOverCol,     setDragOverCol]     = useState<BoardColId | null>(null);
  const [localColOverride,setLocalColOverride]= useState<Record<string, BoardColId>>({});
  const [selectedTask,    setSelectedTask]    = useState<BoardTask | null>(null);

  const allAgents = useMemo(() => [...new Set(BOARD_TASKS.map(t => t.agent))].sort(), []);
  const allDepts  = useMemo(() => [...new Set(BOARD_TASKS.map(t => t.dept))].sort(), []);

  const tasksWithOverrides = useMemo(() =>
    BOARD_TASKS.map(t => localColOverride[t.id] ? { ...t, col: localColOverride[t.id] } : t),
    [localColOverride]
  );

  const filtered = useMemo(() => {
    let tasks = tasksWithOverrides;
    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.agent.toLowerCase().includes(q) || t.stage.toLowerCase().includes(q));
    }
    if (filterStatus   !== "all") tasks = tasks.filter(t => t.col === filterStatus);
    if (filterAgent    !== "all") tasks = tasks.filter(t => t.agent === filterAgent);
    if (filterPriority !== "all") tasks = tasks.filter(t => t.priority === filterPriority);
    if (filterDept     !== "all") tasks = tasks.filter(t => t.dept === filterDept);
    const PORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    if (sortBy === "priority")    tasks = [...tasks].sort((a, b) => PORDER[a.priority] - PORDER[b.priority]);
    else if (sortBy === "cost-desc")   tasks = [...tasks].sort((a, b) => b.cost - a.cost);
    else if (sortBy === "cost-asc")    tasks = [...tasks].sort((a, b) => a.cost - b.cost);
    else if (sortBy === "tokens-desc") tasks = [...tasks].sort((a, b) => b.tokens - a.tokens);
    else if (sortBy === "conf-desc")   tasks = [...tasks].sort((a, b) => b.confidence - a.confidence);
    return tasks;
  }, [tasksWithOverrides, search, filterStatus, filterAgent, filterPriority, filterDept, sortBy]);

  const tasksByCol = useMemo(() => {
    const map = {} as Record<BoardColId, BoardTask[]>;
    BOARD_COLUMNS.forEach(c => { map[c.id] = []; });
    filtered.forEach(t => { if (map[t.col]) map[t.col].push(t); });
    return map;
  }, [filtered]);

  const totalCost   = BOARD_TASKS.reduce((s, t) => s + t.cost, 0);
  const totalTokens = BOARD_TASKS.reduce((s, t) => s + t.tokens, 0);

  const toggleCollapse = (id: BoardColId) =>
    setCollapsedCols(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDrop = (colId: BoardColId) => {
    if (dragTask) { setLocalColOverride(p => ({ ...p, [dragTask]: colId })); setDragTask(null); setDragOverCol(null); }
  };

  const handleCardClick = (task: BoardTask) => {
    setSelectedTask(prev => prev?.id === task.id ? null : task);
    if (onSelectStage) { const idx = STAGE_KEY_MAP[task.stage]; if (idx !== undefined) onSelectStage(idx); }
  };

  const selDropdown = "text-[10px] border border-border rounded-sm px-1.5 py-1 bg-white focus:outline-none cursor-pointer";

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 px-3 py-2 border-b border-border bg-[#F8F9FA] flex flex-wrap items-center gap-2">
        <Kanban size={12} className="text-violet-500 shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">Execution Board</span>
        <span className="text-[9px] text-muted-foreground shrink-0">— {BOARD_TASKS.length} tasks · MSN-2026-0847</span>
        <div className="flex items-center gap-1.5 ml-1">
          {([
            { col: "completed"     as BoardColId, label: `${tasksByCol["completed"]?.length ?? 0} done` },
            { col: "in-progress"   as BoardColId, label: `${tasksByCol["in-progress"]?.length ?? 0} active` },
            { col: "waiting-human" as BoardColId, label: `${tasksByCol["waiting-human"]?.length ?? 0} pending` },
          ]).map(({ col, label }) => (
            <span key={col} className={cn("text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase", COL_BADGE_STYLES[col])}>{label}</span>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <div className="relative">
            <Search size={9} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-5 pr-6 py-1 text-[10px] border border-border rounded-sm focus:outline-none w-28 bg-white" />
            {search && <button onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={8} /></button>}
          </div>
          <select value={filterStatus}   onChange={e => setFilterStatus(e.target.value)}   className={selDropdown}>
            <option value="all">All Statuses</option>
            {BOARD_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selDropdown}>
            <option value="all">All Priorities</option>
            {["Critical","High","Medium","Low"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterAgent}    onChange={e => setFilterAgent(e.target.value)}    className={cn(selDropdown, "max-w-[130px]")}>
            <option value="all">All Agents</option>
            {allAgents.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterDept}     onChange={e => setFilterDept(e.target.value)}     className={selDropdown}>
            <option value="all">All Depts</option>
            {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={sortBy}         onChange={e => setSortBy(e.target.value)}         className={selDropdown}>
            <option value="default">Default Order</option>
            <option value="priority">Priority</option>
            <option value="cost-desc">Cost ↓</option>
            <option value="cost-asc">Cost ↑</option>
            <option value="tokens-desc">Tokens ↓</option>
            <option value="conf-desc">Confidence ↓</option>
          </select>
        </div>

        <div className="flex items-center gap-3 shrink-0 border-l border-border/60 pl-2">
          <div className="text-center">
            <div className="font-mono text-[11px] font-bold text-foreground">{totalTokens.toLocaleString()}</div>
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Tokens</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[11px] font-bold text-violet-700">${totalCost.toFixed(4)}</div>
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Total Cost</div>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full" style={{ minWidth: `${BOARD_COLUMNS.reduce((s, c) => s + (collapsedCols.has(c.id) ? 36 : 196), 0)}px` }}>
          {BOARD_COLUMNS.map((col, ci) => {
            const tasks = tasksByCol[col.id] ?? [];
            const isCollapsed  = collapsedCols.has(col.id);
            const isDropTarget = dragOverCol === col.id && !isCollapsed;
            return (
              <div
                key={col.id}
                className={cn(
                  "flex flex-col border-r border-border last:border-r-0 transition-all duration-200",
                  isCollapsed ? "w-9 min-w-[36px]" : "",
                  ci % 2 === 0 ? "bg-[#F8F9FA]" : "bg-white",
                  isDropTarget ? "ring-2 ring-inset ring-violet-400" : "",
                )}
                style={isCollapsed ? {} : { width: "196px", minWidth: "196px" }}
                onDragOver={e => { e.preventDefault(); if (!isCollapsed) setDragOverCol(col.id); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => handleDrop(col.id)}
              >
                {/* Column header */}
                <div className={cn("shrink-0 border-b flex items-center gap-1.5", col.headerColor, isCollapsed ? "px-1 py-2 justify-center flex-col" : "px-2 py-2")}>
                  {isCollapsed ? (
                    <button onClick={() => toggleCollapse(col.id)} className="flex flex-col items-center gap-1" title={col.label}>
                      <span className={cn("w-2 h-2 rounded-full", col.color)} />
                      <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded-sm min-w-[18px] text-center", tasks.length > 0 ? COL_BADGE_STYLES[col.id] : "bg-muted text-muted-foreground")}>{tasks.length}</span>
                    </button>
                  ) : (
                    <>
                      <span className={cn("w-2 h-2 rounded-full shrink-0", col.color)} />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-foreground truncate flex-1">{col.label}</span>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm min-w-[18px] text-center shrink-0", tasks.length > 0 ? COL_BADGE_STYLES[col.id] : "bg-muted text-muted-foreground")}>{tasks.length}</span>
                      <button onClick={() => toggleCollapse(col.id)} className="shrink-0 text-muted-foreground hover:text-foreground" title="Collapse">
                        <ChevronLeft size={10} />
                      </button>
                    </>
                  )}
                </div>

                {/* Cards */}
                {!isCollapsed && (
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {tasks.length === 0 ? (
                      <div className={cn("flex flex-col items-center justify-center h-16 rounded-sm border-2 border-dashed transition-colors text-muted-foreground",
                        isDropTarget ? "border-violet-300 bg-violet-50" : "border-transparent")}>
                        <Circle size={16} className="opacity-20 mb-1" />
                        <span className="text-[9px] opacity-40">Drop here</span>
                      </div>
                    ) : (
                      tasks.map(task => (
                        <BoardCard
                          key={task.id} task={task}
                          isDragging={dragTask === task.id}
                          isSelected={selectedTask?.id === task.id}
                          onDragStart={() => setDragTask(task.id)}
                          onDragEnd={() => { setDragTask(null); setDragOverCol(null); }}
                          onClick={() => handleCardClick(task)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function MissionReplay() {
  const [, navigate] = useLocation();
  const [selectedStage, setSelectedStage] = useState(10);
  const [replayPos, setReplayPos] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditSortKey, setAuditSortKey] = useState<keyof AuditEntry>("ts");
  const [auditSortDir, setAuditSortDir] = useState<"asc" | "desc">("asc");
  const [mainTab, setMainTab] = useState<"timeline" | "board">("timeline");
  const [auditDetail, setAuditDetail] = useState<AuditEntry | null>(null);
  const [expandedMsgs, setExpandedMsgs] = useState<Set<number>>(new Set([0, 1, 2]));
  const [stageAnimKey, setStageAnimKey] = useState(0);
  const [decisionAnimKey, setDecisionAnimKey] = useState(0);
  const [headerMounted, setHeaderMounted] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevEffectiveRef = useRef<number>(-1);
  const PAGE_SIZE = 8;

  const replayStage = useMemo(() => {
    const idx = Math.min(10, Math.floor((replayPos / 100) * 11));
    return idx;
  }, [replayPos]);

  const effectiveStage = isPlaying || replayPos < 100 ? replayStage : selectedStage;
  const stageKey = STAGES[effectiveStage]?.key ?? "impact";
  const decision = DECISIONS[stageKey];
  const StageDetail = STAGE_DETAILS[stageKey];

  // Fire animation keys whenever the effective stage changes
  useEffect(() => {
    if (prevEffectiveRef.current !== effectiveStage) {
      prevEffectiveRef.current = effectiveStage;
      setStageAnimKey((k) => k + 1);
      setDecisionAnimKey((k) => k + 1);
    }
  }, [effectiveStage]);

  // Header countup trigger on mount
  useEffect(() => { const t = setTimeout(() => setHeaderMounted(true), 200); return () => clearTimeout(t); }, []);

  // How many agent messages to show (based on replay position)
  const visibleMsgCount = useMemo(() => {
    if (replayPos >= 100) return AGENT_MESSAGES.length;
    return Math.max(1, Math.floor((replayPos / 100) * AGENT_MESSAGES.length));
  }, [replayPos]);

  // Countup targets for header KPIs
  const tokenCount = useCountUp(MISSION.tokensUsed, 1200, headerMounted);
  const confidencePct = useCountUp(Math.round(MISSION.confidence * 10), 800, headerMounted);

  // Business impact countups
  const savedCount   = useCountUp(309,     900, headerMounted);
  const downtimeCount= useCountUp(180,     1100, headerMounted);
  const scoreCount   = useCountUp(94,      700, headerMounted);
  const riskCount    = useCountUp(8,       600, headerMounted);
  const revenueCount = useCountUp(21,      1000, headerMounted);
  const automCount   = useCountUp(978,     1100, headerMounted);

  useEffect(() => {
    if (isPlaying) {
      playRef.current = setInterval(() => {
        setReplayPos((p) => {
          if (p >= 100) { setIsPlaying(false); return 100; }
          return p + 1;
        });
      }, 160);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) setSelectedStage(replayStage);
  }, [replayStage, isPlaying]);

  const filteredAudit = useMemo(() => {
    let logs = AUDIT_LOGS;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      logs = logs.filter(l => l.action.toLowerCase().includes(q) || l.stage.toLowerCase().includes(q) || l.agent.toLowerCase().includes(q) || l.result.toLowerCase().includes(q));
    }
    return [...logs].sort((a, b) => {
      const av = a[auditSortKey], bv = b[auditSortKey];
      const cmp = typeof av === "number" ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
      return auditSortDir === "asc" ? cmp : -cmp;
    });
  }, [auditSearch, auditSortKey, auditSortDir]);

  const auditPages = Math.max(1, Math.ceil(filteredAudit.length / PAGE_SIZE));
  const auditRows = filteredAudit.slice((auditPage - 1) * PAGE_SIZE, auditPage * PAGE_SIZE);

  const handleAuditSort = (key: keyof AuditEntry) => {
    if (auditSortKey === key) setAuditSortDir(d => d === "asc" ? "desc" : "asc");
    else { setAuditSortKey(key); setAuditSortDir("asc"); }
    setAuditPage(1);
  };

  const pulsing = (si: number) => {
    if (isPlaying || replayPos < 100) return si === replayStage;
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">
      <style>{STAGE_CSS}</style>
      <HeaderBar
        moduleName="AGENT EXECUTION INTELLIGENCE"
        engineBadge="DEEPSIGHTS ENGINE V3.2"
        metrics={[
          { label: "MISSION", value: MISSION.id },
          { label: "SCORE", value: "94/100" },
          { label: "AI COST", value: "$0.28" },
          { label: "DURATION", value: "2h 33m" },
        ]}
      />

      {/* ── Mission Header ── */}
      <div className="bg-white border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">MISSION</span>
              <span className="font-mono text-[10px] text-muted-foreground">{MISSION.id}</span>
              <Badge color="green">COMPLETED</Badge>
              <Badge color="blue">PROCUREMENT</Badge>
            </div>
            <h1 className="font-bold text-sm text-foreground leading-tight">{MISSION.name}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{MISSION.objective}</p>
          </div>
          {/* Progress bar */}
          <div className="w-48 shrink-0 mt-1">
            <div className="flex items-center justify-between text-[9px] text-muted-foreground uppercase tracking-widest mb-1">
              <span>Progress</span><span className="font-bold text-emerald-600">{MISSION.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${MISSION.progress}%` }} />
            </div>
          </div>
          {/* KPIs */}
          <div className="flex items-center gap-4 shrink-0">
            {[
              { l: "PHASE", v: MISSION.currentPhase },
              { l: "AGENT", v: "PROC-001" },
              { l: "CONFIDENCE", v: `${(confidencePct / 10).toFixed(1)}%`, c: "text-emerald-600" },
              { l: "RISK", v: `${MISSION.risk}/100`, c: "text-emerald-600" },
              { l: "ETA", v: MISSION.eta },
              { l: "EXEC TIME", v: MISSION.executionTime },
              { l: "AI COST", v: `$${MISSION.costUsd.toFixed(4)}` },
              { l: "TOKENS", v: tokenCount.toLocaleString() },
            ].map(({ l, v, c }) => (
              <div key={l} className="text-center shrink-0 _ox_kpi">
                <div className={cn("font-mono font-bold text-[11px]", c ?? "text-foreground")}>{v}</div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-3">
          <span>Started: <b className="text-foreground">{MISSION.startedAt}</b></span>
          <span>Completed: <b className="text-foreground">{MISSION.completedAt}</b></span>
          <span>PO: <b className="text-foreground font-mono">{MISSION.po}</b></span>
          <span>Vendor: <b className="text-foreground">{MISSION.vendor}</b></span>
          <span className="ml-auto">Human: <b className="text-emerald-600">{MISSION.humanApproval}</b></span>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div role="tablist" aria-label="Mission view" className="shrink-0 bg-white border-b border-border flex items-center px-4 gap-0">
        {([
          { id: "timeline", label: "Mission Timeline",  icon: Activity },
          { id: "board",    label: "Execution Board",   icon: Kanban   },
        ] as { id: "timeline" | "board"; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={mainTab === id}
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
            onClick={() => setMainTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors",
              mainTab === id
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Icon size={11} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Board view ── */}
      {mainTab === "board" && (
        <div className="flex-1 overflow-hidden">
          <ExecutionBoard onSelectStage={(idx) => setSelectedStage(idx)} />
        </div>
      )}

      {/* ── Scrollable body (timeline view) ── */}
      {mainTab === "timeline" && (
      <div className="flex-1 overflow-y-auto">

      {/* ── Main 3-column body ── */}
      <div className="flex" style={{ height: "460px" }}>

        {/* Left: Timeline */}
        <div className="w-[180px] shrink-0 bg-white border-r border-border flex flex-col overflow-y-auto">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">MISSION TIMELINE</span>
          </div>
          <div className="flex-1 py-2">
            {STAGES.map((stage, si) => {
              const Icon = stage.icon;
              const isSelected = (isPlaying || replayPos < 100) ? si === replayStage : si === selectedStage;
              const isDone = si <= (isPlaying || replayPos < 100 ? replayStage : 10);
              const isPulse = pulsing(si);
              return (
                <div key={stage.id} className="relative">
                  {si < STAGES.length - 1 && (
                    <div className={cn("absolute left-[26px] top-8 w-[2px] h-[calc(100%-8px)] z-0", isDone && si < (isPlaying || replayPos < 100 ? replayStage : 10) ? "bg-violet-300" : "bg-border")} />
                  )}
                  <button
                    onClick={() => { setSelectedStage(si); if (!isPlaying) setReplayPos(Math.round((si / 10) * 100)); }}
                    className={cn(
                      "relative z-10 w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-violet-50 group",
                      isSelected && "bg-violet-50"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all border-2",
                      isDone ? "bg-violet-600 border-violet-600" : "bg-white border-border",
                      isPulse && "animate-pulse ring-2 ring-violet-300",
                      isSelected && "ring-2 ring-violet-300"
                    )}>
                      {isDone
                        ? <CheckCircle2 size={13} className="text-white" />
                        : <Icon size={12} className="text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={cn("text-[10px] font-bold leading-tight truncate", isDone ? "text-foreground" : "text-muted-foreground", isSelected && "text-violet-700")}>{stage.label}</span>
                        {isPulse && isPlaying && <ThinkingDots />}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono">{stage.time} · {stage.duration}</div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: Execution Details */}
        <div className="flex-1 min-w-0 overflow-y-auto px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">EXECUTION DETAILS</span>
            <ChevronRight size={11} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-widest">{STAGES[effectiveStage]?.label}</span>
            {isPlaying && <ThinkingDots />}
            <span className="text-[10px] font-mono text-muted-foreground ml-auto">{STAGES[effectiveStage]?.time} · {STAGES[effectiveStage]?.duration}</span>
          </div>
          {StageDetail && (
            <div key={stageAnimKey} className="_ox_stage space-y-3">
              <StageDetail />
            </div>
          )}
        </div>

        {/* Right: Decision Intelligence */}
        <div className="w-[240px] shrink-0 border-l border-border bg-white overflow-y-auto">
          <div className="px-3 py-2 border-b border-border bg-violet-50 flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-violet-700">DECISION INTELLIGENCE</span>
            {isPlaying && <ThinkingDots />}
          </div>
          <div className="p-3 space-y-3">
            {decision && (
              <div key={decisionAnimKey} className="_ox_decision space-y-3">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Current Decision</div>
                  <div className="text-[11px] font-bold text-foreground leading-snug">{decision.decision}</div>
                </div>
                <div className="p-2 bg-[#F8F9FA] border border-border/60 rounded-sm">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Reasoning</div>
                  <div className="text-[10px] text-foreground leading-relaxed">{decision.reason}</div>
                </div>
                {/* Animated confidence gauge */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Confidence</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">{decision.confidence}%</span>
                  </div>
                  <AnimatedBar pct={decision.confidence} color="emerald" height="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Risk Score</span>
                    <span className="text-sm font-bold font-mono text-blue-600">{MISSION.risk}/100</span>
                  </div>
                  <AnimatedBar pct={MISSION.risk} color="blue" height="h-2" />
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Business Impact</span><span className="font-bold text-foreground text-right max-w-[130px]">{decision.impact}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Savings</span><span className="font-bold text-emerald-600 text-right max-w-[130px]">{decision.saving}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Risk Reduction</span><span className="font-bold text-blue-600 text-right max-w-[130px]">{decision.riskReduction}</span></div>
                </div>
                <div className="space-y-1 text-[10px] pt-1 border-t border-border/40">
                  <div><span className="text-muted-foreground">SOP: </span><span className="font-mono text-foreground">{decision.sop}</span></div>
                  <div><span className="text-muted-foreground">Policy: </span><span className="font-mono text-foreground">{decision.policy}</span></div>
                  <div><span className="text-muted-foreground">Dept: </span><span className="text-foreground">{decision.dept}</span></div>
                </div>
                <div className="p-2 bg-amber-50 border border-amber-100 rounded-sm text-[10px]">
                  <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Recommended Next</div>
                  <div className="text-foreground font-medium">{decision.nextAction}</div>
                </div>
                <div className="space-y-1 pt-1">
                  {[
                    { label: "Open Agent", path: "/agents/proc-001", icon: Bot },
                    { label: "Open Workflow", path: "/workflow/msn-2026-0847", icon: GitBranch },
                    { label: "Open Policy", path: "/policy-studio", icon: ShieldAlert },
                    { label: "Open Knowledge", path: "/knowledge-studio", icon: BookOpen },
                    { label: "Open Logs", path: "/agent-logs", icon: FileText },
                  ].map(({ label, path, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm border border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-violet-50 transition-colors"
                    >
                      <Icon size={11} />
                      <span>{label}</span>
                      <ExternalLink size={9} className="ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Sections ── */}
      <div className="shrink-0 border-t border-border bg-white overflow-hidden" style={{ height: "340px" }}>
        <div className="flex h-full">

          {/* Agent Collaboration */}
          <div className="w-[320px] shrink-0 border-r border-border flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <Users size={12} className="text-violet-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">Agent Collaboration</span>
              {isPlaying && <ThinkingDots />}
              <span className="ml-auto text-[9px] text-muted-foreground">{visibleMsgCount}/{AGENT_MESSAGES.length} messages</span>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1">
              {AGENT_MESSAGES.slice(0, visibleMsgCount).map((msg, i) => {
                const isExpanded = expandedMsgs.has(i);
                const typeColors = { system: "bg-violet-50 border-violet-100", request: "bg-blue-50 border-blue-100", response: "bg-emerald-50 border-emerald-100", alert: "bg-amber-50 border-amber-100" };
                return (
                  <div
                    key={i}
                    className={cn("border rounded-sm text-[10px] cursor-pointer hover:opacity-90 transition-opacity _ox_msg", typeColors[msg.type as keyof typeof typeColors])}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={() => setExpandedMsgs(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <span className="font-bold text-foreground">{msg.from}</span>
                      <ArrowRight size={9} className="text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{msg.to}</span>
                      <span className="ml-auto font-mono text-muted-foreground text-[9px]">{msg.ts}</span>
                    </div>
                    {isExpanded && (
                      <div className="px-2 pb-1.5 text-foreground leading-relaxed border-t border-inherit text-[10px] pt-1">{msg.content}</div>
                    )}
                    {!isExpanded && (
                      <div className="px-2 pb-1 text-muted-foreground truncate text-[10px]">{msg.content}</div>
                    )}
                  </div>
                );
              })}
              {visibleMsgCount < AGENT_MESSAGES.length && (
                <div className="text-center py-2 text-[9px] text-muted-foreground flex items-center justify-center gap-1">
                  <span>Streaming messages</span><ThinkingDots />
                </div>
              )}
            </div>
          </div>

          {/* Business Impact + Replay */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Replay Timeline */}
            <div className="px-4 py-2.5 border-b border-border bg-[#F8F9FA]">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">REPLAY</span>
                <button onClick={() => { setReplayPos(0); setSelectedStage(0); setIsPlaying(false); }} className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground"><SkipBack size={12} /></button>
                <button onClick={() => setIsPlaying(p => !p)} className="p-1 hover:bg-muted rounded-sm text-violet-600 hover:text-violet-800">
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={() => { setReplayPos(100); setSelectedStage(10); setIsPlaying(false); }} className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground"><SkipForward size={12} /></button>
                <div className="flex-1 relative">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${replayPos}%` }} />
                  </div>
                  <input type="range" min={0} max={100} value={replayPos} onChange={e => { setReplayPos(+e.target.value); setIsPlaying(false); setSelectedStage(Math.min(10, Math.floor((+e.target.value / 100) * 11))); }} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
                  <div className="flex justify-between mt-0.5">
                    {STAGES.filter((_, i) => i % 2 === 0).map(s => (
                      <span key={s.id} className="text-[8px] text-muted-foreground font-mono">{s.time}</span>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-violet-600 font-bold shrink-0">{STAGES[effectiveStage]?.label}</span>
              </div>
            </div>

            {/* Business Impact Cards */}
            <div className="flex-1 px-3 py-2 overflow-auto">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">BUSINESS IMPACT</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Money Saved",       value: `$${savedCount}`,              sub: "vs. $1,200 budget ceiling",  color: "emerald" },
                  { label: "Downtime Prevented", value: `$${downtimeCount}K`,          sub: "Line B shutdown avoided",    color: "blue"    },
                  { label: "Mission Score",      value: `${scoreCount}/100`,           sub: "Enterprise A grade",         color: "violet"  },
                  { label: "Lead Time",          value: "2 Days",                      sub: "4 days faster than avg",     color: "amber"   },
                  { label: "Supplier Risk",      value: `${riskCount}/100`,            sub: "73% below dept avg",         color: "emerald" },
                  { label: "Revenue Protected",  value: `$${revenueCount / 10}M`,      sub: "Line B weekly output",       color: "blue"    },
                  { label: "Automation Rate",    value: `${(automCount / 10).toFixed(1)}%`, sub: "1 human touch only",   color: "violet"  },
                  { label: "AI Cost Ratio",      value: "0.032%",                      sub: "of PO value ($891)",         color: "amber"   },
                ].map(({ label, value, sub, color }, idx) => {
                  const colorMap = {
                    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
                    blue:    "bg-blue-50 border-blue-200 text-blue-700",
                    violet:  "bg-violet-50 border-violet-200 text-violet-700",
                    amber:   "bg-amber-50 border-amber-200 text-amber-700",
                  };
                  return (
                    <div
                      key={label}
                      className={cn("p-2 border rounded-sm text-center", colorMap[color as keyof typeof colorMap])}
                      style={{ animation: `_ox_kpi 350ms ease both`, animationDelay: `${idx * 80 + 100}ms` }}
                    >
                      <div className="font-bold font-mono text-sm">{value}</div>
                      <div className="text-[9px] uppercase tracking-widest font-bold opacity-80">{label}</div>
                      <div className="text-[9px] opacity-60 mt-0.5">{sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Enterprise Audit Trail ── */}
      <div className="shrink-0 border-t border-border bg-white" style={{ height: "260px" }}>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <Activity size={12} className="text-violet-500" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">Enterprise Audit Trail</span>
          <span className="text-[10px] text-muted-foreground">— {AUDIT_LOGS.length} events · Mission MSN-2026-0847</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={auditSearch} onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }} placeholder="Search audit…" className="pl-6 pr-2 py-1 text-[10px] border border-border rounded-sm focus:outline-none w-40 bg-white" />
              {auditSearch && <button onClick={() => setAuditSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={9} /></button>}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} className="p-0.5 hover:text-foreground" disabled={auditPage === 1}><ChevronLeft size={12} /></button>
              <span>{auditPage}/{auditPages}</span>
              <button onClick={() => setAuditPage(p => Math.min(auditPages, p + 1))} className="p-0.5 hover:text-foreground" disabled={auditPage === auditPages}><ChevronRight size={12} /></button>
            </div>
          </div>
        </div>
        <div className="overflow-auto" style={{ height: "212px" }}>
          <table className="w-full text-[10px] border-collapse">
            <thead className="sticky top-0 bg-[#F8F9FA] z-10 border-b border-border">
              <tr>
                {([
                  { key: "ts", label: "Time" }, { key: "stage", label: "Stage" }, { key: "agent", label: "Agent" },
                  { key: "action", label: "Action" }, { key: "result", label: "Result" },
                  { key: "latencyMs", label: "Latency" }, { key: "tokens", label: "Tokens" }, { key: "costUsd", label: "Cost" }, { key: "status", label: "Status" }
                ] as { key: keyof AuditEntry; label: string }[]).map(({ key, label }) => (
                  <th key={key} onClick={() => handleAuditSort(key)} className="px-3 py-1.5 text-left text-[9px] uppercase tracking-widest text-muted-foreground font-bold whitespace-nowrap cursor-pointer hover:text-foreground select-none">
                    <div className="flex items-center gap-1">{label}{auditSortKey === key && (auditSortDir === "asc" ? <ChevronUp size={8} /> : <ChevronDown size={8} />)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {auditRows.map((row, ri) => (
                <tr key={row.id} onClick={() => setAuditDetail(auditDetail?.id === row.id ? null : row)} className={cn("cursor-pointer hover:bg-violet-50 transition-colors", ri % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]", auditDetail?.id === row.id && "bg-violet-50")}>
                  <td className="px-3 py-1.5 font-mono text-muted-foreground whitespace-nowrap">{row.ts}</td>
                  <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">{row.stage}</td>
                  <td className="px-3 py-1.5 text-violet-600 font-medium whitespace-nowrap">{row.agent}</td>
                  <td className="px-3 py-1.5 text-foreground max-w-[240px]"><div className="truncate">{row.action}</div></td>
                  <td className="px-3 py-1.5 text-foreground whitespace-nowrap">{row.result}</td>
                  <td className="px-3 py-1.5 font-mono whitespace-nowrap">{row.latencyMs > 0 ? `${row.latencyMs}ms` : "—"}</td>
                  <td className="px-3 py-1.5 font-mono whitespace-nowrap">{row.tokens.toLocaleString()}</td>
                  <td className="px-3 py-1.5 font-mono whitespace-nowrap">${row.costUsd.toFixed(4)}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase",
                      row.status === "success" ? "bg-emerald-100 text-emerald-700" : row.status === "info" ? "bg-blue-100 text-blue-700" : row.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      </div>
      )}

      {/* ── Audit Detail Drawer ── */}
      {auditDetail && (
        <div className="fixed bottom-0 right-0 w-[400px] bg-white border-l border-t border-border shadow-xl z-50 rounded-tl-sm" style={{ height: "220px" }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">EVENT DETAIL — {auditDetail.id}</span>
            <button onClick={() => setAuditDetail(null)} className="ml-auto text-muted-foreground hover:text-foreground"><X size={14} /></button>
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto text-[11px]" style={{ height: "180px" }}>
            <KV k="Timestamp" v={<span className="font-mono">{auditDetail.ts}</span>} />
            <KV k="Stage" v={auditDetail.stage} />
            <KV k="Agent" v={<span className="text-violet-600 font-bold">{auditDetail.agent}</span>} />
            <KV k="Action" v={auditDetail.action} />
            <KV k="Result" v={auditDetail.result} />
            <KV k="Latency" v={<span className="font-mono">{auditDetail.latencyMs > 0 ? `${auditDetail.latencyMs}ms` : "—"}</span>} />
            <KV k="Tokens" v={<span className="font-mono">{auditDetail.tokens.toLocaleString()}</span>} />
            <KV k="Cost" v={<span className="font-mono">${auditDetail.costUsd.toFixed(4)}</span>} />
            <KV k="Detail" v={<span className="italic text-muted-foreground">{auditDetail.detail}</span>} />
          </div>
        </div>
      )}
    </div>
  );
}
