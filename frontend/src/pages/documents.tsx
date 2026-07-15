import { useMemo, useState } from "react";
import { HeaderBar } from "@/components/shared/HeaderBar";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import {
  DOCUMENTS, DOCUMENT_CATEGORIES, type Document, type DocCategory, canView, canApprove,
} from "@/data/documents-data";
import { DocumentCard } from "@/components/documents/document-card";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { UploadModal } from "@/components/documents/upload-modal";
import { CategoryManager } from "@/components/documents/category-manager";
import { ApprovalsPanel } from "@/components/documents/approvals-panel";
import {
  Search, UploadCloud, FolderKanban, ShieldAlert, LayoutGrid,
} from "lucide-react";

type Tab = "library" | "categories" | "approvals";

export default function Documents() {
  const { persona } = useAppContext();
  const [documents, setDocuments] = useState<Document[]>(DOCUMENTS);
  const [categories, setCategories] = useState<DocCategory[]>(DOCUMENT_CATEGORIES);
  const [tab, setTab] = useState<Tab>("library");
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const viewerCtx = { personId: persona.id, role: persona.role, buId: persona.buId, deptId: persona.deptId };

  const visible = useMemo(() => documents.filter((d) => canView(d, viewerCtx)), [documents, persona]);
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return visible.filter((d) =>
      (categoryFilter === "all" || d.categoryId === categoryFilter) &&
      (qq === "" || d.title.toLowerCase().includes(qq) || d.tags.some((t) => t.toLowerCase().includes(qq)))
    );
  }, [visible, categoryFilter, q]);

  const pendingForMe = documents.filter((d) => d.status === "pending-approval" && canApprove(d, viewerCtx)).length;

  const updateDoc = (updated: Document) => {
    setDocuments((docs) => docs.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDoc(updated);
  };
  const createDoc = (doc: Document) => setDocuments((docs) => [doc, ...docs]);
  const createCategory = (cat: DocCategory) => setCategories((c) => [...c, cat]);

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "library", label: "Library", icon: LayoutGrid },
    { id: "categories", label: "Categories", icon: FolderKanban },
    { id: "approvals", label: "Approvals", icon: ShieldAlert, badge: pendingForMe },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] overflow-hidden">
      <HeaderBar
        moduleName="DOCUMENT MANAGEMENT"
        metrics={[
          { label: "VISIBLE DOCS", value: visible.length },
          { label: "CATEGORIES", value: categories.length },
          { label: "AWAITING APPROVAL", value: pendingForMe },
        ]}
      />

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-6 pt-1 border-b border-border bg-white shrink-0">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-[10px] uppercase tracking-widest font-semibold border-b-2 transition-colors -mb-px",
              active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}>
              <Icon size={12} />{t.label}
              {!!t.badge && <span className="ml-0.5 text-[9px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5">{t.badge}</span>}
            </button>
          );
        })}
        <div className="flex-1" />
        {tab === "library" && (
          <button onClick={() => setShowUpload(true)} className="mb-2 flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-foreground text-background hover:bg-foreground/90 rounded-sm transition-colors">
            <UploadCloud size={10} />Upload Document
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "library" && (
          <>
            <div className="px-6 py-3 border-b border-border bg-white flex flex-wrap items-center gap-2 sticky top-0 z-20">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents or tags…"
                  className="pl-7 pr-3 py-1.5 text-[11px] border border-border rounded-sm bg-white w-64 focus:outline-none focus:border-primary" />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-[10px] border border-border rounded-sm px-2 py-1.5 bg-white text-muted-foreground">
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex-1" />
              <span className="text-[10px] text-muted-foreground">{filtered.length} of {visible.length} documents</span>
            </div>

            <div className="p-6 pt-10">
              {filtered.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-16">No documents match the current filters.</div>
              ) : (
                <div className="grid grid-cols-5 gap-x-3 gap-y-8">
                  {filtered.map((d) => <DocumentCard key={d.id} doc={d} onOpen={() => setSelectedDoc(d)} />)}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "categories" && <CategoryManager categories={categories} documents={visible} onCreate={createCategory} />}
        {tab === "approvals" && <ApprovalsPanel documents={documents} persona={persona} onOpen={setSelectedDoc} onUpdate={updateDoc} />}
      </div>

      {selectedDoc && (
        <DocumentViewer doc={documents.find((d) => d.id === selectedDoc.id) ?? selectedDoc} persona={persona} onClose={() => setSelectedDoc(null)} onUpdate={updateDoc} />
      )}
      {showUpload && <UploadModal persona={persona} categories={categories} onClose={() => setShowUpload(false)} onCreate={createDoc} />}
    </div>
  );
}
