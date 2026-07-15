import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { CONNECTOR_CATALOG, type Connector } from "@/data/connectors-data";
import { BU_LIST } from "@/data/enterprise-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Cable, Check } from "lucide-react";

export default function Connectors() {
  const [items, setItems] = useState<Connector[]>(CONNECTOR_CATALOG);
  const { toast } = useToast();

  const toggle = (id: string) => {
    setItems((prev) => prev.map((c) => c.id === id ? { ...c, connected: !c.connected, lastSync: !c.connected ? "just now" : "—" } : c));
    const c = items.find((c) => c.id === id);
    if (c) toast({ title: c.connected ? "Disconnected" : "Connected", description: `${c.name} is now ${c.connected ? "disconnected" : "connected"}.` });
  };

  const connected = items.filter((c) => c.connected);
  const available = items.filter((c) => !c.connected);

  const Section = ({ title, list }: { title: string; list: Connector[] }) => (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{title} ({list.length})</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((c) => (
          <div key={c.id} className="bg-white border border-border rounded-sm shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Cable size={14} className="text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.category} · {c.protocol}</div>
                </div>
              </div>
              <span className={cn("text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border shrink-0",
                c.connected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200")}>
                {c.connected ? "Connected" : "Available"}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mb-3">
              Serves {BU_LIST.find((b: any) => b.id === c.buId)?.name ?? c.buId} · last sync {c.lastSync}
            </div>
            <button
              onClick={() => toggle(c.id)}
              className={cn("w-full text-[10px] uppercase tracking-widest font-bold py-1.5 rounded-sm border transition-colors flex items-center justify-center gap-1",
                c.connected ? "text-destructive border-red-200 hover:bg-red-50" : "text-primary border-primary/30 hover:bg-primary/5")}
            >
              {c.connected ? "Disconnect" : <><Check size={11} /> Connect</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="CONNECTORS" metrics={[{ label: "CONNECTED", value: connected.length }, { label: "AVAILABLE", value: available.length }]} />
      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
        <Section title="Connected" list={connected} />
        <Section title="Available" list={available} />
      </div>
    </div>
  );
}
