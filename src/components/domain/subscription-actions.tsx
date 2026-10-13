"use client";
import * as React from "react";
import { useStore, SUB_ACTION_LABEL } from "@/lib/store";
import type { Subscription, SubscriptionStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { RejectDialog } from "./dialogs";
import { Check, X, Send, FileSignature, ShieldCheck, Banknote, RotateCcw } from "lucide-react";

const NEXT: Partial<Record<SubscriptionStatus, SubscriptionStatus>> = {
  invited: "signed",
  signed: "kyc_review",
  kyc_review: "approved",
  approved: "wire_pending",
  wire_pending: "funded",
};

const ICON: Partial<Record<SubscriptionStatus, React.ReactNode>> = {
  signed: <FileSignature className="h-3.5 w-3.5" />,
  kyc_review: <ShieldCheck className="h-3.5 w-3.5" />,
  approved: <Check className="h-3.5 w-3.5" />,
  wire_pending: <Send className="h-3.5 w-3.5" />,
  funded: <Banknote className="h-3.5 w-3.5" />,
};

export function SubscriptionActions({ sub, compact }: { sub: Subscription; compact?: boolean }) {
  const transition = useStore((s) => s.transitionSubscription);
  const vehicle = useStore((s) => s.vehicles.find((v) => v.id === sub.vehicleId));
  const investor = useStore((s) => s.investors.find((i) => i.id === sub.investorId));
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const next = NEXT[sub.status];
  const acceptingSubs = vehicle?.status === "raising" || vehicle?.status === "closing";

  // precompute blocking hints for approval so the button can explain itself
  let blocked: string | undefined;
  if (next === "approved" && investor) {
    if (investor.kycStatus !== "approved") blocked = "KYC not approved";
    else if (investor.accreditation !== "verified") blocked = "Accreditation not verified";
  }
  if (next && !acceptingSubs) blocked = "Vehicle not accepting subscriptions";

  return (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {next ? (
        <Button size="sm" variant={next === "funded" ? "success" : "primary"} title={blocked ?? SUB_ACTION_LABEL[next]} aria-label={SUB_ACTION_LABEL[next]} disabled={!!blocked} onClick={() => toast.result(transition(sub.id, next))}>
          {ICON[next]} {compact ? null : SUB_ACTION_LABEL[next]}
        </Button>
      ) : null}
      {sub.status === "rejected" && acceptingSubs ? (
        <Button size="sm" variant="outline" onClick={() => toast.result(transition(sub.id, "invited"))}><RotateCcw className="h-3.5 w-3.5" /> {compact ? null : "Re-invite"}</Button>
      ) : null}
      {sub.status !== "funded" && sub.status !== "rejected" ? (
        <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={() => setRejectOpen(true)} title="Reject"><X className="h-3.5 w-3.5" /></Button>
      ) : null}
      <RejectDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={(reason) => toast.result(transition(sub.id, "rejected", reason))} />
    </div>
  );
}
