import { useState } from "react";

import { api, errMsg, type Task } from "../api/client";
import { Button, Card, Empty, Field, Input, Pill, SectionTitle, Textarea } from "../components/ui";
import { useUnits } from "../state/unit";

const SAMPLE =
  "Ravi will send the revised quote to Client X by Friday. " +
  "Priya to prepare the budget report by next week. " +
  "Sam will follow up with legal on the contract.";

export default function IngestPage() {
  const { selected } = useUnits();
  const [title, setTitle] = useState("Weekly sync");
  const [content, setContent] = useState(SAMPLE);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!selected) return;
    setBusy(true);
    setErr("");
    try {
      const res = await api.ingest({ unit_id: selected.id, title, content });
      setTasks(res.tasks);
      setUnresolved(res.unresolved_owners);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!selected) return <Empty>Select a unit first.</Empty>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Meeting Intelligence · {selected.name}</h1>
      <p className="text-sm text-neutral-400">
        Paste a transcript; commitments are extracted into the Task Registry with provenance back to
        the source sentence. Owners are matched against people in this unit.
      </p>

      <Card>
        <div className="space-y-3">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Transcript">
            <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
          </Field>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={run} disabled={busy}>Extract commitments</Button>
            {err && <span className="text-sm text-red-400">{err}</span>}
          </div>
        </div>
      </Card>

      {tasks.length > 0 && (
        <Card>
          <SectionTitle>Extracted commitments</SectionTitle>
          {unresolved.length > 0 && (
            <p className="mb-2 text-xs text-amber-400">
              Unmatched owners (add them as People to auto-assign): {unresolved.join(", ")}
            </p>
          )}
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="rounded-lg border border-neutral-800 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.title}</span>
                  <Pill value={t.owner ? t.owner.type : "unassigned"} />
                </div>
                {t.source.quote && <p className="mt-1 text-xs text-neutral-500">“{t.source.quote}”</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
