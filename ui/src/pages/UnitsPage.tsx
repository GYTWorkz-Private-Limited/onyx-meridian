import { useState } from "react";

import { api, errMsg } from "../api/client";
import { Button, Card, Field, Input, Pill, SectionTitle } from "../components/ui";
import { useUnits } from "../state/unit";

export default function UnitsPage() {
  const { units, refresh, setSelectedId } = useUnits();
  const [name, setName] = useState("");
  const [caretaker, setCaretaker] = useState("");
  const [scopes, setScopes] = useState("ops.*, crm.write_task");
  const [budget, setBudget] = useState("100");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const unit = await api.createUnit({
        name,
        caretaker_user_id: caretaker || null,
        allowed_scopes: scopes.split(",").map((s) => s.trim()).filter(Boolean),
        budget_monthly_usd: Number(budget) || 0,
      });
      await refresh();
      setSelectedId(unit.id);
      setName("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: string) {
    try {
      await api.activateUnit(id);
      await refresh();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Units</h1>

      <Card>
        <SectionTitle>Onboard a department</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Operations" />
          </Field>
          <Field label="Caretaker (user id)">
            <Input value={caretaker} onChange={(e) => setCaretaker(e.target.value)} placeholder="user_ravi" />
          </Field>
          <Field label="Delegatable scopes (comma-separated)">
            <Input value={scopes} onChange={(e) => setScopes(e.target.value)} />
          </Field>
          <Field label="Monthly budget (USD)">
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button variant="primary" onClick={create} disabled={busy || !name}>
            Onboard unit
          </Button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      </Card>

      <Card>
        <SectionTitle>All units</SectionTitle>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-neutral-500">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Scopes</th>
              <th className="pb-2">Budget</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-t border-neutral-800">
                <td className="py-2">{u.name}</td>
                <td className="py-2"><Pill value={u.status} /></td>
                <td className="py-2 text-neutral-400">{u.allowed_scopes.join(", ") || "—"}</td>
                <td className="py-2">${u.budget_monthly_usd}</td>
                <td className="py-2 text-right">
                  {u.status === "onboarding" && (
                    <Button variant="primary" onClick={() => activate(u.id)}>
                      Activate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
