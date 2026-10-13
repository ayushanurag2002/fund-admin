"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Stat, PageHeader, Avatar, Progress } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AreaTrend, Donut, Bars } from "@/components/charts/charts";
import { Badge, StatusBadge, vehicleTone, priorityTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtCurrency, fmtDate, relativeTime, daysUntil, sum, titleCase } from "@/lib/utils";
import { totalAum, vehicleCommitted, vehicleNav, managerName, vehicleName } from "@/lib/selectors";
import { Landmark, Users, ArrowDownToLine, Wallet, ArrowRight, AlertTriangle } from "lucide-react";
import type { AppData } from "@/lib/types";

function monthlySeries(d: AppData) {
  const months: { label: string; key: string; contributions: number; distributions: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: dt.toLocaleString("en-US", { month: "short" }), key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`, contributions: 0, distributions: 0 });
  }
  for (const l of d.ledger) {
    const m = months.find((x) => x.key === l.date.slice(0, 7));
    if (!m) continue;
    if (l.type === "contribution") m.contributions += l.amount;
    if (l.type === "distribution") m.distributions += -l.amount;
  }
  let cum = 0;
  return months.map((m) => {
    cum += m.contributions;
    return { ...m, cumulative: cum };
  });
}

export default function DashboardPage() {
  const d = useStore();
  const aum = totalAum(d);
  const activeVehicles = d.vehicles.filter((v) => v.status === "active" || v.status === "closed");
  const raising = d.vehicles.filter((v) => v.status === "raising" || v.status === "closing");
  const openCalls = d.capitalCalls.filter((c) => c.status === "sent" || c.status === "partially_funded");
  const outstanding = sum(openCalls.flatMap((c) => c.items.filter((i) => !i.received).map((i) => i.amount)));
  const kycPending = d.investors.filter((i) => i.kycStatus === "pending").length;
  const openTasks = d.tasks.filter((t) => t.status !== "done");
  const overdue = openTasks.filter((t) => daysUntil(t.dueDate) < 0);
  const series = monthlySeries(d);

  const bySector = Object.entries(
    activeVehicles.reduce<Record<string, number>>((acc, v) => {
      acc[v.sector] = (acc[v.sector] ?? 0) + vehicleNav(d, v);
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const statusCounts = ["draft", "raising", "closing", "closed", "active", "liquidated"].map((s) => ({ label: titleCase(s), count: d.vehicles.filter((v) => v.status === s).length }));

  return (
    <>
      <PageHeader title="Good to see you, Admin" subtitle={`${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${raising.length} vehicle${raising.length === 1 ? "" : "s"} raising · ${openCalls.length} open capital call${openCalls.length === 1 ? "" : "s"}`} actions={<Link href="/vehicles/new"><Button>New vehicle</Button></Link>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Assets under administration" value={fmtCurrency(aum, { compact: true })} delta={12.4} hint="vs. last quarter" icon={<Wallet className="h-4 w-4" />} tone="brand" />
        <Stat label="Active vehicles" value={activeVehicles.length} hint={`${raising.length} raising · ${d.vehicles.filter((v) => v.status === "draft").length} in draft`} icon={<Landmark className="h-4 w-4" />} tone="violet" />
        <Stat label="Investors" value={d.investors.length} hint={`${kycPending} awaiting KYC review`} icon={<Users className="h-4 w-4" />} tone="teal" />
        <Stat label="Uncalled / outstanding" value={fmtCurrency(outstanding, { compact: true })} hint={`${openCalls.length} capital calls in flight`} icon={<ArrowDownToLine className="h-4 w-4" />} tone="warning" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Capital flows" subtitle="Contributions received vs. distributions paid, trailing 12 months" />
          <CardBody>
            <AreaTrend data={series} keys={[{ key: "contributions", label: "Contributions" }, { key: "distributions", label: "Distributions", color: "var(--teal)" }]} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="NAV by sector" subtitle="Active & closed vehicles" />
          <CardBody>
            <Donut data={bySector} height={180} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Raises in progress" subtitle="Committed vs. target" action={<Link href="/vehicles" className="text-[13px] font-medium text-brand hover:underline">All vehicles</Link>} />
          <CardBody className="space-y-4">
            {raising.length === 0 ? <p className="text-sm text-muted">No vehicles are currently raising.</p> : null}
            {raising.map((v) => {
              const committed = vehicleCommitted(d, v.id);
              const pct = (committed / v.targetRaise) * 100;
              return (
                <Link key={v.id} href={`/vehicles/${v.id}`} className="block rounded-lg border border-border p-3.5 transition-colors hover:bg-hover">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted">{managerName(d, v.managerId)} · closes {fmtDate(v.targetCloseDate)} · {daysUntil(v.targetCloseDate)}d left</p>
                    </div>
                    <StatusBadge status={v.status} map={vehicleTone} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={pct} tone={pct >= 100 ? "success" : pct > 60 ? "brand" : "warning"} className="flex-1" />
                    <span className="text-xs tnum text-muted">{fmtCurrency(committed, { compact: true })} / {fmtCurrency(v.targetRaise, { compact: true })} · {pct.toFixed(0)}%</span>
                  </div>
                </Link>
              );
            })}
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">Vehicles by stage</p>
              <Bars data={statusCounts} keys={[{ key: "count", label: "Vehicles" }]} money={false} height={150} />
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Needs attention" subtitle={`${openTasks.length} open · ${overdue.length} overdue`} action={<Link href="/tasks" className="text-[13px] font-medium text-brand hover:underline">Tasks</Link>} />
            <CardBody className="space-y-2">
              {openTasks
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .slice(0, 5)
                .map((t) => {
                  const du = daysUntil(t.dueDate);
                  return (
                    <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                      <span className={du < 0 ? "mt-0.5 text-danger" : "mt-0.5 text-faint"}>{du < 0 ? <AlertTriangle className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{t.title}</p>
                        <p className="text-xs text-muted">{t.vehicleId ? vehicleName(d, t.vehicleId) : "Investor"} · {du < 0 ? `${-du}d overdue` : du === 0 ? "due today" : `due in ${du}d`}</p>
                      </div>
                      <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                    </div>
                  );
                })}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Recent activity" />
            <CardBody>
              <ul className="space-y-3">
                {d.activity.slice(0, 7).map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <Avatar name={a.actor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-5"><span className="font-medium">{a.actor}</span> <span className="text-muted">{a.action}</span></p>
                      <p className="text-[11px] text-faint">{relativeTime(a.at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
