import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { saveKpiChat, deleteSavedKpiChat, type KpiChartSpec } from "@/lib/api";
import { KpiChatChart } from "@/components/kpi-studio/kpi-chat-chart";
import { Sparkles, Send, Bot, User, Pin, PinOff, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  data?: Record<string, unknown>[];
  chart?: KpiChartSpec | null;
  savedId?: string;
}

type ChatEvent =
  | { type: "stage"; stage: string; attempt?: number }
  | { type: "final"; answer: string; sql: string; data: Record<string, unknown>[]; chart: KpiChartSpec | null };

const STAGE_LABELS: Record<string, string> = {
  retrieving_schema: "Finding relevant tables…",
  generating_sql: "Writing query…",
  executing_sql: "Running query…",
  fixing_sql: "Query failed, retrying…",
  summarizing: "Summarizing results…",
};

async function* streamKpiChat(question: string, threadId: string) {
  const res = await fetch("/api/kpi-chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ question, threadId }),
  });
  if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (line) yield JSON.parse(line.slice(6)) as ChatEvent;
    }
  }
}

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

export function AiChatPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "m0", role: "assistant", content: "Ask me anything about your KPIs — I'll query the live database and answer with real numbers." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const threadId = useRef(crypto.randomUUID()).current;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;

    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: q }]);
    setInput("");
    setSending(true);
    setStageLabel("Thinking…");

    try {
      let final: { answer: string; sql: string; data: Record<string, unknown>[]; chart: KpiChartSpec | null } | null = null;
      for await (const event of streamKpiChat(q, threadId)) {
        if (event.type === "stage") setStageLabel(STAGE_LABELS[event.stage] ?? event.stage);
        else final = event;
      }
      if (final) {
        setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: final!.answer, sql: final!.sql, data: final!.data, chart: final!.chart }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: `Something went wrong answering that: ${err instanceof Error ? err.message : String(err)}` }]);
    } finally {
      setSending(false);
      setStageLabel(null);
    }
  };

  const pin = async (msg: Message) => {
    const idx = messages.findIndex((m) => m.id === msg.id);
    const question = [...messages].slice(0, idx).reverse().find((m) => m.role === "user")?.content;
    if (!question) return;
    try {
      const saved = await saveKpiChat({ question, answer: msg.content, sqlQuery: msg.sql, resultData: msg.data, chartSpec: msg.chart });
      setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, savedId: saved.id } : x)));
      queryClient.invalidateQueries({ queryKey: ["kpi-chat-saved"] });
      toast({ title: "Pinned", description: "Saved this answer for later." });
    } catch {
      toast({ title: "Couldn't pin", description: "Something went wrong saving this answer." });
    }
  };

  const unpin = async (savedId: string, messageId?: string) => {
    await deleteSavedKpiChat(savedId);
    queryClient.invalidateQueries({ queryKey: ["kpi-chat-saved"] });
    if (messageId) setMessages((m) => m.map((x) => (x.id === messageId ? { ...x, savedId: undefined } : x)));
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-10 shrink-0 border-l border-border bg-white flex flex-col items-center justify-start pt-4 gap-2 hover:bg-muted/30 transition-colors"
        title="Open Ask AI"
      >
        <Sparkles size={16} className="text-primary" />
        <ChevronLeft size={12} className="text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="w-[380px] shrink-0 border-l border-border bg-white flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Ask AI</span>
        </div>
        <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground p-1">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", m.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>
                  {m.role === "assistant" ? <Bot size={12} /> : <User size={12} />}
                </div>
                <div className={cn("min-w-0", m.chart ? "max-w-[96%]" : "max-w-[85%]")}>
                  <div className={cn(
                    "rounded-sm px-2.5 py-2 text-[11px] leading-relaxed whitespace-pre-line",
                    m.role === "assistant" ? "bg-muted/40 border border-border text-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    <FormattedText text={m.content} />
                  </div>
                  {m.chart && m.data && <KpiChatChart spec={m.chart} data={m.data} />}
                  {m.role === "assistant" && m.id !== "m0" && (
                    <button
                      onClick={() => (m.savedId ? unpin(m.savedId, m.id) : pin(m))}
                      className={cn(
                        "mt-1 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold transition-colors",
                        m.savedId ? "text-primary" : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      {m.savedId ? <><PinOff size={9} /> Pinned</> : <><Pin size={9} /> Pin this</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <Loader2 size={12} className="animate-spin" />
                </div>
                <div className="text-[10px] text-muted-foreground italic py-1.5">{stageLabel}</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="px-3 pb-3 pt-2 border-t border-border shrink-0">
            <div className="flex items-center gap-1.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                placeholder="Ask about any KPI…"
                disabled={sending}
                className="flex-1 border border-border rounded-sm px-2.5 py-2 text-[11px] focus:outline-none focus:border-primary disabled:opacity-60"
              />
              <button
                onClick={() => send(input)}
                disabled={sending}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-60"
              >
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
          </div>
    </div>
  );
}
