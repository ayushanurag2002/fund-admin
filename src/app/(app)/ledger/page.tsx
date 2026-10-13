"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, Stat } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select, Field, MoneyInput } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { Bars } from "@/components/charts/charts";
import { fmtCurrency, fmtDate, titleCase, downloadCsv, sum, isoDate } from "@/lib/utils";
import { investorName, vehicleName } from "@/lib/selectors";
import type { LedgerEntry, LedgerType } from "@/lib/types";
import { Download, Plus, Search } from "lucide-react";

const TYPES: LedgerType[] = ["contribution", "distribution", "investment", "management_fee", "expense", "carry"];
const tone = (t: LedgerType) => (t === "contribution" ? "success" : t === "distribution" ? "info" : t === "investment" ? "violet" : t === "carry" ? "teal" : "warning");

export default function LedgerPage() {
  const d = useStore();
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState("all");
  const [vehicleId, setVehicleId] = React.useState("all");
  const [add, setAdd] = React.useState(false);

  const rows = d.ledger.filter((l) => {
    if (type !== "all" && l.type !== type) return false;
    if (vehicleId !== "all" && l.vehicleId !== vehicleId) return false;
    const t = q.toLowerCase();
    return !t || l.memo.toLowerCase().includes(t) || investorName(d, l.investorId).toLowerCase().includes(t) || vehicleName(d, l.vehicleId).toLowerCase().includes(t);
  });

  const byType = TYPES.map((t) => ({ label: titleCase(t).replace("Management ", "Mgmt "), amount: Math.abs(sum(rows.filter((l) => l.type === t).map((l) => l.amount))) }));
  const inflows = sum(rows.filter((l) => l.amount > 0).map((l) => l.amount));
  const outflows = -sum(rows.filter((l) => l.amount < 0).map((l) => l.amount));

  const columns: Column<LedgerEntry>[] = [
    { key: "date", header: "Date", sortValue: (l) => l.date, render: (l) => <span className="text-muted">{fmtDate(l.date)}</span> },
    { key: "vehicle", header: "Vehicle", sortValue: (l) => vehicleName(d, l.vehicleId), render: (l) => <Link href={`/vehicles/${l.vehicleId}`} className="hover:underline">{vehicleName(d, l.vehicleId)}</Link> },
    { key: "type", header: "Type", sortValue: (l) => l.type, render: (l) => <Badge tone={tone(l.type)}>{titleCase(l.type)}</Badge> },
    { key: "party", header: "Counterparty", render: (l) => (l.investorId ? <Link href={`/investors/${l.investorId}`} className="hover:underline">{investorName(d, l.investorId)}</Link> : <span className="text-faint">—</span>) },
    { key: "memo", header: "Memo", render: (l) => <span className="text-muted">{l.memo}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (l) => l.amount, render: (l) => <span className={l.amount < 0 ? "font-medium text-danger" : "font-medium text-success"}>{l.amount < 0 ? "−" : "+"}{fmtCurrency(Math.abs(l.amount))}</span> },
  ];

  return (
    <>
      <PageHeader title="Ledger" subtitle="Every cash movement across vehicles, double-checked against subscriptions, calls and distributions" actions={<><Button variant="outline" onClick={() => downloadCsv("ledger.csv", rows.map((l) => ({ date: l.date, vehicle: vehicleName(d, l.vehicleId), type: l.type, counterparty: investorName(d, l.investorId), memo: l.memo, amount: l.amount, reference: l.reference ?? "" })))}><Download className="h-4 w-4" /> Export CSV</Button><Button onClick={() => setAdd(true)}><Plus className="h-4 w-4" /> Manual entry</Button></>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Inflows (filtered)" value={fmtCurrency(inflows, { compact: true })} tone="success" />
        <Stat label="Outflows (filtered)" value={fmtCurrency(outflows, { compact: true })} tone="warning" />
        <Stat label="Net" value={fmtCurrency(inflows - outflows, { compact: true })} hint={`${rows.length} entries`} tone="brand" />
      </div>
      <div className="mb-6 rounded-xl border border-border bg-elev p-5 shadow-card"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">Volume by type</p><Bars data={byType} keys={[{ key: "amount", label: "Amount" }]} height={160} /></div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" /><Input className="pl-9" placeholder="Search memo, investor, vehicle…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="w-full sm:w-64"><Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}><option value="all">All vehicles</option>{d.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></div>
        <div className="w-full sm:w-44"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option>{TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></div>
      </div>
      <DataTable rows={rows} columns={columns} rowKey={(l) => l.id} initialSort={{ key: "date", dir: "desc" }} dense pageSize={30} />
      <ManualEntryDialog open={add} onClose={() => setAdd(false)} />
    </>
  );
}

function ManualEntryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = useStore();
  const [form, setForm] = React.useState({ vehicleId: d.vehicles[0]?.id ?? "", type: "expense" as LedgerType, amount: 0, date: isoDate(new Date()), memo: "" });
  const submit = () => {
    if (!form.memo.trim() || form.amount <= 0) return toast.error("Memo and a positive amount are required");
    const sign = form.type === "contribution" ? 1 : -1;
    const r = d.addLedgerEntry({ vehicleId: form.vehicleId, type: form.type, amount: sign * form.amount, date: form.date, memo: form.memo });
    if (toast.result(r)) onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Manual ledger entry" description="Use for expenses, fees or adjustments. Contributions and distributions should flow through their workflows." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Post entry</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Vehicle" className="sm:col-span-2"><Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>{d.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
        <Field label="Type"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LedgerType })}>{["expense", "management_fee", "investment", "carry"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
        <Field label="Amount" hint="Booked as an outflow"><MoneyInput value={form.amount} onChange={(n) => setForm({ ...form, amount: n })} /></Field>
        <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Memo"><Input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}
