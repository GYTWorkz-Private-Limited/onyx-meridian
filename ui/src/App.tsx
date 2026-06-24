import {
  Boxes,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { useUnits } from "./state/unit";
import { cx } from "./components/ui";
import ApprovalsPage from "./pages/ApprovalsPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import EmployeesPage from "./pages/EmployeesPage";
import IngestPage from "./pages/IngestPage";
import TasksPage from "./pages/TasksPage";
import UnitsPage from "./pages/UnitsPage";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/units", label: "Units", icon: Boxes },
  { to: "/employees", label: "AI Employees", icon: Users },
  { to: "/tasks", label: "Task Registry", icon: ListChecks },
  { to: "/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/ingest", label: "Meeting Intel", icon: ClipboardList },
];

function UnitSelector() {
  const { units, selectedId, setSelectedId } = useUnits();
  if (units.length === 0) return <span className="text-xs text-neutral-500">no units yet</span>;
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => setSelectedId(e.target.value)}
      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 outline-none focus:border-indigo-500"
    >
      {units.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name} · {u.status}
        </option>
      ))}
    </select>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 p-4">
        <div className="mb-1 flex items-center gap-2 px-1">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-400 to-fuchsia-500" />
          <span className="font-semibold">Onyx Meridian</span>
        </div>
        <p className="mb-4 px-1 text-xs text-neutral-500">AI-Employee Console</p>

        <div className="mb-4">
          <div className="mb-1 px-1 text-xs text-neutral-500">Active unit</div>
          <UnitSelector />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  isActive ? "bg-neutral-800 text-white" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200",
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-1 text-xs text-neutral-600">v0.3.0</div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/ingest" element={<IngestPage />} />
        </Routes>
      </main>
    </div>
  );
}
