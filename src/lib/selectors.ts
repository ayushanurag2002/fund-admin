import type { AppData, Investor, Subscription, SubscriptionStatus, Vehicle, VehicleStatus } from "./types";
import { sum } from "./utils";

export const COMMITTED_STATUSES: SubscriptionStatus[] = ["approved", "wire_pending", "funded"];
export const OPEN_STATUSES: SubscriptionStatus[] = ["invited", "signed", "kyc_review"];

export const VEHICLE_STATUS_ORDER: VehicleStatus[] = ["draft", "raising", "closing", "closed", "active", "liquidated"];
export const SUB_STATUS_ORDER: SubscriptionStatus[] = ["invited", "signed", "kyc_review", "approved", "wire_pending", "funded", "rejected"];

export function vehicleSubs(d: AppData, vehicleId: string) {
  return d.subscriptions.filter((s) => s.vehicleId === vehicleId);
}

export function vehicleCommitted(d: AppData, vehicleId: string) {
  return sum(vehicleSubs(d, vehicleId).filter((s) => COMMITTED_STATUSES.includes(s.status)).map((s) => s.amount));
}

export function vehicleFunded(d: AppData, vehicleId: string) {
  return sum(vehicleSubs(d, vehicleId).filter((s) => s.status === "funded").map((s) => s.amount));
}

export function vehiclePipeline(d: AppData, vehicleId: string) {
  return sum(vehicleSubs(d, vehicleId).filter((s) => OPEN_STATUSES.includes(s.status)).map((s) => s.amount));
}

/** Cash actually received into the vehicle (contributions in ledger). */
export function vehicleContributions(d: AppData, vehicleId: string) {
  return sum(d.ledger.filter((l) => l.vehicleId === vehicleId && l.type === "contribution").map((l) => l.amount));
}

export function vehicleDistributed(d: AppData, vehicleId: string) {
  return -sum(d.ledger.filter((l) => l.vehicleId === vehicleId && l.type === "distribution").map((l) => l.amount));
}

export function vehicleCashBalance(d: AppData, vehicleId: string) {
  return sum(d.ledger.filter((l) => l.vehicleId === vehicleId).map((l) => l.amount));
}

export function vehicleNav(d: AppData, v: Vehicle) {
  return v.currentValue + Math.max(0, vehicleCashBalance(d, v.id));
}

export function vehicleMoic(d: AppData, v: Vehicle) {
  const contributed = vehicleContributions(d, v.id);
  if (contributed <= 0) return null;
  return (vehicleNav(d, v) + vehicleDistributed(d, v.id)) / contributed;
}

export function investorContributions(d: AppData, investorId: string, vehicleId?: string) {
  return sum(
    d.ledger
      .filter((l) => l.investorId === investorId && l.type === "contribution" && (!vehicleId || l.vehicleId === vehicleId))
      .map((l) => l.amount),
  );
}

export function investorDistributions(d: AppData, investorId: string, vehicleId?: string) {
  return -sum(
    d.ledger
      .filter((l) => l.investorId === investorId && l.type === "distribution" && (!vehicleId || l.vehicleId === vehicleId))
      .map((l) => l.amount),
  );
}

export function investorCommitted(d: AppData, investorId: string) {
  return sum(d.subscriptions.filter((s) => s.investorId === investorId && COMMITTED_STATUSES.includes(s.status)).map((s) => s.amount));
}

export function investorVehicles(d: AppData, investorId: string) {
  const ids = new Set(d.subscriptions.filter((s) => s.investorId === investorId && s.status !== "rejected").map((s) => s.vehicleId));
  return d.vehicles.filter((v) => ids.has(v.id));
}

/** Cap table: ownership % by contributed capital (falls back to commitments while raising). */
export function capTable(d: AppData, vehicleId: string) {
  const subs = vehicleSubs(d, vehicleId).filter((s) => COMMITTED_STATUSES.includes(s.status));
  const byInvestor = new Map<string, { investor: Investor; committed: number; contributed: number; subscription: Subscription }>();
  for (const s of subs) {
    const investor = d.investors.find((i) => i.id === s.investorId)!;
    const contributed = investorContributions(d, s.investorId, vehicleId);
    byInvestor.set(s.investorId, { investor, committed: s.amount, contributed, subscription: s });
  }
  const rows = [...byInvestor.values()];
  const totalContributed = sum(rows.map((r) => r.contributed));
  const totalCommitted = sum(rows.map((r) => r.committed));
  const basis = totalContributed > 0 ? "contributed" : "committed";
  return rows
    .map((r) => ({
      ...r,
      ownershipPct: basis === "contributed" ? (totalContributed ? (r.contributed / totalContributed) * 100 : 0) : totalCommitted ? (r.committed / totalCommitted) * 100 : 0,
    }))
    .sort((a, b) => b.ownershipPct - a.ownershipPct);
}

export function totalAum(d: AppData) {
  return sum(d.vehicles.filter((v) => v.status === "active" || v.status === "closed").map((v) => vehicleNav(d, v)));
}

export function managerName(d: AppData, managerId: string) {
  return d.managers.find((m) => m.id === managerId)?.name ?? "Unknown";
}

export function investorName(d: AppData, investorId?: string) {
  if (!investorId) return "—";
  return d.investors.find((i) => i.id === investorId)?.name ?? "Unknown";
}

export function vehicleName(d: AppData, vehicleId?: string) {
  if (!vehicleId) return "—";
  return d.vehicles.find((v) => v.id === vehicleId)?.name ?? "Unknown";
}
