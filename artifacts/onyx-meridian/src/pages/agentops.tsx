import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import {
  Radio, Plus, ChevronRight, Bot, Users, Clock, Zap,
  CheckCircle2, AlertTriangle, Circle, MessageSquare,
  BarChart3, DollarSign, Activity, Terminal, Send,
  Search, GitBranch, Target, Layers, ArrowRight,
  RefreshCw, Cpu, Database, BookOpen, Wrench, Play,
  Loader2,
} from "lucide-react";

// ─── Static data ───────────────────────────────────────────────

const MISSIONS = [
  {
    id: "m1",
    name: "Line 7 OEE Recovery",
    status: "active",
    priority: "critical",
    bu: "Manufacturing",
    agents: ["Production Planner", "OEE Optimizer", "Predictive Maintenance"],
    startedAt: "14:28",
    objective: "Recover Line 7 OEE from 69% to ≥87% target before next shift",
    progress: 62,
    messages: [
      { role: "system", content: "Mission initiated: Line 7 OEE Recovery", ts: "14:28:00", type: "system" },
      { role: "agent", agent: "OEE Optimizer", content: "Analyzing Line 7 production data. Current OEE: 69.6% (Availability 78%, Performance 91%, Quality 98%). Availability is the primary loss driver.", ts: "14:28:14", type: "analysis", phase: "Planning" },
      { role: "agent", agent: "Predictive Maintenance", content: "Asset MX-0441 vibration at 2.3σ above baseline. Bearing failure probability: 87% within 6 hours. Recommending immediate maintenance window.", ts: "14:29:02", type: "alert", phase: "Retrieval" },
      { role: "tool", content: "query_scada_sensor(asset='MX-0441') → temp: +12°C above baseline, vibration: 2.3σ, acoustic: abnormal pattern detected", ts: "14:29:18", type: "tool" },
      { role: "agent", agent: "Production Planner", content: "Calculating schedule impact. If Line 7 stops for 2-hr maintenance window: Line 8 can absorb 74% of output. Recommend initiating maintenance now vs. 6-hr unplanned downtime.", ts: "14:30:41", type: "reasoning", phase: "Planning" },
      { role: "tool", content: "create_work_order(asset='MX-0441', type='emergency', priority='P1', parts=['bearing-7802-A', 'lubricant-H2']) → WO-2024-0441 created", ts: "14:31:05", type: "tool" },
      { role: "agent", agent: "OEE Optimizer", content: "Recommended action: 2-hr planned maintenance window on Line 7. Projected outcome: Prevent $480K unplanned downtime risk, restore OEE to 89% by next shift.", ts: "14:31:48", type: "completion", phase: "Completion" },
      { role: "human", content: "Approved. Proceed with 2-hr maintenance window.", ts: "14:32:10", type: "approval" },
    ],
  },
  {
    id: "m2",
    name: "Supplier Risk Mitigation — Q3",
    status: "active",
    priority: "high",
    bu: "Procurement",
    agents: ["Supplier Risk Agent", "Contract Bot", "Sourcing Agent"],
    startedAt: "13:45",
    objective: "Assess and mitigate Q3 supplier continuity risk for 3 flagged Tier-1 vendors",
    progress: 38,
    messages: [
      { role: "system", content: "Mission initiated: Supplier Risk Mitigation Q3", ts: "13:45:00", type: "system" },
      { role: "agent", agent: "Supplier Risk Agent", content: "Identified 3 Tier-1 suppliers with risk scores >80: Supplier #084 (82), #091 (79), #112 (84). Primary risk: financial distress indicators and delivery performance decline.", ts: "13:45:22", type: "analysis", phase: "Retrieval" },
      { role: "tool", content: "get_supplier_risk_score(supplier_ids=['084','091','112']) → scores: [82, 79, 84], avg delivery delay: +11 days", ts: "13:46:08", type: "tool" },
      { role: "agent", agent: "Sourcing Agent", content: "Scanning alternate supplier pool. Found 4 pre-qualified alternatives with capacity to absorb 60% of affected volume within 14 days.", ts: "13:47:30", type: "reasoning", phase: "Planning" },
    ],
  },
  {
    id: "m3",
    name: "Q3 Revenue Forecast Correction",
    status: "completed",
    priority: "medium",
    bu: "Revenue",
    agents: ["Revenue Scout", "Deal Closer AI", "Forecast Agent"],
    startedAt: "09:14",
    objective: "Identify and correct Q3 revenue forecast by analyzing pipeline slip risk",
    progress: 100,
    messages: [
      { role: "system", content: "Mission completed: Q3 Revenue Forecast Correction", ts: "11:42:00", type: "system" },
    ],
  },
  {
    id: "m4",
    name: "Month-end Financial Close",
    status: "scheduled",
    priority: "medium",
    bu: "Finance",
    agents: ["Finance Analyst", "Audit Agent", "Cost Controller"],
    startedAt: "—",
    objective: "Execute automated month-end close with variance analysis and CFO briefing",
    progress: 0,
    messages: [],
  },
];

