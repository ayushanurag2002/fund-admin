"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ChevronLeft, Landmark, Layers } from "lucide-react";
import { useStore, type NewVehicleInput } from "@/lib/store";
import { PageHeader, KV } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn, fmtCurrency, isoDate, addDays } from "@/lib/utils";

const steps = ["Structure", "Terms", "Details", "Review"] as const;
const SECTORS = ["AI Infrastructure", "Fintech", "Climate", "Healthtech", "SaaS", "Consumer", "Space", "Biotech", "Real Estate", "Crypto"];

export default function NewVehiclePage() {
  const router = useRouter();
  const managers = useStore((s) => s.managers);
  const createVehicle = useStore((s) => s.createVehicle);
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<NewVehicleInput>({
    name: "",
    type: "SPV",
    managerId: managers[0]?.id ?? "",
    portfolioCompany: "",
    sector: SECTORS[0],
    jurisdiction: "Delaware",
    targetRaise: 2_000_000,
    minInvestment: 25_000,
    managementFeePct: 0,
    carryPct: 20,
    preferredReturnPct: 0,
    targetCloseDate: isoDate(addDays(new Date(), 45)),
    description: "",
  });
  const set = <K extends keyof NewVehicleInput>(k: K, v: NewVehicleInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const errors: Partial<Record<keyof NewVehicleInput, string>> = {};
  if (step >= 1 && form.targetRaise <= 0) errors.targetRaise = "Required";
  if (step >= 1 && (form.minInvestment <= 0 || form.minInvestment > form.targetRaise)) errors.minInvestment = "Must be below target raise";
  if (step >= 1 && (form.carryPct < 0 || form.carryPct > 50)) errors.carryPct = "0–50%";
  if (step >= 2 && !form.name.trim()) errors.name = "Required";
  if (step >= 2 && !form.portfolioCompany.trim()) errors.portfolioCompany = "Required";

  const canNext = () => {
    if (step === 1) return !errors.targetRaise && !errors.minInvestment && !errors.carryPct;
    if (step === 2) return !!form.name.trim() && !!form.portfolioCompany.trim();
    return true;
  };

  const submit = () => {
    const r = createVehicle(form);
    if (toast.result(r)) router.push(`/vehicles/${r.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ href: "/vehicles", label: "Vehicles" }} title="Create a new vehicle" subtitle="Set up an SPV or fund. It starts as a draft so you can review before launching the raise." />
      <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors", i < step ? "bg-success text-white" : i === step ? "bg-brand text-white" : "bg-subtle text-faint")}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className={cn("text-sm font-medium", i === step ? "text-fg" : "hidden text-faint sm:inline")}>{s}</span>
            {i < steps.length - 1 ? <ChevronRight className="mx-0.5 h-4 w-4 text-faint sm:mx-1" /> : null}
          </li>
        ))}
      </ol>

      <Card>
        <CardBody className="pt-5">
          {step === 0 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["SPV", "Fund"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => set("type", t)}
                    className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-all", form.type === t ? "border-brand bg-brand-soft ring-2 ring-[var(--ring)]" : "border-border hover:bg-hover")}
                  >
                    <span className={cn("rounded-lg p-2", form.type === t ? "bg-brand text-white" : "bg-subtle text-muted")}>{t === "SPV" ? <Landmark className="h-4 w-4" /> : <Layers className="h-4 w-4" />}</span>
                    <span>
                      <span className="block text-sm font-semibold">{t === "SPV" ? "Special Purpose Vehicle" : "Fund"}</span>
                      <span className="mt-0.5 block text-[13px] text-muted">{t === "SPV" ? "Single-asset deal. Investors wire full subscription at close; no capital calls." : "Multi-asset, blind-pool. Commitments drawn down via capital calls; management fee & pref apply."}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Manager / GP">
                  <Select value={form.managerId} onChange={(e) => set("managerId", e.target.value)}>
                    {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.firm}</option>)}
                  </Select>
                </Field>
                <Field label="Jurisdiction">
                  <Select value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)}>
                    {["Delaware", "Cayman Islands", "BVI", "Singapore", "Luxembourg"].map((j) => <option key={j}>{j}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Target raise" error={errors.targetRaise}><MoneyInput value={form.targetRaise} onChange={(n) => set("targetRaise", n)} /></Field>
              <Field label="Minimum investment" error={errors.minInvestment}><MoneyInput value={form.minInvestment} onChange={(n) => set("minInvestment", n)} /></Field>
              <Field label="Carried interest (%)" error={errors.carryPct}><Input type="number" min={0} max={50} step={0.5} value={form.carryPct} onChange={(e) => set("carryPct", Number(e.target.value))} /></Field>
              <Field label="Management fee (% p.a.)" hint={form.type === "SPV" ? "Usually 0% for SPVs" : "Typically 2%"}><Input type="number" min={0} max={5} step={0.25} value={form.managementFeePct} onChange={(e) => set("managementFeePct", Number(e.target.value))} /></Field>
              <Field label="Preferred return (% p.a.)" hint="Hurdle before carry applies"><Input type="number" min={0} max={20} step={0.5} value={form.preferredReturnPct} onChange={(e) => set("preferredReturnPct", Number(e.target.value))} /></Field>
              <Field label="Target close date"><Input type="date" value={form.targetCloseDate} onChange={(e) => set("targetCloseDate", e.target.value)} /></Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Vehicle name" error={errors.name} className="sm:col-span-2"><Input placeholder={`e.g. ${managers.find((m) => m.id === form.managerId)?.firm ?? "Firm"} SPV – Company`} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label={form.type === "SPV" ? "Portfolio company" : "Strategy / portfolio"} error={errors.portfolioCompany}><Input placeholder="Company name" value={form.portfolioCompany} onChange={(e) => set("portfolioCompany", e.target.value)} /></Field>
              <Field label="Sector"><Select value={form.sector} onChange={(e) => set("sector", e.target.value)}>{SECTORS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Description" className="sm:col-span-2"><Textarea placeholder="Round, lead investor, thesis…" value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-subtle/50 p-4">
                <p className="text-base font-semibold">{form.name}</p>
                <p className="text-sm text-muted">{form.type} · {form.portfolioCompany} · {form.jurisdiction}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <KV label="Target raise" value={fmtCurrency(form.targetRaise)} />
                <KV label="Minimum" value={fmtCurrency(form.minInvestment)} />
                <KV label="Carry" value={`${form.carryPct}%`} />
                <KV label="Mgmt fee" value={`${form.managementFeePct}%`} />
                <KV label="Pref return" value={`${form.preferredReturnPct}%`} />
                <KV label="Target close" value={form.targetCloseDate} />
              </div>
              <div className="rounded-lg border border-info/30 bg-info-soft p-3 text-[13px] text-info">
                On creation we generate a draft operating agreement. The raise can be launched once that agreement is signed.
              </div>
            </div>
          ) : null}
        </CardBody>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={() => (step === 0 ? router.push("/vehicles") : setStep(step - 1))}><ChevronLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}</Button>
          {step < steps.length - 1 ? <Button disabled={!canNext()} onClick={() => setStep(step + 1)}>Continue <ChevronRight className="h-4 w-4" /></Button> : <Button onClick={submit}>Create draft vehicle</Button>}
        </div>
      </Card>
    </div>
  );
}
