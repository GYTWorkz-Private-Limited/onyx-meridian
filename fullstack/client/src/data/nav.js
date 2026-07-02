export const ROUTES = [
  // Org Chart — the default landing: a live canvas of the AI workforce
  { id: 'orgchart',     label: 'Org Chart',    icon: 'Share2',          group: 'Workspace', roles: ['member','head','admin'] },

  // Workspace (all roles)
  { id: 'dashboard',    label: 'Dashboard',    icon: 'LayoutDashboard', group: 'Workspace', roles: ['member','head','admin'] },
  { id: 'my-work',      label: 'My Work',      icon: 'CheckSquare',     group: 'Workspace', roles: ['member','head','admin'] },
  { id: 'inbox',        label: 'Inbox',        icon: 'MessageSquare',   group: 'Workspace', roles: ['member','head','admin'] },
  { id: 'activity',     label: 'Activity',     icon: 'Activity',        group: 'Workspace', roles: ['head','admin'] },

  // Operate
  { id: 'departments',  label: 'Departments',  icon: 'Building2',       group: 'Operate',  roles: ['admin'] },
  { id: 'employees',    label: 'AI Employees', icon: 'Bot',             group: 'Operate',  roles: ['head','admin'] },
  { id: 'taskboard',    label: 'Taskboard',    icon: 'Kanban',          group: 'Operate',  roles: ['member','head','admin'] },
  { id: 'approvals',    label: 'Approvals',    icon: 'ShieldCheck',     group: 'Operate',  roles: ['member','head','admin'] },

  // Direct (Paperclip: goals & projects)
  { id: 'goals',        label: 'Goals',        icon: 'Target',          group: 'Direct',   roles: ['head','admin'] },
  { id: 'projects',     label: 'Projects',     icon: 'FolderKanban',    group: 'Direct',   roles: ['head','admin'] },

  // Build
  { id: 'onboarding',   label: 'Dept Onboarding', icon: 'Rocket',       group: 'Build',    roles: ['admin'] },
  { id: 'unitofwork',   label: 'Units of Work',icon: 'Boxes',           group: 'Build',    roles: ['head','admin'] },
  { id: 'workflows',    label: 'Workflows',    icon: 'GitBranch',       group: 'Build',    roles: ['head','admin'] },
  { id: 'connectors',   label: 'Connectors',   icon: 'Plug',            group: 'Build',    roles: ['head','admin'] },
  { id: 'adapters',     label: 'Adapters',     icon: 'Cpu',             group: 'Build',    roles: ['admin'] },
  { id: 'knowledge',    label: 'Knowledge',    icon: 'Network',         group: 'Build',    roles: ['head','admin'] },

  // Govern
  { id: 'cost',         label: 'Cost Control', icon: 'DollarSign',      group: 'Govern',   roles: ['head','admin'] },
  { id: 'effectiveness',label: 'Effectiveness',icon: 'TrendingUp',      group: 'Govern',   roles: ['head','admin'] },
  { id: 'people',       label: 'People',       icon: 'Users',           group: 'Govern',   roles: ['head','admin'] },
  { id: 'companies',    label: 'Companies',    icon: 'Building',        group: 'Govern',   roles: ['admin'] },
  { id: 'governance',   label: 'Governance',   icon: 'Scale',           group: 'Govern',   roles: ['admin'] },
  { id: 'settings',     label: 'Settings',     icon: 'Settings',        group: 'Govern',   roles: ['admin'] },
];

export function routesFor(role) {
  return ROUTES.filter(r => r.roles.includes(role));
}

export function canAccess(role, routeId) {
  const route = ROUTES.find(r => r.id === routeId);
  return route ? route.roles.includes(role) : false;
}
