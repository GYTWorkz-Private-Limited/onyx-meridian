import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Persona, Role } from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/rbac";
import {
  type Document, categoryById, personById, agentById, missionById, buName, currentVersion,
  canView, editPermission, canApprove, DOCUMENT_CATEGORIES,
} from "@/data/documents-data";
import {
  X, FileText, Printer, History, Users, Bot, GitBranch, Info, Lock,
  RotateCcw, Pencil, CheckCircle2, XCircle, ShieldAlert, Tag,
} from "lucide-react";

type SubTab = "details" | "ocr" | "versions" | "access" | "usage";

const CLASSIFICATION_CLS: Record<string, string> = {
  public: "bg-emerald-50 text-emerald-700 border-emerald-200",
  internal: "bg-blue-50 text-blue-700 border-blue-200",
  confidential: "bg-amber-50 text-amber-700 border-amber-200",
  restricted: "bg-red-50 text-red-700 border-red-200",
};

export function DocumentViewer({
  doc, persona, onClose, onUpdate,
}: {
  doc: Document;
  persona: Persona;
  onClose: () => void;
  onUpdate: (updated: Document) => void;
}) {
  const { toast } = useToast();
  const [sub, setSub] = useState<SubTab>("details");
  const [editing, setEditing] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  const viewerCtx = { personId: persona.id, role: persona.role, buId: persona.buId, deptId: persona.deptId };
  const cat = categoryById(doc.categoryId);
  const cv = currentVersion(doc);
  const owner = personById(doc.ownerPersonId);
  const perm = editPermission(doc, viewerCtx);
  const mayApprove = canApprove(doc, viewerCtx);

  const submitEdit = () => {
    if (!changeNote.trim()) { toast({ title: "Add a change note first", variant: "destructive" }); return; }
    if (perm.needsApproval) {
      onUpdate({
        ...doc,
        status: "pending-approval",
        pendingChange: {
          id: `pc-${Date.now()}`, submittedByPersonId: persona.id, submittedByRole: persona.role,
          submittedAt: new Date().toISOString().slice(0, 10), changeNote, requiredApproverRole: perm.approverRole ?? "ceo",
        },
      });
      toast({ title: "Change submitted for approval", description: `Waiting on sign-off from a ${ROLE_LABEL[perm.approverRole ?? "ceo"]} with access.` });
    } else {
      onUpdate({
        ...doc,
        versions: [...doc.versions, { version: cv.version + 1, editedByPersonId: persona.id, editedByRole: persona.role, editedAt: new Date().toISOString().slice(0, 10), changeNote }],
      });
      toast({ title: "Document updated", description: `Saved as v${cv.version + 1} — no approval required at your access level.` });
    }
    setEditing(false);
    setChangeNote("");
  };

  const approveChange = () => {
    if (!doc.pendingChange) return;
    onUpdate({
      ...doc,
      status: "approved",
      versions: [...doc.versions, { version: cv.version + 1, editedByPersonId: doc.pendingChange.submittedByPersonId, editedByRole: doc.pendingChange.submittedByRole, editedAt: doc.pendingChange.submittedAt, changeNote: doc.pendingChange.changeNote }],
      pendingChange: undefined,
    });
    toast({ title: "Change approved", description: `Now live as v${cv.version + 1}.` });
  };
  const rejectChange = () => {
    onUpdate({ ...doc, status: "approved", pendingChange: undefined });
    toast({ title: "Change rejected", description: "The document was not modified." });
  };
  const revertTo = (version: number) => {
    const target = doc.versions.find((v) => v.version === version);
    if (!target) return;
    onUpdate({
      ...doc,
      versions: [...doc.versions, { version: cv.version + 1, editedByPersonId: persona.id, editedByRole: persona.role, editedAt: new Date().toISOString().slice(0, 10), changeNote: `Reverted to v${version} (${target.changeNote})` }],
    });
    toast({ title: `Reverted to v${version}`, description: `Recorded as new v${cv.version + 1} to preserve full history.` });
  };

  const printDoc = () => window.print();

  const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
    { id: "details", label: "Details", icon: Info },
    { id: "ocr", label: "OCR Text", icon: FileText },
    { id: "versions", label: `Versions (${doc.versions.length})`, icon: History },
    { id: "access", label: "Access", icon: Users },
    { id: "usage", label: "Missions & Agents", icon: Bot },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-[520px] max-w-full h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border" style={{ color: cat?.color, borderColor: `${cat?.color}55`, background: `${cat?.color}0d` }}>{cat?.name}</span>
              <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", CLASSIFICATION_CLS[doc.metadata.classification])}>{doc.metadata.classification}</span>
              {(doc.visibility === "ceo-only" || doc.visibility === "restricted") && (
                <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border bg-muted text-muted-foreground border-border flex items-center gap-0.5"><Lock size={8} />{doc.visibility}</span>
              )}
              {doc.status === "pending-approval" && (
                <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border bg-amber-50 text-amber-700 border-amber-200">Pending Approval</span>
              )}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <h2 className="text-sm font-bold text-foreground leading-snug">{doc.title}</h2>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">v{cv.version} · {owner?.name ?? doc.ownerRole} · {buName(doc.buId)}</div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-0 px-5 border-b border-border overflow-x-auto">
          {subTabs.map((t) => {
            const Icon = t.icon;
            const active = sub === t.id;
            return (
              <button key={t.id} onClick={() => setSub(t.id)} className={cn(
                "flex items-center gap-1 px-2.5 py-2.5 text-[9px] uppercase tracking-widest font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
                <Icon size={11} />{t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {/* Pending approval banner */}
          {doc.status === "pending-approval" && doc.pendingChange && (
            <div className="border border-amber-200 bg-amber-50 rounded-sm p-3 mb-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ShieldAlert size={12} className="text-amber-600" />
                <span className="text-[9px] uppercase tracking-widest font-bold text-amber-700">Awaiting Approval</span>
              </div>
              <div className="text-[10px] text-foreground leading-snug mb-1">"{doc.pendingChange.changeNote}"</div>
              <div className="text-[9px] text-muted-foreground mb-2">
                Submitted by {personById(doc.pendingChange.submittedByPersonId)?.name ?? doc.pendingChange.submittedByRole} ({ROLE_LABEL[doc.pendingChange.submittedByRole]}) on {doc.pendingChange.submittedAt} — needs a {ROLE_LABEL[doc.pendingChange.requiredApproverRole]} with access to sign off.
              </div>
              {mayApprove && (
                <div className="flex gap-2">
                  <button onClick={approveChange} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"><CheckCircle2 size={10} />Approve</button>
                  <button onClick={rejectChange} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm border border-border bg-white hover:bg-muted/40 transition-colors"><XCircle size={10} />Reject</button>
                </div>
              )}
            </div>
          )}

          {sub === "details" && (
            <div className="space-y-4">
              <div className="border border-primary/20 bg-primary/5 rounded-sm p-3">
                <div className="text-[9px] uppercase tracking-widest font-bold text-primary mb-1.5">Summary</div>
                <p className="text-[11px] text-foreground leading-relaxed">{doc.summary}</p>
              </div>
              <div className="border border-border rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-2"><Tag size={11} className="text-muted-foreground" /><span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Metadata</span></div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Author</span><span className="text-foreground">{doc.metadata.author}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Department</span><span className="text-foreground">{doc.metadata.department}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Effective Date</span><span className="text-foreground">{doc.metadata.effectiveDate}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Next Review</span><span className="text-foreground">{doc.metadata.reviewDate}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">File Type</span><span className="text-foreground">{doc.metadata.fileType} · {doc.metadata.fileSizeKb} KB</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Language</span><span className="text-foreground">{doc.metadata.language}</span></div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-border/60">
                  {doc.tags.map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted border border-border text-foreground">#{t}</span>)}
                </div>
              </div>

              {perm.canEdit && !editing && (
                <button onClick={() => setEditing(true)} className="w-full flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded-sm border border-border bg-white hover:bg-muted/40 transition-colors">
                  <Pencil size={12} /> Propose Edit {perm.needsApproval && `(needs ${ROLE_LABEL[perm.approverRole ?? "ceo"]} approval)`}
                </button>
              )}
              {editing && (
                <div className="border border-border rounded-sm p-3 space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block">Change Note</label>
                  <textarea value={changeNote} onChange={(e) => setChangeNote(e.target.value)} rows={3} placeholder="Describe what changed…"
                    className="w-full border border-border rounded-sm px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-primary" />
                  {perm.needsApproval && (
                    <div className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-2 py-1.5">
                      Your role ({ROLE_LABEL[persona.role]}) is below the document's current access level — this will be submitted to a {ROLE_LABEL[perm.approverRole ?? "ceo"]} for approval, not applied immediately.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={submitEdit} className="flex-1 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-colors">
                      {perm.needsApproval ? "Submit for Approval" : "Save New Version"}
                    </button>
                    <button onClick={() => { setEditing(false); setChangeNote(""); }} className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-sm border border-border bg-white hover:bg-muted/40 transition-colors">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {sub === "ocr" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">OCR-Extracted Text</span>
                <button onClick={printDoc} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/20 rounded-sm px-2 py-1 hover:bg-primary/5 transition-colors">
                  <Printer size={10} /> Print
                </button>
              </div>
              <div id="doc-print-area" className="border border-border rounded-sm p-3.5 bg-muted/20 text-[11px] text-foreground leading-relaxed whitespace-pre-line font-mono max-h-[420px] overflow-y-auto">
                <div className="hidden print:block text-sm font-bold mb-2">{doc.title}</div>
                {doc.ocrText}
              </div>
            </div>
          )}

          {sub === "versions" && (
            <div className="space-y-2">
              {[...doc.versions].reverse().map((v) => (
                <div key={v.version} className={cn("border rounded-sm p-3", v.version === cv.version ? "border-primary/30 bg-primary/5" : "border-border")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-foreground">v{v.version} {v.version === cv.version && <span className="text-primary">(current)</span>}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{v.editedAt}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-1.5">{v.changeNote}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">{personById(v.editedByPersonId)?.name ?? v.editedByRole} · {ROLE_LABEL[v.editedByRole]}</span>
                    {v.version !== cv.version && (
                      <button onClick={() => revertTo(v.version)} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-primary hover:underline">
                        <RotateCcw size={9} /> Revert to this version
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sub === "access" && (
            <div className="space-y-3">
              <div className="border border-border rounded-sm p-3">
                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Owner</div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">{owner?.name ?? doc.ownerRole}</span>
                  <span className="text-[9px] text-muted-foreground">{ROLE_LABEL[doc.ownerRole]} · full edit rights</span>
                </div>
              </div>
              <div className="border border-border rounded-sm p-3">
                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Shared With</div>
                {doc.access.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground">Not shared beyond the owner{doc.visibility === "ceo-only" ? " — CEO-only." : "."}</div>
                ) : (
                  <div className="space-y-1.5">
                    {doc.access.map((a) => {
                      const p = personById(a.personId);
                      return (
                        <div key={a.personId} className="flex items-center justify-between px-2 py-1.5 rounded-sm bg-muted/30">
                          <div>
                            <div className="text-[10px] font-semibold text-foreground">{p?.name ?? a.personId}</div>
                            <div className="text-[9px] text-muted-foreground">{ROLE_LABEL[a.role]}</div>
                          </div>
                          <span className={cn("text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border", a.canEdit ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200")}>
                            {a.canEdit ? "Can Edit" : "View Only"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="text-[9px] text-muted-foreground bg-muted/20 border border-border/50 rounded-sm px-2.5 py-2 leading-relaxed">
                Edits from a role at or above the highest access holder apply immediately. Edits from anyone below need sign-off from the nearest higher-ranked person who already has access — that's this document's built-in approval chain.
              </div>
            </div>
          )}

          {sub === "usage" && (
            <div className="space-y-3">
              <div className="border border-border rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-2"><GitBranch size={11} className="text-muted-foreground" /><span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Missions With Access</span></div>
                {doc.linkedMissionIds.length === 0 ? <div className="text-[10px] text-muted-foreground">No missions reference this document.</div> : (
                  <div className="space-y-1">
                    {doc.linkedMissionIds.map((id) => {
                      const m = missionById(id);
                      return <div key={id} className="text-[10px] px-2 py-1.5 rounded-sm bg-muted/30 text-foreground">{m?.name ?? id}</div>;
                    })}
                  </div>
                )}
              </div>
              <div className="border border-border rounded-sm p-3">
                <div className="flex items-center gap-1.5 mb-2"><Bot size={11} className="text-muted-foreground" /><span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">AI Agents With Access</span></div>
                {doc.linkedAgentIds.length === 0 ? <div className="text-[10px] text-muted-foreground">No agents reference this document.</div> : (
                  <div className="space-y-1">
                    {doc.linkedAgentIds.map((id) => {
                      const a = agentById(id);
                      return (
                        <div key={id} className="flex items-center justify-between text-[10px] px-2 py-1.5 rounded-sm bg-muted/30">
                          <span className="text-foreground">{a?.name ?? id}</span>
                          <span className="text-muted-foreground">{a?.role}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
