import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, errMsg, type Credential, type Employee, type Run } from "../api/client";
import { Button, Card, Field, Input, Pill, SectionTitle, Stat } from "../components/ui";

export default function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [cred, setCred] = useState<Credential | null>(null);

  // configure form
  const [caretaker, setCaretaker] = useState("");
  const [dataScopes, setDataScopes] = useState("");
  const [actionScopes, setActionScopes] = useState("");
  const [budget, setBudget] = useState("50");
  const [model, setModel] = useState("internal/onyx-llm");

  const load = useCallback(async () => {
    try {
      const e = await api.getEmployee(id);
      setEmp(e);
      setRuns(await api.listRuns(id));
      setCaretaker(e.supervision.caretaker ?? "");
      setDataScopes(e.permissions.data_scopes.join(", "));
      setActionScopes(e.permissions.action_scopes.join(", "));
      setBudget(String(e.budget.monthly_usd ?? 0));
      setModel(e.model_policy.preferred);
      setErr("");
    } catch (e) {
      setErr(errMsg(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(fn: () => Promise<unknown>, ok: string) {
    setErr("");
    setMsg("");
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  async function configure() {
    await act(
      () =>
        api.configure(id, {
          supervision: { caretaker: caretaker || null },
          permissions: {
            data_scopes: split(dataScopes),
            action_scopes: split(actionScopes),
            deny: [],
          },
          budget: { monthly_usd: Number(budget) || 0 },
          model_policy: { preferred: model, allowed: model === "internal/onyx-llm" ? [] : [model] },
        }),
      "Configured (new version).",
    );
  }

  async function deploy() {
    setErr("");
    setMsg("");
    setCred(null);
    try {
      const res = await api.deploy(id, "console");
      if (res.pending) setMsg("Deploy needs approval — see the Approvals queue.");
      else {
        setMsg("Deployed in Shadow. Save this credential — shown once.");
        if (res.credential) setCred(res.credential);
      }
      await load();
    } catch (e) {
      setErr(errMsg(e));
    }
  }

  async function decommission() {
    await act(() => api.decommission(id, "via console"), "Decommission requested / done.");
  }

  if (err && !emp) return <Card><p className="text-red-400">{err}</p></Card>;
  if (!emp) return <Card>Loading…</Card>;

  const isDraftOrConfigured = emp.status === "draft" || emp.status === "configured";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/employees" className="text-sm text-neutral-500 hover:underline">← Roster</Link>
          <h1 className="text-2xl font-semibold">{emp.display_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Pill value={emp.status} />
          {emp.status === "deployed" && <Pill value={emp.autonomy} />}
        </div>
      </div>

      {(msg || err) && (
        <div className={msg ? "rounded-lg border border-emerald-800 bg-emerald-900/30 p-3 text-sm text-emerald-200" : "rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-200"}>
          {msg || err}
        </div>
      )}

      {cred && (
        <Card className="border-amber-700">
          <SectionTitle>Credential (copy now — shown once)</SectionTitle>
          <code className="block break-all rounded bg-neutral-950 p-2 text-xs text-amber-200">{cred.token}</code>
          <p className="mt-2 text-xs text-neutral-500">principal: {cred.principal_id}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Version" value={emp.version} />
        <Stat label="Tier" value={emp.tier.replace("_", " ")} />
        <Stat label="Spend" value={`$${emp.spent_usd.toFixed(2)}`} sub={`of $${emp.budget.monthly_usd}`} />
        <Stat label="Principal" value={emp.principal_id ? "issued" : "none"} />
      </div>

      <Card>
        <SectionTitle>Lifecycle</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {isDraftOrConfigured && <Button variant="primary" onClick={deploy}>Deploy</Button>}
          {emp.status === "deployed" && (
            <>
              <Button variant="primary" onClick={() => act(() => api.runHeartbeat(id), "Ran a heartbeat.")}>Run heartbeat</Button>
              <Button onClick={() => act(() => api.promote(id, true), "Promoted (eval passed).")}>Promote autonomy</Button>
              <Button onClick={() => act(() => api.demote(id), "Demoted autonomy.")}>Demote</Button>
              <Button onClick={() => act(() => api.suspend(id, "via console"), "Suspended.")}>Suspend</Button>
              <Button onClick={() => act(async () => setCred(await api.rotateCredential(id)), "Credential rotated.")}>Rotate credential</Button>
            </>
          )}
          {emp.status === "suspended" && (
            <Button variant="primary" onClick={() => act(() => api.resume(id), "Resumed.")}>Resume</Button>
          )}
          {emp.status !== "retired" && (
            <Button variant="danger" onClick={decommission}>Decommission</Button>
          )}
        </div>
      </Card>

      {isDraftOrConfigured && (
        <Card>
          <SectionTitle>Configure</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Caretaker (required to deploy)">
              <Input value={caretaker} onChange={(e) => setCaretaker(e.target.value)} placeholder="user_ravi" />
            </Field>
            <Field label="Model (preferred)">
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </Field>
            <Field label="Data scopes (comma-separated, within unit catalog)">
              <Input value={dataScopes} onChange={(e) => setDataScopes(e.target.value)} placeholder="ops.meetings" />
            </Field>
            <Field label="Action scopes">
              <Input value={actionScopes} onChange={(e) => setActionScopes(e.target.value)} placeholder="crm.write_task" />
            </Field>
            <Field label="Monthly budget (USD)">
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3">
            <Button variant="primary" onClick={configure}>Save configuration</Button>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Runs</SectionTitle>
        {runs.length === 0 ? (
          <p className="text-sm text-neutral-500">No runs yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-neutral-500">
              <tr><th className="pb-2">Status</th><th className="pb-2">Model</th><th className="pb-2">Tokens</th><th className="pb-2">Cost</th></tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t border-neutral-800">
                  <td className="py-1.5"><Pill value={r.status} /></td>
                  <td className="py-1.5 text-neutral-400">{r.model}</td>
                  <td className="py-1.5">{r.input_tokens + r.output_tokens}</td>
                  <td className="py-1.5">${r.cost_usd.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function split(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
