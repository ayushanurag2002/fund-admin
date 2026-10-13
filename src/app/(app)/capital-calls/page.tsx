"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Stat, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { CapitalCallCard } from "@/components/domain/capital-call-card";
import { CapitalCallDialog } from "@/components/domain/dialogs";
import { fmtCurrency, sum, titleCase } from "@/lib/utils";
import { Plus, ArrowDownToLine } from "lucide-react";

export default function CapitalCallsPage() {
  const d = useStore();
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState("all");
  const calls = d.capitalCalls.filter((c) => status === "all" || c.status === status).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const live = d.capitalCalls.filter((c) => c.status === "sent" || c.status === "partially_funded");
  const outstanding = sum(live.flatMap((c) => c.items.filter((i) => !i.received).map((i) => i.amount)));
  const received = sum(live.flatMap((c) => c.items.filter((i) => i.received).map((i) => i.amount)));
  const totalCalled = sum(d.capitalCalls.filter((c) => c.status !== "cancelled").map((c) => c.totalAmount));

  return (
    <>
      <PageHeader title="Capital calls" subtitle="Drawdowns against LP commitments for funds" actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New capital call</Button>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Open calls" value={live.length} hint={`${live.flatMap((c) => c.items.filter((i) => !i.received)).length} wires outstanding`} tone="brand" />
        <Stat label="Outstanding" value={fmtCurrency(outstanding, { compact: true })} hint={`${fmtCurrency(received, { compact: true })} received on open calls`} tone="warning" icon={<ArrowDownToLine className="h-4 w-4" />} />
        <Stat label="Total called (lifetime)" value={fmtCurrency(totalCalled, { compact: true })} hint={`${d.capitalCalls.length} calls issued`} tone="violet" />
      </div>
      <div className="mb-4 w-48"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{["draft", "sent", "partially_funded", "funded", "cancelled"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</Select></div>
      <div className="space-y-3">
        {calls.length === 0 ? <EmptyState icon={<ArrowDownToLine className="h-5 w-5" />} title="No capital calls" description="Create one for a closed or active fund." action={<Button onClick={() => setOpen(true)}>New capital call</Button>} /> : null}
        {calls.map((c) => <CapitalCallCard key={c.id} call={c} showVehicle defaultOpen={c.status === "draft" || c.status === "sent" || c.status === "partially_funded"} />)}
      </div>
      <CapitalCallDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
