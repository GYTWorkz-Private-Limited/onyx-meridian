import { useState } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import {
  Search, Plus, BookOpen, Database, FileText, Zap, Bot,
  ChevronRight, ArrowRight, Tag, Circle, Link2, Upload,
  Eye, X, MessageSquare, Send, Loader2, Network,
  Cpu, CheckCircle2, AlertTriangle, GitBranch,
} from "lucide-react";

// ─── Knowledge Graph data ──────────────────────────────────────

const KG_NODES = [
  // BU nodes
  { id: "bu-mfg", label: "Manufacturing", type: "bu", x: 400, y: 200, color: "#3B82F6", size: 48, connections: ["kb-maint", "kb-quality", "sop-pm", "sop-qi", "ag-oee", "ag-pp"] },
  { id: "bu-sc", label: "Supply Chain", type: "bu", x: 700, y: 140, color: "#F59E0B", size: 42, connections: ["kb-supplier", "ag-inv"] },
  { id: "bu-proc", label: "Procurement", type: "bu", x: 900, y: 280, color: "#F97316", size: 42, connections: ["kb-supplier", "sop-sra", "ag-srisk"] },
  { id: "bu-fin", label: "Finance", type: "bu", x: 780, y: 400, color: "#10B981", size: 40, connections: ["kb-fin", "sop-mfc", "ag-fa"] },
  { id: "bu-rev", label: "Revenue", type: "bu", x: 550, y: 360, color: "#8B5CF6", size: 42, connections: ["kb-sales", "ag-rs"] },
  // Knowledge bases
  { id: "kb-maint", label: "Maintenance Procedures", type: "knowledge", x: 210, y: 120, color: "#6366F1", size: 32, connections: ["ag-pm", "sop-pm"] },
  { id: "kb-quality", label: "Quality Standards", type: "knowledge", x: 200, y: 300, color: "#6366F1", size: 32, connections: ["ag-qi", "sop-qi"] },
  { id: "kb-supplier", label: "Supplier Intelligence", type: "knowledge", x: 820, y: 140, color: "#6366F1", size: 30, connections: ["ag-srisk"] },
  { id: "kb-fin", label: "Financial Policies", type: "knowledge", x: 900, y: 440, color: "#6366F1", size: 30, connections: ["ag-fa"] },
  { id: "kb-sales", label: "Sales Playbooks", type: "knowledge", x: 420, y: 480, color: "#6366F1", size: 30, connections: ["ag-rs"] },
  // SOPs
  { id: "sop-pm", label: "SOP: Pred. Maintenance", type: "sop", x: 110, y: 220, color: "#0EA5E9", size: 28, connections: ["ag-pm"] },
  { id: "sop-qi", label: "SOP: Quality Inspection", type: "sop", x: 100, y: 370, color: "#0EA5E9", size: 28, connections: ["ag-qi"] },
  { id: "sop-sra", label: "SOP: Supplier Risk", type: "sop", x: 1060, y: 220, color: "#0EA5E9", size: 26, connections: ["ag-srisk"] },
  { id: "sop-mfc", label: "SOP: Month-end Close", type: "sop", x: 1040, y: 410, color: "#0EA5E9", size: 26, connections: ["ag-fa"] },
  // Agents
  { id: "ag-pp", label: "Production Planner", type: "agent", x: 290, y: 60, color: "#EC4899", size: 26, connections: [] },
  { id: "ag-oee", label: "OEE Optimizer", type: "agent", x: 490, y: 80, color: "#EC4899", size: 26, connections: [] },
  { id: "ag-pm", label: "Predictive Maintenance", type: "agent", x: 140, y: 300, color: "#EC4899", size: 26, connections: [] },
  { id: "ag-qi", label: "Quality Inspector", type: "agent", x: 130, y: 450, color: "#EC4899", size: 26, connections: [] },
  { id: "ag-inv", label: "Inventory Optimizer", type: "agent", x: 760, y: 60, color: "#EC4899", size: 24, connections: [] },
  { id: "ag-srisk", label: "Supplier Risk Agent", type: "agent", x: 1020, y: 330, color: "#EC4899", size: 24, connections: [] },
  { id: "ag-fa", label: "Finance Analyst", type: "agent", x: 1010, y: 490, color: "#EC4899", size: 24, connections: [] },
  { id: "ag-rs", label: "Revenue Scout", type: "agent", x: 460, y: 500, color: "#EC4899", size: 24, connections: [] },
];

