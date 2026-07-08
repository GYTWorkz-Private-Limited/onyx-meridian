import { useLocation } from "wouter";
import { ChevronDown, Check, UserCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/context/AppContext";
import { PERSONAS, ROLE_LABEL, landingRouteFor, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const ROLE_ORDER: Role[] = ["ceo", "abu_head", "employee"];

export function PersonaSwitcher() {
  const { persona, setActivePersonaId } = useAppContext();
  const [, navigate] = useLocation();

  const select = (id: string) => {
    const next = PERSONAS.find((p) => p.id === id);
    if (!next) return;
    setActivePersonaId(id);
    navigate(landingRouteFor(next.role));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border border-border bg-white hover:bg-muted/60 transition-colors">
          <UserCircle2 size={14} className="text-muted-foreground shrink-0" />
          <div className="text-left leading-tight">
            <div className="text-[10px] font-semibold text-foreground">{persona.name}</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{ROLE_LABEL[persona.role]}</div>
          </div>
          <ChevronDown size={12} className="text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {ROLE_ORDER.map((role, ri) => (
          <div key={role}>
            {ri > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground">
              {ROLE_LABEL[role]}
            </DropdownMenuLabel>
            {PERSONAS.filter((p) => p.role === role).map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => select(p.id)}
                className={cn("flex items-center justify-between gap-2 cursor-pointer", p.id === persona.id && "bg-primary/5")}
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{p.title}</div>
                </div>
                {p.id === persona.id && <Check size={13} className="text-primary shrink-0" />}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
