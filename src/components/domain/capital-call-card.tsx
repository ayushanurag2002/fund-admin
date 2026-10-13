"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { CapitalCall } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { StatusBadge, callTone } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { fmtCurrency, fmtDate, daysUntil, fmtDateTime } from "@/lib/utils";
import { investorName, vehicleName } from "@/lib/selectors";
import { ChevronDown, Send, Ban, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CapitalCallCard({ call, showVehicle, defaultOpen }: { call: CapitalCall; showVehicle?: boolean; defaultOpen?: boolean }) {
  const d = useStore();
  const [open, setOpen] = React.useState(!!defaultOpen);
  const received = call.items.filter((i) => i.received).reduce((a, i) => a + i.amount, 0);
  const pct = call.totalAmount ? (received / call.totalAmount) * 100 : 0;
  const du = daysUntil(call.dueDate);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-sm font-semibold tnum">#{call.number}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{call.purpose}</p>
            <p className="truncate text-xs text-muted">
              {showVehicle ? <><Link href={`/vehicles/${call.vehicleId}`} className="hover:text-fg hover:underline" onClick={(e) => e.stopPropagation()}>{vehicleName(d, call.vehicleId)}</Link> · </> : null}
              Issued {fmtDate(call.issuedAt)} · Due {fmtDate(call.dueDate)}
              {call.status === "sent" || call.status === "partially_funded" ? <span className={cn("ml-1", du < 0 ? "text-danger" : "")}>({du < 0 ? `${-du}d overdue` : `${du}d left`})</span> : null}
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")} />
        </button>
        <div className="flex items-center gap-4 sm:w-[340px]">
          <div className="flex-1">
            <div className="flex justify-between text-xs tnum"><span className="font-medium">{fmtCurrency(received, { compact: true })}</span><span className="text-faint">of {fmtCurrency(call.totalAmount, { compact: true })}</span></div>
            <Progress value={pct} tone={pct >= 100 ? "success" : "brand"} className="mt-1.5" />
          </div>
          <StatusBadge status={call.status} map={callTone} />
        </div>
      </div>
      {open ? (
        <div className="border-t border-border">
          <div className="flex flex-wrap items-center gap-2 bg-subtle/40 px-4 py-2.5">
            {call.status === "draft" ? <Button size="sm" onClick={() => toast.result(d.issueCapitalCall(call.id))}><Send className="h-3.5 w-3.5" /> Issue notices</Button> : null}
            {(call.status === "draft" || call.status === "sent") ? <Button size="sm" variant="ghost" className="text-danger" onClick={() => toast.result(d.cancelCapitalCall(call.id))}><Ban className="h-3.5 w-3.5" /> Cancel</Button> : null}
            <span className="ml-auto text-xs text-muted">{call.items.filter((i) => i.received).length}/{call.items.length} LPs funded</span>
          </div>
          <div className="scroll-area overflow-x-auto"><table className="w-full text-sm">
            <tbody>
              {call.items.map((it) => (
                <tr key={it.investorId} className="border-t border-border">
                  <td className="px-4 py-2"><Link href={`/investors/${it.investorId}`} className="hover:underline">{investorName(d, it.investorId)}</Link></td>
                  <td className="px-4 py-2 text-right tnum">{fmtCurrency(it.amount)}</td>
                  <td className="px-4 py-2 text-right text-xs text-muted">{it.received ? `Received ${fmtDateTime(it.receivedAt)}` : "Awaiting wire"}</td>
                  <td className="px-4 py-2 text-right">
                    {it.received ? <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Check className="h-3.5 w-3.5" /> Paid</span> : (
                      <Button size="sm" variant="outline" disabled={call.status === "draft" || call.status === "cancelled"} onClick={() => toast.result(d.markCallItemReceived(call.id, it.investorId))}>Record wire</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ) : null}
    </Card>
  );
}
