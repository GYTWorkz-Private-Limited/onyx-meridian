import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, Briefcase, CheckSquare, Cpu, LayoutDashboard,
  ShieldAlert, TrendingUp, BrainCircuit,
  ThumbsUp,
  Bot, GitBranch, BookOpen, ScrollText,
  Target, Layers, TerminalSquare, Radio, FileText, FlaskConical,
  ListChecks, History, Boxes, Plug, Cable, FolderKanban, Gauge, Rocket, Users, LineChart, BarChart3, Crosshair,
  Files, ClipboardList,
} from "lucide-react";
import onyxStar from "@/assets/onyx-star.png";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";
import { OnyxCopilot } from "@/components/OnyxCopilot";
import { PersonaSwitcher } from "@/components/layout/PersonaSwitcher";
import { useAppContext } from "@/context/AppContext";
import { COMPANIES } from "@/data/companies-data";
import type { Role } from "@/lib/rbac";

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  path: string;
  label: string;
  roles?: Role[]; // omit = visible to all roles
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "My Space",
    items: [
      { icon: ListChecks, path: "/my-work",     label: "My Work" },
      { icon: LineChart,  path: "/employee-metrics", label: "Employee Metrics", roles: ["employee"] },
      { icon: History,    path: "/my-activity", label: "My Activity", roles: ["employee"] },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { icon: Files,          path: "/documents",        label: "Documents" },
      { icon: BookOpen,       path: "/knowledge-studio", label: "Knowledge" },
      { icon: ClipboardList,  path: "/sop",               label: "SOP Library", roles: ["dept_manager", "abu_head", "ceo"] },
    ],
  },
  {
    label: "Enterprise",
    items: [
      { icon: Activity,        path: "/digital-twin",    label: "Digital Twin",       roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: Crosshair,       path: "/kpi-studio",      label: "KPI Studio",        roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: LayoutDashboard, path: "/dashboard",       label: "Executive Command", roles: ["abu_head", "ceo"] },
      { icon: Briefcase,       path: "/business-units",  label: "Business Units",    roles: ["abu_head", "ceo"] },
      { icon: TrendingUp,      path: "/business-impact", label: "Business Impact",   roles: ["abu_head", "ceo"] },
      { icon: BrainCircuit,    path: "/intelligence",    label: "Recommendations",   roles: ["abu_head", "ceo"] },
    ],
  },
  {
    label: "Operate",
    items: [
      { icon: Cpu,         path: "/workforce",      label: "AI Workforce",    roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: Users,       path: "/people",         label: "People",          roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: BarChart3,   path: "/workforce-intelligence", label: "Workforce Intelligence", roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: Radio,       path: "/agentops",       label: "Mission Control" },
      { icon: FlaskConical,path: "/mission-replay", label: "Execution Intel", roles: ["abu_head", "ceo"] },
      { icon: FileText,    path: "/agent-logs",     label: "Agent Logs" },
    ],
  },
  {
    label: "Control",
    items: [
      { icon: ShieldAlert, path: "/governance", label: "Governance", roles: ["abu_head", "ceo"] },
      { icon: ThumbsUp,    path: "/approvals",  label: "Approvals" },
    ],
  },
  {
    label: "Strategy",
    items: [
      { icon: Target,      path: "/goals",         label: "Goals",         roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: FolderKanban,path: "/projects",      label: "Projects",      roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: Gauge,       path: "/cost-control",  label: "Cost Control",  roles: ["abu_head", "ceo"] },
    ],
  },
  {
    label: "Build",
    items: [
      { icon: Bot,            path: "/agent-studio",      label: "Agent Harness" },
      { icon: GitBranch,      path: "/workflow-studio",   label: "Mission Creator", roles: ["abu_head", "ceo"] },
      { icon: ScrollText,     path: "/policy-studio",     label: "Policy Studio",     roles: ["abu_head", "ceo"] },
      { icon: TerminalSquare, path: "/prompt-playground", label: "Prompt Playground" },
      { icon: Boxes,          path: "/unit-of-work",      label: "Unit of Work", roles: ["dept_manager", "abu_head", "ceo"] },
      { icon: Plug,           path: "/adapters",          label: "Adapters",     roles: ["abu_head", "ceo"] },
      { icon: Cable,          path: "/connectors",        label: "Connectors",   roles: ["abu_head", "ceo"] },
      { icon: Rocket,         path: "/abu-onboarding",    label: "ABU Onboarding", roles: ["ceo"] },
    ],
  },
  {
    label: "Optimize",
    items: [
      { icon: Layers, path: "/simulation", label: "Simulation", roles: ["abu_head", "ceo"] },
    ],
  },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const { role, currentCompanyId } = useAppContext();
  const activeCompany = COMPANIES.find((c) => c.id === currentCompanyId);

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
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      <CommandPalette />

      {/* Sidebar */}
      <div className="group/sidebar w-[50px] hover:w-[210px] transition-[width] duration-200 ease-in-out border-r border-border bg-white flex flex-col py-4 z-10 shrink-0 overflow-y-auto overflow-x-hidden">

        {/* Logo / Copilot trigger */}
        <div className="mb-4 px-[11px] shrink-0 flex items-center h-8 gap-2">
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
            <img
              src={onyxStar}
              alt="Onyx Co Work"
              className="w-7 h-7 rounded-full object-cover"
            />
            {/* Notification dot */}
            {!hasOpened && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 border border-white" />
            )}
          </button>

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
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Persona / company strip */}
        <div className="h-9 shrink-0 border-b border-border bg-white flex items-center justify-end gap-2 px-3 z-20">
          {role === "ceo" && activeCompany && (
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
    </div>
  );
}
