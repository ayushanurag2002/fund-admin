"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Stat, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { DistributionCard } from "@/components/domain/distribution-card";
import { DistributionDialog } from "@/components/domain/dialogs";
import { fmtCurrency, sum, titleCase } from "@/lib/utils";
import { Plus, ArrowUpFromLine } from "lucide-react";

export default function DistributionsPage() {
  const d = useStore();
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState("all");
  const dists = d.distributions.filter((x) => status === "all" || x.status === status).sort((a, b) => b.date.localeCompare(a.date));
  const paid = d.distributions.filter((x) => x.status === "paid");
  const pending = d.distributions.filter((x) => x.status !== "paid");

  return (
    <>
      <PageHeader title="Distributions" subtitle="Proceeds returned to LPs through the waterfall" actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New distribution</Button>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Paid to LPs (lifetime)" value={fmtCurrency(sum(paid.map((x) => x.totalAmount - x.carryAmount)), { compact: true })} hint={`${paid.length} distributions`} tone="success" icon={<ArrowUpFromLine className="h-4 w-4" />} />
        <Stat label="Carry earned by GPs" value={fmtCurrency(sum(paid.map((x) => x.carryAmount)), { compact: true })} hint="from paid distributions" tone="violet" />
        <Stat label="Pending approval / payment" value={fmtCurrency(sum(pending.map((x) => x.totalAmount)), { compact: true })} hint={`${pending.length} in queue`} tone="warning" />
      </div>
      <div className="mb-4 w-48"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{["draft", "approved", "paid"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</Select></div>
      <div className="space-y-3">
        {dists.length === 0 ? <EmptyState icon={<ArrowUpFromLine className="h-5 w-5" />} title="No distributions" action={<Button onClick={() => setOpen(true)}>New distribution</Button>} /> : null}
        {dists.map((x) => <DistributionCard key={x.id} dist={x} showVehicle defaultOpen={x.status !== "paid"} />)}
      </div>
      <DistributionDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
