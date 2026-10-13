"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore, VEHICLE_ACTION_LABEL } from "@/lib/store";
import { PageHeader, KV, Tabs, Progress, EmptyState, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge, vehicleTone, subTone, docTone, kycTone } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { Lifecycle } from "@/components/domain/lifecycle";
import { SubscriptionActions } from "@/components/domain/subscription-actions";
import { CapitalCallCard } from "@/components/domain/capital-call-card";
import { DistributionCard } from "@/components/domain/distribution-card";
import { InviteInvestorDialog, CapitalCallDialog, DistributionDialog, AddTaskDialog } from "@/components/domain/dialogs";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, MoneyInput, Select } from "@/components/ui/input";
import { Donut } from "@/components/charts/charts";
import { fmtCurrency, fmtDate, fmtDateTime, fmtPct, relativeTime, titleCase, daysUntil, downloadCsv } from "@/lib/utils";
import { capTable, managerName, vehicleCommitted, vehicleFunded, vehiclePipeline, vehicleContributions, vehicleDistributed, vehicleCashBalance, vehicleNav, vehicleMoic, investorName, SUB_STATUS_ORDER } from "@/lib/selectors";
import type { Subscription, LedgerEntry, Doc, VehicleStatus } from "@/lib/types";
import { UserPlus, ArrowDownToLine, ArrowUpFromLine, Download, FileText, Trash2, Pencil, Plus, Upload, ShieldCheck } from "lucide-react";

