import { useLocation } from "wouter";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppContext } from "@/context/AppContext";
import { ROLE_LABEL } from "@/lib/rbac";

export function PersonaSwitcher() {
  const { persona, authUser, logout } = useAppContext();
  const [, navigate] = useLocation();

  const onLogout = () => {
    logout();
    navigate("/");
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground">
          Signed in as
        </DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <div className="text-xs font-medium truncate">{persona.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{persona.title}</div>
          {authUser?.username && (
            <div className="text-[10px] text-muted-foreground truncate">@{authUser.username}</div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
          <LogOut size={13} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
