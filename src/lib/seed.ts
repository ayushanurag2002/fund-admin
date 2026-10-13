import type {
  Activity,
  AppData,
  CapitalCall,
  Distribution,
  Doc,
  Investor,
  LedgerEntry,
  Manager,
  Subscription,
  Task,
  Vehicle,
} from "./types";
import { addDays, isoDate } from "./utils";

const D = (offsetDays: number) => isoDate(addDays(new Date(), offsetDays));
const T = (offsetDays: number, hour = 10) => {
  const d = addDays(new Date(), offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const managers: Manager[] = [
  { id: "mgr_1", name: "Priya Raman", firm: "Northwind Ventures", email: "priya@northwind.vc" },
  { id: "mgr_2", name: "Daniel Okafor", firm: "Okafor Capital", email: "dan@okaforcap.com" },
  { id: "mgr_3", name: "Elena Marchetti", firm: "Lumen Syndicate", email: "elena@lumen.xyz" },
  { id: "mgr_4", name: "Marcus Chen", firm: "Harbor Angels", email: "marcus@harborangels.co" },
];

const vehicles: Vehicle[] = [
  {
    id: "veh_1",
    name: "Northwind SPV IV – Lattice AI",
    type: "SPV",
    status: "active",
    managerId: "mgr_1",
    portfolioCompany: "Lattice AI",
    sector: "AI Infrastructure",
    jurisdiction: "Delaware",
    targetRaise: 5_000_000,
    minInvestment: 25_000,
    managementFeePct: 0,
    carryPct: 20,
    preferredReturnPct: 0,
    openedAt: D(-240),
    targetCloseDate: D(-180),
    closedAt: D(-175),
    description: "Series B co-invest alongside Sequoia in Lattice AI's inference compute platform.",
    investedCapital: 4_850_000,
    currentValue: 7_900_000,
  },
  {
    id: "veh_2",
    name: "Okafor Growth Fund II",
    type: "Fund",
    status: "active",
    managerId: "mgr_2",
    portfolioCompany: "Diversified (12 companies)",
    sector: "Fintech",
    jurisdiction: "Delaware",
    targetRaise: 40_000_000,
    minInvestment: 250_000,
    managementFeePct: 2,
    carryPct: 20,
    preferredReturnPct: 8,
    openedAt: D(-540),
    targetCloseDate: D(-365),
    closedAt: D(-350),
    description: "Growth-stage fintech fund investing in Series A–C across Africa and LATAM.",
    investedCapital: 24_500_000,
    currentValue: 31_200_000,
  },
  {
    id: "veh_3",
    name: "Lumen SPV – Helio Energy",
    type: "SPV",
    status: "raising",
    managerId: "mgr_3",
    portfolioCompany: "Helio Energy",
    sector: "Climate",
    jurisdiction: "Delaware",
    targetRaise: 3_000_000,
    minInvestment: 10_000,
    managementFeePct: 0,
    carryPct: 15,
    preferredReturnPct: 0,
    openedAt: D(-28),
    targetCloseDate: D(21),
    description: "Seed extension into Helio's residential solar battery leasing platform.",
    investedCapital: 0,
    currentValue: 0,
  },
  {
    id: "veh_4",
    name: "Harbor Angels SPV 7 – Fathom Health",
    type: "SPV",
    status: "closing",
    managerId: "mgr_4",
    portfolioCompany: "Fathom Health",
    sector: "Healthtech",
    jurisdiction: "Delaware",
    targetRaise: 2_000_000,
    minInvestment: 10_000,
    managementFeePct: 0,
    carryPct: 20,
    preferredReturnPct: 0,
    openedAt: D(-60),
    targetCloseDate: D(5),
    description: "Series A allocation in Fathom's AI medical coding engine.",
    investedCapital: 0,
    currentValue: 0,
  },
  {
    id: "veh_5",
    name: "Northwind SPV V – Orbital Labs",
    type: "SPV",
    status: "draft",
    managerId: "mgr_1",
    portfolioCompany: "Orbital Labs",
    sector: "Space",
    jurisdiction: "Cayman Islands",
    targetRaise: 8_000_000,
    minInvestment: 50_000,
    managementFeePct: 0,
    carryPct: 20,
    preferredReturnPct: 0,
    openedAt: D(-3),
    targetCloseDate: D(60),
    description: "Pre-launch SPV for Orbital Labs' Series C. Awaiting signed term sheet.",
    investedCapital: 0,
    currentValue: 0,
  },
  {
    id: "veh_6",
    name: "Lumen Opportunity Fund I",
    type: "Fund",
    status: "closed",
    managerId: "mgr_3",
    portfolioCompany: "Diversified (6 companies)",
    sector: "Consumer",
    jurisdiction: "Delaware",
    targetRaise: 15_000_000,
    minInvestment: 100_000,
    managementFeePct: 2,
    carryPct: 20,
    preferredReturnPct: 8,
    openedAt: D(-120),
    targetCloseDate: D(-10),
    closedAt: D(-8),
    description: "Opportunistic consumer fund. First close completed, deploying over 24 months.",
    investedCapital: 1_500_000,
    currentValue: 1_500_000,
  },
  {
    id: "veh_7",
    name: "Harbor Angels SPV 3 – Quill",
    type: "SPV",
    status: "liquidated",
    managerId: "mgr_4",
    portfolioCompany: "Quill (acq. by Notion)",
    sector: "SaaS",
    jurisdiction: "Delaware",
    targetRaise: 1_000_000,
    minInvestment: 5_000,
    managementFeePct: 0,
    carryPct: 20,
    preferredReturnPct: 0,
    openedAt: D(-900),
    targetCloseDate: D(-850),
    closedAt: D(-845),
    description: "Seed SPV in Quill. Acquired by Notion; proceeds fully distributed.",
    investedCapital: 980_000,
    currentValue: 0,
  },
  {
    id: "veh_8",
    name: "Okafor SPV – PayNest",
    type: "SPV",
    status: "active",
    managerId: "mgr_2",
    portfolioCompany: "PayNest",
    sector: "Fintech",
    jurisdiction: "Delaware",
    targetRaise: 1_500_000,
    minInvestment: 10_000,
    managementFeePct: 0,
    carryPct: 20,
    preferredReturnPct: 0,
    openedAt: D(-400),
    targetCloseDate: D(-340),
    closedAt: D(-338),
    description: "Series A in PayNest, a cross-border payroll platform.",
    investedCapital: 1_470_000,
    currentValue: 2_100_000,
  },
];

const investorSeed: Array<[string, string, Investor["entityType"], string, Investor["kycStatus"], Investor["accreditation"]]> = [
  ["Avery Lindqvist", "avery@lindqvist.family", "individual", "United States", "approved", "verified"],
  ["Cedar Ridge Family Office", "ops@cedarridgefo.com", "entity", "United States", "approved", "verified"],
  ["Tomas Herrera", "tomas.herrera@gmail.com", "individual", "Mexico", "approved", "verified"],
  ["Blackwell Trust", "trustee@blackwelltrust.com", "trust", "United States", "approved", "verified"],
  ["Mei-Lin Zhou", "mzhou@zhoucap.com", "individual", "Singapore", "approved", "verified"],
  ["Kestrel Partners LLC", "lp@kestrelpartners.com", "entity", "United States", "approved", "verified"],
  ["Jonah Feldman", "jonah@feldman.io", "individual", "United States", "pending", "verified"],
  ["Sofia Almeida", "sofia.almeida@outlook.com", "individual", "Brazil", "pending", "unverified"],
  ["Halvorsen Holdings AS", "invest@halvorsen.no", "entity", "Norway", "approved", "verified"],
  ["Raj Patel IRA", "raj.patel@proton.me", "ira", "United States", "approved", "verified"],
  ["Nadia Kowalski", "nadia.k@gmail.com", "individual", "Poland", "not_started", "unverified"],
  ["Pinecrest Capital", "team@pinecrest.capital", "entity", "United States", "approved", "verified"],
  ["Omar Haddad", "omar@haddadgroup.ae", "individual", "UAE", "rejected", "unverified"],
  ["Lucia Bianchi", "lucia@bianchi.it", "individual", "Italy", "approved", "expired"],
  ["Greenlight Ventures Fund", "admin@greenlight.vc", "entity", "United States", "approved", "verified"],
  ["Wyatt Thompson", "wyatt.t@me.com", "individual", "United States", "approved", "verified"],
  ["Sato Family Trust", "sato.trust@jp.com", "trust", "Japan", "pending", "verified"],
  ["Isabelle Moreau", "isabelle@moreau.fr", "individual", "France", "approved", "verified"],
  ["Arjun Mehta", "arjun.mehta@gmail.com", "individual", "India", "approved", "verified"],
  ["Driftwood Capital LP", "ir@driftwoodcap.com", "entity", "United States", "approved", "verified"],
  ["Hannah O'Brien", "hannah.ob@gmail.com", "individual", "Ireland", "not_started", "unverified"],
  ["Felix Wagner", "felix@wagner.de", "individual", "Germany", "approved", "verified"],
  ["Summit Peak Holdings", "ops@summitpeak.com", "entity", "Canada", "approved", "verified"],
  ["Chloe Nakamura", "chloe.n@gmail.com", "individual", "United States", "pending", "unverified"],
];

const investors: Investor[] = investorSeed.map(([name, email, entityType, country, kycStatus, accreditation], i) => ({
  id: `inv_${i + 1}`,
  name,
  email,
  entityType,
  country,
  kycStatus,
  accreditation,
  taxId: `***-**-${String(1000 + i * 37).slice(-4)}`,
  createdAt: D(-600 + i * 20),
}));

// [vehicleId, investorId, amount, status, daysAgoInvited]
const subSeed: Array<[string, string, number, Subscription["status"], number]> = [
  // veh_1 Lattice AI (active, 4.85M)
  ["veh_1", "inv_1", 250_000, "funded", 230],
  ["veh_1", "inv_2", 1_000_000, "funded", 228],
  ["veh_1", "inv_4", 500_000, "funded", 225],
  ["veh_1", "inv_6", 750_000, "funded", 222],
  ["veh_1", "inv_9", 400_000, "funded", 220],
  ["veh_1", "inv_12", 1_000_000, "funded", 218],
  ["veh_1", "inv_15", 600_000, "funded", 215],
  ["veh_1", "inv_16", 150_000, "funded", 212],
  ["veh_1", "inv_19", 200_000, "funded", 210],
  // veh_2 Okafor Growth II (active, 24.5M committed)
  ["veh_2", "inv_2", 5_000_000, "funded", 520],
  ["veh_2", "inv_6", 3_000_000, "funded", 515],
  ["veh_2", "inv_9", 2_500_000, "funded", 510],
  ["veh_2", "inv_12", 4_000_000, "funded", 505],
  ["veh_2", "inv_15", 5_000_000, "funded", 500],
  ["veh_2", "inv_20", 3_000_000, "funded", 495],
  ["veh_2", "inv_23", 2_000_000, "funded", 490],
  // veh_3 Helio (raising)
  ["veh_3", "inv_1", 100_000, "approved", 25],
  ["veh_3", "inv_3", 50_000, "signed", 22],
  ["veh_3", "inv_5", 250_000, "kyc_review", 20],
  ["veh_3", "inv_7", 75_000, "kyc_review", 18],
  ["veh_3", "inv_8", 25_000, "signed", 15],
  ["veh_3", "inv_10", 50_000, "approved", 14],
  ["veh_3", "inv_11", 20_000, "invited", 10],
  ["veh_3", "inv_14", 100_000, "signed", 9],
  ["veh_3", "inv_18", 150_000, "approved", 8],
  ["veh_3", "inv_21", 10_000, "invited", 5],
  ["veh_3", "inv_13", 50_000, "rejected", 24],
  // veh_4 Fathom (closing)
  ["veh_4", "inv_2", 500_000, "funded", 55],
  ["veh_4", "inv_4", 250_000, "funded", 52],
  ["veh_4", "inv_16", 100_000, "wire_pending", 50],
  ["veh_4", "inv_19", 200_000, "wire_pending", 48],
  ["veh_4", "inv_22", 150_000, "funded", 45],
  ["veh_4", "inv_24", 50_000, "approved", 40],
  ["veh_4", "inv_17", 300_000, "kyc_review", 35],
  ["veh_4", "inv_10", 100_000, "funded", 33],
  // veh_6 Lumen Opp I (closed)
  ["veh_6", "inv_2", 2_000_000, "funded", 110],
  ["veh_6", "inv_6", 1_500_000, "funded", 105],
  ["veh_6", "inv_12", 3_000_000, "funded", 100],
  ["veh_6", "inv_15", 2_500_000, "funded", 95],
  ["veh_6", "inv_20", 2_000_000, "funded", 90],
  ["veh_6", "inv_23", 1_000_000, "funded", 85],
  ["veh_6", "inv_9", 1_000_000, "funded", 80],
  // veh_7 Quill (liquidated)
  ["veh_7", "inv_1", 100_000, "funded", 890],
  ["veh_7", "inv_3", 50_000, "funded", 885],
  ["veh_7", "inv_16", 80_000, "funded", 880],
  ["veh_7", "inv_19", 250_000, "funded", 875],
  ["veh_7", "inv_22", 500_000, "funded", 870],
  // veh_8 PayNest (active)
  ["veh_8", "inv_3", 100_000, "funded", 390],
  ["veh_8", "inv_5", 300_000, "funded", 385],
  ["veh_8", "inv_10", 70_000, "funded", 380],
  ["veh_8", "inv_14", 250_000, "funded", 375],
  ["veh_8", "inv_18", 350_000, "funded", 370],
  ["veh_8", "inv_22", 400_000, "funded", 365],
];

const subscriptions: Subscription[] = subSeed.map(([vehicleId, investorId, amount, status, ago], i) => {
  const base: Subscription = {
    id: `sub_${i + 1}`,
    vehicleId,
    investorId,
    amount,
    status,
    invitedAt: T(-ago),
  };
  const order: Subscription["status"][] = ["invited", "signed", "kyc_review", "approved", "wire_pending", "funded"];
  const idx = order.indexOf(status);
  if (status === "rejected") {
    base.signedAt = T(-ago + 1);
    base.rejectedReason = "Failed sanctions screening";
    return base;
  }
  if (idx >= 1) base.signedAt = T(-ago + 1);
  if (idx >= 3) base.approvedAt = T(-ago + 3);
  if (idx >= 5) base.fundedAt = T(-ago + 6);
  return base;
});

const capitalCalls: CapitalCall[] = [
  {
    id: "cc_1",
    vehicleId: "veh_2",
    number: 1,
    purpose: "Initial drawdown – first 4 portfolio investments",
    totalAmount: 9_800_000,
    issuedAt: D(-340),
    dueDate: D(-310),
    status: "funded",
    items: [
      { investorId: "inv_2", amount: 2_000_000, received: true, receivedAt: T(-320) },
      { investorId: "inv_6", amount: 1_200_000, received: true, receivedAt: T(-322) },
      { investorId: "inv_9", amount: 1_000_000, received: true, receivedAt: T(-318) },
      { investorId: "inv_12", amount: 1_600_000, received: true, receivedAt: T(-315) },
      { investorId: "inv_15", amount: 2_000_000, received: true, receivedAt: T(-319) },
      { investorId: "inv_20", amount: 1_200_000, received: true, receivedAt: T(-312) },
      { investorId: "inv_23", amount: 800_000, received: true, receivedAt: T(-311) },
    ],
  },
  {
    id: "cc_2",
    vehicleId: "veh_2",
    number: 2,
    purpose: "Follow-on reserves – Series B participations",
    totalAmount: 7_350_000,
    issuedAt: D(-150),
    dueDate: D(-120),
    status: "funded",
    items: [
      { investorId: "inv_2", amount: 1_500_000, received: true, receivedAt: T(-130) },
      { investorId: "inv_6", amount: 900_000, received: true, receivedAt: T(-128) },
      { investorId: "inv_9", amount: 750_000, received: true, receivedAt: T(-126) },
      { investorId: "inv_12", amount: 1_200_000, received: true, receivedAt: T(-125) },
      { investorId: "inv_15", amount: 1_500_000, received: true, receivedAt: T(-124) },
      { investorId: "inv_20", amount: 900_000, received: true, receivedAt: T(-122) },
      { investorId: "inv_23", amount: 600_000, received: true, receivedAt: T(-121) },
    ],
  },
  {
    id: "cc_3",
    vehicleId: "veh_2",
    number: 3,
    purpose: "Q4 deployment – 3 new Series A positions",
    totalAmount: 4_900_000,
    issuedAt: D(-12),
    dueDate: D(18),
    status: "partially_funded",
    items: [
      { investorId: "inv_2", amount: 1_000_000, received: true, receivedAt: T(-4) },
      { investorId: "inv_6", amount: 600_000, received: false },
      { investorId: "inv_9", amount: 500_000, received: true, receivedAt: T(-2) },
      { investorId: "inv_12", amount: 800_000, received: false },
      { investorId: "inv_15", amount: 1_000_000, received: true, receivedAt: T(-1) },
      { investorId: "inv_20", amount: 600_000, received: false },
      { investorId: "inv_23", amount: 400_000, received: false },
    ],
  },
  {
    id: "cc_4",
    vehicleId: "veh_6",
    number: 1,
    purpose: "First close drawdown – 25% of commitments",
    totalAmount: 3_250_000,
    issuedAt: D(-6),
    dueDate: D(24),
    status: "partially_funded",
    items: [
      { investorId: "inv_2", amount: 500_000, received: true, receivedAt: T(-3) },
      { investorId: "inv_6", amount: 375_000, received: false },
      { investorId: "inv_12", amount: 750_000, received: true, receivedAt: T(-2) },
      { investorId: "inv_15", amount: 625_000, received: true, receivedAt: T(-1) },
      { investorId: "inv_20", amount: 500_000, received: false },
      { investorId: "inv_23", amount: 250_000, received: false },
      { investorId: "inv_9", amount: 250_000, received: false },
    ],
  },
];

const distributions: Distribution[] = [
  {
    id: "dist_1",
    vehicleId: "veh_7",
    type: "exit",
    totalAmount: 2_940_000,
    carryAmount: 392_000,
    date: D(-200),
    status: "paid",
    memo: "Notion acquisition proceeds – 3.0x gross",
    allocations: [
      { investorId: "inv_1", grossAmount: 300_000, carry: 40_000, netAmount: 260_000 },
      { investorId: "inv_3", grossAmount: 150_000, carry: 20_000, netAmount: 130_000 },
      { investorId: "inv_16", grossAmount: 240_000, carry: 32_000, netAmount: 208_000 },
      { investorId: "inv_19", grossAmount: 750_000, carry: 100_000, netAmount: 650_000 },
      { investorId: "inv_22", grossAmount: 1_500_000, carry: 200_000, netAmount: 1_300_000 },
    ],
  },
  {
    id: "dist_2",
    vehicleId: "veh_2",
    type: "profit",
    totalAmount: 3_000_000,
    carryAmount: 0,
    date: D(-45),
    status: "paid",
    memo: "Partial realisation – Kuda secondary sale (within pref)",
    allocations: [
      { investorId: "inv_2", grossAmount: 612_245, carry: 0, netAmount: 612_245 },
      { investorId: "inv_6", grossAmount: 367_347, carry: 0, netAmount: 367_347 },
      { investorId: "inv_9", grossAmount: 306_122, carry: 0, netAmount: 306_122 },
      { investorId: "inv_12", grossAmount: 489_796, carry: 0, netAmount: 489_796 },
      { investorId: "inv_15", grossAmount: 612_245, carry: 0, netAmount: 612_245 },
      { investorId: "inv_20", grossAmount: 367_347, carry: 0, netAmount: 367_347 },
      { investorId: "inv_23", grossAmount: 244_898, carry: 0, netAmount: 244_898 },
    ],
  },
  {
    id: "dist_3",
    vehicleId: "veh_8",
    type: "return_of_capital",
    totalAmount: 400_000,
    carryAmount: 0,
    date: D(3),
    status: "approved",
    memo: "Partial return of capital – PayNest tender offer",
    allocations: [
      { investorId: "inv_3", grossAmount: 27_211, carry: 0, netAmount: 27_211 },
      { investorId: "inv_5", grossAmount: 81_633, carry: 0, netAmount: 81_633 },
      { investorId: "inv_10", grossAmount: 19_048, carry: 0, netAmount: 19_048 },
      { investorId: "inv_14", grossAmount: 68_027, carry: 0, netAmount: 68_027 },
      { investorId: "inv_18", grossAmount: 95_238, carry: 0, netAmount: 95_238 },
      { investorId: "inv_22", grossAmount: 108_843, carry: 0, netAmount: 108_843 },
    ],
  },
];

function buildLedger(): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  let n = 0;
  const push = (e: Omit<LedgerEntry, "id">) => entries.push({ id: `led_${++n}`, ...e });

  // contributions from funded SPV subscriptions
  for (const s of subscriptions) {
    const v = vehicles.find((x) => x.id === s.vehicleId)!;
    if (s.status === "funded" && v.type === "SPV") {
      push({ vehicleId: s.vehicleId, investorId: s.investorId, type: "contribution", amount: s.amount, date: s.fundedAt!.slice(0, 10), memo: "Subscription wire received", reference: s.id });
    }
  }
  // contributions from capital call receipts (Funds)
  for (const cc of capitalCalls) {
    for (const it of cc.items) {
      if (it.received) {
        push({ vehicleId: cc.vehicleId, investorId: it.investorId, type: "contribution", amount: it.amount, date: it.receivedAt!.slice(0, 10), memo: `Capital call #${cc.number} received`, reference: cc.id });
      }
    }
  }
  // investments
  push({ vehicleId: "veh_1", type: "investment", amount: -4_850_000, date: D(-170), memo: "Wire to Lattice AI – Series B preferred" });
  push({ vehicleId: "veh_8", type: "investment", amount: -1_470_000, date: D(-330), memo: "Wire to PayNest – Series A preferred" });
  push({ vehicleId: "veh_7", type: "investment", amount: -980_000, date: D(-840), memo: "Wire to Quill – Seed SAFE" });
  push({ vehicleId: "veh_2", type: "investment", amount: -9_200_000, date: D(-300), memo: "Deployment tranche 1 – 4 companies" });
  push({ vehicleId: "veh_2", type: "investment", amount: -6_800_000, date: D(-115), memo: "Deployment tranche 2 – follow-ons" });
  push({ vehicleId: "veh_2", type: "investment", amount: -2_400_000, date: D(-3), memo: "Deployment tranche 3 – partial" });
  push({ vehicleId: "veh_6", type: "investment", amount: -1_500_000, date: D(-1), memo: "Initial deployment – 2 companies" });
  // fees & expenses
  push({ vehicleId: "veh_2", type: "management_fee", amount: -200_000, date: D(-95), memo: "Q management fee (2% p.a.)" });
  push({ vehicleId: "veh_2", type: "management_fee", amount: -200_000, date: D(-5), memo: "Q management fee (2% p.a.)" });
  push({ vehicleId: "veh_1", type: "expense", amount: -8_500, date: D(-172), memo: "Formation & legal (Allocations)" });
  push({ vehicleId: "veh_8", type: "expense", amount: -8_500, date: D(-335), memo: "Formation & legal (Allocations)" });
  push({ vehicleId: "veh_4", type: "expense", amount: -8_500, date: D(-58), memo: "Formation & legal (Allocations)" });
  push({ vehicleId: "veh_3", type: "expense", amount: -8_500, date: D(-27), memo: "Formation & legal (Allocations)" });
  push({ vehicleId: "veh_6", type: "expense", amount: -22_000, date: D(-7), memo: "Fund formation, audit retainer" });
  // distributions paid
  for (const d of distributions) {
    if (d.status === "paid") {
      for (const a of d.allocations) {
        push({ vehicleId: d.vehicleId, investorId: a.investorId, type: "distribution", amount: -a.netAmount, date: d.date, memo: d.memo, reference: d.id });
      }
      if (d.carryAmount > 0) push({ vehicleId: d.vehicleId, type: "carry", amount: -d.carryAmount, date: d.date, memo: "Carried interest to manager", reference: d.id });
    }
  }
  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const tasks: Task[] = [
  { id: "task_1", title: "Review KYC documents – Mei-Lin Zhou", type: "kyc", vehicleId: "veh_3", investorId: "inv_5", dueDate: D(2), priority: "high", status: "open", assignee: "You", createdAt: T(-3) },
  { id: "task_2", title: "Review KYC documents – Jonah Feldman", type: "kyc", vehicleId: "veh_3", investorId: "inv_7", dueDate: D(2), priority: "high", status: "in_progress", assignee: "You", createdAt: T(-4) },
  { id: "task_3", title: "File Form D – Harbor Angels SPV 7", type: "filing", vehicleId: "veh_4", dueDate: D(9), priority: "high", status: "open", assignee: "Compliance", createdAt: T(-10) },
  { id: "task_4", title: "Chase outstanding wires – Fathom SPV", type: "wire", vehicleId: "veh_4", dueDate: D(4), priority: "medium", status: "open", assignee: "You", createdAt: T(-2) },
  { id: "task_5", title: "Counter-sign subscription docs (3 pending)", type: "signature", vehicleId: "veh_3", dueDate: D(1), priority: "medium", status: "open", assignee: "Elena Marchetti", createdAt: T(-1) },
  { id: "task_6", title: "Prepare K-1 package – Okafor Growth II FY", type: "tax", vehicleId: "veh_2", dueDate: D(40), priority: "medium", status: "in_progress", assignee: "Tax team", createdAt: T(-20) },
  { id: "task_7", title: "Sato Family Trust – accreditation letter", type: "kyc", investorId: "inv_17", dueDate: D(-1), priority: "high", status: "open", assignee: "You", createdAt: T(-8) },
  { id: "task_8", title: "Quarterly NAV review – Lattice AI SPV", type: "review", vehicleId: "veh_1", dueDate: D(14), priority: "low", status: "open", assignee: "Priya Raman", createdAt: T(-5) },
  { id: "task_9", title: "Lucia Bianchi – accreditation expired, re-verify", type: "kyc", investorId: "inv_14", dueDate: D(6), priority: "medium", status: "open", assignee: "You", createdAt: T(-6) },
  { id: "task_10", title: "Approve PayNest return-of-capital wires", type: "wire", vehicleId: "veh_8", dueDate: D(3), priority: "high", status: "open", assignee: "Daniel Okafor", createdAt: T(-2) },
  { id: "task_11", title: "Blue sky filing – Delaware (Lumen Opp I)", type: "filing", vehicleId: "veh_6", dueDate: D(-12), priority: "medium", status: "done", assignee: "Compliance", createdAt: T(-30) },
  { id: "task_12", title: "Bank account opening – Orbital Labs SPV", type: "review", vehicleId: "veh_5", dueDate: D(7), priority: "medium", status: "open", assignee: "Ops", createdAt: T(-2) },
];

const documents: Doc[] = [
  { id: "doc_1", vehicleId: "veh_1", name: "Operating Agreement – Northwind SPV IV.pdf", kind: "operating_agreement", status: "signed", uploadedAt: T(-238), sizeKb: 842 },
  { id: "doc_2", vehicleId: "veh_1", name: "PPM – Northwind SPV IV.pdf", kind: "ppm", status: "filed", uploadedAt: T(-238), sizeKb: 1930 },
  { id: "doc_3", vehicleId: "veh_1", name: "Form D – Northwind SPV IV.pdf", kind: "form_d", status: "filed", uploadedAt: T(-170), sizeKb: 210 },
  { id: "doc_4", vehicleId: "veh_1", investorId: "inv_2", name: "Subscription Agreement – Cedar Ridge FO.pdf", kind: "subscription_agreement", status: "signed", uploadedAt: T(-227), sizeKb: 410 },
  { id: "doc_5", vehicleId: "veh_2", name: "LPA – Okafor Growth Fund II.pdf", kind: "operating_agreement", status: "signed", uploadedAt: T(-538), sizeKb: 2210 },
  { id: "doc_6", vehicleId: "veh_2", investorId: "inv_15", name: "Side Letter – Greenlight Ventures.pdf", kind: "side_letter", status: "signed", uploadedAt: T(-498), sizeKb: 120 },
  { id: "doc_7", vehicleId: "veh_2", name: "Schedule K-1 (FY) – batch.zip", kind: "k1", status: "draft", uploadedAt: T(-15), sizeKb: 5120 },
  { id: "doc_8", vehicleId: "veh_3", name: "Operating Agreement – Lumen SPV Helio.pdf", kind: "operating_agreement", status: "signed", uploadedAt: T(-27), sizeKb: 801 },
  { id: "doc_9", vehicleId: "veh_3", investorId: "inv_3", name: "Subscription Agreement – Tomas Herrera.pdf", kind: "subscription_agreement", status: "pending_signature", uploadedAt: T(-21), sizeKb: 402 },
  { id: "doc_10", vehicleId: "veh_3", investorId: "inv_8", name: "Subscription Agreement – Sofia Almeida.pdf", kind: "subscription_agreement", status: "pending_signature", uploadedAt: T(-14), sizeKb: 402 },
  { id: "doc_11", vehicleId: "veh_3", investorId: "inv_14", name: "Subscription Agreement – Lucia Bianchi.pdf", kind: "subscription_agreement", status: "pending_signature", uploadedAt: T(-8), sizeKb: 402 },
  { id: "doc_12", vehicleId: "veh_4", name: "Operating Agreement – Harbor SPV 7.pdf", kind: "operating_agreement", status: "signed", uploadedAt: T(-59), sizeKb: 812 },
  { id: "doc_13", vehicleId: "veh_4", name: "Form D – Harbor SPV 7 (draft).pdf", kind: "form_d", status: "draft", uploadedAt: T(-3), sizeKb: 198 },
  { id: "doc_14", vehicleId: "veh_4", name: "Bank statement – Sep.pdf", kind: "bank_statement", status: "filed", uploadedAt: T(-9), sizeKb: 96 },
  { id: "doc_15", vehicleId: "veh_6", name: "LPA – Lumen Opportunity Fund I.pdf", kind: "operating_agreement", status: "signed", uploadedAt: T(-118), sizeKb: 2305 },
  { id: "doc_16", vehicleId: "veh_7", name: "Final Distribution Notice – Quill.pdf", kind: "k1", status: "filed", uploadedAt: T(-199), sizeKb: 230 },
  { id: "doc_17", vehicleId: "veh_8", name: "Operating Agreement – Okafor SPV PayNest.pdf", kind: "operating_agreement", status: "signed", uploadedAt: T(-398), sizeKb: 790 },
  { id: "doc_18", vehicleId: "veh_5", name: "Operating Agreement – Orbital Labs SPV (draft).pdf", kind: "operating_agreement", status: "draft", uploadedAt: T(-2), sizeKb: 760 },
];

const activity: Activity[] = [
  { id: "act_1", at: T(-0.05, 9), actor: "Cedar Ridge Family Office", action: "wired $1,000,000 for Capital Call #3 (Okafor Growth Fund II)", entityType: "capital_call", entityId: "cc_3" },
  { id: "act_2", at: T(-0.3, 16), actor: "Elena Marchetti", action: "approved subscription of Isabelle Moreau ($150,000) in Lumen SPV – Helio Energy", entityType: "subscription", entityId: "sub_26" },
  { id: "act_3", at: T(-1, 11), actor: "System", action: "Greenlight Ventures Fund wired $1,000,000 for Capital Call #3", entityType: "capital_call", entityId: "cc_3" },
  { id: "act_4", at: T(-1, 14), actor: "You", action: "created task 'Chase outstanding wires – Fathom SPV'", entityType: "task", entityId: "task_4" },
  { id: "act_5", at: T(-2, 10), actor: "Daniel Okafor", action: "approved distribution 'Partial return of capital – PayNest tender offer' ($400,000)", entityType: "distribution", entityId: "dist_3" },
  { id: "act_6", at: T(-2, 15), actor: "Halvorsen Holdings AS", action: "wired $500,000 for Capital Call #3", entityType: "capital_call", entityId: "cc_3" },
  { id: "act_7", at: T(-3, 9), actor: "Priya Raman", action: "created draft vehicle 'Northwind SPV V – Orbital Labs'", entityType: "vehicle", entityId: "veh_5" },
  { id: "act_8", at: T(-5, 12), actor: "Lucia Bianchi", action: "signed subscription agreement for Lumen SPV – Helio Energy", entityType: "subscription", entityId: "sub_25" },
  { id: "act_9", at: T(-6, 10), actor: "Elena Marchetti", action: "issued Capital Call #1 for Lumen Opportunity Fund I ($3,250,000)", entityType: "capital_call", entityId: "cc_4" },
  { id: "act_10", at: T(-8, 17), actor: "You", action: "moved Lumen Opportunity Fund I to Closed", entityType: "vehicle", entityId: "veh_6" },
  { id: "act_11", at: T(-10, 11), actor: "Nadia Kowalski", action: "was invited to Lumen SPV – Helio Energy", entityType: "subscription", entityId: "sub_24" },
  { id: "act_12", at: T(-12, 9), actor: "Daniel Okafor", action: "issued Capital Call #3 for Okafor Growth Fund II ($4,900,000)", entityType: "capital_call", entityId: "cc_3" },
];

export function buildSeed(): AppData {
  return {
    managers,
    vehicles,
    investors,
    subscriptions,
    capitalCalls,
    distributions,
    ledger: buildLedger(),
    tasks,
    documents,
    activity,
  };
}