const COLLABORATIONS = [
  {
    id: "c1",
    name: "Manufacturing × Finance",
    type: "Cross-BU",
    agents: ["Production Planner", "Finance Analyst"],
    topic: "Cost per unit variance — Line 7 output impact on Q3 COGS",
    status: "active",
    messages: 24,
  },
  {
    id: "c2",
    name: "Procurement × Supply Chain",
    type: "Cross-BU",
    agents: ["Supplier Risk Agent", "Inventory Optimizer"],
    topic: "SKU-8841 alternate supplier sourcing for stockout prevention",
    status: "active",
    messages: 18,
  },
  {
    id: "c3",
    name: "Revenue × Finance",
    type: "Cross-BU",
    agents: ["Revenue Scout", "Finance Analyst"],
    topic: "APAC deal pipeline Q3 revenue recognition alignment",
    status: "watch",
    messages: 7,
  },
];

const PHASE_ANIMATIONS = ["Thinking", "Planning", "Retrieval", "Tool Calls", "Completion"] as const;
type Phase = typeof PHASE_ANIMATIONS[number];

const phaseColor: Record<Phase, string> = {
  Thinking: "text-violet-400",
  Planning: "text-blue-400",
  Retrieval: "text-amber-400",
  "Tool Calls": "text-emerald-400",
  Completion: "text-emerald-300",
};

const priorityStyle: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-muted text-muted-foreground border-border",
};

const statusStyle: Record<string, { cls: string; label: string; dot: string }> = {
  active: { cls: "text-emerald-600", label: "Active", dot: "bg-emerald-500 animate-pulse" },
  scheduled: { cls: "text-blue-600", label: "Scheduled", dot: "bg-blue-400" },
  completed: { cls: "text-muted-foreground", label: "Completed", dot: "bg-muted-foreground" },
  watch: { cls: "text-amber-600", label: "Watch", dot: "bg-amber-500" },
};

function AgentThinking({ phase }: { phase: Phase }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono">
      <Loader2 size={10} className={cn("animate-spin", phaseColor[phase])} />
      <span className={phaseColor[phase]}>{phase}...</span>
    </div>
  );
}

function MissionTimeline({ mission }: { mission: typeof MISSIONS[0] }) {
  const events = [
    { label: "Mission Created", time: mission.startedAt, status: "done" },
    { label: "Agents Briefed", time: mission.startedAt, status: "done" },
    { label: "Data Retrieval", time: `${parseInt(mission.startedAt?.split(":")?.[1] || "0") + 2}:${mission.startedAt?.split(":")?.[2] || "00"}`, status: mission.progress > 20 ? "done" : "pending" },
    { label: "Analysis Complete", time: "—", status: mission.progress > 50 ? "done" : "pending" },
    { label: "Recommendation", time: "—", status: mission.progress > 80 ? "done" : "pending" },
    { label: "Human Approval", time: "—", status: mission.status === "completed" ? "done" : "pending" },
  ];
  return (
    <div className="space-y-2">
      {events.map((ev, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
            ev.status === "done" ? "bg-emerald-500 border-emerald-500" : "bg-white border-border"
          )}>
            {ev.status === "done" && <CheckCircle2 size={8} className="text-white" />}
          </div>
          <div className="flex-1">
            <div className={cn("text-[10px] font-semibold", ev.status === "done" ? "text-foreground" : "text-muted-foreground")}>{ev.label}</div>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground">{ev.time}</span>
        </div>
      ))}
    </div>
  );
}

