"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { fmtCurrency, fmtPct, isoDate, addDays } from "@/lib/utils";
import { vehicleSubs, investorName, vehicleCommitted } from "@/lib/selectors";
import { allocateCapitalCall, computeWaterfall } from "@/lib/waterfall";
import type { DistributionType } from "@/lib/types";
import { Badge, kycTone, StatusBadge } from "@/components/ui/badge";

/* ---------------- Invite investor ---------------- */
export function InviteInvestorDialog(props: Parameters<typeof InviteInvestorDialogInner>[0]) {
  if (!props.open) return null;
  return <InviteInvestorDialogInner {...props} />;
}

function InviteInvestorDialogInner({ open, onClose, vehicleId }: { open: boolean; onClose: () => void; vehicleId: string }) {
  const d = useStore();
  const v = d.vehicles.find((x) => x.id === vehicleId);
  const existing = new Set(vehicleSubs(d, vehicleId).filter((s) => s.status !== "rejected").map((s) => s.investorId));
  const candidates = d.investors.filter((i) => !existing.has(i.id));
  const [investorId, setInvestorId] = React.useState("");
  const [amount, setAmount] = React.useState(v?.minInvestment ?? 0);
  if (!v) return null;
  const inv = d.investors.find((i) => i.id === investorId);
  const committed = vehicleCommitted(d, vehicleId);
  const remaining = v.targetRaise - committed;
  const submit = () => {
    const r = d.inviteInvestor(vehicleId, investorId, amount);
    if (toast.result(r)) onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Invite investor" description={`Send subscription documents for ${v.name}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!investorId}>Send invitation</Button></>}>
      <div className="space-y-4">
        <Field label="Investor">
          <Select value={investorId} onChange={(e) => setInvestorId(e.target.value)}>
            {candidates.length === 0 ? <option value="">All investors already invited</option> : null}
            {candidates.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.email}</option>)}
          </Select>
        </Field>
        {inv ? (
          <div className="flex items-center gap-2 text-xs text-muted">
            KYC <StatusBadge status={inv.kycStatus} map={kycTone} /> · Accreditation <Badge tone={inv.accreditation === "verified" ? "success" : "neutral"}>{inv.accreditation}</Badge>
          </div>
        ) : null}
        <Field label="Subscription amount" hint={`Minimum ${fmtCurrency(v.minInvestment)} · ${fmtCurrency(Math.max(0, remaining))} remaining to target`}>
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>
        {amount > remaining && remaining > 0 ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">This subscription oversubscribes the target raise. Allowed up to 120% hard cap.</p> : null}
      </div>
    </Dialog>
  );
}

/* ---------------- Capital call ---------------- */
export function CapitalCallDialog(props: Parameters<typeof CapitalCallDialogInner>[0]) {
  if (!props.open) return null;
  return <CapitalCallDialogInner {...props} />;
}

