import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { type DocCategory, type Document } from "@/data/documents-data";
import { Lock, Plus, FolderOpen } from "lucide-react";

const SWATCHES = ["#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706", "#0891b2", "#be185d", "#4b5563"];

export function CategoryManager({
  categories, documents, onCreate,
}: {
  categories: DocCategory[];
  documents: Document[];
  onCreate: (cat: DocCategory) => void;
}) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);

  const countFor = (catId: string) => documents.filter((d) => d.categoryId === catId).length;

  const submit = () => {
    if (!name.trim()) { toast({ title: "Category name is required", variant: "destructive" }); return; }
    const cat: DocCategory = { id: `cat-${Date.now()}`, name: name.trim(), description: description.trim() || "Custom category", color };
    onCreate(cat);
    toast({ title: "Category created", description: `"${cat.name}" is now available when uploading documents.` });
    setName(""); setDescription(""); setColor(SWATCHES[0]); setShowForm(false);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Document Categories</div>
        <button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold px-2.5 py-1.5 rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-colors">
          <Plus size={11} /> New Category
        </button>
      </div>

      {showForm && (
        <div className="border border-border rounded-sm p-4 mb-4 bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vendor Audits" className="w-full border border-border rounded-sm px-2.5 py-1.5 text-[12px]" />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What belongs in this category" className="w-full border border-border rounded-sm px-2.5 py-1.5 text-[12px]" />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Color</label>
            <div className="flex gap-1.5">
              {SWATCHES.map((s) => (
                <button key={s} onClick={() => setColor(s)} className={cn("w-6 h-6 rounded-full border-2", color === s ? "border-foreground" : "border-transparent")} style={{ background: s }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-sm border border-border bg-white hover:bg-muted/40 transition-colors">Cancel</button>
            <button onClick={submit} className="text-[10px] font-semibold px-2.5 py-1.5 rounded-sm bg-foreground text-background hover:bg-foreground/90 transition-colors">Create Category</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 bg-white border border-border rounded-sm p-3 shadow-sm">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0" style={{ background: `${c.color}14` }}>
              <FolderOpen size={16} style={{ color: c.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-foreground">{c.name}</span>
                {c.builtin && <span title="Built-in category"><Lock size={9} className="text-muted-foreground" /></span>}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{c.description}</div>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground shrink-0">{countFor(c.id)} docs</div>
          </div>
        ))}
      </div>
    </div>
  );
}
