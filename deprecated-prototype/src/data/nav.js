// Route registry + role-based access. Mirrors doc/system-actions.md persona model.
//   member → participate only.  head → operate one department.  admin → everything.
import {
  LayoutGrid, ListChecks, MessagesSquare, Building2, Network, Bot, KanbanSquare,
  Workflow, Sparkles, ShieldCheck, Cable, Share2, CircleDollarSign, Gauge,
  Users, Lock, Settings, Inbox,
} from 'lucide-react'

export const NAV = [
  { group: 'Workspace', items: [
    { key: 'dashboard', label: 'Overview', icon: LayoutGrid, roles: ['member', 'head', 'admin'] },
    { key: 'mywork', label: 'My Work', icon: ListChecks, roles: ['member', 'head', 'admin'] },
    { key: 'inbox', label: 'Questions & Chat', icon: Inbox, roles: ['member', 'head', 'admin'], countKey: 'questions' },
  ]},
  { group: 'Operate', items: [
    { key: 'departments', label: 'Departments', icon: Building2, roles: ['head', 'admin'] },
    { key: 'orgtwin', label: 'Org Digital Twin', icon: Network, roles: ['head', 'admin'] },
    { key: 'employees', label: 'AI Employees', icon: Bot, roles: ['head', 'admin'], countKey: 'employees' },
    { key: 'taskboard', label: 'Taskboard', icon: KanbanSquare, roles: ['head', 'admin'] },
    { key: 'approvals', label: 'Approval Gates', icon: ShieldCheck, roles: ['head', 'admin'], countKey: 'approvals' },
  ]},
  { group: 'Build', items: [
    { key: 'onboarding', label: 'Onboarding Agent', icon: Sparkles, roles: ['head', 'admin'] },
    { key: 'workflows', label: 'Workflows', icon: Workflow, roles: ['head', 'admin'] },
    { key: 'connectors', label: 'Connections', icon: Cable, roles: ['head', 'admin'] },
    { key: 'knowledge', label: 'Knowledge Graph', icon: Share2, roles: ['head', 'admin'] },
  ]},
  { group: 'Govern', items: [
    { key: 'cost', label: 'Cost Control', icon: CircleDollarSign, roles: ['head', 'admin'] },
    { key: 'effectiveness', label: 'Effectiveness', icon: Gauge, roles: ['head', 'admin'] },
    { key: 'people', label: 'People', icon: Users, roles: ['head', 'admin'] },
    { key: 'governance', label: 'Governance & Security', icon: Lock, roles: ['admin'] },
    { key: 'settings', label: 'Platform Settings', icon: Settings, roles: ['admin'] },
  ]},
]

export const ALL_ROUTES = NAV.flatMap((g) => g.items)
export function canAccess(roleKey, routeKey) {
  const r = ALL_ROUTES.find((x) => x.key === routeKey)
  return r ? r.roles.includes(roleKey) : false
}
export function routesFor(roleKey) {
  return NAV.map((g) => ({ group: g.group, items: g.items.filter((i) => i.roles.includes(roleKey)) }))
    .filter((g) => g.items.length)
}
