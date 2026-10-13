export type VehicleType = "SPV" | "Fund";
export type VehicleStatus =
  | "draft"
  | "raising"
  | "closing"
  | "closed"
  | "active"
  | "liquidated";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  managerId: string;
  portfolioCompany: string;
  sector: string;
  jurisdiction: string;
  targetRaise: number;
  minInvestment: number;
  managementFeePct: number;
  carryPct: number;
  preferredReturnPct: number;
  openedAt: string;
  targetCloseDate: string;
  closedAt?: string;
  description: string;
  investedCapital: number;
  currentValue: number;
}

export interface Manager {
  id: string;
  name: string;
  firm: string;
  email: string;
}

export type KycStatus = "not_started" | "pending" | "approved" | "rejected";
export type AccreditationStatus = "unverified" | "verified" | "expired";
export type InvestorEntityType = "individual" | "entity" | "trust" | "ira";

export interface Investor {
  id: string;
  name: string;
  email: string;
  entityType: InvestorEntityType;
  country: string;
  kycStatus: KycStatus;
  accreditation: AccreditationStatus;
  taxId: string;
  createdAt: string;
  notes?: string;
}

export type SubscriptionStatus =
  | "invited"
  | "signed"
  | "kyc_review"
  | "approved"
  | "wire_pending"
  | "funded"
  | "rejected";

export interface Subscription {
  id: string;
  vehicleId: string;
  investorId: string;
  amount: number;
  status: SubscriptionStatus;
  invitedAt: string;
  signedAt?: string;
  approvedAt?: string;
  fundedAt?: string;
  rejectedReason?: string;
}

export type CapitalCallStatus =
  | "draft"
  | "sent"
  | "partially_funded"
  | "funded"
  | "cancelled";

export interface CapitalCallItem {
  investorId: string;
  amount: number;
  received: boolean;
  receivedAt?: string;
}

export interface CapitalCall {
  id: string;
  vehicleId: string;
  number: number;
  purpose: string;
  totalAmount: number;
  issuedAt: string;
  dueDate: string;
  status: CapitalCallStatus;
  items: CapitalCallItem[];
}

export type DistributionType = "return_of_capital" | "profit" | "exit";
export type DistributionStatus = "draft" | "approved" | "paid";

export interface DistributionAllocation {
  investorId: string;
  grossAmount: number;
  carry: number;
  netAmount: number;
}

export interface Distribution {
  id: string;
  vehicleId: string;
  type: DistributionType;
  totalAmount: number;
  carryAmount: number;
  date: string;
  status: DistributionStatus;
  memo: string;
  allocations: DistributionAllocation[];
}

export type LedgerType =
  | "contribution"
  | "distribution"
  | "management_fee"
  | "expense"
  | "investment"
  | "carry";

export interface LedgerEntry {
  id: string;
  vehicleId: string;
  investorId?: string;
  type: LedgerType;
  amount: number;
  date: string;
  memo: string;
  reference?: string;
}

export type TaskType = "kyc" | "filing" | "tax" | "signature" | "wire" | "review";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  vehicleId?: string;
  investorId?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  createdAt: string;
}

export type DocumentStatus = "draft" | "pending_signature" | "signed" | "filed";
export type DocumentKind =
  | "operating_agreement"
  | "subscription_agreement"
  | "ppm"
  | "k1"
  | "side_letter"
  | "bank_statement"
  | "form_d";

export interface Doc {
  id: string;
  vehicleId: string;
  investorId?: string;
  name: string;
  kind: DocumentKind;
  status: DocumentStatus;
  uploadedAt: string;
  sizeKb: number;
}

export interface Activity {
  id: string;
  at: string;
  actor: string;
  action: string;
  entityType: "vehicle" | "investor" | "subscription" | "capital_call" | "distribution" | "task" | "document" | "system";
  entityId?: string;
}

export interface AppData {
  managers: Manager[];
  vehicles: Vehicle[];
  investors: Investor[];
  subscriptions: Subscription[];
  capitalCalls: CapitalCall[];
  distributions: Distribution[];
  ledger: LedgerEntry[];
  tasks: Task[];
  documents: Doc[];
  activity: Activity[];
}
