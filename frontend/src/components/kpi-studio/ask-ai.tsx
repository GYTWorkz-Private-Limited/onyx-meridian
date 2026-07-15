import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { KPI_CATALOG, BU_LIST, type KpiEntry } from "@/data/enterprise-data";
import { GOAL_TREE } from "@/data/goals-data";
import { forecastHorizons, ASK_AI_SUGGESTIONS } from "@/data/kpi-studio-data";
import { Sparkles, Send, Bot, User } from "lucide-react";

interface Message { id: string; role: "user" | "assistant"; content: string; }

// Renders **bold** segments as React nodes — no dangerouslySetInnerHTML,
// so raw user input (which flows through `content` for user messages)
// is never parsed as HTML.
function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function findKpi(q: string): KpiEntry | undefined {
  const ql = q.toLowerCase();
  return KPI_CATALOG.find((k) => ql.includes(k.fullName.toLowerCase()) || (k.abbreviation && ql.includes(k.abbreviation.toLowerCase())) || ql.includes(k.name.toLowerCase()));
}
function findBus(q: string) {
  const ql = q.toLowerCase();
  return BU_LIST.filter((b) => ql.includes(b.name.toLowerCase()) || ql.includes(b.id.replace("-", " ")));
}

function generateAnswer(query: string): string {
  const ql = query.toLowerCase();
  const kpi = findKpi(query);
  const bus = findBus(query);

  if (kpi && (ql.includes("why") || ql.includes("decrease") || ql.includes("declin") || ql.includes("drop") || ql.includes("driving") || ql.includes("cause"))) {
    const causes = kpi.rootCauses.length
      ? kpi.rootCauses.map((c) => `${c.cause} (${c.confidence}% confidence)`).join("; ")
      : "no active root cause is flagged — the metric is within normal variance.";
    return `**${kpi.fullName}${kpi.abbreviation ? ` (${kpi.abbreviation})` : ""}** is currently ${kpi.value} against a target of ${kpi.target} (${kpi.variance}). ${kpi.aiSummary} Root cause: ${causes}`;
  }

  if ((ql.includes("predict") || ql.includes("forecast")) && kpi) {
    const points = forecastHorizons(kpi);
    const month = points.find((p) => p.horizon === "Next Month");
    return `Forecast for **${kpi.fullName}**: ${points.map((p) => `${p.horizon} → ${p.value} (${p.confidence}% conf.)`).join(", ")}. Most likely trajectory: ${month?.value} by next month, trending ${kpi.trend === "up" ? "upward" : "downward"} on current momentum.`;
  }

  if (ql.includes("compare") && bus.length >= 2) {
    const [a, b] = bus;
    return `**${a.name}** is at ${a.health}% health / EEI ${a.eei} (risk: ${a.risk}), vs **${b.name}** at ${b.health}% health / EEI ${b.eei} (risk: ${b.risk}). ${a.health >= b.health ? a.name : b.name} is currently the stronger performer of the two.`;
  }

  if (ql.includes("downtime") || (ql.includes("highest") && ql.includes("bu"))) {
    const dtKpi = KPI_CATALOG.find((k) => k.id === "k-downtime");
    if (dtKpi) return `**Manufacturing** has the highest downtime exposure — ${dtKpi.fullName} is at ${dtKpi.value} against a target of ${dtKpi.target}. ${dtKpi.aiSummary}`;
  }

  if (ql.includes("threat") && (ql.includes("goal") || ql.includes("eei"))) {
    const eeiGoal = GOAL_TREE.find((g) => g.id === "goal-1");
    const risky = KPI_CATALOG.filter((k) => k.goalIds.includes("goal-1") || k.healthScore < 75).sort((a, b) => a.healthScore - b.healthScore).slice(0, 4);
    return `Toward "${eeiGoal?.title}", the KPIs most at risk right now are: ${risky.map((k) => `${k.abbreviation ?? k.name} (health ${k.healthScore})`).join(", ")}. Procurement's Cycle Time and Manufacturing's Equipment Health are the primary drags this quarter.`;
  }

  if (kpi) {
    return `**${kpi.fullName}**: ${kpi.value} vs target ${kpi.target} (${kpi.variance}). Health score ${kpi.healthScore}/100, owned by ${kpi.owner}. ${kpi.aiSummary}`;
  }

  const critical = KPI_CATALOG.filter((k) => k.healthScore < 70);
  return `I can answer questions about any tracked KPI, or compare business units. Right now the KPIs needing the most attention are: ${critical.map((k) => k.abbreviation ?? k.name).join(", ") || "none — everything is within a healthy range"}. Try asking "Why did OEE decrease?" or "Compare Manufacturing vs Supply Chain".`;
}

export function AskAi() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", role: "assistant", content: "Ask me anything about your KPIs — trends, root causes, forecasts, or business unit comparisons." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: generateAnswer(q) }]);
    }, 350);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", m.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>
              {m.role === "assistant" ? <Sparkles size={13} /> : <User size={13} />}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-sm px-3.5 py-2.5 text-[12px] leading-relaxed whitespace-pre-line",
              m.role === "assistant" ? "bg-white border border-border text-foreground" : "bg-primary text-primary-foreground"
            )}>
              <FormattedText text={m.content} />
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="px-6 pb-2 flex flex-wrap gap-1.5">
        {ASK_AI_SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="text-[9px] uppercase tracking-widest font-semibold px-2 py-1 rounded-sm border border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-white transition-colors">
            {s}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask about any KPI, trend, or business unit…"
            className="flex-1 border border-border rounded-sm px-3.5 py-2.5 text-[12px] focus:outline-none focus:border-primary"
          />
          <button onClick={() => send(input)} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-colors">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
