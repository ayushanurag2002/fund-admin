"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Activity,
  AppData,
  CapitalCall,
  Distribution,
  DistributionType,
  Doc,
  DocumentKind,
  Investor,
  KycStatus,
  LedgerEntry,
  Subscription,
  SubscriptionStatus,
  Task,
  TaskStatus,
  Vehicle,
  VehicleStatus,
} from "./types";
import { buildSeed } from "./seed";
import { nowIso, uid } from "./utils";
import { COMMITTED_STATUSES, OPEN_STATUSES, vehicleCommitted, vehicleSubs } from "./selectors";
import { allocateCapitalCall, computeWaterfall } from "./waterfall";

export type Result = { ok: true; message?: string } | { ok: false; error: string };
const ok = (message?: string): Result => ({ ok: true, message });
const fail = (error: string): Result => ({ ok: false, error });

export interface NewVehicleInput {
  name: string;
  type: Vehicle["type"];
  managerId: string;
  portfolioCompany: string;
  sector: string;
  jurisdiction: string;
  targetRaise: number;
  minInvestment: number;
  managementFeePct: number;
  carryPct: number;
  preferredReturnPct: number;
  targetCloseDate: string;
  description: string;
}

export interface NewInvestorInput {
  name: string;
  email: string;
  entityType: Investor["entityType"];
  country: string;
  taxId: string;
  notes?: string;
}

interface Store extends AppData {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  reset: () => void;
  // vehicles
  createVehicle: (input: NewVehicleInput) => { id: string } & Result;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => Result;
  transitionVehicle: (id: string, to: VehicleStatus) => Result;
  deleteVehicle: (id: string) => Result;
  // investors
  createInvestor: (input: NewInvestorInput) => { id: string } & Result;
  updateInvestor: (id: string, patch: Partial<Investor>) => Result;
  setKyc: (id: string, status: KycStatus) => Result;
  verifyAccreditation: (id: string) => Result;
  // subscriptions
  inviteInvestor: (vehicleId: string, investorId: string, amount: number) => Result;
  transitionSubscription: (id: string, to: SubscriptionStatus, reason?: string) => Result;
  // capital calls
  createCapitalCall: (vehicleId: string, totalAmount: number, dueDate: string, purpose: string) => { id?: string } & Result;
  issueCapitalCall: (id: string) => Result;
  markCallItemReceived: (id: string, investorId: string) => Result;
  cancelCapitalCall: (id: string) => Result;
  // distributions
  createDistribution: (vehicleId: string, type: DistributionType, totalAmount: number, date: string, memo: string) => { id?: string } & Result;
  approveDistribution: (id: string) => Result;
  payDistribution: (id: string) => Result;
  deleteDistribution: (id: string) => Result;
  // tasks
  createTask: (input: Omit<Task, "id" | "createdAt" | "status">) => Result;
  setTaskStatus: (id: string, status: TaskStatus) => Result;
  deleteTask: (id: string) => Result;
  // documents
  addDocument: (vehicleId: string, name: string, kind: DocumentKind, investorId?: string) => Result;
  setDocumentStatus: (id: string, status: Doc["status"]) => Result;
  // ledger
  addLedgerEntry: (entry: Omit<LedgerEntry, "id">) => Result;
}

const VEHICLE_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  draft: ["raising"],
  raising: ["closing", "draft"],
  closing: ["closed", "raising"],
  closed: ["active"],
  active: ["liquidated"],
  liquidated: [],
};

const SUB_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  invited: ["signed", "rejected"],
  signed: ["kyc_review", "rejected"],
  kyc_review: ["approved", "rejected"],
  approved: ["wire_pending", "rejected"],
  wire_pending: ["funded", "rejected"],
  funded: [],
  rejected: ["invited"],
};

