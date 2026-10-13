import { cn } from "@/lib/utils";
import type { CapitalCallStatus, DistributionStatus, DocumentStatus, KycStatus, SubscriptionStatus, TaskPriority, TaskStatus, VehicleStatus, AccreditationStatus } from "@/lib/types";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "violet" | "teal";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-muted border-border",
  brand: "bg-brand-soft text-brand border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  info: "bg-info-soft text-info border-transparent",
  violet: "bg-brand-soft text-violet border-transparent",
  teal: "bg-info-soft text-teal border-transparent",
};

export function Badge({ tone = "neutral", className, children, dot }: { tone?: Tone; className?: string; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11.5px] font-medium leading-5 whitespace-nowrap", tones[tone], className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export const vehicleTone: Record<VehicleStatus, Tone> = {
  draft: "neutral",
  raising: "info",
  closing: "warning",
  closed: "violet",
  active: "success",
  liquidated: "neutral",
};

export const subTone: Record<SubscriptionStatus, Tone> = {
  invited: "neutral",
  signed: "info",
  kyc_review: "warning",
  approved: "violet",
  wire_pending: "warning",
  funded: "success",
  rejected: "danger",
};

export const kycTone: Record<KycStatus, Tone> = {
  not_started: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export const accrTone: Record<AccreditationStatus, Tone> = {
  unverified: "neutral",
  verified: "success",
  expired: "danger",
};

export const callTone: Record<CapitalCallStatus, Tone> = {
  draft: "neutral",
  sent: "info",
  partially_funded: "warning",
  funded: "success",
  cancelled: "danger",
};

export const distTone: Record<DistributionStatus, Tone> = {
  draft: "neutral",
  approved: "info",
  paid: "success",
};

export const taskTone: Record<TaskStatus, Tone> = {
  open: "neutral",
  in_progress: "info",
  done: "success",
};

export const priorityTone: Record<TaskPriority, Tone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export const docTone: Record<DocumentStatus, Tone> = {
  draft: "neutral",
  pending_signature: "warning",
  signed: "success",
  filed: "violet",
};

export function StatusBadge<T extends string>({ status, map, label }: { status: T; map: Record<T, Tone>; label?: string }) {
  return (
    <Badge tone={map[status]} dot>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}
