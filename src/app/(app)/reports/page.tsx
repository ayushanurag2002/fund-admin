"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, Stat, SegmentedControl } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Badge, StatusBadge, vehicleTone } from "@/components/ui/badge";
import { Bars, Donut } from "@/components/charts/charts";
import { fmtCurrency, downloadCsv, sum } from "@/lib/utils";
import { vehicleNav, vehicleContributions, vehicleDistributed, vehicleMoic, managerName, capTable, investorContributions, investorDistributions, totalAum } from "@/lib/selectors";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const d = useStore();
  const [view, setView] = React.useState<"performance" | "statements" | "gp">("performance");
  const [investorId, setInvestorId] = React.useState(d.investors[0]?.id ?? "");
  const perf = d.vehicles
    .filter((v) => v.status !== "draft" && v.status !== "raising")
    .map((v) => ({ v, contributed: vehicleContributions(d, v.id), distributed: vehicleDistributed(d, v.id), nav: vehicleNav(d, v), moic: vehicleMoic(d, v) }))
    .sort((a, b) => b.nav - a.nav);

  const gpRows = d.managers.map((m) => {
    const vs = d.vehicles.filter((v) => v.managerId === m.id);
    return { m, vehicles: vs.length, aum: sum(vs.map((v) => vehicleNav(d, v))), carry: sum(d.distributions.filter((x) => x.status === "paid" && vs.some((v) => v.id === x.vehicleId)).map((x) => x.carryAmount)) };
  }).sort((a, b) => b.aum - a.aum);

  const inv = d.investors.find((i) => i.id === investorId);
  const positions = inv ? d.subscriptions.filter((s) => s.investorId === inv.id && s.status === "funded").map((s) => {
    const v = d.vehicles.find((x) => x.id === s.vehicleId)!;
    const row = capTable(d, v.id).find((r) => r.investor.id === inv.id);
    const share = row ? row.ownershipPct / 100 : 0;
    const contributed = investorContributions(d, inv.id, v.id);
    const distributed = investorDistributions(d, inv.id, v.id);
    const nav = share * vehicleNav(d, v);
    return { v, committed: s.amount, contributed, distributed, nav, share, moic: contributed ? (nav + distributed) / contributed : 0 };
  }) : [];

  return (
    <>
      <PageHeader title="Reports" subtitle="Performance, investor statements and GP economics" actions={<SegmentedControl options={[{ value: "performance", label: "Performance" }, { value: "statements", label: "Investor statements" }, { value: "gp", label: "GP economics" }]} value={view} onChange={setView} />} />

      {view === "performance" ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Stat label="Total AUA" value={fmtCurrency(totalAum(d), { compact: true })} tone="brand" />
            <Stat label="Contributed capital" value={fmtCurrency(sum(perf.map((p) => p.contributed)), { compact: true })} tone="violet" />
            <Stat label="Distributed" value={fmtCurrency(sum(perf.map((p) => p.distributed)), { compact: true })} tone="success" />
            <Stat label="Blended MOIC" value={(() => { const c = sum(perf.map((p) => p.contributed)); return c ? `${((sum(perf.map((p) => p.nav)) + sum(perf.map((p) => p.distributed))) / c).toFixed(2)}x` : "—"; })()} tone="teal" />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2"><CardHeader title="Contributed vs. NAV + distributions by vehicle" /><CardBody><Bars data={perf.map((p) => ({ label: p.v.type === "Fund" ? p.v.name.split(" ").slice(0, 2).join(" ") : p.v.portfolioCompany.split(" (")[0], Contributed: p.contributed, "NAV + Dist.": p.nav + p.distributed }))} keys={[{ key: "Contributed", label: "Contributed" }, { key: "NAV + Dist.", label: "NAV + Distributions", color: "var(--teal)" }]} height={260} /></CardBody></Card>
            <Card><CardHeader title="AUA by manager" /><CardBody><Donut data={gpRows.map((g) => ({ name: g.m.firm, value: g.aum }))} height={170} /></CardBody></Card>
          </div>
          <Card>
            <CardHeader title="Vehicle performance" action={<Button size="sm" variant="outline" onClick={() => downloadCsv("performance.csv", perf.map((p) => ({ vehicle: p.v.name, status: p.v.status, contributed: p.contributed, distributed: p.distributed, nav: p.nav, moic: p.moic?.toFixed(2) ?? "" })))}><Download className="h-3.5 w-3.5" /> CSV</Button>} />
            <CardBody>
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-faint"><tr><th className="pb-2 text-left font-semibold">Vehicle</th><th className="pb-2 text-left font-semibold">Status</th><th className="pb-2 text-right font-semibold">Contributed</th><th className="pb-2 text-right font-semibold">Distributed</th><th className="pb-2 text-right font-semibold">NAV</th><th className="pb-2 text-right font-semibold">DPI</th><th className="pb-2 text-right font-semibold">MOIC</th></tr></thead>
                <tbody>
                  {perf.map((p) => (
                    <tr key={p.v.id} className="border-t border-border">
                      <td className="py-2.5"><Link href={`/vehicles/${p.v.id}`} className="font-medium hover:underline">{p.v.name}</Link><p className="text-xs text-muted">{managerName(d, p.v.managerId)}</p></td>
                      <td className="py-2.5"><StatusBadge status={p.v.status} map={vehicleTone} /></td>
                      <td className="py-2.5 text-right tnum">{fmtCurrency(p.contributed)}</td>
                      <td className="py-2.5 text-right tnum">{fmtCurrency(p.distributed)}</td>
                      <td className="py-2.5 text-right tnum">{fmtCurrency(p.nav)}</td>
                      <td className="py-2.5 text-right tnum">{p.contributed ? `${(p.distributed / p.contributed).toFixed(2)}x` : "—"}</td>
                      <td className="py-2.5 text-right"><Badge tone={!p.moic ? "neutral" : p.moic >= 1.5 ? "success" : p.moic >= 1 ? "info" : "danger"}>{p.moic ? `${p.moic.toFixed(2)}x` : "—"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </>
      ) : null}

      {view === "statements" ? (
        <>
          <div className="mb-4 w-full sm:w-96"><Select value={investorId} onChange={(e) => setInvestorId(e.target.value)}>{d.investors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></div>
          {inv ? (
            <Card>
              <CardHeader title={`Capital account statement – ${inv.name}`} subtitle={`As of ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${inv.email}`} action={<Button size="sm" variant="outline" onClick={() => downloadCsv(`${inv.name}-statement.csv`, positions.map((p) => ({ vehicle: p.v.name, committed: p.committed, contributed: p.contributed, distributed: p.distributed, nav: Math.round(p.nav), ownership_pct: (p.share * 100).toFixed(4), moic: p.moic.toFixed(2) })))}><Download className="h-3.5 w-3.5" /> Export</Button>} />
              <CardBody>
                <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Committed" value={fmtCurrency(sum(positions.map((p) => p.committed)), { compact: true })} tone="brand" />
                  <Stat label="Contributed" value={fmtCurrency(sum(positions.map((p) => p.contributed)), { compact: true })} tone="violet" />
                  <Stat label="Distributed" value={fmtCurrency(sum(positions.map((p) => p.distributed)), { compact: true })} tone="success" />
                  <Stat label="NAV" value={fmtCurrency(sum(positions.map((p) => p.nav)), { compact: true })} tone="teal" />
                </div>
                {positions.length === 0 ? <p className="text-sm text-muted">No funded positions.</p> : (
                  <table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-faint"><tr><th className="pb-2 text-left font-semibold">Vehicle</th><th className="pb-2 text-right font-semibold">Committed</th><th className="pb-2 text-right font-semibold">Contributed</th><th className="pb-2 text-right font-semibold">Distributed</th><th className="pb-2 text-right font-semibold">Ownership</th><th className="pb-2 text-right font-semibold">NAV</th><th className="pb-2 text-right font-semibold">MOIC</th></tr></thead>
                    <tbody>
                      {positions.map((p) => (
                        <tr key={p.v.id} className="border-t border-border">
                          <td className="py-2.5"><Link href={`/vehicles/${p.v.id}`} className="font-medium hover:underline">{p.v.name}</Link></td>
                          <td className="py-2.5 text-right tnum">{fmtCurrency(p.committed)}</td>
                          <td className="py-2.5 text-right tnum">{fmtCurrency(p.contributed)}</td>
                          <td className="py-2.5 text-right tnum">{fmtCurrency(p.distributed)}</td>
                          <td className="py-2.5 text-right tnum">{(p.share * 100).toFixed(2)}%</td>
                          <td className="py-2.5 text-right tnum">{fmtCurrency(p.nav)}</td>
                          <td className="py-2.5 text-right tnum">{p.moic.toFixed(2)}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          ) : null}
        </>
      ) : null}

      {view === "gp" ? (
        <Card>
          <CardHeader title="GP economics" subtitle="Vehicles administered, assets and carry realised per manager" />
          <CardBody>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-faint"><tr><th className="pb-2 text-left font-semibold">Manager</th><th className="pb-2 text-right font-semibold">Vehicles</th><th className="pb-2 text-right font-semibold">AUA</th><th className="pb-2 text-right font-semibold">Carry realised</th></tr></thead>
              <tbody>
                {gpRows.map((g) => (
                  <tr key={g.m.id} className="border-t border-border">
                    <td className="py-2.5"><p className="font-medium">{g.m.name}</p><p className="text-xs text-muted">{g.m.firm} · {g.m.email}</p></td>
                    <td className="py-2.5 text-right tnum">{g.vehicles}</td>
                    <td className="py-2.5 text-right tnum">{fmtCurrency(g.aum)}</td>
                    <td className="py-2.5 text-right tnum text-success">{fmtCurrency(g.carry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
