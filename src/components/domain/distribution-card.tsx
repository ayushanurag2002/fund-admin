"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { Distribution } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, distTone, Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { fmtCurrency, fmtDate, titleCase, cn } from "@/lib/utils";
import { investorName, vehicleName } from "@/lib/selectors";
import { ChevronDown, CheckCircle2, Banknote, Trash2 } from "lucide-react";

export function DistributionCard({ dist, showVehicle, defaultOpen }: { dist: Distribution; showVehicle?: boolean; defaultOpen?: boolean }) {
  const d = useStore();
  const [open, setOpen] = React.useState(!!defaultOpen);
  const net = dist.totalAmount - dist.carryAmount;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success"><Banknote className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{dist.memo}</p>
            <p className="truncate text-xs text-muted">
              {showVehicle ? <><Link href={`/vehicles/${dist.vehicleId}`} className="hover:text-fg hover:underline" onClick={(e) => e.stopPropagation()}>{vehicleName(d, dist.vehicleId)}</Link> · </> : null}
              {fmtDate(dist.date)} · {dist.allocations.length} LPs
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")} />
        </button>
        <div className="flex items-center gap-3">
          <Badge tone="neutral">{titleCase(dist.type)}</Badge>
          <div className="text-right">
            <p className="text-sm font-semibold tnum">{fmtCurrency(dist.totalAmount)}</p>
            <p className="text-[11px] text-muted tnum">net {fmtCurrency(net)}{dist.carryAmount ? ` · carry ${fmtCurrency(dist.carryAmount)}` : ""}</p>
          </div>
          <StatusBadge status={dist.status} map={distTone} />
        </div>
      </div>
      {open ? (
        <div className="border-t border-border">
          <div className="flex flex-wrap items-center gap-2 bg-subtle/40 px-4 py-2.5">
            {dist.status === "draft" ? <Button size="sm" onClick={() => toast.result(d.approveDistribution(dist.id))}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button> : null}
            {dist.status === "approved" ? <Button size="sm" variant="success" onClick={() => toast.result(d.payDistribution(dist.id))}><Banknote className="h-3.5 w-3.5" /> Pay & book to ledger</Button> : null}
            {dist.status !== "paid" ? <Button size="sm" variant="ghost" className="text-danger" onClick={() => toast.result(d.deleteDistribution(dist.id))}><Trash2 className="h-3.5 w-3.5" /> Delete</Button> : null}
          </div>
          <div className="scroll-area overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-faint"><tr><th className="px-4 py-2 text-left font-semibold">Investor</th><th className="px-4 py-2 text-right font-semibold">Gross</th><th className="px-4 py-2 text-right font-semibold">Carry</th><th className="px-4 py-2 text-right font-semibold">Net</th></tr></thead>
            <tbody>
              {dist.allocations.map((a) => (
                <tr key={a.investorId} className="border-t border-border">
                  <td className="px-4 py-2"><Link href={`/investors/${a.investorId}`} className="hover:underline">{investorName(d, a.investorId)}</Link></td>
                  <td className="px-4 py-2 text-right tnum">{fmtCurrency(a.grossAmount)}</td>
                  <td className="px-4 py-2 text-right tnum text-warning">{a.carry ? `−${fmtCurrency(a.carry)}` : "—"}</td>
                  <td className="px-4 py-2 text-right font-medium tnum">{fmtCurrency(a.netAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ) : null}
    </Card>
  );
}
