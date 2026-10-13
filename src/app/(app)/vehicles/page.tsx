"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Landmark, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader, Progress, SegmentedControl } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge, vehicleTone, Badge } from "@/components/ui/badge";
import { fmtCurrency, fmtDate, titleCase } from "@/lib/utils";
import { managerName, vehicleCommitted, vehicleNav, vehicleSubs, COMMITTED_STATUSES, VEHICLE_STATUS_ORDER } from "@/lib/selectors";
import type { Vehicle } from "@/lib/types";

export default function VehiclesPage() {
  const d = useStore();
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<"all" | "SPV" | "Fund">("all");
  const [status, setStatus] = React.useState<string>("all");

  const rows = d.vehicles.filter((v) => {
    if (type !== "all" && v.type !== type) return false;
    if (status !== "all" && v.status !== status) return false;
    const t = q.toLowerCase();
    return !t || v.name.toLowerCase().includes(t) || v.portfolioCompany.toLowerCase().includes(t) || managerName(d, v.managerId).toLowerCase().includes(t);
  });

  const columns: Column<Vehicle>[] = [
    {
      key: "name",
      header: "Vehicle",
      sortValue: (v) => v.name,
      render: (v) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"><Landmark className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="truncate font-medium">{v.name}</p>
            <p className="truncate text-xs text-muted">{v.portfolioCompany} · {v.sector}</p>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", sortValue: (v) => v.type, render: (v) => <Badge tone={v.type === "Fund" ? "violet" : "info"}>{v.type}</Badge> },
    { key: "status", header: "Status", sortValue: (v) => VEHICLE_STATUS_ORDER.indexOf(v.status), render: (v) => <StatusBadge status={v.status} map={vehicleTone} /> },
    { key: "manager", header: "Manager", sortValue: (v) => managerName(d, v.managerId), render: (v) => <span className="text-muted">{managerName(d, v.managerId)}</span> },
    {
      key: "raise",
      header: "Committed / Target",
      sortValue: (v) => vehicleCommitted(d, v.id),
      width: "220px",
      render: (v) => {
        const c = vehicleCommitted(d, v.id);
        const pct = (c / v.targetRaise) * 100;
        return (
          <div>
            <div className="flex justify-between text-xs tnum"><span className="font-medium">{fmtCurrency(c, { compact: true })}</span><span className="text-faint">{fmtCurrency(v.targetRaise, { compact: true })}</span></div>
            <Progress value={pct} className="mt-1.5" tone={pct >= 100 ? "success" : "brand"} />
          </div>
        );
      },
    },
    { key: "investors", header: "LPs", align: "right", sortValue: (v) => vehicleSubs(d, v.id).filter((s) => COMMITTED_STATUSES.includes(s.status)).length, render: (v) => vehicleSubs(d, v.id).filter((s) => COMMITTED_STATUSES.includes(s.status)).length },
    { key: "nav", header: "NAV", align: "right", sortValue: (v) => vehicleNav(d, v), render: (v) => <span className="font-medium">{fmtCurrency(vehicleNav(d, v), { compact: true })}</span> },
    { key: "close", header: "Close", sortValue: (v) => v.targetCloseDate, render: (v) => <span className="text-muted">{fmtDate(v.closedAt ?? v.targetCloseDate)}</span> },
  ];

  return (
    <>
      <PageHeader title="Vehicles" subtitle={`${d.vehicles.length} SPVs and funds under administration`} actions={<Link href="/vehicles/new"><Button><Plus className="h-4 w-4" /> New vehicle</Button></Link>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input className="pl-9" placeholder="Search by name, company, manager…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <SegmentedControl options={[{ value: "all", label: "All" }, { value: "SPV", label: "SPVs" }, { value: "Fund", label: "Funds" }]} value={type} onChange={setType} />
        <div className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {VEHICLE_STATUS_ORDER.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </div>
      </div>
      <DataTable rows={rows} columns={columns} rowKey={(v) => v.id} onRowClick={(v) => router.push(`/vehicles/${v.id}`)} empty="No vehicles match your filters" />
    </>
  );
}
