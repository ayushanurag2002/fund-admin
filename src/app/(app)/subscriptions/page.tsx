"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, Avatar, SegmentedControl } from "@/components/ui/misc";
import { Select } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge, subTone, kycTone, Badge } from "@/components/ui/badge";
import { SubscriptionActions } from "@/components/domain/subscription-actions";
import { fmtCurrency, relativeTime, titleCase, cn } from "@/lib/utils";
import { investorName, vehicleName, SUB_STATUS_ORDER } from "@/lib/selectors";
import type { Subscription, SubscriptionStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";

const PIPELINE: SubscriptionStatus[] = ["invited", "signed", "kyc_review", "approved", "wire_pending", "funded"];

export default function SubscriptionsPage() {
  const d = useStore();
  const [view, setView] = React.useState<"board" | "table">("board");
  const [vehicleId, setVehicleId] = React.useState("all");
  const subs = d.subscriptions.filter((s) => vehicleId === "all" || s.vehicleId === vehicleId);
  const openVehicles = d.vehicles.filter((v) => d.subscriptions.some((s) => s.vehicleId === v.id));

  const columns: Column<Subscription>[] = [
    { key: "investor", header: "Investor", sortValue: (s) => investorName(d, s.investorId), render: (s) => (<div className="flex items-center gap-3"><Avatar name={investorName(d, s.investorId)} size="sm" /><Link href={`/investors/${s.investorId}`} className="font-medium hover:underline">{investorName(d, s.investorId)}</Link></div>) },
    { key: "vehicle", header: "Vehicle", sortValue: (s) => vehicleName(d, s.vehicleId), render: (s) => <Link href={`/vehicles/${s.vehicleId}`} className="text-muted hover:underline">{vehicleName(d, s.vehicleId)}</Link> },
    { key: "kyc", header: "KYC", render: (s) => <StatusBadge status={d.investors.find((i) => i.id === s.investorId)!.kycStatus} map={kycTone} /> },
    { key: "amount", header: "Amount", align: "right", sortValue: (s) => s.amount, render: (s) => <span className="font-medium">{fmtCurrency(s.amount)}</span> },
    { key: "status", header: "Status", sortValue: (s) => SUB_STATUS_ORDER.indexOf(s.status), render: (s) => <StatusBadge status={s.status} map={subTone} /> },
    { key: "updated", header: "Updated", sortValue: (s) => s.fundedAt ?? s.approvedAt ?? s.signedAt ?? s.invitedAt, render: (s) => <span className="text-xs text-muted">{relativeTime(s.fundedAt ?? s.approvedAt ?? s.signedAt ?? s.invitedAt)}</span> },
    { key: "actions", header: "", align: "right", render: (s) => <SubscriptionActions sub={s} /> },
  ];

  return (
    <>
      <PageHeader title="Subscriptions" subtitle="Investor onboarding pipeline across all raises" actions={<SegmentedControl options={[{ value: "board", label: "Board" }, { value: "table", label: "Table" }]} value={view} onChange={setView} />} />
      <div className="mb-4 w-full sm:w-80"><Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}><option value="all">All vehicles</option>{openVehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></div>

      {view === "table" ? <DataTable rows={subs} columns={columns} rowKey={(s) => s.id} initialSort={{ key: "status", dir: "asc" }} /> : (
        <div className="scroll-area -mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {PIPELINE.map((stage) => {
            const items = subs.filter((s) => s.status === stage);
            const total = items.reduce((a, s) => a + s.amount, 0);
            return (
              <div key={stage} className="flex w-[290px] shrink-0 flex-col rounded-xl border border-border bg-subtle/40">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2"><StatusBadge status={stage} map={subTone} /><span className="text-xs text-faint tnum">{items.length}</span></div>
                  <span className="text-xs font-medium text-muted tnum">{fmtCurrency(total, { compact: true })}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                  {items.length === 0 ? <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-faint">Empty</div> : null}
                  {items.map((s) => {
                    const inv = d.investors.find((i) => i.id === s.investorId)!;
                    return (
                      <Card key={s.id} className="p-3">
                        <div className="flex items-start gap-2">
                          <Avatar name={inv.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <Link href={`/investors/${inv.id}`} className="block truncate text-[13px] font-medium hover:underline">{inv.name}</Link>
                            <Link href={`/vehicles/${s.vehicleId}`} className="block truncate text-[11.5px] text-muted hover:underline">{vehicleName(d, s.vehicleId)}</Link>
                          </div>
                          <span className="text-[13px] font-semibold tnum">{fmtCurrency(s.amount, { compact: true })}</span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Badge tone={kycTone[inv.kycStatus]} className={cn("px-1.5 text-[10.5px]")}>KYC {titleCase(inv.kycStatus)}</Badge>
                          </div>
                          <SubscriptionActions sub={s} compact />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex w-[220px] shrink-0 flex-col rounded-xl border border-dashed border-border bg-transparent">
            <div className="flex items-center justify-between px-3 py-2.5"><StatusBadge status="rejected" map={subTone} /><span className="text-xs text-faint tnum">{subs.filter((s) => s.status === "rejected").length}</span></div>
            <div className="flex flex-col gap-2 px-2 pb-2">
              {subs.filter((s) => s.status === "rejected").map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-elev p-3 opacity-75">
                  <p className="truncate text-[13px] font-medium">{investorName(d, s.investorId)}</p>
                  <p className="truncate text-[11px] text-muted">{vehicleName(d, s.vehicleId)}</p>
                  <p className="mt-1 text-[11px] text-danger">{s.rejectedReason}</p>
                  <div className="mt-2 flex justify-end"><SubscriptionActions sub={s} compact /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
