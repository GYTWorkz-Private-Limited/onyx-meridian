import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Persona } from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/rbac";
import {
  type Document, categoryById, personById, canApprove, currentVersion,
} from "@/data/documents-data";
import { ShieldAlert, CheckCircle2, XCircle, Clock3 } from "lucide-react";

export function ApprovalsPanel({
  documents, persona, onOpen, onUpdate,
}: {
  documents: Document[];
  persona: Persona;
  onOpen: (doc: Document) => void;
  onUpdate: (updated: Document) => void;
}) {
  const { toast } = useToast();
  const viewerCtx = { personId: persona.id, role: persona.role, buId: persona.buId, deptId: persona.deptId };

  const pending = documents.filter((d) => d.status === "pending-approval" && d.pendingChange);
  const awaitingMe = pending.filter((d) => canApprove(d, viewerCtx));
  const mySubmissions = pending.filter((d) => d.pendingChange?.submittedByPersonId === persona.id);

  const approve = (doc: Document) => {
    const cv = currentVersion(doc);
    if (!doc.pendingChange) return;
    onUpdate({
      ...doc, status: "approved", pendingChange: undefined,
      versions: [...doc.versions, { version: cv.version + 1, editedByPersonId: doc.pendingChange.submittedByPersonId, editedByRole: doc.pendingChange.submittedByRole, editedAt: doc.pendingChange.submittedAt, changeNote: doc.pendingChange.changeNote }],
    });
    toast({ title: "Change approved", description: `"${doc.title}" is now v${cv.version + 1}.` });
  };
  const reject = (doc: Document) => {
    onUpdate({ ...doc, status: "approved", pendingChange: undefined });
    toast({ title: "Change rejected", description: `"${doc.title}" was not modified.` });
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <ShieldAlert size={13} className="text-amber-600" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Awaiting Your Approval</span>
          <span className="text-[9px] text-muted-foreground">{awaitingMe.length}</span>
        </div>
        {awaitingMe.length === 0 ? (
          <div className="text-[11px] text-muted-foreground border border-dashed border-border rounded-sm px-4 py-8 text-center">Nothing needs your sign-off right now.</div>
        ) : (
          <div className="space-y-2">
            {awaitingMe.map((doc) => {
              const cat = categoryById(doc.categoryId);
              const submitter = personById(doc.pendingChange!.submittedByPersonId);
              return (
                <div key={doc.id} className="bg-white border border-amber-200 bg-amber-50/40 rounded-sm p-3.5 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border" style={{ color: cat?.color, borderColor: `${cat?.color}55`, background: `${cat?.color}0d` }}>{cat?.name}</span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Clock3 size={9} />{doc.pendingChange!.submittedAt}</span>
                  </div>
                  <button onClick={() => onOpen(doc)} className="text-[12px] font-semibold text-foreground hover:text-primary transition-colors block mb-1 text-left">{doc.title}</button>
                  <div className="text-[10px] text-muted-foreground mb-1.5">
                    {submitter?.name ?? doc.pendingChange!.submittedByRole} ({ROLE_LABEL[doc.pendingChange!.submittedByRole]}) proposes: "{doc.pendingChange!.changeNote}"
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approve(doc)} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"><CheckCircle2 size={10} />Approve</button>
                    <button onClick={() => reject(doc)} className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-sm border border-border bg-white hover:bg-muted/40 transition-colors"><XCircle size={10} />Reject</button>
                    <button onClick={() => onOpen(doc)} className="ml-auto text-[9px] uppercase tracking-widest font-bold text-primary hover:underline">Open Document →</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Clock3 size={13} className="text-muted-foreground" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Your Submitted Changes</span>
          <span className="text-[9px] text-muted-foreground">{mySubmissions.length}</span>
        </div>
        {mySubmissions.length === 0 ? (
          <div className="text-[11px] text-muted-foreground border border-dashed border-border rounded-sm px-4 py-6 text-center">You have no changes waiting on someone else's approval.</div>
        ) : (
          <div className="space-y-2">
            {mySubmissions.map((doc) => (
              <button key={doc.id} onClick={() => onOpen(doc)} className="w-full text-left bg-white border border-border rounded-sm p-3 shadow-sm hover:border-primary/40 transition-colors">
                <div className="text-[11px] font-semibold text-foreground mb-0.5">{doc.title}</div>
                <div className="text-[10px] text-muted-foreground">Waiting on a {ROLE_LABEL[doc.pendingChange!.requiredApproverRole]} — "{doc.pendingChange!.changeNote}"</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
