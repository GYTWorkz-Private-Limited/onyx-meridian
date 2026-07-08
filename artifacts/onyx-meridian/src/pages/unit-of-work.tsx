import { useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { BU_LIST } from "@/data/enterprise-data";
import { UNIT_OF_WORK_CATALOG, effectivenessFor, type UnitOfWork } from "@/data/unit-of-work-data";
import { Boxes, X, Lock, ShieldCheck, Workflow, Users } from "lucide-react";

const METHOD_CLS: Record<string, string> = {
  GET: "bg-blue-50 text-blue-700 border-blue-200",
  POST: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PATCH: "bg-amber-50 text-amber-700 border-amber-200",
  PUT: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
};

function DetailModal({ uow, onClose }: { uow: UnitOfWork; onClose: () => void }) {
  const eff = effectivenessFor(uow);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-border rounded-sm shadow-xl w-[620px] max-h-[85vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Boxes size={15} className="text-primary" /> {uow.name}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">{uow.description}</p>

        <div className="border border-border rounded-sm p-3 mb-3">
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-1"><Workflow size={11} /> Used in Workflows</div>
          {uow.usedInWorkflows.length === 0
            ? <div className="text-xs text-muted-foreground">Not yet composed into a named workflow.</div>
            : <div className="flex flex-wrap gap-1.5">{uow.usedInWorkflows.map(w => <span key={w} className="text-[10px] px-2 py-0.5 rounded-sm bg-muted border border-border text-foreground">{w}</span>)}</div>}
        </div>

        <div className="border border-border rounded-sm p-3 mb-3">
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Endpoint</div>
          <div className="flex items-center gap-2">
            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border", METHOD_CLS[uow.endpoint.method])}>{uow.endpoint.method}</span>
            <span className="text-xs font-mono text-foreground">{uow.endpoint.baseUrl}{uow.endpoint.path}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Calls are proxied through the Meridian Proxy — the agent never sees the raw credential.</p>
        </div>

        <div className="border border-border rounded-sm p-3 mb-3">
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-1"><ShieldCheck size={11} /> Security</div>
          <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border", uow.authMode === "proxy-delegated" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200")}>
            {uow.authMode}
          </span>
          {uow.secret && (
            <div className="mt-2 flex items-center gap-2 bg-muted/40 border border-border rounded-sm px-2 py-1.5">
              <Lock size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[10px] font-mono text-muted-foreground">{uow.secret}</span>
            </div>
          )}
        </div>

        <div className="border border-border rounded-sm p-3 mb-3">
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-1"><Users size={11} /> Accountability (RACI)</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Responsible", hint: "Does the work", value: uow.raci.responsible },
              { label: "Accountable", hint: "Owns the outcome", value: uow.raci.accountable },
              { label: "Consulted", hint: "Advises before", value: uow.raci.consulted },
              { label: "Informed", hint: "Notified after", value: uow.raci.informed },
            ].map(cell => (
              <div key={cell.label} className="bg-muted/30 rounded-sm px-2 py-1.5">
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{cell.label}</div>
                <div className="text-[9px] text-muted-foreground/70">{cell.hint}</div>
                <div className="text-xs font-medium text-foreground mt-0.5">{cell.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-sm p-3">
          <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Effectiveness Mapping</div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Time / run</div><div className="text-xs font-mono font-semibold text-foreground">{uow.mapping.manualMinutes}m → {uow.mapping.automatedMinutes}m</div></div>
            <div><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Cost / run</div><div className="text-xs font-mono font-semibold text-foreground">${uow.mapping.manualCostUsd} → ${uow.mapping.automatedCostUsd}</div></div>
            <div><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Volume</div><div className="text-xs font-mono font-semibold text-foreground">{uow.mapping.runsPerMonth}/mo</div></div>
            <div><div className="text-[9px] uppercase tracking-widest text-muted-foreground">Faster by</div><div className="text-xs font-mono font-semibold text-emerald-600">{eff.pctFaster}%</div></div>
          </div>
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-sm px-3 py-2">
            <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">Projected Annual ROI</span>
            <span className="text-sm font-bold font-mono text-emerald-700">${Math.round(eff.costSavedPerMonth * 12).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnitOfWork() {
  const [detail, setDetail] = useState<UnitOfWork | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-auto">
      <HeaderBar moduleName="UNIT OF WORK" metrics={[{ label: "CATALOGED", value: UNIT_OF_WORK_CATALOG.length }]} />

      <div className="p-6 max-w-[1400px] mx-auto w-full space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-sm px-4 py-2.5 text-xs text-blue-800">
          Every Unit of Work runs through the Meridian Proxy. The endpoint stores only a reference to a secret in the Governance vault — no raw credential ever reaches the browser.
        </div>

        <div className="bg-white border border-border rounded-sm shadow-sm">
          <Accordion type="multiple" defaultValue={BU_LIST.map((b: any) => b.id)} className="px-4">
            {BU_LIST.map((bu: any) => {
              const items = UNIT_OF_WORK_CATALOG.filter((u) => u.buId === bu.id);
              if (items.length === 0) return null;
              return (
                <AccordionItem key={bu.id} value={bu.id}>
                  <AccordionTrigger>
                    <span className="text-xs font-semibold text-foreground">{bu.name}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{items.length} units</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border">
                          <th className="text-left font-medium py-1.5">Unit of Work</th>
                          <th className="text-left font-medium py-1.5">Endpoint</th>
                          <th className="text-left font-medium py-1.5">Security</th>
                          <th className="text-left font-medium py-1.5">Accountable</th>
                          <th className="text-left font-medium py-1.5">Manual → Auto</th>
                          <th className="py-1.5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {items.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => setDetail(u)}>
                            <td className="py-2 pr-2">
                              <div className="font-semibold text-foreground">{u.name}</div>
                              <div className="text-[10px] text-muted-foreground">{u.description}</div>
                            </td>
                            <td className="py-2 pr-2">
                              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded-sm border border-border/60">{u.endpoint.method} {u.endpoint.path}</span>
                            </td>
                            <td className="py-2 pr-2">
                              <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm border", u.authMode === "proxy-delegated" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200")}>
                                {u.authMode === "proxy-delegated" ? "Proxy" : "Vault"}
                              </span>
                            </td>
                            <td className="py-2 pr-2 text-foreground">{u.raci.accountable}</td>
                            <td className="py-2 pr-2 font-mono text-[10px] text-foreground">{u.mapping.manualMinutes}m → {u.mapping.automatedMinutes}m</td>
                            <td className="py-2 text-right">
                              <button className="text-[9px] uppercase tracking-widest font-bold text-primary">Details →</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>

      {detail && <DetailModal uow={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
