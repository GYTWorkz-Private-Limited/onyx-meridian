import { useCallback, useEffect, useState } from "react";

import { api, errMsg, type Approval } from "../api/client";
import { Button, Card, Empty, Pill, SectionTitle } from "../components/ui";
import { useUnits } from "../state/unit";

export default function ApprovalsPage() {
  const { selected, refresh } = useUnits();
  const [rows, setRows] = useState<Approval[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    try {
      setRows(await api.listApprovals(selected.id, "pending"));
      setErr("");
    } catch (e) {
      setErr(errMsg(e));
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, approve: boolean) {
    try {
      await api.decideApproval(id, approve);
      await load();
      await refresh();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  if (!selected) return <Empty>Select a unit first.</Empty>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Approvals · {selected.name}</h1>
      <p className="text-sm text-neutral-400">AI proposes, a human commits. Every Yes is one tap.</p>

      {err && <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-200">{err}</div>}

      {rows.length === 0 ? (
        <Empty>No pending approvals.</Empty>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Pill value={a.type} />
                    <span className="text-sm text-neutral-400">requested by {a.requested_by ?? "system"}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">subject: {a.subject_employee_id ?? "—"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => decide(a.id, true)}>Approve</Button>
                  <Button variant="danger" onClick={() => decide(a.id, false)}>Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
