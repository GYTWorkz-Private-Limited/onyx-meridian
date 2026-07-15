import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  type Document, categoryById, personById, buName, currentVersion,
} from "@/data/documents-data";
import { FileText, Lock, Clock3, Users, Eye } from "lucide-react";

const CLASSIFICATION_CLS: Record<string, string> = {
  public: "bg-emerald-50 text-emerald-700 border-emerald-200",
  internal: "bg-blue-50 text-blue-700 border-blue-200",
  confidential: "bg-amber-50 text-amber-700 border-amber-200",
  restricted: "bg-red-50 text-red-700 border-red-200",
};

export function DocumentCard({ doc, onOpen }: { doc: Document; onOpen: () => void }) {
  const [hot, setHot] = useState(false);
  const cat = categoryById(doc.categoryId);
  const owner = personById(doc.ownerPersonId);
  const cv = currentVersion(doc);
  const locked = doc.visibility === "cxo-only" || doc.visibility === "restricted";

  return (
    <button
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onClick={onOpen}
      className="relative text-left group"
      style={{ zIndex: hot ? 30 : 1 }}
    >
      <div className={cn(
        "bg-white border border-border rounded-sm overflow-hidden shadow-sm transition-all duration-150",
        hot && "shadow-2xl scale-[1.06] border-primary/30"
      )}>
        {/* Header band */}
        <div className="h-20 flex items-center justify-center relative" style={{ background: `${cat?.color}14` }}>
          <FileText size={26} style={{ color: cat?.color }} />
          {locked && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/90 border border-border flex items-center justify-center">
              <Lock size={10} className="text-muted-foreground" />
            </div>
          )}
          {doc.status === "pending-approval" && (
            <div className="absolute top-2 left-2 text-[7px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 border border-amber-200">
              Pending
            </div>
          )}
        </div>

        <div className="p-2.5">
          <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm border inline-block mb-1" style={{ color: cat?.color, borderColor: `${cat?.color}55`, background: `${cat?.color}0d` }}>
            {cat?.name}
          </span>
          <div className="text-[11px] font-semibold text-foreground leading-snug line-clamp-2 mb-1 min-h-[28px]">{doc.title}</div>
          <div className="flex items-center justify-between text-[8px] text-muted-foreground">
            <span>v{cv.version}</span>
            <span>{cv.editedAt}</span>
          </div>
        </div>
      </div>

      {/* Netflix-style hover preview */}
      {hot && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-foreground text-white rounded-sm shadow-2xl p-3 pointer-events-none">
          <div className="text-[10px] font-bold mb-1.5 leading-snug">{doc.title}</div>
          <p className="text-[9px] text-white/80 leading-relaxed line-clamp-4 mb-2">{doc.summary}</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-white/60 mb-2">
            <span className="flex items-center gap-1"><Users size={9} />{owner?.name ?? doc.ownerRole}</span>
            <span className="flex items-center gap-1"><Clock3 size={9} />{doc.metadata.reviewDate}</span>
            <span>{buName(doc.buId)}</span>
            <span className={cn("px-1 py-0 rounded-sm border w-fit", CLASSIFICATION_CLS[doc.metadata.classification])}>{doc.metadata.classification}</span>
          </div>
          <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-white/40 pt-1.5 border-t border-white/15">
            <Eye size={9} /> Click to open
          </div>
        </div>
      )}
    </button>
  );
}