type Tab = "overview" | "investors" | "captable" | "calls" | "distributions" | "ledger" | "documents" | "activity";

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const d = useStore();
  const v = d.vehicles.find((x) => x.id === id);
  const [tab, setTab] = React.useState<Tab>("overview");
  const [invite, setInvite] = React.useState(false);
  const [callOpen, setCallOpen] = React.useState(false);
  const [distOpen, setDistOpen] = React.useState(false);
  const [taskOpen, setTaskOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [valOpen, setValOpen] = React.useState(false);

  if (!v) {
    return <EmptyState title="Vehicle not found" description="It may have been deleted." action={<Link href="/vehicles"><Button variant="outline">Back to vehicles</Button></Link>} />;
  }

  const subs = d.subscriptions.filter((s) => s.vehicleId === v.id);
  const committed = vehicleCommitted(d, v.id);
  const funded = vehicleFunded(d, v.id);
  const pipeline = vehiclePipeline(d, v.id);
  const contributions = vehicleContributions(d, v.id);
  const distributed = vehicleDistributed(d, v.id);
  const cash = vehicleCashBalance(d, v.id);
  const nav = vehicleNav(d, v);
  const moic = vehicleMoic(d, v);
  const calls = d.capitalCalls.filter((c) => c.vehicleId === v.id).sort((a, b) => b.number - a.number);
  const dists = d.distributions.filter((x) => x.vehicleId === v.id).sort((a, b) => b.date.localeCompare(a.date));
  const ledger = d.ledger.filter((l) => l.vehicleId === v.id);
  const docs = d.documents.filter((x) => x.vehicleId === v.id);
  const activity = d.activity.filter((a) => a.entityId === v.id || subs.some((s) => s.id === a.entityId) || calls.some((c) => c.id === a.entityId) || dists.some((x) => x.id === a.entityId));
  const cap = capTable(d, v.id);
  const tasks = d.tasks.filter((t) => t.vehicleId === v.id && t.status !== "done");

  const transitions: Record<VehicleStatus, VehicleStatus[]> = { draft: ["raising"], raising: ["closing"], closing: ["closed"], closed: ["active"], active: ["liquidated"], liquidated: [] };
  const nextStates = transitions[v.status];

  const subColumns: Column<Subscription>[] = [
    { key: "investor", header: "Investor", sortValue: (s) => investorName(d, s.investorId), render: (s) => { const inv = d.investors.find((i) => i.id === s.investorId)!; return (<div className="flex items-center gap-3"><Avatar name={inv.name} size="sm" /><div className="min-w-0"><Link href={`/investors/${inv.id}`} className="block truncate font-medium hover:underline">{inv.name}</Link><p className="truncate text-xs text-muted">{inv.email}</p></div></div>); } },
    { key: "kyc", header: "KYC", render: (s) => { const inv = d.investors.find((i) => i.id === s.investorId)!; return <div className="flex items-center gap-1.5"><StatusBadge status={inv.kycStatus} map={kycTone} />{inv.accreditation === "verified" ? <ShieldCheck className="h-3.5 w-3.5 text-success" /> : null}</div>; } },
    { key: "amount", header: "Amount", align: "right", sortValue: (s) => s.amount, render: (s) => <span className="font-medium">{fmtCurrency(s.amount)}</span> },
    { key: "status", header: "Status", sortValue: (s) => SUB_STATUS_ORDER.indexOf(s.status), render: (s) => <div><StatusBadge status={s.status} map={subTone} />{s.rejectedReason ? <p className="mt-1 text-[11px] text-danger">{s.rejectedReason}</p> : null}</div> },
    { key: "updated", header: "Last update", sortValue: (s) => s.fundedAt ?? s.approvedAt ?? s.signedAt ?? s.invitedAt, render: (s) => <span className="text-xs text-muted">{relativeTime(s.fundedAt ?? s.approvedAt ?? s.signedAt ?? s.invitedAt)}</span> },
    { key: "actions", header: "", align: "right", render: (s) => <SubscriptionActions sub={s} /> },
  ];

  const ledgerColumns: Column<LedgerEntry>[] = [
    { key: "date", header: "Date", sortValue: (l) => l.date, render: (l) => <span className="text-muted">{fmtDate(l.date)}</span> },
    { key: "type", header: "Type", sortValue: (l) => l.type, render: (l) => <Badge tone={l.type === "contribution" ? "success" : l.type === "distribution" ? "info" : l.type === "investment" ? "violet" : "warning"}>{titleCase(l.type)}</Badge> },
    { key: "memo", header: "Memo", render: (l) => <div><p>{l.memo}</p>{l.investorId ? <p className="text-xs text-muted">{investorName(d, l.investorId)}</p> : null}</div> },
    { key: "amount", header: "Amount", align: "right", sortValue: (l) => l.amount, render: (l) => <span className={l.amount < 0 ? "font-medium text-danger" : "font-medium text-success"}>{l.amount < 0 ? "−" : "+"}{fmtCurrency(Math.abs(l.amount))}</span> },
  ];

  const docColumns: Column<Doc>[] = [
    { key: "name", header: "Document", render: (x) => <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-faint" /><div><p className="font-medium">{x.name}</p><p className="text-xs text-muted">{titleCase(x.kind)}{x.investorId ? ` · ${investorName(d, x.investorId)}` : ""} · {x.sizeKb} KB</p></div></div> },
    { key: "status", header: "Status", render: (x) => <StatusBadge status={x.status} map={docTone} /> },
    { key: "uploaded", header: "Uploaded", sortValue: (x) => x.uploadedAt, render: (x) => <span className="text-xs text-muted">{fmtDateTime(x.uploadedAt)}</span> },
    { key: "actions", header: "", align: "right", render: (x) => (
      <div className="flex justify-end gap-1.5">
        {x.status === "draft" ? <Button size="sm" variant="outline" onClick={() => toast.result(d.setDocumentStatus(x.id, "pending_signature"))}>Send for signature</Button> : null}
        {x.status === "pending_signature" ? <Button size="sm" variant="outline" onClick={() => toast.result(d.setDocumentStatus(x.id, "signed"))}>Mark signed</Button> : null}
        {x.status === "signed" && (x.kind === "form_d" || x.kind === "ppm" || x.kind === "k1") ? <Button size="sm" variant="ghost" onClick={() => toast.result(d.setDocumentStatus(x.id, "filed"))}>Mark filed</Button> : null}
      </div>
    ) },
  ];

  const raisePct = (committed / v.targetRaise) * 100;

  return (
    <>
      <PageHeader
        back={{ href: "/vehicles", label: "Vehicles" }}
        eyebrow={<div className="flex items-center gap-2"><Badge tone={v.type === "Fund" ? "violet" : "info"}>{v.type}</Badge><StatusBadge status={v.status} map={vehicleTone} /><span className="text-xs text-faint">{v.jurisdiction}</span></div>}
        title={v.name}
        subtitle={`${v.portfolioCompany} · ${v.sector} · Managed by ${managerName(d, v.managerId)}`}
        actions={
          <>
            {v.status === "draft" ? <Button variant="ghost" className="text-danger" onClick={() => { if (toast.result(d.deleteVehicle(v.id))) router.push("/vehicles"); }}><Trash2 className="h-4 w-4" /> Delete</Button> : null}
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
            {(v.status === "raising" || v.status === "closing") ? <Button variant="outline" onClick={() => setInvite(true)}><UserPlus className="h-4 w-4" /> Invite investor</Button> : null}
            {v.type === "Fund" && (v.status === "closed" || v.status === "active") ? <Button variant="outline" onClick={() => setCallOpen(true)}><ArrowDownToLine className="h-4 w-4" /> Capital call</Button> : null}
            {(v.status === "active" || v.status === "closed") ? <Button variant="outline" onClick={() => setDistOpen(true)}><ArrowUpFromLine className="h-4 w-4" /> Distribute</Button> : null}
            {nextStates.map((ns) => <Button key={ns} onClick={() => toast.result(d.transitionVehicle(v.id, ns))}>{VEHICLE_ACTION_LABEL[ns]}</Button>)}
          </>
        }
      />

      <Card className="mb-6">
        <CardBody className="pt-5">
          <Lifecycle status={v.status} />
          {v.status === "draft" ? <p className="mt-4 rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info">Draft: sign the operating agreement in Documents, then launch the raise.</p> : null}
          {v.status === "raising" ? <p className="mt-4 rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info">Raising: invite investors and move subscriptions through signing, KYC and approval. Begin closing once at least one subscription is approved.</p> : null}
          {v.status === "closing" ? <p className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning">Closing: collect wires for all approved subscriptions. Final close requires every approved subscription to be funded or rejected; unsigned invites are dropped automatically.</p> : null}
          {v.status === "closed" ? <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-[13px] text-brand">Closed: {v.type === "SPV" ? "mark deployed to wire capital to the portfolio company." : "issue capital calls to draw down commitments, then mark deployed."}</p> : null}
        </CardBody>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card className="p-4"><KV label="Target" value={fmtCurrency(v.targetRaise, { compact: true })} /><Progress value={raisePct} className="mt-3" tone={raisePct >= 100 ? "success" : "brand"} /><p className="mt-1.5 text-[11px] text-faint tnum">{raisePct.toFixed(0)}% committed</p></Card>
        <Card className="p-4"><KV label="Committed" value={fmtCurrency(committed, { compact: true })} /><p className="mt-1 text-[11px] text-faint">{fmtCurrency(pipeline, { compact: true })} in pipeline</p></Card>
        <Card className="p-4"><KV label={v.type === "Fund" ? "Called & received" : "Funded"} value={fmtCurrency(v.type === "Fund" ? contributions : funded, { compact: true })} /><p className="mt-1 text-[11px] text-faint">{subs.filter((s) => s.status === "funded").length} funded LPs</p></Card>
        <Card className="p-4"><KV label="Cash balance" value={fmtCurrency(cash, { compact: true })} /><p className="mt-1 text-[11px] text-faint">from ledger</p></Card>
        <Card className="p-4"><KV label="NAV" value={fmtCurrency(nav, { compact: true })} /><p className="mt-1 text-[11px] text-faint">holding {fmtCurrency(v.currentValue, { compact: true })} + cash</p></Card>
        <Card className="p-4"><KV label="MOIC" value={moic ? `${moic.toFixed(2)}x` : "—"} /><p className="mt-1 text-[11px] text-faint">{fmtCurrency(distributed, { compact: true })} distributed</p></Card>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "investors", label: "Subscriptions", count: subs.length },
          { id: "captable", label: "Cap table", count: cap.length },
          ...(v.type === "Fund" ? [{ id: "calls" as Tab, label: "Capital calls", count: calls.length }] : []),
          { id: "distributions", label: "Distributions", count: dists.length },
          { id: "ledger", label: "Ledger", count: ledger.length },
          { id: "documents", label: "Documents", count: docs.length },
          { id: "activity", label: "Activity" },
        ]}
      />

      <div className="mt-5">
        {tab === "overview" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Terms" action={<Button size="sm" variant="ghost" onClick={() => setValOpen(true)}>Update valuation</Button>} />
              <CardBody>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <KV label="Min investment" value={fmtCurrency(v.minInvestment)} />
                  <KV label="Carry" value={fmtPct(v.carryPct, 0)} />
                  <KV label="Mgmt fee" value={fmtPct(v.managementFeePct, 2)} />
                  <KV label="Pref return" value={fmtPct(v.preferredReturnPct, 0)} />
                  <KV label="Opened" value={fmtDate(v.openedAt)} />
                  <KV label={v.closedAt ? "Closed" : "Target close"} value={fmtDate(v.closedAt ?? v.targetCloseDate)} />
                  <KV label="Invested capital" value={fmtCurrency(v.investedCapital, { compact: true })} />
                  <KV label="Holding value" value={fmtCurrency(v.currentValue, { compact: true })} />
                </div>
                <p className="mt-5 text-sm leading-6 text-muted">{v.description}</p>
              </CardBody>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader title="Subscription funnel" />
                <CardBody className="space-y-2">
                  {SUB_STATUS_ORDER.map((s) => {
                    const n = subs.filter((x) => x.status === s);
                    if (!n.length) return null;
                    return (
                      <div key={s} className="flex items-center justify-between text-sm">
                        <StatusBadge status={s} map={subTone} />
                        <span className="text-muted tnum">{n.length} · {fmtCurrency(n.reduce((a, x) => a + x.amount, 0), { compact: true })}</span>
                      </div>
                    );
                  })}
                  {!subs.length ? <p className="text-sm text-muted">No subscriptions yet.</p> : null}
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Open tasks" action={<Button size="sm" variant="ghost" onClick={() => setTaskOpen(true)}><Plus className="h-3.5 w-3.5" /> Add</Button>} />
                <CardBody className="space-y-2">
                  {tasks.length === 0 ? <p className="text-sm text-muted">Nothing outstanding.</p> : null}
                  {tasks.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-[13px]">
                      <span className="truncate">{t.title}</span>
                      <span className={daysUntil(t.dueDate) < 0 ? "shrink-0 text-xs text-danger" : "shrink-0 text-xs text-muted"}>{fmtDate(t.dueDate)}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>
        ) : null}

        {tab === "investors" ? (
          subs.length === 0 ? <EmptyState icon={<UserPlus className="h-5 w-5" />} title="No subscriptions yet" description={v.status === "draft" ? "Launch the raise to start inviting investors." : "Invite investors to begin collecting subscriptions."} action={(v.status === "raising" || v.status === "closing") ? <Button onClick={() => setInvite(true)}>Invite investor</Button> : undefined} /> :
          <DataTable rows={subs} columns={subColumns} rowKey={(s) => s.id} initialSort={{ key: "status", dir: "asc" }} />
        ) : null}

        {tab === "captable" ? (
          cap.length === 0 ? <EmptyState title="Cap table is empty" description="Ownership appears once subscriptions are approved." /> : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader title="Ownership" subtitle={`Pro-rata by ${contributions > 0 ? "contributed capital" : "commitments"}`} action={<Button size="sm" variant="ghost" onClick={() => downloadCsv(`${v.name}-captable.csv`, cap.map((r) => ({ investor: r.investor.name, email: r.investor.email, committed: r.committed, contributed: r.contributed, ownership_pct: r.ownershipPct.toFixed(4) })))}><Download className="h-3.5 w-3.5" /> CSV</Button>} />
                <CardBody>
                  <div className="scroll-area overflow-x-auto"><table className="w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-faint"><tr><th className="pb-2 text-left font-semibold">Investor</th><th className="pb-2 text-right font-semibold">Committed</th><th className="pb-2 text-right font-semibold">Contributed</th><th className="pb-2 text-right font-semibold">Ownership</th></tr></thead>
                    <tbody>
                      {cap.map((r) => (
                        <tr key={r.investor.id} className="border-t border-border">
                          <td className="py-2.5"><Link href={`/investors/${r.investor.id}`} className="flex items-center gap-2 hover:underline"><Avatar name={r.investor.name} size="sm" />{r.investor.name}</Link></td>
                          <td className="py-2.5 text-right tnum">{fmtCurrency(r.committed)}</td>
                          <td className="py-2.5 text-right tnum">{fmtCurrency(r.contributed)}</td>
                          <td className="py-2.5 text-right"><div className="flex items-center justify-end gap-2"><Progress value={r.ownershipPct} className="w-20" /><span className="w-14 font-medium tnum">{r.ownershipPct.toFixed(2)}%</span></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </CardBody>
              </Card>
              <Card><CardHeader title="Concentration" /><CardBody><Donut height={170} data={cap.slice(0, 6).map((r) => ({ name: r.investor.name, value: contributions > 0 ? r.contributed : r.committed })).concat(cap.length > 6 ? [{ name: "Others", value: cap.slice(6).reduce((a, r) => a + (contributions > 0 ? r.contributed : r.committed), 0) }] : [])} /></CardBody></Card>
            </div>
          )
        ) : null}

        {tab === "calls" ? (
          <div className="space-y-3">
            {calls.length === 0 ? <EmptyState icon={<ArrowDownToLine className="h-5 w-5" />} title="No capital calls" description="Issue a capital call to draw down LP commitments pro-rata." action={(v.status === "closed" || v.status === "active") ? <Button onClick={() => setCallOpen(true)}>New capital call</Button> : undefined} /> : null}
            {calls.map((c) => <CapitalCallCard key={c.id} call={c} defaultOpen={c.status === "sent" || c.status === "partially_funded" || c.status === "draft"} />)}
          </div>
        ) : null}

        {tab === "distributions" ? (
          <div className="space-y-3">
            {dists.length === 0 ? <EmptyState icon={<ArrowUpFromLine className="h-5 w-5" />} title="No distributions" description="Distributions run through the waterfall: capital, preferred return, then carry." action={(v.status === "active" || v.status === "closed") ? <Button onClick={() => setDistOpen(true)}>New distribution</Button> : undefined} /> : null}
            {dists.map((x) => <DistributionCard key={x.id} dist={x} defaultOpen={x.status !== "paid"} />)}
          </div>
        ) : null}

        {tab === "ledger" ? (
          <>
            <div className="mb-3 flex justify-end"><Button size="sm" variant="outline" onClick={() => downloadCsv(`${v.name}-ledger.csv`, ledger.map((l) => ({ date: l.date, type: l.type, investor: investorName(d, l.investorId), memo: l.memo, amount: l.amount })))}><Download className="h-3.5 w-3.5" /> Export CSV</Button></div>
            <DataTable rows={ledger} columns={ledgerColumns} rowKey={(l) => l.id} initialSort={{ key: "date", dir: "desc" }} dense empty="No ledger entries yet" />
          </>
        ) : null}

        {tab === "documents" ? (
          <>
            <div className="mb-3 flex justify-end"><Button size="sm" variant="outline" onClick={() => { const name = window.prompt("Document name", `Side Letter – ${v.name}.pdf`); if (name) toast.result(d.addDocument(v.id, name, "side_letter")); }}><Upload className="h-3.5 w-3.5" /> Upload document</Button></div>
            <DataTable rows={docs} columns={docColumns} rowKey={(x) => x.id} initialSort={{ key: "uploaded", dir: "desc" }} empty="No documents" />
          </>
        ) : null}

        {tab === "activity" ? (
          <Card><CardBody className="pt-5">
            {activity.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : null}
            <ol className="relative space-y-5 border-l border-border pl-6">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-elev bg-brand" />
                  <p className="text-sm"><span className="font-medium">{a.actor}</span> <span className="text-muted">{a.action}</span></p>
                  <p className="text-xs text-faint">{fmtDateTime(a.at)} · {relativeTime(a.at)}</p>
                </li>
              ))}
            </ol>
          </CardBody></Card>
        ) : null}
      </div>

      <InviteInvestorDialog open={invite} onClose={() => setInvite(false)} vehicleId={v.id} />
      <CapitalCallDialog open={callOpen} onClose={() => setCallOpen(false)} vehicleId={v.id} />
      <DistributionDialog open={distOpen} onClose={() => setDistOpen(false)} vehicleId={v.id} />
      <AddTaskDialog open={taskOpen} onClose={() => setTaskOpen(false)} vehicleId={v.id} />
      <EditVehicleDialog open={editOpen} onClose={() => setEditOpen(false)} vehicleId={v.id} />
      <ValuationDialog open={valOpen} onClose={() => setValOpen(false)} vehicleId={v.id} />
    </>
  );
}