function CapitalCallDialogInner({ open, onClose, vehicleId: initialVehicle }: { open: boolean; onClose: () => void; vehicleId?: string }) {
  const d = useStore();
  const funds = d.vehicles.filter((v) => v.type === "Fund" && (v.status === "closed" || v.status === "active"));
  const [vehicleId, setVehicleId] = React.useState(initialVehicle ?? funds[0]?.id ?? "");
  const [mode, setMode] = React.useState<"amount" | "pct">("pct");
  const [pct, setPct] = React.useState(10);
  const [amount, setAmount] = React.useState(0);
  const [dueDate, setDueDate] = React.useState(isoDate(addDays(new Date(), 30)));
  const [purpose, setPurpose] = React.useState("");

  const v = d.vehicles.find((x) => x.id === vehicleId);
  const commitments = vehicleSubs(d, vehicleId).filter((s) => s.status === "funded").reduce((a, s) => a + s.amount, 0);
  const called = d.capitalCalls.filter((c) => c.vehicleId === vehicleId && c.status !== "cancelled").reduce((a, c) => a + c.totalAmount, 0);
  const uncalled = commitments - called;
  const total = mode === "pct" ? Math.round((commitments * pct) / 100) : amount;
  const items = vehicleId ? allocateCapitalCall(d, vehicleId, total) : [];

  const submit = () => {
    const r = d.createCapitalCall(vehicleId, total, dueDate, purpose);
    if (toast.result(r)) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="New capital call" description="Draw down committed capital pro-rata across LPs" size="lg" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!v || total <= 0 || total > uncalled}>Create draft</Button></>}>
      {funds.length === 0 ? <p className="text-sm text-muted">No closed or active funds available. Capital calls apply to Funds only.</p> : (
        <div className="space-y-4">
          <Field label="Fund">
            <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>{funds.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select>
          </Field>
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-subtle/60 p-3 text-xs">
            <div><p className="text-faint">Commitments</p><p className="font-semibold tnum">{fmtCurrency(commitments)}</p></div>
            <div><p className="text-faint">Called to date</p><p className="font-semibold tnum">{fmtCurrency(called)}</p></div>
            <div><p className="text-faint">Uncalled</p><p className="font-semibold tnum text-success">{fmtCurrency(uncalled)}</p></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Call basis">
              <Select value={mode} onChange={(e) => setMode(e.target.value as "amount" | "pct")}><option value="pct">% of commitments</option><option value="amount">Fixed amount</option></Select>
            </Field>
            {mode === "pct" ? <Field label="Percentage"><Input type="number" min={1} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} /></Field> : <Field label="Amount"><MoneyInput value={amount} onChange={setAmount} /></Field>}
            <Field label="Due date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            <Field label="Purpose"><Input placeholder="e.g. Q4 deployment – 3 new positions" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
          </div>
          {total > uncalled ? <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">Exceeds uncalled commitments by {fmtCurrency(total - uncalled)}.</p> : null}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">Pro-rata allocation · {fmtCurrency(total)}</p>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {items.map((it) => (
                    <tr key={it.investorId} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{investorName(d, it.investorId)}</td>
                      <td className="px-3 py-2 text-right text-xs text-faint tnum">{commitments ? fmtPct((it.amount / total) * 100) : "—"}</td>
                      <td className="px-3 py-2 text-right font-medium tnum">{fmtCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}

/* ---------------- Distribution ---------------- */
export function DistributionDialog(props: Parameters<typeof DistributionDialogInner>[0]) {
  if (!props.open) return null;
  return <DistributionDialogInner {...props} />;
}

function DistributionDialogInner({ open, onClose, vehicleId: initialVehicle }: { open: boolean; onClose: () => void; vehicleId?: string }) {
  const d = useStore();
  const eligible = d.vehicles.filter((v) => v.status === "active" || v.status === "closed");
  const [vehicleId, setVehicleId] = React.useState(initialVehicle ?? eligible[0]?.id ?? "");
  const [type, setType] = React.useState<DistributionType>("profit");
  const [amount, setAmount] = React.useState(500_000);
  const [date, setDate] = React.useState(isoDate(addDays(new Date(), 7)));
  const [memo, setMemo] = React.useState("");
  const v = d.vehicles.find((x) => x.id === vehicleId);
  const wf = v ? computeWaterfall(d, v, type, amount, date) : null;

  const submit = () => {
    const r = d.createDistribution(vehicleId, type, amount, date, memo);
    if (toast.result(r)) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="New distribution" description="Allocate proceeds through the waterfall and preview carry" size="lg" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!v || amount <= 0 || !wf?.allocations.length}>Create draft</Button></>}>
      {eligible.length === 0 ? <p className="text-sm text-muted">No closed or active vehicles to distribute from.</p> : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Vehicle" className="sm:col-span-2"><Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>{eligible.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select></Field>
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value as DistributionType)}>
                <option value="return_of_capital">Return of capital (no carry)</option>
                <option value="profit">Profit distribution</option>
                <option value="exit">Exit proceeds</option>
              </Select>
            </Field>
            <Field label="Gross amount"><MoneyInput value={amount} onChange={setAmount} /></Field>
            <Field label="Payment date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Memo"><Input placeholder="e.g. Secondary sale proceeds" value={memo} onChange={(e) => setMemo(e.target.value)} /></Field>
          </div>
          {v && wf ? (
            <>
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-subtle/60 p-3 text-xs">
                <div><p className="text-faint">Gross</p><p className="font-semibold tnum">{fmtCurrency(wf.totalGross)}</p></div>
                <div><p className="text-faint">Carry ({v.carryPct}%)</p><p className="font-semibold tnum text-warning">{fmtCurrency(wf.carryAmount)}</p></div>
                <div><p className="text-faint">Net to LPs</p><p className="font-semibold tnum text-success">{fmtCurrency(wf.totalNet)}</p></div>
              </div>
              {wf.notes.map((n) => <p key={n} className="text-xs text-muted">• {n}</p>)}
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-subtle/60 text-[11px] uppercase tracking-wider text-faint"><tr><th className="px-3 py-2 text-left font-semibold">Investor</th><th className="px-3 py-2 text-right font-semibold">Gross</th><th className="px-3 py-2 text-right font-semibold">Carry</th><th className="px-3 py-2 text-right font-semibold">Net</th></tr></thead>
                  <tbody>
                    {wf.allocations.map((a) => (
                      <tr key={a.investorId} className="border-t border-border">
                        <td className="px-3 py-2">{investorName(d, a.investorId)}</td>
                        <td className="px-3 py-2 text-right tnum">{fmtCurrency(a.grossAmount)}</td>
                        <td className="px-3 py-2 text-right tnum text-warning">{a.carry ? `−${fmtCurrency(a.carry)}` : "—"}</td>
                        <td className="px-3 py-2 text-right font-medium tnum">{fmtCurrency(a.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}

/* ---------------- Reject reason ---------------- */
export function RejectDialog(props: Parameters<typeof RejectDialogInner>[0]) {
  if (!props.open) return null;
  return <RejectDialogInner {...props} />;
}

function RejectDialogInner({ open, onClose, onConfirm, title = "Reject subscription" }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void; title?: string }) {
  const [reason, setReason] = React.useState("");
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => { onConfirm(reason); onClose(); }}>Reject</Button></>}>
      <Field label="Reason"><Textarea placeholder="e.g. Failed sanctions screening" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
    </Dialog>
  );
}

/* ---------------- Add investor ---------------- */
export function AddInvestorDialog(props: Parameters<typeof AddInvestorDialogInner>[0]) {
  if (!props.open) return null;
  return <AddInvestorDialogInner {...props} />;
}

function AddInvestorDialogInner({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const createInvestor = useStore((s) => s.createInvestor);
  const [form, setForm] = React.useState({ name: "", email: "", entityType: "individual" as const, country: "United States", taxId: "", notes: "" });
  const submit = () => {
    const r = createInvestor({ ...form, taxId: form.taxId || "***-**-0000" });
    if (toast.result(r)) { onClose(); onCreated?.(r.id); }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Add investor" description="Creates an LP profile. KYC and accreditation start as not verified." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add investor</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name / entity" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe or Acme Family Office LLC" /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Entity type">
          <Select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value as typeof form.entityType })}>
            <option value="individual">Individual</option><option value="entity">Entity / LLC</option><option value="trust">Trust</option><option value="ira">IRA</option>
          </Select>
        </Field>
        <Field label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field>
        <Field label="Tax ID (masked)"><Input placeholder="***-**-1234" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} /></Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}

/* ---------------- Add task ---------------- */
export function AddTaskDialog(props: Parameters<typeof AddTaskDialogInner>[0]) {
  if (!props.open) return null;
  return <AddTaskDialogInner {...props} />;
}

function AddTaskDialogInner({ open, onClose, vehicleId }: { open: boolean; onClose: () => void; vehicleId?: string }) {
  const d = useStore();
  const [form, setForm] = React.useState({ title: "", type: "review" as const, vehicleId: vehicleId ?? "", dueDate: isoDate(addDays(new Date(), 7)), priority: "medium" as const, assignee: "You" });
  const submit = () => {
    const r = d.createTask({ title: form.title, type: form.type, vehicleId: form.vehicleId || undefined, dueDate: form.dueDate, priority: form.priority, assignee: form.assignee });
    if (toast.result(r)) onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title="New task" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Create task</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>{["kyc", "filing", "tax", "signature", "wire", "review"].map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        <Field label="Vehicle"><Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}><option value="">— None —</option>{d.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
        <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
        <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as typeof form.priority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
        <Field label="Assignee" className="sm:col-span-2"><Input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}
