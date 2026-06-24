import { useCallback, useEffect, useState } from "react";

import { api, errMsg, type Task } from "../api/client";
import { Button, Card, Empty, Field, Input, Pill, SectionTitle } from "../components/ui";
import { useUnits } from "../state/unit";

export default function TasksPage() {
  const { selected } = useUnits();
  const [rows, setRows] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!selected) return;
    try {
      setRows(await api.listTasks(selected.id));
      setErr("");
    } catch (e) {
      setErr(errMsg(e));
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!selected) return;
    try {
      await api.createTask({ unit_id: selected.id, title, due: due || null });
      setTitle("");
      setDue("");
      await load();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  async function action(id: string, a: "start" | "complete" | "cancel") {
    try {
      await api.taskAction(id, a);
      await load();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  async function escalate() {
    if (!selected) return;
    try {
      await api.escalate(selected.id);
      await load();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  if (!selected) return <Empty>Select a unit first.</Empty>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Task Registry · {selected.name}</h1>
        <Button onClick={escalate}>Run escalation sweep</Button>
      </div>

      <Card>
        <SectionTitle>Add a commitment</SectionTitle>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-80">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Send revised quote to Client X" />
            </Field>
          </div>
          <div className="w-56">
            <Field label="Due (optional)">
              <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </Field>
          </div>
          <Button variant="primary" onClick={create} disabled={!title}>Add</Button>
          {err && <span className="text-sm text-red-400">{err}</span>}
        </div>
      </Card>

      <Card>
        <SectionTitle>Commitments</SectionTitle>
        {rows.length === 0 ? (
          <Empty>No commitments. Add one above or ingest a meeting.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-neutral-500">
              <tr>
                <th className="pb-2">Title</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Owner</th>
                <th className="pb-2">Source</th>
                <th className="pb-2">Due</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-neutral-800 align-top">
                  <td className="py-2">{t.title}</td>
                  <td className="py-2"><Pill value={t.status} /></td>
                  <td className="py-2 text-neutral-400">{t.owner ? `${t.owner.type}` : "unassigned"}</td>
                  <td className="py-2 text-neutral-400">{t.source.type}</td>
                  <td className="py-2 text-neutral-400">{t.due ? new Date(t.due).toLocaleDateString() : "—"}</td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {["open", "missed", "blocked"].includes(t.status) && (
                        <Button onClick={() => action(t.id, "start")}>Start</Button>
                      )}
                      {["open", "in_progress", "blocked", "missed"].includes(t.status) && (
                        <Button variant="primary" onClick={() => action(t.id, "complete")}>Done</Button>
                      )}
                    </div>
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
