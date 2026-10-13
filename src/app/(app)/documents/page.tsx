"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, Stat } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/table";
import { StatusBadge, docTone, Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/input";
import { fmtDateTime, titleCase } from "@/lib/utils";
import { investorName, vehicleName } from "@/lib/selectors";
import type { Doc, DocumentKind } from "@/lib/types";
import { FileText, Search, Upload, FileSignature } from "lucide-react";

const KINDS: DocumentKind[] = ["operating_agreement", "subscription_agreement", "ppm", "k1", "side_letter", "bank_statement", "form_d"];

export default function DocumentsPage() {
  const d = useStore();
  const [q, setQ] = React.useState("");
  const [kind, setKind] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [upload, setUpload] = React.useState(false);
  const rows = d.documents.filter((x) => (kind === "all" || x.kind === kind) && (status === "all" || x.status === status) && (!q || x.name.toLowerCase().includes(q.toLowerCase()) || vehicleName(d, x.vehicleId).toLowerCase().includes(q.toLowerCase())));
  const columns: Column<Doc>[] = [
    { key: "name", header: "Document", sortValue: (x) => x.name, render: (x) => <div className="flex items-center gap-3"><span className="rounded-lg bg-subtle p-2 text-faint"><FileText className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-medium">{x.name}</p><p className="text-xs text-muted">{x.sizeKb} KB{x.investorId ? ` · ${investorName(d, x.investorId)}` : ""}</p></div></div> },
    { key: "kind", header: "Type", sortValue: (x) => x.kind, render: (x) => <Badge>{x.kind === "ppm" ? "PPM" : x.kind === "k1" ? "K-1" : titleCase(x.kind)}</Badge> },
    { key: "vehicle", header: "Vehicle", sortValue: (x) => vehicleName(d, x.vehicleId), render: (x) => <Link href={`/vehicles/${x.vehicleId}`} className="text-muted hover:underline">{vehicleName(d, x.vehicleId)}</Link> },
    { key: "status", header: "Status", sortValue: (x) => x.status, render: (x) => <StatusBadge status={x.status} map={docTone} /> },
    { key: "uploaded", header: "Uploaded", sortValue: (x) => x.uploadedAt, render: (x) => <span className="text-xs text-muted">{fmtDateTime(x.uploadedAt)}</span> },
    { key: "actions", header: "", align: "right", render: (x) => (<div className="flex justify-end gap-1.5">{x.status === "draft" ? <Button size="sm" variant="outline" onClick={() => toast.result(d.setDocumentStatus(x.id, "pending_signature"))}><FileSignature className="h-3.5 w-3.5" /> Send</Button> : null}{x.status === "pending_signature" ? <Button size="sm" variant="outline" onClick={() => toast.result(d.setDocumentStatus(x.id, "signed"))}>Mark signed</Button> : null}{x.status === "signed" && (x.kind === "form_d" || x.kind === "ppm" || x.kind === "k1") ? <Button size="sm" variant="ghost" onClick={() => toast.result(d.setDocumentStatus(x.id, "filed"))}>File</Button> : null}</div>) },
  ];
  return (
    <>
      <PageHeader title="Documents" subtitle="Formation docs, subscription agreements, tax forms and filings" actions={<Button onClick={() => setUpload(true)}><Upload className="h-4 w-4" /> Upload</Button>} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Awaiting signature" value={d.documents.filter((x) => x.status === "pending_signature").length} tone="warning" />
        <Stat label="Drafts" value={d.documents.filter((x) => x.status === "draft").length} tone="brand" />
        <Stat label="Filed / signed" value={d.documents.filter((x) => x.status === "signed" || x.status === "filed").length} tone="success" />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" /><Input className="pl-9" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="w-full sm:w-52"><Select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All types</option>{KINDS.map((k) => <option key={k} value={k}>{titleCase(k)}</option>)}</Select></div>
        <div className="w-full sm:w-48"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{["draft", "pending_signature", "signed", "filed"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</Select></div>
      </div>
      <DataTable rows={rows} columns={columns} rowKey={(x) => x.id} initialSort={{ key: "uploaded", dir: "desc" }} />
      <UploadDialog open={upload} onClose={() => setUpload(false)} />
    </>
  );
}

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = useStore();
  const [form, setForm] = React.useState({ vehicleId: d.vehicles[0]?.id ?? "", kind: "side_letter" as DocumentKind, name: "", investorId: "" });
  const submit = () => {
    if (!form.name.trim()) return toast.error("Name required");
    if (toast.result(d.addDocument(form.vehicleId, form.name.endsWith(".pdf") ? form.name : `${form.name}.pdf`, form.kind, form.investorId || undefined))) onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Upload document" description="Demo only – no file is actually uploaded." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add</Button></>}>
      <div className="space-y-4">
        <div className="flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-border-strong text-sm text-faint">Drop a PDF here (simulated)</div>
        <Field label="Document name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Side Letter – Investor.pdf" /></Field>
        <Field label="Type"><Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as DocumentKind })}>{KINDS.map((k) => <option key={k} value={k}>{titleCase(k)}</option>)}</Select></Field>
        <Field label="Vehicle"><Select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>{d.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
        <Field label="Investor (optional)"><Select value={form.investorId} onChange={(e) => setForm({ ...form, investorId: e.target.value })}><option value="">—</option>{d.investors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field>
      </div>
    </Dialog>
  );
}
