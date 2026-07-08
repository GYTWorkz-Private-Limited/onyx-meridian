import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Search, X, Download, Settings2, RefreshCw, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Play, Pause, ChevronsLeft, ChevronsRight,
  Filter, Clock, Database, Terminal, GitBranch, Layers, Shield,
  AlertCircle, CheckCircle2, XCircle, AlertTriangle, Info,
  Cpu, MemoryStick, Zap, DollarSign, BookOpen, Wrench, Network,
  ArrowUpRight, Copy, ExternalLink,
} from "lucide-react";
import {
  ALL_LOGS, buildTrace, type AgentLog, type Severity, type LogResult,
} from "@/data/agent-logs-data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────
const PAGE_SIZES = [25, 50, 100];
const MODULES = ["All Modules", "Execution", "Knowledge", "Memory", "Policy", "Tool", "Security", "Deployment", "Inference"];
const TIME_RANGES = ["Today", "Last 1h", "Last 4h", "Last 24h", "Last 7d", "Custom"];
const PRESETS = [
  { label: "High-Severity Errors", filter: (l: AgentLog) => l.severity === "ERR" },
  { label: "Slow Requests >3s",    filter: (l: AgentLog) => l.latencyMs > 3000 },
  { label: "Security Events",      filter: (l: AgentLog) => l.module === "Security" || l.module === "Policy" },
];

const SEV_COLORS: Record<Severity, string> = {
  ERR: "bg-red-100 text-red-700 border border-red-200",
  WAR: "bg-amber-100 text-amber-700 border border-amber-200",
  INF: "bg-blue-100 text-blue-700 border border-blue-200",
  DEB: "bg-gray-100 text-gray-600 border border-gray-200",
};
const RESULT_COLORS: Record<LogResult, string> = {
  Success:  "text-emerald-600",
  Timeout:  "text-red-500",
  Escalated:"text-orange-500",
  Blocked:  "text-red-600",
  Failed:   "text-red-600",
  Retried:  "text-amber-500",
};
const LATENCY_COLOR = (ms: number) =>
  ms > 10000 ? "text-red-600 font-bold" : ms > 3000 ? "text-amber-500" : "text-emerald-600";

function fmtLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
function fmtCost(usd: number): string {
  return usd < 0.001 ? `$${(usd * 1000).toFixed(3)}m` : `$${usd.toFixed(4)}`;
}

// ─── Column defs ─────────────────────────────────────────────────────────
const ALL_COLS = [
  { key: "timestamp",     label: "Timestamp",    width: 80,  show: true  },
  { key: "severity",      label: "Sev",          width: 46,  show: true  },
  { key: "module",        label: "Module",       width: 88,  show: true  },
  { key: "agent",         label: "Agent",        width: 160, show: true  },
  { key: "agentId",       label: "ID",           width: 76,  show: true  },
  { key: "action",        label: "Action",       width: 148, show: true  },
  { key: "resource",      label: "Resource",     width: 120, show: true  },
  { key: "result",        label: "Result",       width: 96,  show: true  },
  { key: "latencyMs",     label: "Latency",      width: 80,  show: true  },
  { key: "tokensTotal",   label: "Tokens",       width: 68,  show: true  },
  { key: "statusCode",    label: "Code",         width: 52,  show: true  },
  { key: "error",         label: "Error",        width: 160, show: true  },
  { key: "abu",           label: "ABU",          width: 140, show: false },
  { key: "department",    label: "Dept",         width: 80,  show: false },
  { key: "model",         label: "Model",        width: 100, show: false },
  { key: "costUsd",       label: "Cost",         width: 72,  show: false },
  { key: "queueTimeMs",   label: "Queue",        width: 72,  show: false },
  { key: "executionTimeMs",label: "Exec",        width: 72,  show: false },
  { key: "mcpServer",     label: "MCP",          width: 120, show: false },
  { key: "region",        label: "Region",       width: 96,  show: false },
  { key: "retryCount",    label: "Retries",      width: 60,  show: false },
  { key: "environment",   label: "Env",          width: 72,  show: false },
  { key: "user",          label: "User",         width: 140, show: false },
];

