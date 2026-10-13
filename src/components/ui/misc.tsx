"use client";
import * as React from "react";
import Link from "next/link";
import { cn, initials } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, ChevronLeft } from "lucide-react";

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const hue = Math.abs([...name].reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  const s = { sm: "h-7 w-7 text-[11px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" }[size];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", s, className)}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))` }}
    >
      {initials(name)}
    </span>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "success" | "warning" | "danger" }) {
  const v = Math.max(0, Math.min(100, value));
  const colors = { brand: "bg-brand", success: "bg-success", warning: "bg-warning", danger: "bg-danger" };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-subtle", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", colors[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Stat({ label, value, delta, hint, icon, tone }: { label: string; value: React.ReactNode; delta?: number; hint?: string; icon?: React.ReactNode; tone?: "brand" | "success" | "warning" | "violet" | "teal" }) {
  const toneBg = {
    brand: "from-brand/15 to-brand/0 text-brand",
    success: "from-success/15 to-success/0 text-success",
    warning: "from-warning/15 to-warning/0 text-warning",
    violet: "from-violet/15 to-violet/0 text-violet",
    teal: "from-teal/15 to-teal/0 text-teal",
  }[tone ?? "brand"];
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-elev p-5 shadow-card">
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl", toneBg)} />
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon ? <span className={cn("rounded-lg bg-subtle p-1.5", toneBg.split(" ").pop())}>{icon}</span> : null}
      </div>
      <div className="mt-2 text-[26px] font-semibold tracking-tight tnum">{value}</div>
      {(delta !== undefined || hint) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {delta !== undefined ? (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-success" : "text-danger")}>
              {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
          {hint ? <span className="text-faint">{hint}</span> : null}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back, eyebrow }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string }; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg">
            <ChevronLeft className="h-3.5 w-3.5" /> {back.label}
          </Link>
        ) : null}
        {eyebrow ? <div className="mb-1.5">{eyebrow}</div> : null}
        <h1 className="truncate text-[22px] font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong px-6 py-14 text-center">
      {icon ? <div className="mb-3 rounded-xl bg-subtle p-3 text-faint">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="scroll-area -mb-px flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13.5px] font-medium transition-colors",
            value === t.id ? "text-fg" : "text-muted hover:text-fg",
          )}
        >
          {t.label}
          {t.count !== undefined ? <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] tnum", value === t.id ? "bg-brand-soft text-brand" : "bg-subtle text-faint")}>{t.count}</span> : null}
          {value === t.id ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" /> : null}
        </button>
      ))}
    </div>
  );
}

export function KV({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[11.5px] font-medium uppercase tracking-wide text-faint">{label}</span>
      <span className="text-sm font-medium tnum">{value}</span>
    </div>
  );
}

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-subtle p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-md px-3 py-1 text-[13px] font-medium transition-all", value === o.value ? "bg-elev text-fg shadow-card" : "text-muted hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
