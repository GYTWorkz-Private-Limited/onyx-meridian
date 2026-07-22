import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, Briefcase, CheckSquare, Cpu, LayoutDashboard,
  ShieldAlert, TrendingUp, BrainCircuit,
  ThumbsUp,
  Bot, GitBranch, BookOpen, ScrollText,
  Target, TerminalSquare, Radio, FileText, FlaskConical,
  ListChecks, History, Boxes, Plug, Cable, FolderKanban, Gauge, Rocket, Users, LineChart, BarChart3, Crosshair,
  Files, ClipboardList, Bug, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import onyxStar from "@/assets/onyx-star.png";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";
import { OnyxCopilot } from "@/components/OnyxCopilot";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { COMPANIES } from "@/data/companies-data";
import { ROLE_LABEL, type Role } from "@/lib/rbac";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  path: string;
  label: string;
  roles?: Role[]; // omit = visible to all roles
  roleLabels?: Partial<Record<Role, string>>; // override label for specific roles
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "My Space",
    items: [
      { icon: ListChecks, path: "/my-work",     label: "My Work" },
      { icon: ThumbsUp,    path: "/approvals",  label: "Approvals", roles: ["employee", "dept_manager", "abu_head", "cxo"] },
      { icon: LineChart,  path: "/employee-metrics", label: "Employee Metrics", roles: ["employee", "dept_manager"] },
      { icon: History,    path: "/my-activity", label: "My Activity" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { icon: Files,          path: "/documents",        label: "Documents" },
      { icon: BookOpen,       path: "/knowledge-studio", label: "Knowledge", roles: ["employee", "dept_manager", "developer"] },
      { icon: ClipboardList,  path: "/sop",               label: "SOP Library", roles: ["employee", "dept_manager", "developer"] },
    ],
  },
  {
    label: "Enterprise",
    items: [
      { icon: Activity,        path: "/digital-twin",    label: "Digital Twin" },
      { icon: Crosshair,       path: "/kpi-studio",      label: "KPI Studio",        roles: ["employee", "dept_manager", "developer"] },
      { icon: LayoutDashboard, path: "/dashboard",       label: "Executive Command" },
      { icon: Briefcase,       path: "/business-units",  label: "Business Units",    roles: ["dept_manager", "abu_head", "cxo"] },
      { icon: TrendingUp,      path: "/business-impact", label: "Business Impact",   roles: ["abu_head", "cxo"] },
      { icon: BrainCircuit,    path: "/intelligence",    label: "Recommendations",   roles: ["employee", "dept_manager", "abu_head", "cxo"] },
    ],
  },
  {
    label: "Operate",
    items: [
      { icon: Cpu,         path: "/workforce",      label: "AI Workforce",    roles: ["employee", "dept_manager", "developer"] },
      { icon: Users,       path: "/people",         label: "People",          roles: ["dept_manager", "abu_head", "cxo"] },
      { icon: BarChart3,   path: "/workforce-intelligence", label: "Workforce Intelligence", roles: ["dept_manager", "abu_head"] },
      { icon: Radio,       path: "/agentops",       label: "Mission Control", roles: ["employee", "dept_manager", "developer"] },
      { icon: FlaskConical,path: "/mission-replay", label: "Execution Intel", roles: ["employee", "dept_manager", "developer"] },
      { icon: FileText,    path: "/agent-logs",     label: "Agent Logs", roles: ["employee", "dept_manager", "developer"] },
    ],
  },
  {
    label: "Control",
    items: [
      { icon: ShieldAlert, path: "/governance", label: "Governance", roles: ["employee", "dept_manager"] },
    ],
  },
  {
    label: "Strategy",
    items: [
      { icon: Target,      path: "/goals",         label: "Goals",         roles: ["employee", "dept_manager", "abu_head", "cxo"] },
      { icon: FolderKanban,path: "/projects",      label: "Projects",      roles: ["employee", "dept_manager", "abu_head", "cxo"] },
      { icon: Gauge,       path: "/cost-control",  label: "Cost Control", roles: ["employee", "dept_manager", "developer"] },
    ],
  },
  {
    // Build section: matrix reserves this entire section for Developer
    // ("core") — every other role is "—", with no exceptions.
    label: "Build",
    items: [
      { icon: Bot,            path: "/agent-studio",      label: "Agent Harness",   roles: ["developer"] },
      { icon: GitBranch,      path: "/workflow-studio",   label: "Mission Creator", roles: ["developer"] },
      { icon: ScrollText,     path: "/policy-studio",     label: "Policy Studio",   roles: ["developer"] },
      { icon: TerminalSquare, path: "/prompt-playground", label: "Prompt Playground", roles: ["developer"] },
      { icon: Boxes,          path: "/unit-of-work",      label: "Unit of Work",    roles: ["developer"] },
      { icon: Plug,           path: "/adapters",          label: "Adapters",        roles: ["developer"] },
      { icon: Cable,          path: "/connectors",        label: "Connectors",      roles: ["developer"] },
      // ABU Onboarding is its own matrix row (not part of "Build section"),
      // scoped to ABU Head/CXO independent of the Build restriction above.
      // ABU Head's version is department-scoped ("Dept onboarding" in the
      // matrix), so it reads as "Department Onboarding" for that role only.
      { icon: Rocket,         path: "/abu-onboarding",    label: "ABU Onboarding", roles: ["abu_head", "cxo"], roleLabels: { abu_head: "Department Onboarding" } },
    ],
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugText, setBugText] = useState("");
  const { role, currentCompanyId, previewPerson, exitPreview } = useAppContext();
  const activeCompany = COMPANIES.find((c) => c.id === currentCompanyId);
  const { toast } = useToast();

  const submitBug = () => {
    setShowBugModal(false);
    setBugText("");
    toast({ title: "Bug reported", description: "Thanks — logged for review." });
  };

  const exitPreviewToPeople = () => {
    exitPreview();
    navigate("/people");
  };

  const visibleSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  const openCopilot = () => {
    setCopilotOpen(true);
    setHasOpened(true);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      {previewPerson && (
        <div className="h-8 shrink-0 bg-amber-500 text-white flex items-center justify-center gap-2 text-[11px] font-semibold z-30">
          <span>Previewing as {previewPerson.name} ({ROLE_LABEL[role]})</span>
          <button
            onClick={exitPreviewToPeople}
            className="uppercase tracking-widest text-[9px] font-bold border border-white/50 rounded-sm px-2 py-0.5 hover:bg-white/15 transition-colors"
          >
            Exit Preview
          </button>
        </div>
      )}
      <div className="flex flex-1 w-full overflow-hidden">
      <CommandPalette />

      {/* Sidebar */}
      <div className="group/sidebar w-[50px] hover:w-[210px] transition-[width] duration-200 ease-in-out border-r border-border bg-white flex flex-col py-4 z-10 shrink-0 overflow-y-auto overflow-x-hidden">

        {/* Logo / Copilot trigger */}
        <div className="mb-4 px-[11px] shrink-0 flex items-center h-8 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={openCopilot}
                title="Open Onyx Co Work"
                className={cn(
                  "relative w-7 h-7 rounded-full shrink-0 p-0 overflow-visible",
                  "transition-all duration-200 ease-out",
                  "hover:shadow-[0_0_14px_rgba(99,102,241,0.65)] hover:scale-110",
                  copilotOpen && "shadow-[0_0_14px_rgba(99,102,241,0.8)] scale-105"
                )}
              >
                {/* Subtle always-on pulse ring, separate from the icon so it stays crisp */}
                {!copilotOpen && (
                  <span className="absolute inset-0 rounded-full bg-indigo-400/40 animate-ping" />
                )}
                <img
                  src={onyxStar}
                  alt="Onyx Co Work"
                  className="relative w-7 h-7 rounded-full object-cover"
                />
                {/* Notification dot */}
                {!hasOpened && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 border border-white" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-[11px]">
              Have any question?
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0 w-full">
          {visibleSections.map((section, si) => (
            <div key={si}>
              {si > 0 && <div className="my-1.5 mx-3 border-t border-border/60" />}
              <div className="px-3 mb-0.5 overflow-hidden h-4 flex items-center">
                <span className="text-[8px] leading-none uppercase tracking-widest font-bold text-muted-foreground/50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                  {section.label}
                </span>
              </div>
              {section.items.map((item) => {
                const isActive =
                  location === item.path ||
                  (item.path !== "/" && location.startsWith(item.path));
                const Icon = item.icon;
                const label = item.roleLabels?.[role] ?? item.label;
                return (
                  <Link
                    key={item.path + item.label}
                    href={item.path}
                    className={cn(
                      "relative w-full flex items-center gap-2.5 px-[16.5px] py-2 text-muted-foreground hover:text-foreground transition-colors",
                      isActive && "text-primary"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary rounded-r-md" />
                    )}
                    <Icon
                      size={15}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="shrink-0"
                    />
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap overflow-hidden transition-all duration-150",
                        "max-w-0 opacity-0 group-hover/sidebar:max-w-[160px] group-hover/sidebar:opacity-100"
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Report a bug — deliberately tiny and unobtrusive */}
        <button
          onClick={() => setShowBugModal(true)}
          title="Report a bug"
          className="mt-auto w-full flex items-center gap-2.5 px-[16.5px] py-1.5 text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors shrink-0"
        >
          <Bug size={11} className="shrink-0" />
          <span className="text-[8px] uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-150 max-w-0 opacity-0 group-hover/sidebar:max-w-[160px] group-hover/sidebar:opacity-100">
            Report a bug
          </span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Persona / company strip */}
        <div className="h-9 shrink-0 border-b border-border bg-white flex items-center justify-end gap-2 px-3 z-20">
          {role === "cxo" && activeCompany && (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-sm px-2 py-1 bg-muted/30">
              {activeCompany.name}
            </span>
          )}
          <PersonaSwitcher />
        </div>
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>

      {/* Onyx Copilot */}
      <OnyxCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentPage={location}
      />

      {showBugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-border rounded-sm shadow-xl w-[380px] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><Bug size={12} /> Report a Bug</h3>
              <button onClick={() => setShowBugModal(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <textarea
              className="w-full border border-border rounded-sm px-3 py-2 text-xs min-h-[80px]"
              placeholder="What went wrong?"
              value={bugText}
              onChange={(e) => setBugText(e.target.value)}
            />
            <div className="mt-3 flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowBugModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={submitBug}>Submit</Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
