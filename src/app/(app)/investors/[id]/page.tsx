"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageHeader, Avatar, KV, EmptyState, Tabs } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge, kycTone, accrTone, subTone, vehicleTone, docTone } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { SubscriptionActions } from "@/components/domain/subscription-actions";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { fmtCurrency, fmtDate, fmtDateTime, titleCase, relativeTime } from "@/lib/utils";
import { investorCommitted, investorContributions, investorDistributions, vehicleName, capTable } from "@/lib/selectors";
import { ShieldCheck, ShieldAlert, Pencil, FileText, CheckCircle2, XCircle, Send } from "lucide-react";

export default function InvestorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const d = useStore();
  const inv = d.investors.find((i) => i.id === id);
  const [tab, setTab] = React.useState<"positions" | "transactions" | "documents" | "activity">("positions");
  const [edit, setEdit] = React.useState(false);
  if (!inv) return <EmptyState title="Investor not found" action={<Link href="/investors"><Button variant="outline">Back</Button></Link>} />;

  const subs = d.subscriptions.filter((s) => s.investorId === inv.id);
  const ledger = d.ledger.filter((l) => l.investorId === inv.id);
  const docs = d.documents.filter((x) => x.investorId === inv.id);
  const activity = d.activity.filter((a) => a.entityId === inv.id || subs.some((s) => s.id === a.entityId));
  const committed = investorCommitted(d, inv.id);
  const contributed = investorContributions(d, inv.id);
  const distributed = investorDistributions(d, inv.id);
  const nav = subs.filter((s) => s.status === "funded").reduce((acc, s) => {
    const v = d.vehicles.find((x) => x.id === s.vehicleId)!;
    const row = capTable(d, v.id).find((r) => r.investor.id === inv.id);
    const vNav = v.currentValue + Math.max(0, d.ledger.filter((l) => l.vehicleId === v.id).reduce((a, l) => a + l.amount, 0));
    return acc + (row ? (row.ownershipPct / 100) * vNav : 0);
  }, 0);

  return (
    <>
      <PageHeader
        back={{ href: "/investors", label: "Investors" }}
        title={<span className="flex items-center gap-3"><Avatar name={inv.name} size="lg" />{inv.name}</span>}
        subtitle={`${titleCase(inv.entityType)} · ${inv.country} · ${inv.email} · Tax ID ${inv.taxId}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</Button>
            {inv.kycStatus === "not_started" ? <Button onClick={() => toast.result(d.setKyc(inv.id, "pending"))}><Send className="h-4 w-4" /> Request KYC</Button> : null}
            {inv.kycStatus === "pending" ? <><Button variant="success" onClick={() => toast.result(d.setKyc(inv.id, "approved"))}><CheckCircle2 className="h-4 w-4" /> Approve KYC</Button><Button variant="danger" onClick={() => toast.result(d.setKyc(inv.id, "rejected"))}><XCircle className="h-4 w-4" /> Reject</Button></> : null}
            {inv.kycStatus === "rejected" ? <Button variant="outline" onClick={() => toast.result(d.setKyc(inv.id, "pending"))}>Re-open KYC</Button> : null}
            {inv.accreditation !== "verified" ? <Button variant="outline" onClick={() => toast.result(d.verifyAccreditation(inv.id))}><ShieldCheck className="h-4 w-4" /> Verify accreditation</Button> : null}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Compliance" />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-faint" /> KYC / AML</div>
              <StatusBadge status={inv.kycStatus} map={kycTone} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-faint" /> Accreditation</div>
              <StatusBadge status={inv.accreditation} map={accrTone} />
            </div>
            {inv.kycStatus !== "approved" || inv.accreditation !== "verified" ? <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">Subscriptions cannot be approved until KYC is approved and accreditation is verified.</p> : <p className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">Cleared to invest.</p>}
            {inv.notes ? <p className="text-sm text-muted">{inv.notes}</p> : null}
            <KV label="Investor since" value={fmtDate(inv.createdAt)} />
          </CardBody>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Card className="p-5"><KV label="Total committed" value={fmtCurrency(committed, { compact: true })} /><p className="mt-1 text-xs text-faint">{subs.filter((s) => s.status !== "rejected").length} subscriptions</p></Card>
          <Card className="p-5"><KV label="Contributed" value={fmtCurrency(contributed, { compact: true })} /><p className="mt-1 text-xs text-faint">{fmtCurrency(committed - contributed, { compact: true })} uncalled</p></Card>
          <Card className="p-5"><KV label="Distributions received" value={fmtCurrency(distributed, { compact: true })} /><p className="mt-1 text-xs text-faint">net of carry</p></Card>
          <Card className="p-5"><KV label="Estimated NAV" value={fmtCurrency(nav, { compact: true })} /><p className="mt-1 text-xs text-faint">pro-rata share of vehicle NAV</p></Card>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ id: "positions", label: "Positions", count: subs.length }, { id: "transactions", label: "Transactions", count: ledger.length }, { id: "documents", label: "Documents", count: docs.length }, { id: "activity", label: "Activity" }]} />
      <div className="mt-5">
        {tab === "positions" ? (
          <div className="space-y-3">
            {subs.length === 0 ? <EmptyState title="No positions" description="Invite this investor to a raising vehicle to get started." /> : null}
            {subs.map((s) => {
              const v = d.vehicles.find((x) => x.id === s.vehicleId)!;
              const c = investorContributions(d, inv.id, v.id);
              const dist = investorDistributions(d, inv.id, v.id);
              const row = capTable(d, v.id).find((r) => r.investor.id === inv.id);
              return (
                <Card key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><Link href={`/vehicles/${v.id}`} className="truncate text-sm font-medium hover:underline">{v.name}</Link><StatusBadge status={v.status} map={vehicleTone} /></div>
                    <p className="text-xs text-muted">{v.portfolioCompany} · invited {fmtDate(s.invitedAt)}{s.fundedAt ? ` · funded ${fmtDate(s.fundedAt)}` : ""}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-right text-xs sm:w-[380px]">
                    <div><p className="text-faint">Committed</p><p className="font-medium tnum">{fmtCurrency(s.amount, { compact: true })}</p></div>
                    <div><p className="text-faint">Contributed</p><p className="font-medium tnum">{fmtCurrency(c, { compact: true })}</p></div>
                    <div><p className="text-faint">Distributed</p><p className="font-medium tnum">{fmtCurrency(dist, { compact: true })}</p></div>
                    <div><p className="text-faint">Ownership</p><p className="font-medium tnum">{row ? `${row.ownershipPct.toFixed(2)}%` : "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-2 sm:w-[260px] sm:justify-end"><StatusBadge status={s.status} map={subTone} /><SubscriptionActions sub={s} compact /></div>
                </Card>
              );
            })}
          </div>
        ) : null}
        {tab === "transactions" ? (
          <Card>
            <table className="w-full text-sm">
              <thead className="bg-subtle/60 text-[11px] uppercase tracking-wider text-faint"><tr><th className="px-4 py-2.5 text-left font-semibold">Date</th><th className="px-4 py-2.5 text-left font-semibold">Vehicle</th><th className="px-4 py-2.5 text-left font-semibold">Type</th><th className="px-4 py-2.5 text-left font-semibold">Memo</th><th className="px-4 py-2.5 text-right font-semibold">Amount</th></tr></thead>
              <tbody>
                {ledger.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No transactions</td></tr> : null}
                {ledger.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-2.5 text-muted">{fmtDate(l.date)}</td>
                    <td className="px-4 py-2.5"><Link href={`/vehicles/${l.vehicleId}`} className="hover:underline">{vehicleName(d, l.vehicleId)}</Link></td>
                    <td className="px-4 py-2.5"><Badge tone={l.type === "contribution" ? "success" : "info"}>{titleCase(l.type)}</Badge></td>
                    <td className="px-4 py-2.5 text-muted">{l.memo}</td>
                    <td className={l.type === "contribution" ? "px-4 py-2.5 text-right font-medium tnum" : "px-4 py-2.5 text-right font-medium tnum text-success"}>{l.type === "contribution" ? `−${fmtCurrency(l.amount)}` : `+${fmtCurrency(-l.amount)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border px-4 py-2 text-[11px] text-faint">Shown from the investor&apos;s perspective: contributions are outflows, distributions are inflows.</p>
          </Card>
        ) : null}
        {tab === "documents" ? (
          <Card>
            {docs.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted">No investor documents</p> : null}
            {docs.map((x) => (
              <div key={x.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <FileText className="h-4 w-4 text-faint" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{x.name}</p><p className="text-xs text-muted">{vehicleName(d, x.vehicleId)} · {fmtDateTime(x.uploadedAt)}</p></div>
                <StatusBadge status={x.status} map={docTone} />
                {x.status === "pending_signature" ? <Button size="sm" variant="outline" onClick={() => toast.result(d.setDocumentStatus(x.id, "signed"))}>Mark signed</Button> : null}
              </div>
            ))}
          </Card>
        ) : null}
        {tab === "activity" ? (
          <Card><CardBody className="pt-5">
            {activity.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : null}
            <ol className="relative space-y-5 border-l border-border pl-6">
              {activity.map((a) => (<li key={a.id} className="relative"><span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-elev bg-brand" /><p className="text-sm"><span className="font-medium">{a.actor}</span> <span className="text-muted">{a.action}</span></p><p className="text-xs text-faint">{relativeTime(a.at)}</p></li>))}
            </ol>
          </CardBody></Card>
        ) : null}
      </div>

      <EditInvestorDialog open={edit} onClose={() => setEdit(false)} investorId={inv.id} />
    </>
  );
}

function EditInvestorDialog(props: { open: boolean; onClose: () => void; investorId: string }) {
  if (!props.open) return null;
  return <EditInvestorDialogInner {...props} />;
}

function EditInvestorDialogInner({ open, onClose, investorId }: { open: boolean; onClose: () => void; investorId: string }) {
  const d = useStore();
  const inv = d.investors.find((i) => i.id === investorId)!;
  const [form, setForm] = React.useState({ name: inv.name, email: inv.email, country: inv.country, notes: inv.notes ?? "" });
  return (
    <Dialog open={open} onClose={onClose} title="Edit investor" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { if (toast.result(d.updateInvestor(inv.id, form))) onClose(); }}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Country"><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Field>
        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </div>
    </Dialog>
  );
}
