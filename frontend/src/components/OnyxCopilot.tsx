import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import {
  X, Search, ChevronRight, Navigation2, BookOpen,
  Plus, Zap, CornerDownLeft, MessageCircle,
} from "lucide-react";
import onyxStar from "@/assets/onyx-star.png";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

type Mode = "ask" | "navigate" | "explain" | "create" | "actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: "ask",      label: "Ask",      icon: MessageCircle },
  { id: "navigate", label: "Navigate", icon: Navigation2 },
  { id: "explain",  label: "Explain",  icon: BookOpen },
  { id: "create",   label: "Create",   icon: Plus },
  { id: "actions",  label: "Actions",  icon: Zap },
];

const SUGGESTED_PROMPTS = [
  "Show Manufacturing Health",
  "Open Procurement",
  "Create Mission",
  "Show failing agents",
  "Open Agent Inventory",
  "Open Policy Studio",
  "Open Knowledge Graph",
  "Explain EEI",
  "Show Critical Alerts",
  "Show Agent Logs",
  "Show Business Impact",
];

const PAGE_NAMES: Record<string, string> = {
  "/":                  "Digital Twin",
  "/digital-twin":      "Digital Twin",
  "/dashboard":         "Executive Command",
  "/business-units":    "Business Units",
  "/business-impact":   "Business Impact",
  "/intelligence":      "Enterprise Intelligence",
  "/workforce":         "AI Workforce",
  "/agentops":          "Mission Control",
  "/governance":        "Risk Center",
  "/outcomes":          "Learning & Outcomes",
  "/tasks":             "Task Registry",
  "/simulation":        "Simulation",
  "/approvals":         "Approvals",
  "/agent-studio":      "Agent Harness",
  "/workflow-studio":   "Mission Creator",
  "/knowledge-studio":  "Knowledge Studio",
  "/policy-studio":     "Policy Studio",
  "/prompt-playground": "Prompt Playground",
  "/agent-logs":        "Agent Logs",
  "/mission-replay":    "Execution Intelligence",
};

// ─── Navigation resolver ──────────────────────────────────────────────────────

function getNavigationTarget(input: string): string | null {
  const routes: [RegExp, string][] = [
    [/manufactur/i,                                      "/business-units/manufacturing"],
    [/supply.?chain/i,                                   "/business-units/supply-chain"],
    [/procurement/i,                                     "/business-units/procurement"],
    [/finance.*unit|finance.*bu/i,                       "/business-units/finance"],
    [/revenue.*unit|revenue.*bu/i,                       "/business-units/revenue"],
    [/business.?unit/i,                                  "/business-units"],
    [/business.?impact|roi/i,                            "/business-impact"],
    [/agent.?harness|agent.?studio|agent.?inventor/i,    "/agent-studio"],
    [/mission.?creator|workflow.?studio/i,               "/workflow-studio"],
    [/knowledge/i,                                       "/knowledge-studio"],
    [/policy.?studio/i,                                  "/policy-studio"],
    [/prompt.?playground/i,                              "/prompt-playground"],
    [/agent.?log/i,                                      "/agent-logs"],
    [/mission.?control|agentops/i,                       "/agentops"],
    [/governance|risk.?center|critical.?alert|failing/i, "/governance"],
    [/intelligence|recommendation/i,                     "/intelligence"],
    [/workforce|ai.?employee/i,                          "/workforce"],
    [/approval/i,                                        "/approvals"],
    [/task/i,                                            "/tasks"],
    [/simulat/i,                                         "/simulation"],
    [/outcome|analysis/i,                                "/outcomes"],
    [/dashboard|executive/i,                             "/dashboard"],
    [/digital.?twin/i,                                   "/"],
    [/execution.?intel|mission.?replay/i,                "/mission-replay"],
  ];
  for (const [pattern, route] of routes) {
    if (pattern.test(input)) return route;
  }
  return null;
}

// ─── Knowledge base ───────────────────────────────────────────────────────────