export const SUB_ACTION_LABEL: Record<SubscriptionStatus, string> = {
  invited: "Re-invite",
  signed: "Mark signed",
  kyc_review: "Submit for KYC",
  approved: "Approve",
  wire_pending: "Send wire instructions",
  funded: "Mark funded",
  rejected: "Reject",
};

export const VEHICLE_ACTION_LABEL: Record<VehicleStatus, string> = {
  draft: "Back to draft",
  raising: "Launch raise",
  closing: "Begin closing",
  closed: "Final close",
  active: "Mark deployed",
  liquidated: "Liquidate",
};

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const log = (actor: string, action: string, entityType: Activity["entityType"], entityId?: string) => {
        set((s) => ({ activity: [{ id: uid("act"), at: nowIso(), actor, action, entityType, entityId }, ...s.activity].slice(0, 300) }));
      };
      const data = () => get() as AppData;

      return {
        ...buildSeed(),
        hydrated: false,
        setHydrated: (v) => set({ hydrated: v }),
        reset: () => {
          set({ ...buildSeed() });
        },

        // ---------- Vehicles ----------
        createVehicle: (input) => {
          if (!input.name.trim()) return { id: "", ok: false, error: "Name is required" };
          if (input.targetRaise <= 0) return { id: "", ok: false, error: "Target raise must be positive" };
          if (input.minInvestment <= 0 || input.minInvestment > input.targetRaise) return { id: "", ok: false, error: "Minimum investment must be positive and below target" };
          const id = uid("veh");
          const v: Vehicle = {
            id,
            ...input,
            status: "draft",
            openedAt: nowIso().slice(0, 10),
            investedCapital: 0,
            currentValue: 0,
          };
          set((s) => ({ vehicles: [v, ...s.vehicles] }));
          get().addDocument(id, `Operating Agreement – ${input.name} (draft).pdf`, "operating_agreement");
          log("You", `created draft vehicle '${input.name}'`, "vehicle", id);
          return { id, ok: true, message: "Vehicle created as draft" };
        },

        updateVehicle: (id, patch) => {
          set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
          return ok("Saved");
        },

        transitionVehicle: (id, to) => {
          const d = data();
          const v = d.vehicles.find((x) => x.id === id);
          if (!v) return fail("Vehicle not found");
          if (!VEHICLE_TRANSITIONS[v.status].includes(to)) return fail(`Cannot move from ${v.status} to ${to}`);
          const subs = vehicleSubs(d, id);
          const patch: Partial<Vehicle> = { status: to };

          if (to === "raising" && v.status === "draft") {
            if (!v.portfolioCompany.trim()) return fail("Set a portfolio company before launching");
            const hasOA = d.documents.some((doc) => doc.vehicleId === id && doc.kind === "operating_agreement" && doc.status === "signed");
            if (!hasOA) return fail("Operating agreement must be signed before launching the raise");
          }
          if (to === "closing") {
            if (!subs.some((s) => COMMITTED_STATUSES.includes(s.status))) return fail("At least one approved subscription is required to begin closing");
          }
          if (to === "closed") {
            const unresolved = subs.filter((s) => s.status === "approved" || s.status === "wire_pending");
            if (unresolved.length) return fail(`${unresolved.length} approved subscription(s) still awaiting wires. Fund or reject them first.`);
            const funded = subs.filter((s) => s.status === "funded");
            if (!funded.length) return fail("No funded subscriptions – nothing to close");
            const dropped = subs.filter((s) => OPEN_STATUSES.includes(s.status));
            if (dropped.length) {
              set((s) => ({
                subscriptions: s.subscriptions.map((x) =>
                  x.vehicleId === id && OPEN_STATUSES.includes(x.status) ? { ...x, status: "rejected", rejectedReason: "Vehicle closed before completion" } : x,
                ),
              }));
            }
            patch.closedAt = nowIso().slice(0, 10);
            get().createTask({ title: `File Form D – ${v.name}`, type: "filing", vehicleId: id, dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10), priority: "high", assignee: "Compliance" });
          }
          if (to === "active") {
            const contributions = d.ledger.filter((l) => l.vehicleId === id && l.type === "contribution").reduce((a, l) => a + l.amount, 0);
            const expenses = d.ledger.filter((l) => l.vehicleId === id && (l.type === "expense" || l.type === "management_fee")).reduce((a, l) => a + l.amount, 0);
            const deployable = contributions + expenses;
            if (deployable <= 0) return fail("No capital received to deploy");
            if (v.type === "SPV") {
              get().addLedgerEntry({ vehicleId: id, type: "investment", amount: -deployable, date: nowIso().slice(0, 10), memo: `Wire to ${v.portfolioCompany} – investment` });
              patch.investedCapital = deployable;
              patch.currentValue = deployable;
            } else {
              patch.investedCapital = v.investedCapital || 0;
              patch.currentValue = v.currentValue || deployable;
            }
          }
          if (to === "liquidated") {
            const hasExit = d.distributions.some((x) => x.vehicleId === id && x.status === "paid");
            if (!hasExit) return fail("Pay at least one distribution before liquidating");
            patch.currentValue = 0;
          }
          set((s) => ({ vehicles: s.vehicles.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
          log("You", `moved '${v.name}' to ${to}`, "vehicle", id);
          return ok(`Vehicle is now ${to}`);
        },

        deleteVehicle: (id) => {
          const v = data().vehicles.find((x) => x.id === id);
          if (!v) return fail("Not found");
          if (v.status !== "draft") return fail("Only draft vehicles can be deleted");
          set((s) => ({
            vehicles: s.vehicles.filter((x) => x.id !== id),
            documents: s.documents.filter((x) => x.vehicleId !== id),
            tasks: s.tasks.filter((x) => x.vehicleId !== id),
            subscriptions: s.subscriptions.filter((x) => x.vehicleId !== id),
          }));
          log("You", `deleted draft vehicle '${v.name}'`, "vehicle", id);
          return ok("Vehicle deleted");
        },

        // ---------- Investors ----------
        createInvestor: (input) => {
          if (!input.name.trim() || !input.email.includes("@")) return { id: "", ok: false, error: "Name and a valid email are required" };
          if (data().investors.some((i) => i.email.toLowerCase() === input.email.toLowerCase())) return { id: "", ok: false, error: "An investor with this email already exists" };
          const id = uid("inv");
          const inv: Investor = { id, ...input, kycStatus: "not_started", accreditation: "unverified", createdAt: nowIso().slice(0, 10) };
          set((s) => ({ investors: [inv, ...s.investors] }));
          log("You", `added investor ${input.name}`, "investor", id);
          return { id, ok: true, message: "Investor added" };
        },

        updateInvestor: (id, patch) => {
          set((s) => ({ investors: s.investors.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
          return ok("Saved");
        },

        setKyc: (id, status) => {
          const inv = data().investors.find((i) => i.id === id);
          if (!inv) return fail("Investor not found");
          const allowed: Record<KycStatus, KycStatus[]> = {
            not_started: ["pending"],
            pending: ["approved", "rejected"],
            approved: ["pending"],
            rejected: ["pending"],
          };
          if (!allowed[inv.kycStatus].includes(status)) return fail(`Cannot move KYC from ${inv.kycStatus} to ${status}`);
          set((s) => ({ investors: s.investors.map((i) => (i.id === id ? { ...i, kycStatus: status } : i)) }));
          if (status === "approved") {
            set((s) => ({ tasks: s.tasks.map((t) => (t.investorId === id && t.type === "kyc" && t.status !== "done" ? { ...t, status: "done" } : t)) }));
          }
          if (status === "rejected") {
            // any subscriptions in review are rejected too
            set((s) => ({
              subscriptions: s.subscriptions.map((x) => (x.investorId === id && (x.status === "kyc_review" || x.status === "signed") ? { ...x, status: "rejected", rejectedReason: "KYC rejected" } : x)),
            }));
          }
          log("You", `set KYC for ${inv.name} to ${status}`, "investor", id);
          return ok(`KYC ${status}`);
        },

        verifyAccreditation: (id) => {
          const inv = data().investors.find((i) => i.id === id);
          if (!inv) return fail("Investor not found");
          set((s) => ({ investors: s.investors.map((i) => (i.id === id ? { ...i, accreditation: "verified" } : i)) }));
          log("You", `verified accreditation for ${inv.name}`, "investor", id);
          return ok("Accreditation verified");
        },

        // ---------- Subscriptions ----------
        inviteInvestor: (vehicleId, investorId, amount) => {
          const d = data();
          const v = d.vehicles.find((x) => x.id === vehicleId);
          const inv = d.investors.find((x) => x.id === investorId);
          if (!v || !inv) return fail("Vehicle or investor not found");
          if (v.status !== "raising" && v.status !== "closing") return fail("Vehicle must be raising or closing to invite investors");
          if (amount < v.minInvestment) return fail(`Minimum investment is $${v.minInvestment.toLocaleString()}`);
          const existing = d.subscriptions.find((s) => s.vehicleId === vehicleId && s.investorId === investorId && s.status !== "rejected");
          if (existing) return fail("Investor already has an active subscription in this vehicle");
          if (vehicleCommitted(d, vehicleId) + amount > v.targetRaise * 1.2) return fail("This would exceed 120% of target raise (hard cap)");
          const sub: Subscription = { id: uid("sub"), vehicleId, investorId, amount, status: "invited", invitedAt: nowIso() };
          set((s) => ({ subscriptions: [sub, ...s.subscriptions] }));
          get().addDocument(vehicleId, `Subscription Agreement – ${inv.name}.pdf`, "subscription_agreement", investorId);
          log("You", `invited ${inv.name} to ${v.name} ($${amount.toLocaleString()})`, "subscription", sub.id);
          return ok("Invitation sent");
        },

        transitionSubscription: (id, to, reason) => {
          const d = data();
          const sub = d.subscriptions.find((s) => s.id === id);
          if (!sub) return fail("Subscription not found");
          const v = d.vehicles.find((x) => x.id === sub.vehicleId)!;
          const inv = d.investors.find((x) => x.id === sub.investorId)!;
          if (!SUB_TRANSITIONS[sub.status].includes(to)) return fail(`Cannot move from ${sub.status} to ${to}`);
          if (to !== "rejected" && v.status !== "raising" && v.status !== "closing") return fail("Vehicle is not accepting subscriptions");

          const patch: Partial<Subscription> = { status: to };
          if (to === "signed") {
            patch.signedAt = nowIso();
            set((s) => ({ documents: s.documents.map((doc) => (doc.vehicleId === sub.vehicleId && doc.investorId === sub.investorId && doc.kind === "subscription_agreement" ? { ...doc, status: "signed" } : doc)) }));
          }
          if (to === "kyc_review") {
            if (inv.kycStatus === "rejected") return fail("Investor KYC is rejected – cannot submit");
            if (inv.kycStatus === "not_started") get().setKyc(inv.id, "pending");
            if (!d.tasks.some((t) => t.investorId === inv.id && t.type === "kyc" && t.status !== "done") && inv.kycStatus !== "approved") {
              get().createTask({ title: `Review KYC documents – ${inv.name}`, type: "kyc", vehicleId: v.id, investorId: inv.id, dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), priority: "high", assignee: "You" });
            }
          }
          if (to === "approved") {
            if (inv.kycStatus !== "approved") return fail("Investor KYC must be approved first");
            if (inv.accreditation !== "verified") return fail("Investor accreditation must be verified first");
            if (vehicleCommitted(d, v.id) + sub.amount > v.targetRaise * 1.2) return fail("Approval would exceed the 120% hard cap");
            patch.approvedAt = nowIso();
          }
          if (to === "funded") {
            patch.fundedAt = nowIso();
            if (v.type === "SPV") {
              get().addLedgerEntry({ vehicleId: v.id, investorId: inv.id, type: "contribution", amount: sub.amount, date: nowIso().slice(0, 10), memo: "Subscription wire received", reference: sub.id });
            }
          }
          if (to === "rejected") patch.rejectedReason = reason || "Rejected by admin";
          if (to === "invited") {
            patch.rejectedReason = undefined;
            patch.signedAt = undefined;
            patch.approvedAt = undefined;
          }
          set((s) => ({ subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
          log("You", `moved ${inv.name}'s subscription in ${v.name} to ${to.replace("_", " ")}`, "subscription", id);
          return ok(`Subscription ${to.replace("_", " ")}`);
        },

        // ---------- Capital calls ----------
        createCapitalCall: (vehicleId, totalAmount, dueDate, purpose) => {
          const d = data();
          const v = d.vehicles.find((x) => x.id === vehicleId);
          if (!v) return fail("Vehicle not found");
          if (v.type !== "Fund") return fail("Capital calls are only available for Funds (SPVs are fully funded at close)");
          if (v.status !== "closed" && v.status !== "active") return fail("Fund must be closed or active to call capital");
          if (totalAmount <= 0) return fail("Amount must be positive");
          const commitments = vehicleSubs(d, vehicleId).filter((s) => s.status === "funded").reduce((a, s) => a + s.amount, 0);
          const alreadyCalled = d.capitalCalls.filter((c) => c.vehicleId === vehicleId && c.status !== "cancelled").reduce((a, c) => a + c.totalAmount, 0);
          if (alreadyCalled + totalAmount > commitments) return fail(`Exceeds uncalled commitments ($${(commitments - alreadyCalled).toLocaleString()} remaining)`);
          if (!dueDate || new Date(dueDate) < new Date(nowIso().slice(0, 10))) return fail("Due date must be today or later");
          const items = allocateCapitalCall(d, vehicleId, totalAmount);
          const number = d.capitalCalls.filter((c) => c.vehicleId === vehicleId).length + 1;
          const cc: CapitalCall = { id: uid("cc"), vehicleId, number, purpose: purpose || `Capital call #${number}`, totalAmount, issuedAt: nowIso().slice(0, 10), dueDate, status: "draft", items };
          set((s) => ({ capitalCalls: [cc, ...s.capitalCalls] }));
          log("You", `drafted Capital Call #${number} for ${v.name} ($${totalAmount.toLocaleString()})`, "capital_call", cc.id);
          return { id: cc.id, ok: true, message: "Capital call drafted" };
        },

        issueCapitalCall: (id) => {
          const cc = data().capitalCalls.find((c) => c.id === id);
          if (!cc) return fail("Not found");
          if (cc.status !== "draft") return fail("Only drafts can be issued");
          set((s) => ({ capitalCalls: s.capitalCalls.map((c) => (c.id === id ? { ...c, status: "sent", issuedAt: nowIso().slice(0, 10) } : c)) }));
          const v = data().vehicles.find((x) => x.id === cc.vehicleId)!;
          get().createTask({ title: `Track wires – Capital Call #${cc.number} (${v.name})`, type: "wire", vehicleId: cc.vehicleId, dueDate: cc.dueDate, priority: "medium", assignee: "You" });
          log("You", `issued Capital Call #${cc.number} for ${v.name}`, "capital_call", id);
          return ok("Capital call notices sent to all LPs");
        },

        markCallItemReceived: (id, investorId) => {
          const d = data();
          const cc = d.capitalCalls.find((c) => c.id === id);
          if (!cc) return fail("Not found");
          if (cc.status === "draft") return fail("Issue the capital call before recording wires");
          if (cc.status === "cancelled") return fail("Capital call is cancelled");
          const item = cc.items.find((i) => i.investorId === investorId);
          if (!item || item.received) return fail("Nothing to record");
          const items = cc.items.map((i) => (i.investorId === investorId ? { ...i, received: true, receivedAt: nowIso() } : i));
          const allReceived = items.every((i) => i.received);
          const status: CapitalCall["status"] = allReceived ? "funded" : "partially_funded";
          set((s) => ({ capitalCalls: s.capitalCalls.map((c) => (c.id === id ? { ...c, items, status } : c)) }));
          get().addLedgerEntry({ vehicleId: cc.vehicleId, investorId, type: "contribution", amount: item.amount, date: nowIso().slice(0, 10), memo: `Capital call #${cc.number} received`, reference: cc.id });
          const name = d.investors.find((i) => i.id === investorId)?.name;
          log("System", `${name} wired $${item.amount.toLocaleString()} for Capital Call #${cc.number}`, "capital_call", id);
          if (allReceived) {
            set((s) => ({ tasks: s.tasks.map((t) => (t.vehicleId === cc.vehicleId && t.type === "wire" && t.title.includes(`#${cc.number}`) ? { ...t, status: "done" } : t)) }));
          }
          return ok(allReceived ? "All wires received – call fully funded" : "Wire recorded");
        },

        cancelCapitalCall: (id) => {
          const cc = data().capitalCalls.find((c) => c.id === id);
          if (!cc) return fail("Not found");
          if (cc.items.some((i) => i.received)) return fail("Cannot cancel – wires already received");
          set((s) => ({ capitalCalls: s.capitalCalls.map((c) => (c.id === id ? { ...c, status: "cancelled" } : c)) }));
          log("You", `cancelled Capital Call #${cc.number}`, "capital_call", id);
          return ok("Capital call cancelled");
        },

        // ---------- Distributions ----------
        createDistribution: (vehicleId, type, totalAmount, date, memo) => {
          const d = data();
          const v = d.vehicles.find((x) => x.id === vehicleId);
          if (!v) return fail("Vehicle not found");
          if (v.status !== "active" && v.status !== "closed") return fail("Vehicle must be closed or active to distribute");
          if (totalAmount <= 0) return fail("Amount must be positive");
          const wf = computeWaterfall(d, v, type, totalAmount, date);
          if (!wf.allocations.length) return fail("No committed investors to distribute to");
          const dist: Distribution = { id: uid("dist"), vehicleId, type, totalAmount, carryAmount: wf.carryAmount, date, status: "draft", memo: memo || `${type.replace(/_/g, " ")} distribution`, allocations: wf.allocations };
          set((s) => ({ distributions: [dist, ...s.distributions] }));
          log("You", `drafted ${type.replace(/_/g, " ")} distribution for ${v.name} ($${totalAmount.toLocaleString()})`, "distribution", dist.id);
          return { id: dist.id, ok: true, message: "Distribution drafted" };
        },

        approveDistribution: (id) => {
          const dist = data().distributions.find((x) => x.id === id);
          if (!dist) return fail("Not found");
          if (dist.status !== "draft") return fail("Only drafts can be approved");
          set((s) => ({ distributions: s.distributions.map((x) => (x.id === id ? { ...x, status: "approved" } : x)) }));
          const v = data().vehicles.find((x) => x.id === dist.vehicleId)!;
          get().createTask({ title: `Approve distribution wires – ${v.name}`, type: "wire", vehicleId: v.id, dueDate: dist.date, priority: "high", assignee: "You" });
          log("You", `approved distribution '${dist.memo}'`, "distribution", id);
          return ok("Distribution approved – ready to pay");
        },

        payDistribution: (id) => {
          const d = data();
          const dist = d.distributions.find((x) => x.id === id);
          if (!dist) return fail("Not found");
          if (dist.status !== "approved") return fail("Approve the distribution before paying");
          const v = d.vehicles.find((x) => x.id === dist.vehicleId)!;
          const paidDate = nowIso().slice(0, 10);
          for (const a of dist.allocations) {
            get().addLedgerEntry({ vehicleId: v.id, investorId: a.investorId, type: "distribution", amount: -a.netAmount, date: paidDate, memo: dist.memo, reference: dist.id });
          }
          if (dist.carryAmount > 0) get().addLedgerEntry({ vehicleId: v.id, type: "carry", amount: -dist.carryAmount, date: paidDate, memo: "Carried interest to manager", reference: dist.id });
          // distribution proceeds come from the investment; reduce holding value
          const newValue = Math.max(0, v.currentValue - dist.totalAmount);
          set((s) => ({
            distributions: s.distributions.map((x) => (x.id === id ? { ...x, status: "paid", date: paidDate } : x)),
            vehicles: s.vehicles.map((x) => (x.id === v.id ? { ...x, currentValue: newValue } : x)),
            ledger: [{ id: uid("led"), vehicleId: v.id, type: "investment" as const, amount: dist.totalAmount, date: paidDate, memo: `Proceeds from ${v.portfolioCompany}`, reference: dist.id }, ...s.ledger],
            tasks: s.tasks.map((t) => (t.vehicleId === v.id && t.type === "wire" && t.title.startsWith("Approve distribution") && t.status !== "done" ? { ...t, status: "done" } : t)),
          }));
          log("You", `paid distribution '${dist.memo}' – $${dist.totalAmount.toLocaleString()} to ${dist.allocations.length} investors`, "distribution", id);
          return ok("Distribution paid and booked to ledger");
        },

        deleteDistribution: (id) => {
          const dist = data().distributions.find((x) => x.id === id);
          if (!dist) return fail("Not found");
          if (dist.status === "paid") return fail("Paid distributions cannot be deleted");
          set((s) => ({ distributions: s.distributions.filter((x) => x.id !== id) }));
          log("You", `deleted distribution draft '${dist.memo}'`, "distribution", id);
          return ok("Deleted");
        },

        // ---------- Tasks ----------
        createTask: (input) => {
          if (!input.title.trim()) return fail("Title required");
          const t: Task = { id: uid("task"), createdAt: nowIso(), status: "open", ...input };
          set((s) => ({ tasks: [t, ...s.tasks] }));
          return ok("Task created");
        },
        setTaskStatus: (id, status) => {
          set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }));
          const t = data().tasks.find((x) => x.id === id);
          if (t && status === "done") log("You", `completed task '${t.title}'`, "task", id);
          return ok(status === "done" ? "Task completed" : "Task updated");
        },
        deleteTask: (id) => {
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
          return ok("Task deleted");
        },

        // ---------- Documents ----------
        addDocument: (vehicleId, name, kind, investorId) => {
          const doc: Doc = { id: uid("doc"), vehicleId, investorId, name, kind, status: kind === "subscription_agreement" ? "pending_signature" : "draft", uploadedAt: nowIso(), sizeKb: 200 + Math.floor(Math.random() * 1800) };
          set((s) => ({ documents: [doc, ...s.documents] }));
          return ok("Document added");
        },
        setDocumentStatus: (id, status) => {
          set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, status } : d)) }));
          const doc = data().documents.find((x) => x.id === id);
          if (doc) log("You", `marked '${doc.name}' as ${status.replace("_", " ")}`, "document", id);
          return ok("Document updated");
        },

        // ---------- Ledger ----------
        addLedgerEntry: (entry) => {
          set((s) => ({ ledger: [{ id: uid("led"), ...entry }, ...s.ledger] }));
          return ok("Entry added");
        },
      };
    },
    {
      name: "allocations-fund-admin-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        managers: s.managers,
        vehicles: s.vehicles,
        investors: s.investors,
        subscriptions: s.subscriptions,
        capitalCalls: s.capitalCalls,
        distributions: s.distributions,
        ledger: s.ledger,
        tasks: s.tasks,
        documents: s.documents,
        activity: s.activity,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
