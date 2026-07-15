import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Persona, Role } from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/rbac";
import { BU_LIST } from "@/data/enterprise-data";
import { PEOPLE } from "@/data/people-data";
import {
  type Document, type DocCategory, type Visibility, DOCUMENT_CATEGORIES,
} from "@/data/documents-data";
import { X, UploadCloud, Search } from "lucide-react";

const FILE_TYPES = ["PDF", "DOCX", "XLSX", "PPTX", "TXT"];
const CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"] as const;

export function UploadModal({
  persona, categories, onClose, onCreate,
}: {
  persona: Persona;
  categories: DocCategory[];
  onClose: () => void;
  onCreate: (doc: Document) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [buId, setBuId] = useState<string>(persona.buId ?? "");
  const [visibility, setVisibility] = useState<Visibility>("shared");
  const [classification, setClassification] = useState<(typeof CLASSIFICATIONS)[number]>("internal");
  const [fileType, setFileType] = useState("PDF");
  const [tags, setTags] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reviewDate, setReviewDate] = useState("");
  const [summary, setSummary] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [shares, setShares] = useState<Record<string, { checked: boolean; canEdit: boolean; role: Role }>>({});

  const visibilityOptions: Visibility[] = persona.role === "cxo" ? ["shared", "restricted", "cxo-only"] : ["shared", "restricted"];

  const filteredPeople = PEOPLE.filter((p) => p.id !== persona.id && p.name.toLowerCase().includes(peopleSearch.toLowerCase()));

  const toggleShare = (personId: string, role: Role) => {
    setShares((s) => ({ ...s, [personId]: { checked: !s[personId]?.checked, canEdit: s[personId]?.canEdit ?? false, role } }));
  };
  const toggleEdit = (personId: string) => {
    setShares((s) => ({ ...s, [personId]: { ...s[personId], canEdit: !s[personId]?.canEdit } }));
  };

  const submit = () => {
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (!categoryId) { toast({ title: "Choose a category", variant: "destructive" }); return; }

    const access = Object.entries(shares)
      .filter(([, v]) => v.checked)
      .map(([personId, v]) => ({ personId, role: v.role, canEdit: v.canEdit }));

    const doc: Document = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      categoryId,
      buId: visibility === "cxo-only" ? null : (buId || null),
      visibility,
      ownerPersonId: persona.id,
      ownerRole: persona.role,
      access,
      versions: [{ version: 1, editedByPersonId: persona.id, editedByRole: persona.role, editedAt: new Date().toISOString().slice(0, 10), changeNote: "Initial upload." }],
      status: "approved",
      metadata: {
        author: persona.name, department: BU_LIST.find((b) => b.id === buId)?.name ?? "Enterprise",
        effectiveDate, reviewDate: reviewDate || effectiveDate, classification, language: "English", fileType, fileSizeKb: Math.round(120 + Math.random() * 900),
      },
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      ocrText: summary || "OCR extraction pending — this mock document has no scanned content yet.",
      summary: summary || "No summary provided at upload.",
      linkedMissionIds: [],
      linkedAgentIds: [],
    };

    onCreate(doc);
    toast({ title: "Document uploaded", description: `"${doc.title}" is now in the library.` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white border border-border rounded-sm shadow-2xl w-[560px] max-h-[88vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><UploadCloud size={15} /> Upload Document</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Line 7 Escalation Procedure v2"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Category *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-border rounded-sm px-2.5 py-2 text-[12px] bg-white">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">File Type</label>
              <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="w-full border border-border rounded-sm px-2.5 py-2 text-[12px] bg-white">
                {FILE_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Business Unit</label>
              <select value={buId} onChange={(e) => setBuId(e.target.value)} disabled={visibility === "cxo-only"}
                className="w-full border border-border rounded-sm px-2.5 py-2 text-[12px] bg-white disabled:opacity-50">
                <option value="">Enterprise-wide</option>
                {BU_LIST.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Visibility</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)} className="w-full border border-border rounded-sm px-2.5 py-2 text-[12px] bg-white">
                {visibilityOptions.map((v) => <option key={v} value={v}>{v === "cxo-only" ? "CXO Only" : v[0].toUpperCase() + v.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Classification</label>
              <select value={classification} onChange={(e) => setClassification(e.target.value as any)} className="w-full border border-border rounded-sm px-2.5 py-2 text-[12px] bg-white">
                {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Effective Date</label>
              <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full border border-border rounded-sm px-2 py-2 text-[12px]" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Review Date</label>
              <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="w-full border border-border rounded-sm px-2 py-2 text-[12px]" />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. maintenance, line-7, escalation"
              className="w-full border border-border rounded-sm px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Summary (also used as mock OCR text)</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Short description of what this document covers…"
              className="w-full border border-border rounded-sm px-3 py-2 text-[12px]" />
          </div>

          {visibility !== "cxo-only" && (
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Share With</label>
              <div className="border border-border rounded-sm">
                <div className="relative border-b border-border">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Search people…"
                    className="w-full pl-7 pr-2 py-1.5 text-[11px] focus:outline-none" />
                </div>
                <div className="max-h-[160px] overflow-y-auto">
                  {filteredPeople.map((p) => {
                    const roleTierToRole: Record<string, Role> = { cxo: "cxo", abu_head: "abu_head", member: p.deptId ? "dept_manager" : "employee" };
                    const role = roleTierToRole[p.roleTier];
                    const s = shares[p.id];
                    return (
                      <div key={p.id} className="flex items-center justify-between px-2.5 py-1.5 hover:bg-muted/30 border-b border-border/40 last:border-b-0">
                        <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                          <input type="checkbox" checked={s?.checked ?? false} onChange={() => toggleShare(p.id, role)} />
                          <span className="text-[10px] text-foreground truncate">{p.name}</span>
                          <span className="text-[8px] uppercase tracking-widest text-muted-foreground shrink-0">{ROLE_LABEL[role]}</span>
                        </label>
                        {s?.checked && (
                          <label className="flex items-center gap-1 text-[9px] text-muted-foreground shrink-0 cursor-pointer">
                            <input type="checkbox" checked={s.canEdit} onChange={() => toggleEdit(p.id)} /> Can edit
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="text-[11px] font-semibold px-3 py-2 rounded-sm border border-border bg-white hover:bg-muted/40 transition-colors">Cancel</button>
          <button onClick={submit} className="text-[11px] font-semibold px-3 py-2 rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-1.5">
            <UploadCloud size={12} /> Upload
          </button>
        </div>
      </div>
    </div>
  );
}
