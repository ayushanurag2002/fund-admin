"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ShieldCheck, Download } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader, Avatar, Stat } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge, kycTone, accrTone, Badge } from "@/components/ui/badge";
import { AddInvestorDialog } from "@/components/domain/dialogs";
import { fmtCurrency, titleCase, downloadCsv } from "@/lib/utils";
import { investorCommitted, investorContributions, investorVehicles } from "@/lib/selectors";
import type { Investor } from "@/lib/types";

export default function InvestorsPage() {
  const d = useStore();
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [kyc, setKyc] = React.useState("all");
  const [add, setAdd] = React.useState(false);

  const rows = d.investors.filter((i) => {
    if (kyc !== "all" && i.kycStatus !== kyc) return false;
    const t = q.toLowerCase();
    return !t || i.name.toLowerCase().includes(t) || i.email.toLowerCase().includes(t) || i.country.toLowerCase().includes(t);
  });

  const columns: Column<Investor>[] = [
    { key: "name", header: "Investor", sortValue: (i) => i.name, render: (i) => (<div className="flex items-center gap-3"><Avatar name={i.name} /><div className="min-w-0"><p className="truncate font-medium">{i.name}</p><p className="truncate text-xs text-muted">{i.email}</p></div></div>) },
    { key: "type", header: "Type", sortValue: (i) => i.entityType, render: (i) => <Badge>{i.entityType.toUpperCase() === "IRA" ? "IRA" : titleCase(i.entityType)}</Badge> },
    { key: "country", header: "Country", sortValue: (i) => i.country, render: (i) => <span className="text-muted">{i.country}</span> },
    { key: "kyc", header: "KYC", sortValue: (i) => i.kycStatus, render: (i) => <StatusBadge status={i.kycStatus} map={kycTone} /> },
    { key: "accr", header: "Accreditation", sortValue: (i) => i.accreditation, render: (i) => <StatusBadge status={i.accreditation} map={accrTone} /> },
    { key: "vehicles", header: "Vehicles", align: "right", sortValue: (i) => investorVehicles(d, i.id).length, render: (i) => investorVehicles(d, i.id).length },
    { key: "committed", header: "Committed", align: "right", sortValue: (i) => investorCommitted(d, i.id), render: (i) => <span className="font-medium">{fmtCurrency(investorCommitted(d, i.id), { compact: true })}</span> },
    { key: "contributed", header: "Contributed", align: "right", sortValue: (i) => investorContributions(d, i.id), render: (i) => fmtCurrency(investorContributions(d, i.id), { compact: true }) },
  ];

  const pending = d.investors.filter((i) => i.kycStatus === "pending").length;
  const verified = d.investors.filter((i) => i.accreditation === "verified").length;

  return (
    <>
      <PageHeader title="Investors" subtitle="Limited partners across all vehicles" actions={<><Button variant="outline" onClick={() => downloadCsv("investors.csv", d.investors.map((i) => ({ name: i.name, email: i.email, type: i.entityType, country: i.country, kyc: i.kycStatus, accreditation: i.accreditation, committed: investorCommitted(d, i.id) })))}><Download className="h-4 w-4" /> Export</Button><Button onClick={() => setAdd(true)}><Plus className="h-4 w-4" /> Add investor</Button></>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total investors" value={d.investors.length} hint={`${d.investors.filter((i) => i.entityType === "entity").length} entities`} tone="brand" />
        <Stat label="KYC pending review" value={pending} hint="awaiting your decision" tone="warning" />
        <Stat label="Accredited" value={`${verified}/${d.investors.length}`} hint={`${d.investors.filter((i) => i.accreditation === "expired").length} expired`} icon={<ShieldCheck className="h-4 w-4" />} tone="success" />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" /><Input className="pl-9" placeholder="Search investors…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="w-44"><Select value={kyc} onChange={(e) => setKyc(e.target.value)}><option value="all">All KYC statuses</option>{["not_started", "pending", "approved", "rejected"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</Select></div>
      </div>
      <DataTable rows={rows} columns={columns} rowKey={(i) => i.id} onRowClick={(i) => router.push(`/investors/${i.id}`)} initialSort={{ key: "committed", dir: "desc" }} />
      <AddInvestorDialog open={add} onClose={() => setAdd(false)} onCreated={(id) => router.push(`/investors/${id}`)} />
    </>
  );
}