const KG_EDGES = [
  ["bu-mfg", "kb-maint"], ["bu-mfg", "kb-quality"], ["bu-mfg", "sop-pm"], ["bu-mfg", "sop-qi"],
  ["bu-mfg", "ag-oee"], ["bu-mfg", "ag-pp"], ["bu-sc", "kb-supplier"], ["bu-sc", "ag-inv"],
  ["bu-proc", "kb-supplier"], ["bu-proc", "sop-sra"], ["bu-proc", "ag-srisk"],
  ["bu-fin", "kb-fin"], ["bu-fin", "sop-mfc"], ["bu-fin", "ag-fa"],
  ["bu-rev", "kb-sales"], ["bu-rev", "ag-rs"],
  ["kb-maint", "ag-pm"], ["kb-maint", "sop-pm"], ["kb-quality", "ag-qi"], ["kb-quality", "sop-qi"],
  ["kb-supplier", "ag-srisk"], ["kb-fin", "ag-fa"], ["kb-sales", "ag-rs"],
  ["sop-pm", "ag-pm"], ["sop-qi", "ag-qi"], ["sop-sra", "ag-srisk"], ["sop-mfc", "ag-fa"],
];

const NODE_DETAILS: Record<string, { title: string; subtitle: string; items: Array<{ label: string; value: string }>; linkedTo: string[]; chatResponses: string[] }> = {
  "bu-mfg": {
    title: "Manufacturing Business Unit", subtitle: "Core production intelligence",
    items: [{ label: "Agents", value: "18" }, { label: "Knowledge Bases", value: "2" }, { label: "SOPs", value: "2" }, { label: "EEI", value: "88" }],
    linkedTo: ["kb-maint", "kb-quality", "sop-pm", "ag-oee", "ag-pp", "ag-pm"],
    chatResponses: [
      "Manufacturing currently has 18 active agents across production, quality, and maintenance functions.",
      "The OEE is at 87.4% against a 90% target. Line 7 has a bearing issue flagged by Predictive Maintenance.",
      "Manufacturing links to 2 knowledge bases: Maintenance Procedures and Quality Standards.",
    ],
  },
  "kb-maint": {
    title: "Maintenance Procedures", subtitle: "Knowledge Base · 48 docs · 124 MB",
    items: [{ label: "Documents", value: "48" }, { label: "Size", value: "124 MB" }, { label: "Chunks", value: "1,796" }, { label: "Status", value: "Indexed" }],
    linkedTo: ["ag-pm", "sop-pm", "bu-mfg"],
    chatResponses: [
      "The Maintenance Procedures knowledge base contains 48 documents including manuals, risk registers, and work order templates.",
      "This KB is used by Predictive Maintenance and CMMS Agent to generate maintenance recommendations.",
      "Last updated today. All 48 documents are indexed and available for retrieval.",
    ],
  },
  "ag-pm": {
    title: "Predictive Maintenance", subtitle: "Agent · AIE-0201 · Manufacturing",
    items: [{ label: "Status", value: "Active" }, { label: "Model", value: "GPT-4o" }, { label: "Accuracy", value: "96.4%" }, { label: "Tasks", value: "543" }],
    linkedTo: ["kb-maint", "sop-pm", "bu-mfg"],
    chatResponses: [
      "Predictive Maintenance agent is currently active and monitoring 42 assets across the manufacturing floor.",
      "It uses vibration, acoustic, and temperature signals from SCADA/IoT to predict failures 6–48 hours in advance.",
      "This agent has prevented 84 hours of downtime this quarter, protecting $6.1M in revenue.",
    ],
  },
  "sop-pm": {
    title: "SOP: Predictive Maintenance Execution", subtitle: "Standard Operating Procedure · v3.2",
    items: [{ label: "Automation", value: "84%" }, { label: "Risk", value: "Medium" }, { label: "Status", value: "Active" }, { label: "Steps", value: "6" }],
    linkedTo: ["ag-pm", "kb-maint", "bu-mfg"],
    chatResponses: [
      "This SOP defines the 6-step predictive maintenance workflow: Anomaly Detection → AI Diagnosis → Work Order Generation → Parts Request → Maintenance → Verification.",
      "84% of this SOP is automated. Human approval is required for emergency work orders above $10K.",
      "The SOP is linked to policies MNT-001 and MNT-004.",
    ],
  },
};

const KNOWLEDGE_BASES = [
  { id: "kb1", name: "Maintenance Procedures", bu: "Manufacturing", docs: 48, size: "124 MB", status: "indexed", agents: 2 },
  { id: "kb2", name: "Quality Standards", bu: "Manufacturing", docs: 32, size: "87 MB", status: "indexed", agents: 2 },
  { id: "kb3", name: "Supplier Intelligence", bu: "Procurement", docs: 21, size: "56 MB", status: "indexing", agents: 2 },
  { id: "kb4", name: "Financial Policies", bu: "Finance", docs: 18, size: "42 MB", status: "indexed", agents: 2 },
  { id: "kb5", name: "Sales Playbooks", bu: "Revenue", docs: 24, size: "68 MB", status: "indexed", agents: 2 },
];

