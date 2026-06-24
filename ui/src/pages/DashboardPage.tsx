import { useCallback, useEffect, useState } from "react";

import { api, errMsg, type Dashboard } from "../api/client";
import { Card, Empty, Pill, SectionTitle, Stat } from "../components/ui";
import { useUnits } from "../state/unit";

export default function DashboardPage() {
  const { selected } = useUnits();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    try {
      setData(await api.dashboard(selected.id));
      setError("");
    } catch (e) {
      setError(errMsg(e));
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!selected) return <Empty>Create and select a unit to see its dashboard.</Empty>;
  if (error) return <Empty>{error}</Empty>;
  if (!data) return <Empty>Loading…</Empty>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{data.unit_name}</h1>
        <p className="text-sm text-neutral-400">
          Leadership view · unit status <Pill value={data.unit_status} />
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="AI employees" value={data.employees_total} />
        <Stat label="Open commitments" value={data.open_commitments} sub={`${data.commitments_total} total`} />
        <Stat label="Overdue" value={data.overdue_commitments} />
        <Stat label="Completion rate" value={`${Math.round(data.completion_rate * 100)}%`} />
        <Stat label="Spend (USD)" value={`$${data.spent_usd.toFixed(2)}`} sub={`of $${data.budget_monthly_usd.toFixed(0)} budget`} />
        <Stat label="Budget used" value={`${Math.round(data.budget_utilization * 100)}%`} />
        <Stat label="Open approvals" value={data.open_approvals} />
        <Stat label="Stale employees" value={data.stale_employees.length} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <SectionTitle>Employees by status</SectionTitle>
          <Breakdown data={data.by_status} />
        </Card>
        <Card>
          <SectionTitle>By autonomy (deployed)</SectionTitle>
          <Breakdown data={data.by_autonomy} />
        </Card>
        <Card>
          <SectionTitle>Commitments by status</SectionTitle>
          <Breakdown data={data.commitments_by_status} />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle>Needs attention</SectionTitle>
          {data.stale_employees.length === 0 ? (
            <p className="text-sm text-neutral-500">No stale employees.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.stale_employees.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.display_name}</span>
                  <span className="text-neutral-500">{s.last_heartbeat_at ? "stale" : "never ran"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle>Recent activity</SectionTitle>
          <ul className="space-y-1 text-sm">
            {data.recent_activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex justify-between gap-2">
                <span className="text-neutral-300">{a.action}</span>
                <span className="shrink-0 text-neutral-500">{a.actor}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Breakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <p className="text-sm text-neutral-500">None.</p>;
  return (
    <ul className="space-y-2">
      {entries.map(([k, v]) => (
        <li key={k} className="flex items-center justify-between">
          <Pill value={k} />
          <span className="text-sm font-medium">{v}</span>
        </li>
      ))}
    </ul>
  );
}
