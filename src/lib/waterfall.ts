import type { AppData, DistributionAllocation, DistributionType, Vehicle } from "./types";
import { investorContributions, investorDistributions, vehicleSubs } from "./selectors";
import { COMMITTED_STATUSES } from "./selectors";

export interface WaterfallResult {
  allocations: DistributionAllocation[];
  carryAmount: number;
  totalGross: number;
  totalNet: number;
  basis: "contributed" | "committed";
  notes: string[];
}

/**
 * Per-investor (European-style simplified) waterfall:
 * 1. Return of capital: gross allocated pro-rata by contributed capital.
 * 2. Preferred return (if any) accrues simple interest on unreturned capital from vehicle close.
 * 3. Carry applies only to the portion of this distribution that exceeds unreturned capital + accrued pref.
 * Return-of-capital distributions never bear carry.
 */
export function computeWaterfall(d: AppData, v: Vehicle, type: DistributionType, totalAmount: number, asOf: string): WaterfallResult {
  const notes: string[] = [];
  const subs = vehicleSubs(d, v.id).filter((s) => COMMITTED_STATUSES.includes(s.status));
  const rows = subs.map((s) => ({
    investorId: s.investorId,
    contributed: investorContributions(d, s.investorId, v.id),
    committed: s.amount,
    priorGross: investorDistributions(d, s.investorId, v.id),
  }));
  const totalContributed = rows.reduce((a, r) => a + r.contributed, 0);
  const basis: WaterfallResult["basis"] = totalContributed > 0 ? "contributed" : "committed";
  const denominator = basis === "contributed" ? totalContributed : rows.reduce((a, r) => a + r.committed, 0);
  if (basis === "committed") notes.push("No contributions recorded yet; allocating pro-rata by commitments.");
  if (denominator <= 0) {
    return { allocations: [], carryAmount: 0, totalGross: 0, totalNet: 0, basis, notes: ["No committed investors in this vehicle."] };
  }

  const yearsHeld = v.closedAt ? Math.max(0, (new Date(asOf).getTime() - new Date(v.closedAt).getTime()) / (365.25 * 86400000)) : 0;
  const allocations: DistributionAllocation[] = rows.map((r) => {
    const share = (basis === "contributed" ? r.contributed : r.committed) / denominator;
    const gross = Math.round(totalAmount * share);
    if (type === "return_of_capital" || v.carryPct === 0) {
      return { investorId: r.investorId, grossAmount: gross, carry: 0, netAmount: gross };
    }
    // prior distributions first return capital, then pref, then profit
    const unreturnedCapital = Math.max(0, r.contributed - r.priorGross);
    const prefAccrued = r.contributed * (v.preferredReturnPct / 100) * yearsHeld;
    const prefRemaining = Math.max(0, prefAccrued - Math.max(0, r.priorGross - r.contributed));
    const hurdle = unreturnedCapital + prefRemaining;
    const profitPortion = Math.max(0, gross - hurdle);
    const carry = Math.round(profitPortion * (v.carryPct / 100));
    return { investorId: r.investorId, grossAmount: gross, carry, netAmount: gross - carry };
  });

  // fix rounding drift so gross sums exactly to totalAmount
  const drift = totalAmount - allocations.reduce((a, x) => a + x.grossAmount, 0);
  if (drift !== 0 && allocations.length) {
    allocations[0].grossAmount += drift;
    allocations[0].netAmount += drift;
  }
  const carryAmount = allocations.reduce((a, x) => a + x.carry, 0);
  if (type !== "return_of_capital" && v.preferredReturnPct > 0) notes.push(`Preferred return of ${v.preferredReturnPct}% p.a. accrued over ${yearsHeld.toFixed(2)} years before carry.`);
  if (carryAmount > 0) notes.push(`${v.carryPct}% carried interest applied to profit above the hurdle.`);
  return {
    allocations,
    carryAmount,
    totalGross: totalAmount,
    totalNet: totalAmount - carryAmount,
    basis,
    notes,
  };
}

/** Pro-rata capital call allocation across funded commitments. */
export function allocateCapitalCall(d: AppData, vehicleId: string, totalAmount: number) {
  const subs = vehicleSubs(d, vehicleId).filter((s) => s.status === "funded");
  const total = subs.reduce((a, s) => a + s.amount, 0);
  if (total <= 0) return [];
  const items = subs.map((s) => ({ investorId: s.investorId, amount: Math.round((totalAmount * s.amount) / total), received: false as const }));
  const drift = totalAmount - items.reduce((a, i) => a + i.amount, 0);
  if (drift !== 0 && items.length) items[0].amount += drift;
  return items;
}