const NODE_TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  bu: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Business Unit" },
  knowledge: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", label: "Knowledge Base" },
  sop: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", label: "SOP" },
  agent: { bg: "bg-pink-50 border-pink-200", text: "text-pink-700", label: "Agent" },
};

const SEARCH_EXAMPLES = [
  "What does the Predictive Maintenance agent know?",
  "Which agents use the quality knowledge base?",
  "How many documents in Manufacturing KBs?",
  "What SOPs are linked to Finance?",
];

export default function KnowledgeStudio() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { role } = useAppContext();
  const canEdit = role !== "employee";
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "I'm your Knowledge Graph assistant. Ask me anything about the enterprise knowledge structure — agents, knowledge bases, SOPs, or how they connect." },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [view, setView] = useState<"graph" | "inventory">("graph");
  const [zoom, setZoom] = useState(0.85);

  const node = selectedNode ? KG_NODES.find(n => n.id === selectedNode) : null;
  const nodeDetail = selectedNode ? NODE_DETAILS[selectedNode] : null;

  const filteredNodes = search
    ? KG_NODES.filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    : [];

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: q }]);
    setChatInput("");
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      const responses: Record<string, string> = {
        "agent": "There are 9 active agents in the knowledge graph, connected to 5 knowledge bases and 5 SOPs across all business units.",
        "knowledge": "The enterprise has 5 knowledge bases totaling 143 documents and 394 MB of indexed content.",
        "sop": "4 active SOPs are in the graph: Predictive Maintenance, Quality Inspection, Supplier Risk Assessment, and Month-end Financial Close.",
        "manufacturing": "Manufacturing is connected to 2 knowledge bases (Maintenance Procedures, Quality Standards), 2 SOPs, and 4 agents including OEE Optimizer and Predictive Maintenance.",
        "finance": "Finance links to Financial Policies KB, the Month-end Close SOP, and the Finance Analyst agent.",
      };
      const match = Object.keys(responses).find(k => q.toLowerCase().includes(k));
      const answer = nodeDetail?.chatResponses?.[Math.floor(Math.random() * 3)] ||
        match ? responses[match!] : "Based on the knowledge graph, I can see connections across all 5 business units, 5 knowledge bases, 5 SOPs, and 9 agents. The most interconnected node is the Manufacturing BU.";
      setChatMessages(prev => [...prev, { role: "assistant", content: answer }]);
    }, 1200);
  };

  const SVG_W = 1160;
  const SVG_H = 560;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="KNOWLEDGE"
        metrics={[
          { label: "KNOWLEDGE BASES", value: KNOWLEDGE_BASES.length },
          { label: "DOCUMENTS", value: KNOWLEDGE_BASES.reduce((s, k) => s + k.docs, 0) },
          { label: "CONNECTED AGENTS", value: 9 },
        ]}
      />

      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-muted/40 rounded-sm p-0.5">
            <button onClick={() => setView("graph")} className={cn("px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-sm transition-colors", view === "graph" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}>
              Graph
            </button>
            <button onClick={() => setView("inventory")} className={cn("px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-sm transition-colors", view === "inventory" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground")}>
              Inventory
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search graph..."
              className="pl-7 pr-3 py-1.5 border border-border rounded-sm text-[10px] outline-none focus:border-primary bg-white w-48"
            />
            {search && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-border rounded-sm shadow-lg z-20 w-64">
                {filteredNodes.map(n => (
                  <button key={n.id} onClick={() => { setSelectedNode(n.id); setSearch(""); }}
                    className="w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
                    <span className="text-[10px] font-semibold text-foreground">{n.label}</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">{NODE_TYPE_STYLE[n.type].label}</span>
                  </button>
                ))}
                {filteredNodes.length === 0 && <div className="px-3 py-2 text-[10px] text-muted-foreground">No nodes found</div>}
              </div>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest" onClick={() => toast({ title: "Knowledge Base Added" })}>
              <Upload size={10} className="mr-1" /> Import
            </Button>
            <Button size="sm" className="h-7 text-[9px] uppercase tracking-widest bg-foreground text-background hover:bg-foreground/90" onClick={() => toast({ title: "Knowledge Base Created" })}>
              <Plus size={10} className="mr-1" /> New KB
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Graph area */}
        <div className="flex-1 overflow-hidden relative bg-[#FAFBFF]">
          {view === "graph" && (
            <>
              {/* Zoom controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
                <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="w-7 h-7 bg-white border border-border rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground text-xs font-bold">+</button>
                <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="w-7 h-7 bg-white border border-border rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground text-xs font-bold">−</button>
                <button onClick={() => setZoom(0.85)} className="w-7 h-7 bg-white border border-border rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground" title="Fit">
                  <Network size={11} />
                </button>
              </div>

              {/* Legend */}
              <div className="absolute top-3 left-3 bg-white border border-border rounded-sm px-3 py-2 shadow-sm z-10">
                <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1.5 font-bold">Legend</div>
                <div className="space-y-1">
                  {Object.entries(NODE_TYPE_STYLE).map(([type, style]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: { bu: "#3B82F6", knowledge: "#6366F1", sop: "#0EA5E9", agent: "#EC4899" }[type] }} />
                      <span className="text-[9px] text-muted-foreground">{style.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full h-full overflow-auto flex items-center justify-center">
                <svg
                  width={SVG_W * zoom}
                  height={SVG_H * zoom}
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  className="cursor-default"
                >
                  <defs>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M 0 0 L 6 3 L 0 6 z" fill="#CBD5E1" />
                    </marker>
                  </defs>
                  {/* Edges */}
                  {KG_EDGES.map(([from, to], i) => {
                    const fromNode = KG_NODES.find(n => n.id === from);
                    const toNode = KG_NODES.find(n => n.id === to);
                    if (!fromNode || !toNode) return null;
                    const isHighlighted = selectedNode === from || selectedNode === to;
                    return (
                      <line
                        key={i}
                        x1={fromNode.x} y1={fromNode.y}
                        x2={toNode.x} y2={toNode.y}
                        stroke={isHighlighted ? "#6366F1" : "#E2E8F0"}
                        strokeWidth={isHighlighted ? 2 : 1}
                        strokeOpacity={selectedNode && !isHighlighted ? 0.2 : 1}
                        markerEnd="url(#arrow)"
                      />
                    );
                  })}
                  {/* Nodes */}
                  {KG_NODES.map(n => {
                    const isSelected = selectedNode === n.id;
                    const isConnected = selectedNode && (
                      KG_EDGES.some(([f, t]) => (f === selectedNode && t === n.id) || (t === selectedNode && f === n.id))
                    );
                    const isGrayed = selectedNode && !isSelected && !isConnected;
                    return (
                      <g key={n.id} onClick={() => setSelectedNode(isSelected ? null : n.id)} className="cursor-pointer">
                        <circle
                          cx={n.x} cy={n.y} r={n.size / 2}
                          fill={n.color}
                          fillOpacity={isGrayed ? 0.2 : 0.15}
                          stroke={isSelected ? n.color : "#CBD5E1"}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeOpacity={isGrayed ? 0.2 : 1}
                        />
                        {isSelected && (
                          <circle cx={n.x} cy={n.y} r={n.size / 2 + 6} fill="none" stroke={n.color} strokeWidth={1.5} strokeDasharray="3,3" strokeOpacity={0.6} />
                        )}
                        <text x={n.x} y={n.y + n.size / 2 + 12} textAnchor="middle" fontSize={9} fill={isGrayed ? "#CBD5E1" : "#64748B"} fontWeight={isSelected ? "700" : "500"}>
                          {n.label.length > 18 ? n.label.slice(0, 16) + "…" : n.label}
                        </text>
                        <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize={9} fill={n.color} fillOpacity={isGrayed ? 0.3 : 0.8} fontWeight="700">
                          {n.type === "bu" ? "BU" : n.type === "knowledge" ? "KB" : n.type === "sop" ? "SOP" : "AI"}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </>
          )}

          {view === "inventory" && (
            <div className="p-6 overflow-auto h-full">
              <div className="grid grid-cols-3 gap-4">
                {KNOWLEDGE_BASES.map(kb => (
                  <div key={kb.id} onClick={() => { const n = KG_NODES.find(n => n.label === kb.name); if (n) { setSelectedNode(n.id); setView("graph"); } }}
                    className="bg-white border border-border rounded-sm p-4 shadow-sm hover:border-primary/40 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={14} className="text-violet-500" />
                      <span className="text-xs font-bold text-foreground">{kb.name}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground mb-3">{kb.bu}</div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><div className="text-xs font-bold font-mono">{kb.docs}</div><div className="text-[8px] text-muted-foreground">docs</div></div>
                      <div><div className="text-xs font-bold font-mono">{kb.size}</div><div className="text-[8px] text-muted-foreground">size</div></div>
                      <div><div className="text-xs font-bold font-mono">{kb.agents}</div><div className="text-[8px] text-muted-foreground">agents</div></div>
                    </div>
                    <div className={cn("mt-3 text-[8px] uppercase tracking-widest font-bold text-center", kb.status === "indexed" ? "text-emerald-600" : "text-amber-600")}>
                      ● {kb.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Node detail + chatbot */}
        <div className="w-[300px] shrink-0 bg-white border-l border-border flex flex-col overflow-hidden">
          {node && nodeDetail ? (
            <>
              {/* Node detail header */}
              <div className="px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
                    <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 border rounded-sm", NODE_TYPE_STYLE[node.type].bg, NODE_TYPE_STYLE[node.type].text)}>
                      {NODE_TYPE_STYLE[node.type].label}
                    </span>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </div>
                <div className="text-sm font-bold text-foreground mt-1.5">{nodeDetail.title}</div>
                <div className="text-[9px] text-muted-foreground">{nodeDetail.subtitle}</div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 p-3 border-b border-border shrink-0">
                {nodeDetail.items.map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-sm px-2.5 py-2 border border-border/40">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">{item.label}</div>
                    <div className="text-sm font-bold font-mono text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Connections */}
              <div className="px-3 py-2.5 border-b border-border shrink-0">
                <div className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Connected To</div>
                <div className="flex flex-wrap gap-1">
                  {nodeDetail.linkedTo.map(id => {
                    const ln = KG_NODES.find(n => n.id === id);
                    return ln ? (
                      <button key={id} onClick={() => setSelectedNode(id)}
                        className="text-[8px] font-semibold px-1.5 py-0.5 rounded-sm border hover:border-primary/40 transition-colors"
                        style={{ color: ln.color, borderColor: `${ln.color}40`, backgroundColor: `${ln.color}10` }}>
                        {ln.label}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="px-3 py-2 border-b border-border shrink-0 flex gap-1.5">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-[8px] uppercase tracking-widest">
                  <Eye size={9} className="mr-1" /> View
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 text-[8px] uppercase tracking-widest" onClick={() => navigate(`/agents/${node.id}`)}>
                  <ArrowRight size={9} className="mr-1" /> Open
                </Button>
              </div>
            </>
          ) : (
            <div className="px-4 py-4 border-b border-border shrink-0">
              <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Knowledge Graph</div>
              <div className="text-[10px] text-muted-foreground">Click any node to explore its connections, details, and linked resources.</div>
              <div className="mt-3 space-y-1">
                {Object.entries(NODE_TYPE_STYLE).map(([type, style]) => {
                  const count = KG_NODES.filter(n => n.type === type).length;
                  return (
                    <div key={type} className={cn("flex items-center justify-between px-2 py-1.5 rounded-sm border text-[9px]", style.bg)}>
                      <span className={cn("font-semibold", style.text)}>{style.label}</span>
                      <span className={cn("font-mono font-bold", style.text)}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chatbot */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-border shrink-0 flex items-center gap-2">
              <MessageSquare size={11} className="text-primary" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Knowledge Assistant</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("text-[10px] leading-relaxed rounded-sm px-2.5 py-2",
                  msg.role === "user" ? "bg-primary text-white ml-4" : "bg-muted/40 text-foreground mr-4"
                )}>
                  {msg.content}
                </div>
              ))}
              {isThinking && (
                <div className="bg-muted/40 rounded-sm px-2.5 py-2 mr-4 flex items-center gap-1.5">
                  <Loader2 size={9} className="animate-spin text-primary" />
                  <span className="text-[9px] text-muted-foreground">Searching knowledge graph…</span>
                </div>
              )}
            </div>
            <div className="px-3 py-2 border-t border-border shrink-0">
              {!chatMessages[chatMessages.length - 1]?.content && (
                <div className="mb-2 space-y-1">
                  {SEARCH_EXAMPLES.slice(0, 2).map(ex => (
                    <button key={ex} onClick={() => setChatInput(ex)} className="w-full text-left text-[9px] text-primary hover:underline truncate">
                      "{ex}"
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Ask about knowledge..."
                  className="flex-1 border border-border rounded-sm px-2.5 py-1.5 text-[10px] outline-none focus:border-primary bg-white"
                />
                <Button size="sm" onClick={sendChat} disabled={!chatInput.trim() || isThinking}
                  className="h-7 px-2 bg-primary text-white hover:bg-primary/90">
                  <Send size={10} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