export default function MissionControl() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { role } = useAppContext();
  const [selectedMission, setSelectedMission] = useState(MISSIONS[0]);
  const [activeTab, setActiveTab] = useState<"missions" | "collaborations">("missions");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MISSIONS[0].messages);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>("Thinking");
  const [rightTab, setRightTab] = useState<"timeline" | "logs" | "metrics">("timeline");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(selectedMission.messages);
  }, [selectedMission]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "human" as const, content: input, ts: new Date().toTimeString().slice(0, 8), type: "user" as const };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsAgentRunning(true);

    const phases: Phase[] = ["Thinking", "Planning", "Retrieval", "Tool Calls", "Completion"];
    let phaseIdx = 0;
    const phaseInterval = setInterval(() => {
      if (phaseIdx < phases.length) {
        setCurrentPhase(phases[phaseIdx]);
        phaseIdx++;
      } else {
        clearInterval(phaseInterval);
        setIsAgentRunning(false);
        setMessages(prev => [...prev, {
          role: "agent" as const, agent: selectedMission.agents[0], content: "Analysis complete. Based on current telemetry and enterprise context, I recommend proceeding with the outlined action plan. All agents aligned on execution path.",
          ts: new Date().toTimeString().slice(0, 8), type: "completion" as const, phase: "Completion" as const,
        }]);
      }
    }, 800);
  };

  const createMission = () => {
    navigate("/workflow-studio");
  };

  const activeMissions = MISSIONS.filter(m => m.status === "active").length;
  const totalAgents = new Set(MISSIONS.flatMap(m => m.agents)).size;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="MISSION CONTROL"
        metrics={[
          { label: "ACTIVE MISSIONS", value: activeMissions },
          { label: "AGENTS DEPLOYED", value: totalAgents },
          { label: "COLLABORATIONS", value: COLLABORATIONS.filter(c => c.status === "active").length },
        ]}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Mission List + Collaborations */}
        <div className="w-[260px] shrink-0 bg-white border-r border-border flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setActiveTab("missions")}
              className={cn("flex-1 py-2.5 text-[9px] uppercase tracking-widest font-bold transition-colors",
                activeTab === "missions" ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Missions
            </button>
            <button
              onClick={() => setActiveTab("collaborations")}
              className={cn("flex-1 py-2.5 text-[9px] uppercase tracking-widest font-bold transition-colors",
                activeTab === "collaborations" ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Collaborations
            </button>
          </div>

          {activeTab === "missions" && (
            <>
              {role !== "employee" && (
                <div className="px-3 py-2 border-b border-border shrink-0">
                  <Button onClick={createMission} size="sm" className="w-full h-7 text-[9px] uppercase tracking-widest font-bold bg-foreground text-background hover:bg-foreground/90">
                    <Plus size={10} className="mr-1" /> New Mission
                  </Button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {MISSIONS.map((mission) => {
                  const st = statusStyle[mission.status];
                  return (
                    <button
                      key={mission.id}
                      onClick={() => setSelectedMission(mission)}
                      className={cn("w-full text-left px-3 py-3 transition-colors hover:bg-muted/30",
                        selectedMission.id === mission.id && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[11px] font-bold text-foreground leading-snug">{mission.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                        </div>
                      </div>
                      <div className="text-[9px] text-muted-foreground mb-1.5">{mission.bu} · {mission.agents.length} agents</div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[8px] uppercase tracking-widest px-1 py-0.5 border rounded-sm font-bold", priorityStyle[mission.priority])}>
                          {mission.priority}
                        </span>
                        {mission.progress > 0 && (
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${mission.progress}%` }} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === "collaborations" && (
            <>
              <div className="px-3 py-2 border-b border-border shrink-0">
                <Button onClick={() => toast({ title: "Collaboration Created" })} size="sm" className="w-full h-7 text-[9px] uppercase tracking-widest font-bold bg-foreground text-background hover:bg-foreground/90">
                  <Plus size={10} className="mr-1" /> New Collaboration
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {COLLABORATIONS.map((collab) => {
                  const st = statusStyle[collab.status];
                  return (
                    <button
                      key={collab.id}
                      onClick={() => navigate(`/workflow/${collab.id}`)}
                      className="w-full text-left px-3 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
                        <span className="text-[11px] font-bold text-foreground">{collab.name}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground mb-1 leading-snug">{collab.topic}</div>
                      <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><MessageSquare size={8} /> {collab.messages} msgs</span>
                        <span>·</span>
                        <span>{collab.type}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* CENTER — Mission Conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mission header */}
          <div className="bg-white border-b border-border px-4 py-2.5 shrink-0 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", statusStyle[selectedMission.status].dot)} />
                <span className="text-sm font-bold text-foreground">{selectedMission.name}</span>
                <span className={cn("text-[8px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm font-bold", priorityStyle[selectedMission.priority])}>
                  {selectedMission.priority}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{selectedMission.objective}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {selectedMission.agents.map((a, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center" title={a}>
                    <Bot size={9} className="text-primary" />
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[9px] uppercase tracking-widest" onClick={() => navigate(`/workflow/${selectedMission.id}`)}>
                <GitBranch size={10} className="mr-1" /> Workflow
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {selectedMission.progress > 0 && (
            <div className="h-1 bg-muted shrink-0">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${selectedMission.progress}%` }} />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => {
              if (msg.type === "system") {
                return (
                  <div key={i} className="flex items-center gap-2 text-[9px] text-muted-foreground justify-center py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="uppercase tracking-widest font-semibold px-2">{msg.content}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                );
              }
              if (msg.type === "tool") {
                return (
                  <div key={i} className="bg-[#1A1A2E] rounded-sm px-3 py-2 border border-gray-800 font-mono text-[10px]">
                    <span className="text-emerald-400">[TOOL]</span>
                    <span className="text-gray-300 ml-2">{msg.content}</span>
                    <span className="text-gray-600 ml-2 float-right">{msg.ts}</span>
                  </div>
                );
              }
              if (msg.role === "human" || msg.type === "approval") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[70%] bg-primary text-white rounded-sm px-3 py-2">
                      <div className="text-[10px] mb-1 opacity-70">Human · {msg.ts}</div>
                      <div className="text-[11px] leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                );
              }
              const phaseColors: Record<string, string> = {
                analysis: "border-l-blue-400",
                alert: "border-l-red-400",
                reasoning: "border-l-violet-400",
                completion: "border-l-emerald-400",
              };
              return (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={13} className="text-primary" />
                  </div>
                  <div className={cn("flex-1 bg-white border border-border rounded-sm px-3 py-2 border-l-2", phaseColors[msg.type] || "border-l-border")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-foreground">{(msg as any).agent}</span>
                      {(msg as any).phase && (
                        <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1 py-0.5 rounded-sm",
                          (msg as any).phase === "Completion" ? "bg-emerald-50 text-emerald-700" :
                          (msg as any).phase === "Planning" ? "bg-blue-50 text-blue-700" :
                          (msg as any).phase === "Retrieval" ? "bg-amber-50 text-amber-700" : "bg-violet-50 text-violet-700"
                        )}>
                          {(msg as any).phase}
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground ml-auto">{msg.ts}</span>
                    </div>
                    <div className="text-[11px] text-foreground leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              );
            })}

            {isAgentRunning && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-primary" />
                </div>
                <div className="flex-1 bg-white border border-border rounded-sm px-3 py-2.5">
                  <AgentThinking phase={currentPhase} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-border px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 border border-border rounded-sm px-3 py-2 bg-muted/20 focus-within:border-primary transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Send a message to the mission agents..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onClick={sendMessage}
                size="sm"
                disabled={!input.trim() || isAgentRunning}
                className="h-9 px-3 bg-primary text-white hover:bg-primary/90"
              >
                <Send size={13} />
              </Button>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
              {selectedMission.agents.map((a, i) => (
                <span key={i} className="flex items-center gap-0.5"><Bot size={8} /> {a}</span>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Timeline / Logs / Metrics */}
        <div className="w-[260px] shrink-0 bg-white border-l border-border flex flex-col overflow-hidden">
          {/* Right tabs */}
          <div className="flex border-b border-border shrink-0">
            {(["timeline", "logs", "metrics"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={cn("flex-1 py-2.5 text-[8px] uppercase tracking-widest font-bold transition-colors",
                  rightTab === tab ? "bg-primary/5 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {rightTab === "timeline" && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Mission Timeline</div>
                <MissionTimeline mission={selectedMission} />
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Status</div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Progress", value: `${selectedMission.progress}%`, color: "text-primary" },
                      { label: "Priority", value: selectedMission.priority, color: priorityStyle[selectedMission.priority].split(" ")[1] },
                      { label: "Started", value: selectedMission.startedAt, color: "text-foreground" },
                      { label: "Agents", value: `${selectedMission.agents.length} active`, color: "text-foreground" },
                      { label: "Status", value: statusStyle[selectedMission.status].label, color: statusStyle[selectedMission.status].cls },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={cn("font-mono font-bold", item.color)}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {rightTab === "logs" && (
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Activity Log</div>
                <div className="bg-[#1A1A2E] rounded-sm p-2 font-mono text-[9px] space-y-1 max-h-[480px] overflow-y-auto">
                  {messages.filter(m => m.type !== "system").map((msg, i) => (
                    <div key={i} className="flex gap-1.5">
                      <span className="text-gray-500 shrink-0">{msg.ts}</span>
                      <span className={cn(
                        "shrink-0 font-bold",
                        msg.type === "tool" ? "text-emerald-400" :
                        msg.role === "human" ? "text-amber-400" : "text-blue-400"
                      )}>
                        [{msg.type === "tool" ? "TOOL" : msg.role === "human" ? "HUMAN" : "AGENT"}]
                      </span>
                      <span className="text-gray-400 truncate">
                        {msg.content.slice(0, 60)}{msg.content.length > 60 ? "…" : ""}
                      </span>
                    </div>
                  ))}
                  <div className="animate-pulse text-gray-600">_</div>
                </div>
              </div>
            )}

            {rightTab === "metrics" && (
              <div className="space-y-3">
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Performance Metrics</div>
                {[
                  { label: "Tokens Used", value: "42,840", icon: Cpu, color: "text-primary" },
                  { label: "Avg Latency", value: "840ms", icon: Zap, color: "text-amber-600" },
                  { label: "Total Cost", value: "$0.18", icon: DollarSign, color: "text-foreground" },
                  { label: "Tool Calls", value: "8", icon: Wrench, color: "text-emerald-600" },
                  { label: "Messages", value: `${messages.length}`, icon: MessageSquare, color: "text-foreground" },
                  { label: "Duration", value: "12 min", icon: Clock, color: "text-foreground" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between bg-muted/30 rounded-sm px-2.5 py-2 border border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Icon size={10} className={item.color} />
                        <span className="text-[10px] text-muted-foreground">{item.label}</span>
                      </div>
                      <span className={cn("text-[10px] font-mono font-bold", item.color)}>{item.value}</span>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-border">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Phase Breakdown</div>
                  {PHASE_ANIMATIONS.map(phase => (
                    <div key={phase} className="flex items-center justify-between text-[9px] mb-1.5">
                      <span className={phaseColor[phase]}>{phase}</span>
                      <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.random() * 60 + 20}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