function EditVehicleDialog(props: { open: boolean; onClose: () => void; vehicleId: string }) {
  if (!props.open) return null;
  return <EditVehicleDialogInner {...props} />;
}

function EditVehicleDialogInner({ open, onClose, vehicleId }: { open: boolean; onClose: () => void; vehicleId: string }) {
  const d = useStore();
  const v = d.vehicles.find((x) => x.id === vehicleId)!;
  const [form, setForm] = React.useState({ name: v.name, portfolioCompany: v.portfolioCompany, sector: v.sector, targetRaise: v.targetRaise, minInvestment: v.minInvestment, carryPct: v.carryPct, managementFeePct: v.managementFeePct, preferredReturnPct: v.preferredReturnPct, targetCloseDate: v.targetCloseDate, description: v.description, managerId: v.managerId });
  const termsLocked = v.status !== "draft" && v.status !== "raising";
  return (
    <Dialog open={open} onClose={onClose} title="Edit vehicle" description={termsLocked ? "Economic terms are locked after closing begins." : undefined} size="lg" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { if (toast.result(d.updateVehicle(v.id, form))) onClose(); }}>Save changes</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Portfolio company"><Input value={form.portfolioCompany} onChange={(e) => setForm({ ...form, portfolioCompany: e.target.value })} /></Field>
        <Field label="Manager"><Select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>{d.managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></Field>
        <Field label="Target raise"><MoneyInput disabled={termsLocked} value={form.targetRaise} onChange={(n) => setForm({ ...form, targetRaise: n })} /></Field>
        <Field label="Minimum investment"><MoneyInput disabled={termsLocked} value={form.minInvestment} onChange={(n) => setForm({ ...form, minInvestment: n })} /></Field>
        <Field label="Carry %"><Input disabled={termsLocked} type="number" value={form.carryPct} onChange={(e) => setForm({ ...form, carryPct: Number(e.target.value) })} /></Field>
        <Field label="Mgmt fee %"><Input disabled={termsLocked} type="number" value={form.managementFeePct} onChange={(e) => setForm({ ...form, managementFeePct: Number(e.target.value) })} /></Field>
        <Field label="Pref return %"><Input disabled={termsLocked} type="number" value={form.preferredReturnPct} onChange={(e) => setForm({ ...form, preferredReturnPct: Number(e.target.value) })} /></Field>
        <Field label="Target close"><Input type="date" value={form.targetCloseDate} onChange={(e) => setForm({ ...form, targetCloseDate: e.target.value })} /></Field>
        <Field label="Description" className="sm:col-span-2"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}

function ValuationDialog(props: { open: boolean; onClose: () => void; vehicleId: string }) {
  if (!props.open) return null;
  return <ValuationDialogInner {...props} />;
}

function ValuationDialogInner({ open, onClose, vehicleId }: { open: boolean; onClose: () => void; vehicleId: string }) {
  const d = useStore();
  const v = d.vehicles.find((x) => x.id === vehicleId)!;
  const [value, setValue] = React.useState(v.currentValue);
  return (
    <Dialog open={open} onClose={onClose} title="Update holding valuation" description="Mark-to-market the portfolio position. NAV = holding value + cash." size="sm" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { if (toast.result(d.updateVehicle(v.id, { currentValue: value }))) onClose(); }}>Save valuation</Button></>}>
      <Field label="Current holding value" hint={`Invested capital: ${fmtCurrency(v.investedCapital)}`}><MoneyInput value={value} onChange={setValue} /></Field>
    </Dialog>
  );
}
