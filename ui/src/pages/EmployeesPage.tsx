import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, errMsg, type Employee } from "../api/client";
import { Button, Card, Empty, Field, Input, Pill, SectionTitle } from "../components/ui";
import { useUnits } from "../state/unit";

const TIERS = ["T1_execution", "T2_optimization", "T3_planning", "T4_superagent"];

export default function EmployeesPage() {
  const { selected } = useUnits();
  const [rows, setRows] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [tier, setTier] = useState(TIERS[0]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    try {
      setRows(await api.listEmployees(selected.id));
      setError("");
    } catch (e) {
      setError(errMsg(e));
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!selected) return;
    try {
      await api.instantiate({ unit_id: selected.id, display_name: name, tier });
      setName("");
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  if (!selected) return <Empty>Select a unit first.</Empty>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI Employees · {selected.name}</h1>

      <Card>
        <SectionTitle>Instantiate (from scratch)</SectionTitle>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meeting Scribe" />
            </Field>
          </div>
          <div className="w-52">
            <Field label="Tier">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Button variant="primary" onClick={create} disabled={!name}>
            Instantiate
          </Button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </Card>

      <Card>
        <SectionTitle>Roster</SectionTitle>
        {rows.length === 0 ? (
          <Empty>No employees yet.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-neutral-500">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Autonomy</th>
                <th className="pb-2">Tier</th>
                <th className="pb-2">Spend</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-neutral-800">
                  <td className="py-2">{e.display_name}</td>
                  <td className="py-2"><Pill value={e.status} /></td>
                  <td className="py-2">{e.status === "deployed" ? <Pill value={e.autonomy} /> : <span className="text-neutral-600">—</span>}</td>
                  <td className="py-2 text-neutral-400">{e.tier}</td>
                  <td className="py-2">${e.spent_usd.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <Link to={`/employees/${e.id}`} className="text-indigo-400 hover:underline">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