function generateResponse(
  input: string,
  currentPage: string,
): { text: string; navigate?: string } {
  const lower = input.toLowerCase();
  const isNav = /^(open|show|go to|take me to|navigate to|launch)\b/i.test(input.trim());

  if (isNav) {
    const target = getNavigationTarget(lower);
    if (target) {
      const name = PAGE_NAMES[target] ?? target;
      return { text: `Navigating to **${name}**...`, navigate: target };
    }
  }

  if (/\beei\b|enterprise.?execution.?index/i.test(lower)) {
    return {
      text: `**Enterprise Execution Index (EEI)** is Onyx Meridian's primary performance metric — a composite score (0–100) measuring how effectively AI agents execute across all business units.\n\n**Components:**\n- Agent Health (40%): reliability, accuracy, drift\n- Task Completion (30%): mission success rate\n- Governance Compliance (20%): policy adherence\n- Business Outcome Quality (10%): revenue & cost impact\n\nCurrent enterprise EEI: **84/100** — above target of 80. Manufacturing leads at 88; Supply Chain trails at 76.`,
    };
  }

  if (/\boee\b|overall.?equipment/i.test(lower)) {
    return {
      text: `**OEE (Overall Equipment Effectiveness)** = Availability × Performance × Quality.\n\nCurrent: **87.4%** (above industry avg of 85%).\n\n⚠️ Active anomaly: Line 7 OEE deviation — bearing failure predicted within 48h. Work order MX-0441 queued for Predictive Maintenance agent.`,
    };
  }

  if (/manufactur.*health|health.*manufactur|manufacturing/i.test(lower)) {
    return {
      text: `**Manufacturing Intelligence — Health 91/100** ✅\n\n- EEI Score: **88**\n- Active Agents: **18** (all healthy)\n- Workflows: **42** running\n- Risk Level: **Low**\n\n**KPIs:** OEE 87.4% · Throughput 2,840 u/hr · Scrap Rate 1.2%\n\n⚠️ One active anomaly: OEE deviation on Line 7 — bearing failure risk ($480K downtime). Predictive maintenance work order queued.`,
      navigate: "/business-units/manufacturing",
    };
  }

  if (/fail|at.?risk|quarantin/i.test(lower)) {
    return {
      text: `**2 agents need attention:**\n\n🔴 **Contract AI** — Risk Score 81/100 · Quarantined\nAccuracy degraded 14% over 30 days. Compliance risk in vendor screening.\nReplacement: Contract AI v3.0 (+22% accuracy)\n\n🟡 **Procurement Intelligence** — Risk Score 72/100 · At Risk\n3 policy violations in 7 days. Drift elevated.\nReplacement: Procurement Intelligence v2.1 (+18% accuracy)\n\nNavigating to Risk Center...`,
      navigate: "/governance",
    };
  }

  if (/create.*(mission|workflow)/i.test(lower)) {
    return {
      text: `Opening Mission Creator...\n\nCreate a new mission to automate a business process:\n\n- Design multi-step agent workflows on a visual canvas\n- Set triggers, conditions, and approval gates\n- Assign AI employees to each step\n- Configure KPI targets and success criteria\n\nThe Mission Creator generates a live workflow that agents execute in real-time.`,
      navigate: "/workflow-studio",
    };
  }

  if (/create.*(agent|employee)/i.test(lower)) {
    return {
      text: `Opening Agent Harness...\n\nConfigure and deploy a new AI agent:\n\n- Select agent type and base model\n- Set autonomy level: Supervised → Semi-Autonomous → Fully Autonomous\n- Attach knowledge sources and SOPs\n- Define decision boundaries and escalation rules\n- Run evaluation suite before going live`,
      navigate: "/agent-studio",
    };
  }

  if (/critical|alert|violation|governance|policy/i.test(lower)) {
    return {
      text: `**Active Enterprise Alerts:**\n\n🔴 **Critical** — OEE deviation Line 7: bearing failure imminent ($480K risk)\n🔴 **Critical** — 3 tier-1 suppliers flagged (Q3 supply risk)\n🟡 **Warning** — Contract AI quarantined (compliance risk)\n🟡 **Warning** — Procurement Intelligence at-risk (3 violations)\n\n**Policy Engine:** 6 active rules · 3 violations this week\n\nNavigating to Risk Center...`,
      navigate: "/governance",
    };
  }

  if (/business.?impact|roi|value.?deliver|cost.?sav/i.test(lower)) {
    return {
      text: `**Enterprise Business Impact — Jun 2026:**\n\n💰 Revenue Protected: **$24.6M**\n💰 Cost Saved: **$2.64M**\n⏱️ Hours Saved: **7,720 hrs**\n📈 Productivity Gain: **+18%**\n🤖 Automation Rate: **74%**\n\nTop performer: Manufacturing ($4.2M protected). Revenue BU: +12% pipeline conversion rate.`,
      navigate: "/business-impact",
    };
  }

  if (/agent.?log|log/i.test(lower)) {
    return {
      text: `Opening Agent Logs...\n\nAgent Logs captures every AI decision, action, and outcome in real-time:\n\n- Filter by agent, business unit, severity, or time range\n- View full decision reasoning and confidence scores\n- Export audit-ready records\n- Trace from action → outcome → business impact`,
      navigate: "/agent-logs",
    };
  }

  if (/knowledge|graph/i.test(lower)) {
    return {
      text: `Opening Knowledge Studio...\n\nThe Knowledge Graph powers all AI agent decisions:\n\n- SOPs and standard operating procedures\n- Governance policies and rules\n- Playbooks and decision frameworks\n- Historical outcomes and case studies\n\nEvery agent references this graph before acting to ensure compliance and institutional memory.`,
      navigate: "/knowledge-studio",
    };
  }

  if (/policy.?studio/i.test(lower)) {
    return {
      text: `Opening Policy Studio...\n\nDefine and manage governance rules that constrain all AI agent behavior:\n\n- 14 policy categories (spending, data, escalation, autonomy…)\n- Natural language IF/THEN rule builder\n- Real-time violation monitoring\n- Policy versioning and full audit trail`,
      navigate: "/policy-studio",
    };
  }

  if (/digital.?twin/i.test(lower)) {
    return {
      text: `**Digital Twin** is Onyx Meridian's live enterprise topology map.\n\n- **Enterprise Core Node**: EEI 84 · $4.2M Rev/Day · 247 AI Agents · 98.7% uptime\n- **5 Business Units**: each with health scores, agent counts, and risk levels\n- **Org Navigator**: drill-down into every BU and AI employee\n- **Live Intelligence Panel**: real-time anomaly feed with recommended actions\n\nDouble-click any BU node to open its full detail page.`,
    };
  }

  if (/what.*page|where.*am|current.*page/i.test(lower)) {
    const name = PAGE_NAMES[currentPage] ?? currentPage;
    return {
      text: `You're on the **${name}** page.\n\nSay "explain this page" for a full overview, or ask me anything about what you see.`,
    };
  }

  if (/explain.*(this|page|view|screen)/i.test(lower)) {
    const name = PAGE_NAMES[currentPage] ?? currentPage;
    const explanations: Record<string, string> = {
      "/": `**Digital Twin** shows your enterprise as a real-time topology. The center node is the Enterprise Core (EEI 84). Surrounding nodes are Business Units. Left panel: Org Navigator. Right panel: Live Intelligence with real-time anomalies.`,
      "/dashboard": `**Executive Command** is the C-suite view — top-line KPIs, EEI trend, AI workforce health, active risks, and high-priority recommendations.`,
      "/governance": `**Risk Center** monitors AI agent compliance. Shows risk scores per agent, the Policy Engine (IF/THEN rules), policy violations, and a real-time audit trail of blocked/approved actions.`,
      "/intelligence": `**Enterprise Intelligence (Prism)** surfaces AI recommendations in three tabs:\n- **Prism**: Strategic recommendations with confidence scores\n- **Pulse**: SOP library\n- **Flow**: Active workflow execution`,
      "/business-units": `**Business Units** shows all 5 autonomous intelligence domains with EEI, health, agent count, automation rate, revenue protected, and cost saved. Click any card to drill in.`,
      "/outcomes": `**Learning & Outcomes** tracks continuous improvement: 90-day EEI trend, delivered business value by BU, and agent retraining/replacement progress.`,
      "/workforce": `**AI Workforce** shows all deployed AI employees — status, autonomy level, task load, and performance. Manage, retrain, or reallocate agents.`,
      "/agentops": `**Mission Control** shows all active and queued missions (workflows). Monitor execution in real-time, view step-by-step progress, and intervene if needed.`,
    };
    return {
      text: explanations[currentPage] ?? `**${name}** is part of the Onyx Meridian Enterprise OS. Ask me specific questions about what you see here.`,
    };
  }

  return {
    text: `I'm **Onyx Copilot**, your enterprise OS assistant.\n\n**🧭 Navigate** — "Open Policy Studio", "Show Manufacturing"\n**📊 Explain** — "Explain EEI", "What is OEE?", "Explain this page"\n**⚡ Act** — "Create Mission", "Create Agent", "Show failing agents"\n**🔍 Surface** — "Show Critical Alerts", "Show Business Impact"\n\nWhat would you like to do?`,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnyxCopilot({
  isOpen,
  onClose,
  currentPage,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
}) {
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeMode, setActiveMode] = useState<Mode>("ask");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 320);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSearchQuery("");
    setIsThinking(true);

    const { text: responseText, navigate: navTarget } = generateResponse(text, currentPage);

    if (navTarget) setTimeout(() => navigate(navTarget), 700);

    await new Promise(r => setTimeout(r, 650));
    setIsThinking(false);

    const aId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: aId, role: "assistant", content: "", streaming: true }]);

    const words = responseText.split(" ");
    let built = "";
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 18));
      built += (i > 0 ? " " : "") + words[i];
      const snapshot = built;
      setMessages(prev =>
        prev.map(m => (m.id === aId ? { ...m, content: snapshot } : m))
      );
    }
    setMessages(prev => prev.map(m => (m.id === aId ? { ...m, streaming: false } : m)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const filteredPrompts = searchQuery
    ? SUGGESTED_PROMPTS.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
    : SUGGESTED_PROMPTS;

  const renderMarkdown = (text: string) =>
    text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : part
      );
      return <p key={i} className={i > 0 ? "mt-1" : ""}>{parts}</p>;
    });

  const pageName = PAGE_NAMES[currentPage] ?? "Current Page";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[400px] bg-white border-l border-border shadow-2xl z-50 flex flex-col",
          "transition-transform duration-300 ease-out will-change-transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/20 shrink-0 bg-[#0F0F1A]">
          <div className="flex items-center gap-3">
            <img src={onyxStar} alt="Onyx Co Work" className="w-8 h-8 rounded-full object-cover" />
            <div>
              <div className="text-sm font-bold text-white tracking-wide">Onyx Co Work</div>
              <div className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">Enterprise Assistant</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-border bg-[#FAFAFA] shrink-0">
          {MODES.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-[8px] uppercase tracking-widest font-bold transition-all",
                  activeMode === m.id
                    ? "text-primary border-b-2 border-primary bg-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={11} />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-3">
                <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search or type a command..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      sendMessage(searchQuery);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-sm bg-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Context chip */}
              <div className="flex items-center gap-1.5 mb-4 px-2.5 py-1.5 bg-primary/5 border border-primary/20 rounded-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="text-[9px] text-primary font-bold uppercase tracking-widest">
                  Context: {pageName}
                </span>
              </div>

              {/* Suggested prompts */}
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2 px-0.5">
                  Suggested
                </div>
                <div className="space-y-0.5">
                  {filteredPrompts.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-[11px] font-medium text-foreground hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/20 rounded-sm transition-all group"
                    >
                      {prompt}
                      <ChevronRight size={10} className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    "animate-in fade-in slide-in-from-bottom-1 duration-200",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {msg.role === "assistant" && (
                    <img src={onyxStar} alt="Onyx Co Work" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                  )}
                  <div
                    className={cn(
                      "max-w-[86%] rounded-sm px-3 py-2 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-[#0F0F1A] text-white rounded-tr-none"
                        : "bg-[#F8F9FA] border border-border text-foreground rounded-tl-none"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div>
                        {renderMarkdown(msg.content)}
                        {msg.streaming && (
                          <span className="inline-block w-[2px] h-3 bg-primary ml-0.5 animate-pulse align-middle" />
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-2 animate-in fade-in duration-200">
                  <img src={onyxStar} alt="Onyx Co Work" className="w-6 h-6 rounded-full object-cover shrink-0 animate-pulse" />
                  <div className="bg-[#F8F9FA] border border-border rounded-sm rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Clear */}
        {messages.length > 0 && (
          <div className="px-4 py-1.5 border-t border-border/40 shrink-0 flex items-center justify-between">
            <button
              onClick={() => setMessages([])}
              className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors font-semibold"
            >
              ← Back to prompts
            </button>
            <span className="text-[9px] text-muted-foreground">{messages.length / 2 | 0} exchanges</span>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Onyx anything…"
              rows={1}
              className="flex-1 resize-none text-xs border border-border rounded-sm px-3 py-2 focus:outline-none focus:border-primary bg-white placeholder:text-muted-foreground transition-colors"
              style={{ minHeight: 34, maxHeight: 100, overflowY: "auto" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isThinking}
              className={cn(
                "w-8 h-8 rounded-sm flex items-center justify-center transition-all shrink-0",
                input.trim() && !isThinking
                  ? "bg-[#0F0F1A] text-white hover:bg-black"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <CornerDownLeft size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <kbd className="text-[8px] font-mono bg-muted px-1 py-0.5 rounded border border-border text-muted-foreground">↵</kbd>
            <span className="text-[9px] text-muted-foreground">send</span>
            <span className="text-[9px] text-muted-foreground/40">·</span>
            <kbd className="text-[8px] font-mono bg-muted px-1 py-0.5 rounded border border-border text-muted-foreground">ESC</kbd>
            <span className="text-[9px] text-muted-foreground">close</span>
          </div>
        </div>
      </div>
    </>
  );
}