// ─── Sort helper ──────────────────────────────────────────────────────────
function sortLogs(logs: AgentLog[], key: keyof AgentLog, dir: "asc" | "desc"): AgentLog[] {
  return [...logs].sort((a, b) => {
    const av = a[key], bv = b[key];
    const cmp = typeof av === "number" ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function AgentLogs() {
  const [, navigate]    = useLocation();

  // Filters
  const [search,        setSearch]        = useState("");
  const [sevFilter,     setSevFilter]     = useState<Set<Severity>>(new Set());
  const [moduleFilter,  setModuleFilter]  = useState("All Modules");
  const [timeRange,     setTimeRange]     = useState("Today");
  const [activePreset,  setActivePreset]  = useState<number | null>(null);

  // Table
  const [sortKey,       setSortKey]       = useState<keyof AgentLog>("timestamp");
  const [sortDir,       setSortDir]       = useState<"asc" | "desc">("desc");
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(50);
  const [cols,          setCols]          = useState(ALL_COLS);
  const [showColPicker, setShowColPicker] = useState(false);

  // Auto-refresh
  const [autoRefresh,   setAutoRefresh]   = useState(false);
  const [refreshCount,  setRefreshCount]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detail drawer
  const [selectedLog,   setSelectedLog]   = useState<AgentLog | null>(null);
  const [traceTab,      setTraceTab]      = useState("timeline");

  // Export feedback
  const [exportMsg,     setExportMsg]     = useState("");

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => setRefreshCount((n) => n + 1), 5000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSelectedLog(null); setShowColPicker(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") { e.preventDefault(); document.getElementById("log-search")?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleSev = (s: Severity) => {
    setSevFilter((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
    setPage(1);
  };

  const filtered = useMemo(() => {
    let logs = ALL_LOGS;
    if (activePreset !== null) logs = logs.filter(PRESETS[activePreset].filter);
    if (sevFilter.size > 0) logs = logs.filter((l) => sevFilter.has(l.severity));
    if (moduleFilter !== "All Modules") logs = logs.filter((l) => l.module === moduleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter((l) =>
        l.agent.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        l.resource.toLowerCase().includes(q) ||
        l.error.toLowerCase().includes(q) ||
        l.agentId.toLowerCase().includes(q) ||
        l.abu.toLowerCase().includes(q) ||
        l.mcpServer.toLowerCase().includes(q) ||
        l.traceId.toLowerCase().includes(q)
      );
    }
    return sortLogs(logs, sortKey, sortDir);
  }, [search, sevFilter, moduleFilter, activePreset, sortKey, sortDir, refreshCount]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData   = filtered.slice((page - 1) * pageSize, page * pageSize);

  const errCount    = filtered.filter((l) => l.severity === "ERR").length;
  const avgLatency  = Math.round(filtered.reduce((s, l) => s + l.latencyMs, 0) / Math.max(1, filtered.length));

  const visibleCols = cols.filter((c) => c.show);

  const handleSort = (key: keyof AgentLog) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const exportCSV = useCallback(() => {
    const headers = visibleCols.map((c) => c.label).join(",");
    const rows = filtered.map((l) =>
      visibleCols.map((c) => {
        const v = l[c.key as keyof AgentLog];
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(",")
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `agent-logs-${Date.now()}.csv`; a.click();
    setExportMsg("CSV exported"); setTimeout(() => setExportMsg(""), 2000);
  }, [filtered, visibleCols]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `agent-logs-${Date.now()}.json`; a.click();
    setExportMsg("JSON exported"); setTimeout(() => setExportMsg(""), 2000);
  }, [filtered]);

  const selectedTrace = selectedLog ? buildTrace(selectedLog) : null;

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="AGENT LOGS"
        engineBadge="DEEPSIGHTS ENGINE V3.2"
        metrics={[
          { label: "TOTAL",    value: filtered.length },
          { label: "ERRORS",   value: errCount },
          { label: "AVG LAT",  value: `${avgLatency}ms` },
          { label: "RANGE",    value: timeRange },
        ]}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Main log panel ── */}
        <div className={cn("flex flex-col flex-1 min-w-0 overflow-hidden transition-all", selectedLog ? "w-[55%]" : "w-full")}>

          {/* ── Toolbar ── */}
          <div className="bg-white border-b border-border px-4 py-2.5 flex flex-col gap-2 shrink-0">
            {/* Search + severity + module + time */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-[520px]">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="log-search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder='Search logs… (e.g. "timeout", "agent:Finance", "tool:SAP")'
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={11} />
                  </button>
                )}
              </div>
              {/* Severity buttons */}
              {(["ERR", "WAR", "INF", "DEB"] as Severity[]).map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSev(s)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm border transition-colors",
                    sevFilter.has(s)
                      ? s === "ERR" ? "bg-red-600 text-white border-red-600"
                        : s === "WAR" ? "bg-amber-500 text-white border-amber-500"
                        : s === "INF" ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-600 text-white border-gray-600"
                      : s === "ERR" ? "text-red-600 border-red-200 hover:bg-red-50"
                        : s === "WAR" ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                        : s === "INF" ? "text-blue-600 border-blue-200 hover:bg-blue-50"
                        : "text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {s === "ERR" ? "ERROR" : s === "WAR" ? "WARNING" : s === "INF" ? "INFO" : "DEBUG"}
                </button>
              ))}
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {TIME_RANGES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {/* Action icons */}
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={exportCSV} title="Export CSV" className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Download size={14} />
                </button>
                <button onClick={exportJSON} title="Export JSON" className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                  <Terminal size={14} />
                </button>
                <button onClick={() => setShowColPicker((v) => !v)} title="Columns" className={cn("p-1.5 rounded-sm hover:bg-muted transition-colors", showColPicker ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Settings2 size={14} />
                </button>
              </div>
              {exportMsg && (
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{exportMsg}</span>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold shrink-0">PRESETS:</span>
              {PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  onClick={() => { setActivePreset(activePreset === i ? null : i); setPage(1); }}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors",
                    activePreset === i
                      ? "bg-primary/10 text-primary border-primary/30 font-bold"
                      : "bg-white text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <span className="text-[8px]">☰</span> {p.label}
                </button>
              ))}
              {(search || sevFilter.size > 0 || moduleFilter !== "All Modules" || activePreset !== null) && (
                <button
                  onClick={() => { setSearch(""); setSevFilter(new Set()); setModuleFilter("All Modules"); setActivePreset(null); setPage(1); }}
                  className="ml-auto text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X size={10} /> Clear all filters
                </button>
              )}
            </div>

            {/* Stats + auto-refresh */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>Total: <b className="text-foreground">{filtered.length} logs</b></span>
              <span>Errors: <b className="text-red-600">{errCount}</b></span>
              <span>Avg Latency: <b className="text-foreground">{avgLatency.toLocaleString()}ms</b></span>
              <span>Range: <b className="text-foreground">{timeRange}</b></span>
              <div className="ml-auto flex items-center gap-2">
                <span>Auto-refresh</span>
                <button
                  onClick={() => setAutoRefresh((v) => !v)}
                  className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    autoRefresh ? "bg-emerald-500" : "bg-muted"
                  )}
                >
                  <span className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all", autoRefresh ? "left-4" : "left-0.5")} />
                </button>
                <span className="text-muted-foreground">{autoRefresh ? "ON" : "OFF"}</span>
              </div>
            </div>
          </div>

          {/* ── Column Picker ── */}
          {showColPicker && (
            <div className="bg-white border-b border-border px-4 py-2 flex flex-wrap gap-2 shrink-0">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold self-center shrink-0">COLUMNS:</span>
              {cols.map((col) => (
                <button
                  key={col.key}
                  onClick={() => setCols((prev) => prev.map((c) => c.key === col.key ? { ...c, show: !c.show } : c))}
                  className={cn(
                    "text-[9px] px-2 py-0.5 rounded-sm border transition-colors",
                    col.show ? "bg-primary/10 text-primary border-primary/20 font-bold" : "text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {col.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Table ── */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[10px] border-collapse min-w-max">
              <thead className="sticky top-0 bg-[#F8F9FA] border-b border-border z-10">
                <tr>
                  {visibleCols.map((col) => (
                    <th
                      key={col.key}
                      style={{ minWidth: col.width, width: col.width }}
                      className="px-3 py-2 text-left font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.key as keyof AgentLog)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key
                          ? sortDir === "asc" ? <ChevronUp size={9} /> : <ChevronDown size={9} />
                          : <span className="opacity-0 group-hover:opacity-30 w-[9px]" />
                        }
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pageData.map((log, ri) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    className={cn(
                      "cursor-pointer hover:bg-primary/5 transition-colors",
                      selectedLog?.id === log.id && "bg-primary/10",
                      ri % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                    )}
                  >
                    {visibleCols.map((col) => (
                      <td key={col.key} className="px-3 py-1.5 whitespace-nowrap" style={{ maxWidth: col.width }}>
                        {col.key === "timestamp" && (
                          <span className="font-mono text-muted-foreground">{log.timestamp}</span>
                        )}
                        {col.key === "severity" && (
                          <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest", SEV_COLORS[log.severity])}>
                            {log.severity}
                          </span>
                        )}
                        {col.key === "module" && (
                          <span className="text-foreground font-medium">{log.module}</span>
                        )}
                        {col.key === "agent" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/agents/${log.agentId}`); }}
                            className="text-violet-600 hover:text-violet-800 hover:underline font-medium truncate max-w-[150px] block text-left"
                          >
                            {log.agent}
                          </button>
                        )}
                        {col.key === "agentId" && (
                          <span className="font-mono text-muted-foreground">{log.agentId}</span>
                        )}
                        {col.key === "action" && (
                          <span className="text-foreground">{log.action}</span>
                        )}
                        {col.key === "resource" && (
                          <span className="text-muted-foreground">{log.resource}</span>
                        )}
                        {col.key === "result" && (
                          <span className={cn("flex items-center gap-1 font-medium", RESULT_COLORS[log.result])}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                            {log.result}
                          </span>
                        )}
                        {col.key === "latencyMs" && (
                          <span className={cn("font-mono", LATENCY_COLOR(log.latencyMs))}>
                            {fmtLatency(log.latencyMs)}
                          </span>
                        )}
                        {col.key === "tokensTotal" && (
                          <span className="font-mono text-foreground">{log.tokensTotal.toLocaleString()}</span>
                        )}
                        {col.key === "statusCode" && (
                          <span className={cn("font-mono font-bold", log.statusCode === 200 ? "text-emerald-600" : log.statusCode >= 500 ? "text-red-600" : "text-amber-500")}>
                            {log.statusCode}
                          </span>
                        )}
                        {col.key === "error" && (
                          <span className={cn("truncate max-w-[150px] block", log.error === "—" ? "text-muted-foreground" : "text-red-600")}>
                            {log.error}
                          </span>
                        )}
                        {col.key === "abu" && <span className="text-muted-foreground truncate block max-w-[130px]">{log.abu}</span>}
                        {col.key === "department" && <span className="text-muted-foreground">{log.department}</span>}
                        {col.key === "model" && <span className="text-muted-foreground">{log.model}</span>}
                        {col.key === "costUsd" && <span className="font-mono text-foreground">{fmtCost(log.costUsd)}</span>}
                        {col.key === "queueTimeMs" && <span className="font-mono text-muted-foreground">{log.queueTimeMs}ms</span>}
                        {col.key === "executionTimeMs" && <span className="font-mono text-muted-foreground">{log.executionTimeMs}ms</span>}
                        {col.key === "mcpServer" && <span className="text-muted-foreground truncate block max-w-[110px]">{log.mcpServer}</span>}
                        {col.key === "region" && <span className="font-mono text-muted-foreground">{log.region}</span>}
                        {col.key === "retryCount" && <span className={cn("font-mono", log.retryCount > 0 ? "text-amber-600 font-bold" : "text-muted-foreground")}>{log.retryCount}</span>}
                        {col.key === "environment" && <span className="text-muted-foreground">{log.environment}</span>}
                        {col.key === "user" && <span className="text-muted-foreground truncate block max-w-[130px]">{log.user}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={visibleCols.length} className="text-center py-12 text-muted-foreground text-xs">
                      No logs match current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="bg-white border-t border-border px-4 py-2 flex items-center gap-3 shrink-0 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Show</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="border border-border rounded-sm px-1.5 py-0.5 focus:outline-none bg-white text-[10px]"
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-muted-foreground">/ page</span>
            </div>
            <span className="text-muted-foreground ml-2">
              {filtered.length === 0 ? "0 results" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} logs`}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded-sm hover:bg-muted disabled:opacity-30 transition-colors"><ChevronsLeft size={12} /></button>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-sm hover:bg-muted disabled:opacity-30 transition-colors"><ChevronLeft size={12} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn("w-6 h-6 rounded-sm text-[10px] transition-colors", p === page ? "bg-primary text-white" : "hover:bg-muted text-muted-foreground")}
                  >
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-sm hover:bg-muted disabled:opacity-30 transition-colors"><ChevronRight size={12} /></button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1 rounded-sm hover:bg-muted disabled:opacity-30 transition-colors"><ChevronsRight size={12} /></button>
            </div>
          </div>
        </div>

        {/* ── Execution Trace Drawer ── */}
        {selectedLog && selectedTrace && (
          <div className="w-[45%] min-w-[560px] border-l border-border bg-white flex flex-col overflow-hidden shrink-0">
            <TraceDrawer
              trace={selectedTrace}
              tab={traceTab}
              onTabChange={setTraceTab}
              onClose={() => setSelectedLog(null)}
              navigate={navigate}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Execution Trace Drawer ────────────────────────────────────────────────
function TraceDrawer({
  trace, tab, onTabChange, onClose, navigate,
}: {
  trace: ReturnType<typeof buildTrace>;
  tab: string;
  onTabChange: (t: string) => void;
  onClose: () => void;
  navigate: (path: string) => void;
}) {
  const { log } = trace;

  const TABS = [
    { id: "timeline",  label: "Timeline",  icon: Clock },
    { id: "reasoning", label: "Reasoning", icon: Cpu },
    { id: "prompt",    label: "Prompt",    icon: Terminal },
    { id: "memory",    label: "Memory",    icon: MemoryStick },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
    { id: "tools",     label: "Tools",     icon: Wrench },
    { id: "policy",    label: "Policy",    icon: Shield },
    { id: "metrics",   label: "Metrics",   icon: Zap },
  ];

  return (
    <>
      {/* Drawer Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase", SEV_COLORS[log.severity])}>{log.severity}</span>
              <span className={cn("text-[10px] font-bold flex items-center gap-1", RESULT_COLORS[log.result])}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" /> {log.result}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">{log.timestamp}</span>
            </div>
            <div className="text-xs font-bold text-foreground">{log.agent}</div>
            <div className="text-[10px] text-muted-foreground">{log.abu} · {log.department} · {log.action}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted transition-colors text-muted-foreground">
            <X size={14} />
          </button>
        </div>

        {/* Key metrics strip */}
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[
            { label: "Latency",  value: fmtLatency(log.latencyMs),     color: LATENCY_COLOR(log.latencyMs) },
            { label: "Tokens",   value: log.tokensTotal.toLocaleString(), color: "text-foreground" },
            { label: "Cost",     value: fmtCost(log.costUsd),           color: "text-foreground" },
            { label: "Retries",  value: String(log.retryCount),         color: log.retryCount > 0 ? "text-amber-500" : "text-emerald-600" },
          ].map((m) => (
            <div key={m.label} className="bg-muted/40 rounded-sm px-2 py-1 text-center border border-border/40">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
              <div className={cn("text-xs font-bold font-mono", m.color)}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Trace + session IDs */}
        <div className="flex items-center gap-3 mt-1.5 text-[9px]">
          <span className="text-muted-foreground">Trace: <span className="font-mono text-foreground">{log.traceId}</span></span>
          <button onClick={() => navigator.clipboard.writeText(log.traceId)} className="text-muted-foreground hover:text-foreground"><Copy size={10} /></button>
          <span className="text-muted-foreground ml-2">Session: <span className="font-mono text-foreground">{log.sessionId}</span></span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border shrink-0 flex overflow-x-auto bg-[#FAFAFA]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors shrink-0",
              tab === id
                ? "border-primary text-primary bg-white"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon size={10} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[10px]">

        {/* ── Timeline ── */}
        {tab === "timeline" && (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Execution Timeline</div>
            {trace.timeline.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    step.status === "ok"    ? "border-emerald-500 bg-emerald-50" :
                    step.status === "warn"  ? "border-amber-400 bg-amber-50" :
                                             "border-red-500 bg-red-50"
                  )}>
                    {step.status === "ok" ? <CheckCircle2 size={8} className="text-emerald-600" /> :
                     step.status === "warn" ? <AlertTriangle size={8} className="text-amber-500" /> :
                     <XCircle size={8} className="text-red-600" />}
                  </div>
                  {i < trace.timeline.length - 1 && (
                    <div className="w-[2px] h-6 bg-border my-0.5" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-[11px]">{step.stage}</span>
                    <span className={cn("font-mono font-bold", step.durationMs > 2000 ? "text-red-600" : step.durationMs > 500 ? "text-amber-500" : "text-emerald-600")}>
                      {step.durationMs}ms
                    </span>
                  </div>
                  <div className="text-muted-foreground text-[9px]">{step.detail}</div>
                  {step.tokens ? (
                    <div className="text-[9px] text-muted-foreground">Tokens: {step.tokens.toLocaleString()}</div>
                  ) : null}
                </div>
              </div>
            ))}

            {/* Latency bar chart */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Latency Breakdown</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={trace.latencyBreakdown} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 72 }}>
                  <XAxis type="number" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
                  <YAxis type="category" dataKey="phase" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={68} />
                  <Tooltip contentStyle={{ fontSize: 9 }} formatter={(v: number) => [`${v}ms`]} />
                  <Bar dataKey="ms" radius={[0, 3, 3, 0]} barSize={8}>
                    {trace.latencyBreakdown.map((d, i) => (
                      <Cell key={i} fill={d.ms > 1000 ? "#ef4444" : d.ms > 200 ? "#f59e0b" : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Reasoning ── */}
        {tab === "reasoning" && (
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Reasoning Chain ({trace.reasoningSteps.length} steps)</div>
            {trace.reasoningSteps.map((step, i) => (
              <div key={i} className="flex gap-2">
                <span className="w-5 h-5 rounded-sm bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 font-mono">{i + 1}</span>
                <p className="text-foreground leading-relaxed text-[10px]">{step}</p>
              </div>
            ))}
            {trace.observations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Observations</div>
                {trace.observations.map((obs, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1.5">
                    <Info size={10} className="text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{obs}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Prompt / Response ── */}
        {tab === "prompt" && (
          <div className="space-y-3">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center justify-between">
                <span>Prompt (v{log.promptVersion})</span>
                <span className="font-mono">{log.tokensIn.toLocaleString()} tokens</span>
              </div>
              <pre className="bg-muted/40 border border-border rounded-sm p-3 text-[9px] font-mono text-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto">{trace.prompt}</pre>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center justify-between">
                <span>Response · {log.model}</span>
                <span className="font-mono">{log.tokensOut.toLocaleString()} tokens</span>
              </div>
              <pre className={cn("border rounded-sm p-3 text-[9px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto",
                log.result === "Success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
              )}>{trace.response}</pre>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Token Breakdown</div>
              {trace.tokenBreakdown.map((t, i) => (
                <div key={i} className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">{t.stage}</span>
                  <div className="flex gap-3 font-mono">
                    <span className="text-blue-600">in: {t.input.toLocaleString()}</span>
                    <span className="text-emerald-600">out: {t.output.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between font-bold border-t border-border pt-1">
                <span>Total Cost</span>
                <span className="font-mono text-foreground">{fmtCost(log.costUsd)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate("/prompt-playground")}
              className="w-full mt-2 flex items-center justify-center gap-1.5 border border-primary/30 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/5 transition-colors"
            >
              Open in Prompt Playground →
            </button>
          </div>
        )}

        {/* ── Memory ── */}
        {tab === "memory" && (
          <div className="space-y-3">
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Memory Reads ({trace.memoryReads.length})</div>
              {trace.memoryReads.map((r, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 bg-blue-50 border border-blue-100 rounded-sm px-2 py-1.5">
                  <ArrowUpRight size={10} className="text-blue-500 mt-0.5 shrink-0" />
                  <span className="font-mono text-blue-800 text-[9px]">{r}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Memory Writes ({trace.memoryWrites.length})</div>
              {trace.memoryWrites.map((w, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 bg-emerald-50 border border-emerald-100 rounded-sm px-2 py-1.5">
                  <ArrowUpRight size={10} className="text-emerald-600 mt-0.5 shrink-0 rotate-90" />
                  <span className="font-mono text-emerald-800 text-[9px]">{w}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/40 rounded-sm px-3 py-2 border border-border/40">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Memory Used</div>
                  <div className="font-bold text-sm font-mono">{log.memoryMb} MB</div>
                </div>
                <div className="bg-muted/40 rounded-sm px-3 py-2 border border-border/40">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Context Size</div>
                  <div className="font-bold text-sm font-mono">{log.contextSize.toLocaleString()} tok</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Knowledge ── */}
        {tab === "knowledge" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Sources",    value: log.knowledgeSources.split(",").length },
                { label: "Docs Found", value: log.docsRetrieved },
                { label: "Hit Rate",   value: "78%" },
              ].map((m) => (
                <div key={m.label} className="bg-muted/40 rounded-sm px-2 py-1.5 border border-border/40 text-center">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.label}</div>
                  <div className="font-bold font-mono text-sm">{m.value}</div>
                </div>
              ))}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Knowledge Sources</div>
            <div className="bg-muted/30 border border-border rounded-sm px-3 py-2 font-mono text-[9px] text-foreground">{log.knowledgeSources}</div>
            {trace.knowledgeChunks.length > 0 && (
              <>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-3 mb-2">Retrieved Chunks</div>
                {trace.knowledgeChunks.map((chunk, i) => (
                  <div key={i} className="bg-violet-50 border border-violet-100 rounded-sm px-3 py-2 text-[9px] text-violet-800 mb-1.5">{chunk}</div>
                ))}
              </>
            )}
            <button
              onClick={() => navigate("/knowledge-studio")}
              className="w-full mt-2 flex items-center justify-center gap-1.5 border border-primary/30 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/5 transition-colors"
            >
              Open Knowledge Studio →
            </button>
          </div>
        )}

        {/* ── Tools / MCP / APIs ── */}
        {tab === "tools" && (
          <div className="space-y-4">
            {trace.toolInvocations.length > 0 && (
              <div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Tool Invocations ({trace.toolInvocations.length})</div>
                {trace.toolInvocations.map((t, i) => (
                  <div key={i} className="border border-border rounded-sm mb-2 overflow-hidden">
                    <div className="bg-muted/40 px-3 py-1.5 flex items-center justify-between">
                      <span className="font-bold text-foreground">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">{t.latencyMs}ms</span>
                        <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm", t.status.startsWith("200") ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>{t.status}</span>
                      </div>
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      <div className="text-[9px] text-muted-foreground">Input: <span className="font-mono text-foreground">{t.input}</span></div>
                      <div className="text-[9px] text-muted-foreground">Output: <span className={cn("font-mono", t.status.startsWith("200") ? "text-emerald-700" : "text-red-600")}>{t.output}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">MCP Communication</div>
              {trace.mcpCalls.map((c, i) => (
                <div key={i} className="flex items-center justify-between border border-border rounded-sm px-3 py-1.5 mb-1">
                  <div>
                    <span className="font-medium text-foreground">{c.server}</span>
                    <span className="text-muted-foreground ml-2 font-mono">{c.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">{c.latencyMs}ms</span>
                    <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm", c.status === "OK" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">API Requests</div>
              {trace.apiRequests.map((r, i) => (
                <div key={i} className="flex items-center justify-between border border-border rounded-sm px-3 py-1.5 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1 py-0.5 rounded-sm">{r.method}</span>
                    <span className="font-mono text-muted-foreground text-[9px]">{r.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">{r.latencyMs}ms</span>
                    <span className={cn("font-mono font-bold", r.statusCode === 200 ? "text-emerald-600" : "text-red-600")}>{r.statusCode}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Policy ── */}
        {tab === "policy" && (
          <div className="space-y-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Policy Evaluations</div>
            {trace.policyEvals.map((p, i) => (
              <div key={i} className={cn("border rounded-sm px-3 py-2", p.result === "BLOCKED" ? "border-red-200 bg-red-50" : p.result === "WARNING" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-foreground">{p.policy}</span>
                  <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm", p.result === "BLOCKED" ? "bg-red-200 text-red-800" : p.result === "WARNING" ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800")}>{p.result}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">{p.detail}</p>
              </div>
            ))}

            {trace.humanApprovals.length > 0 && (
              <>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-3 mb-2">Human Approvals</div>
                {trace.humanApprovals.map((a, i) => (
                  <div key={i} className="border border-amber-200 bg-amber-50 rounded-sm px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground">{a.step}</div>
                      <div className="text-[9px] text-muted-foreground">Approver: {a.approver}</div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-sm">{a.status}</span>
                  </div>
                ))}
              </>
            )}

            {trace.errors.length > 0 && (
              <>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-3 mb-2">Errors &amp; Retries</div>
                {trace.errors.map((e, i) => (
                  <div key={i} className="border border-red-200 bg-red-50 rounded-sm px-3 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-red-700">{e.type}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{e.ts} · retry {e.retry}</span>
                    </div>
                    <p className="text-[9px] text-red-600">{e.message}</p>
                  </div>
                ))}
                <button
                  onClick={() => navigate("/policy-studio")}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 border border-primary/30 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/5 transition-colors"
                >
                  Open Policy Studio →
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Metrics ── */}
        {tab === "metrics" && (
          <div className="space-y-3">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Evaluation Results</div>
            {trace.evalResults.map((e, i) => (
              <div key={i} className="flex items-center gap-3 mb-1">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-foreground font-medium">{e.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">thr: {e.threshold}</span>
                      <span className={cn("font-mono font-bold", e.passed ? "text-emerald-600" : "text-red-600")}>{e.score.toFixed(2)}</span>
                      {e.passed ? <CheckCircle2 size={10} className="text-emerald-500" /> : <XCircle size={10} className="text-red-500" />}
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", e.passed ? "bg-emerald-500" : "bg-red-500")} style={{ width: `${e.score * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Resource Usage</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Memory",      value: `${log.memoryMb} MB` },
                  { label: "Context",     value: `${log.contextSize.toLocaleString()} tok` },
                  { label: "Queue Time",  value: `${log.queueTimeMs}ms` },
                  { label: "Exec Time",   value: `${log.executionTimeMs}ms` },
                  { label: "Tool Calls",  value: String(log.toolCalls) },
                  { label: "Docs Used",   value: String(log.docsRetrieved) },
                ].map((m) => (
                  <div key={m.label} className="bg-muted/40 rounded-sm px-3 py-1.5 border border-border/40 flex items-center justify-between">
                    <span className="text-muted-foreground uppercase tracking-widest text-[9px]">{m.label}</span>
                    <span className="font-mono font-bold">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Related</div>
              <div className="space-y-1">
                {[
                  { label: "Mission",  value: trace.relatedMission,  path: "/agentops" },
                  { label: "Workflow", value: trace.relatedWorkflow,  path: "/workflow-studio" },
                  { label: "Incident", value: trace.relatedIncident,  path: trace.relatedIncident !== "—" ? "/incident/a1" : null },
                  { label: "Agent",    value: log.agent,              path: `/agents/${log.agentId}` },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{r.label}</span>
                    {r.path ? (
                      <button onClick={() => navigate(r.path!)} className="font-medium text-violet-600 hover:underline flex items-center gap-1">
                        {r.value} <ExternalLink size={9} />
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{r.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
