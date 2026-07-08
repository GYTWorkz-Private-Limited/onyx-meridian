import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { cn } from "@/lib/utils";
import { ChevronRight, Plug, Plus, CheckCircle2, AlertTriangle, Clock, Settings, RefreshCw } from "lucide-react";

const CONNECTORS = [
  {
    id: "c1", name: "SAP ERP", category: "ERP", icon: "🏭", status: "connected",
    description: "Enterprise Resource Planning — production orders, cost centers, materials",
    agents: ["Production Planner", "Finance Analyst", "Inventory Optimizer"],
    lastSync: "2 min ago", events: 1284, latency: "420ms",
  },
  {
    id: "c2", name: "Siemens MES", category: "MES", icon: "⚙️", status: "connected",
    description: "Manufacturing Execution System — production data, work orders, line status",
    agents: ["Production Planner", "OEE Optimizer", "Quality Inspector"],
    lastSync: "30 sec ago", events: 4821, latency: "180ms",
  },
  {
    id: "c3", name: "SCADA Platform", category: "SCADA", icon: "📡", status: "connected",
    description: "Supervisory Control & Data Acquisition — real-time sensor telemetry",
    agents: ["OEE Optimizer", "Predictive Maintenance"],
    lastSync: "5 sec ago", events: 28400, latency: "42ms",
  },
  {
    id: "c4", name: "IBM Maximo (CMMS)", category: "CMMS", icon: "🔧", status: "connected",
    description: "Computerized Maintenance Management System — work orders, assets, PM schedules",
    agents: ["Predictive Maintenance", "Asset Inspector"],
    lastSync: "1 min ago", events: 842, latency: "310ms",
  },
  {
    id: "c5", name: "IoT Sensor Platform", category: "IoT", icon: "🌐", status: "connected",
    description: "Industrial IoT — vibration, temperature, acoustic, pressure sensors",
    agents: ["Predictive Maintenance", "OEE Optimizer"],
    lastSync: "Real-time", events: 142000, latency: "18ms",
  },
  {
    id: "c6", name: "Oracle WMS", category: "WMS", icon: "📦", status: "warning",
    description: "Warehouse Management System — inventory, locations, pick/pack/ship",
    agents: ["Inventory Optimizer"],
    lastSync: "18 min ago", events: 482, latency: "840ms",
  },
  {
    id: "c7", name: "Siemens PLM (Teamcenter)", category: "PLM", icon: "📐", status: "connected",
    description: "Product Lifecycle Management — BOMs, ECOs, engineering specs",
    agents: ["Process Engineer", "PLM Agent"],
    lastSync: "4 min ago", events: 284, latency: "520ms",
  },
  {
    id: "c8", name: "Vision Inspection System", category: "Vision AI", icon: "👁️", status: "connected",
    description: "Camera-based defect detection — real-time image classification and defect scoring",
    agents: ["Quality Inspector"],
    lastSync: "12 sec ago", events: 8420, latency: "62ms",
  },
  {
    id: "c9", name: "Supplier Risk API", category: "External", icon: "⚠️", status: "disconnected",
    description: "Third-party supplier risk intelligence — financial stability, ESG scores, risk signals",
    agents: ["Supplier Risk Agent"],
    lastSync: "Never", events: 0, latency: "—",
  },
];

const STATUS_STYLE = {
  connected: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Connected" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Warning" },
  disconnected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Disconnected" },
};

export default function ConnectorHub() {
  const [filter, setFilter] = useState("all");
  const categories = ["all", ...Array.from(new Set(CONNECTORS.map((c) => c.category)))];

  const filtered = CONNECTORS.filter((c) => filter === "all" || c.category === filter);

  const stats = {
    connected: CONNECTORS.filter((c) => c.status === "connected").length,
    warning: CONNECTORS.filter((c) => c.status === "warning").length,
    disconnected: CONNECTORS.filter((c) => c.status === "disconnected").length,
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar moduleName="CONNECTOR HUB" />

      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Build</span>
          <ChevronRight size={10} />
          <span className="text-foreground font-semibold">Connector Hub</span>
        </div>
        <button className="flex items-center gap-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-primary/90 transition-colors">
          <Plus size={11} />
          Add Connector
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Connected", value: stats.connected, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
            { label: "Warning", value: stats.warning, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
            { label: "Disconnected", value: stats.disconnected, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          ].map((m) => (
            <div key={m.label} className={cn("border rounded-sm px-4 py-3", m.bg)}>
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
              <div className={cn("text-2xl font-bold font-mono", m.color)}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "text-[9px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm border transition-colors",
                filter === cat ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {cat === "all" ? "All Systems" : cat}
            </button>
          ))}
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((connector) => {
            const style = STATUS_STYLE[connector.status as keyof typeof STATUS_STYLE];
            return (
              <div key={connector.id} className="bg-white border border-border rounded-sm p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{connector.icon}</span>
                    <div>
                      <div className="text-[11px] font-bold text-foreground">{connector.name}</div>
                      <div className="text-[9px] text-muted-foreground">{connector.category}</div>
                    </div>
                  </div>
                  <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[8px] font-bold uppercase tracking-widest", style.bg, style.text, style.border)}>
                    <span className={cn("w-1 h-1 rounded-full shrink-0", style.dot)} />
                    {style.label}
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground mb-3 leading-relaxed">{connector.description}</div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-muted/30 rounded-sm px-2 py-1.5">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Last Sync</div>
                    <div className="text-[9px] font-semibold text-foreground">{connector.lastSync}</div>
                  </div>
                  <div className="bg-muted/30 rounded-sm px-2 py-1.5">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Events/Day</div>
                    <div className="text-[9px] font-mono font-semibold text-foreground">{connector.events.toLocaleString()}</div>
                  </div>
                  <div className="bg-muted/30 rounded-sm px-2 py-1.5">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">Latency</div>
                    <div className="text-[9px] font-mono font-semibold text-foreground">{connector.latency}</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">Used By Agents</div>
                  <div className="flex flex-wrap gap-1">
                    {connector.agents.map((a) => (
                      <span key={a} className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-semibold">{a}</span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold border border-border px-2.5 py-1.5 rounded-sm hover:bg-muted/60 transition-colors">
                    <RefreshCw size={9} />Sync
                  </button>
                  <button className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold border border-border px-2.5 py-1.5 rounded-sm hover:bg-muted/60 transition-colors">
                    <Settings size={9} />Configure
                  </button>
                  {connector.status === "disconnected" && (
                    <button className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold bg-primary text-white px-2.5 py-1.5 rounded-sm hover:bg-primary/90 transition-colors ml-auto">
                      <Plug size={9} />Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
