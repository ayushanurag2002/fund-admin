# Allocations · Fund Admin (internal tool)

An internal fund-administration console inspired by [allocations.com](https://www.allocations.com): manage SPVs and funds, onboard LPs, run capital calls and distributions, and keep a ledger — all in a **Next.js frontend with local dummy data** (no backend, no API keys).

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 with a custom light/dark design system
- Zustand (persisted to `localStorage`) for state + business logic
- Recharts for charts · lucide-react for icons

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Deploy to Vercel

1. Push this folder to a Git repository.
2. Import the repo in Vercel — framework preset **Next.js**, no environment variables needed.
3. Deploy. Every visitor gets the seeded demo dataset in their own browser; **Settings → Reset demo data** restores it.

## What's inside

| Area | What you can do |
| --- | --- |
| Dashboard | AUA, raise progress, capital flows chart, NAV by sector, tasks needing attention, activity feed |
| Vehicles | Create SPV/Fund via a 4-step wizard; lifecycle `draft → raising → closing → closed → active → liquidated` with guarded transitions; cap table, ledger, documents, activity per vehicle |
| Investors | LP directory, KYC/AML and accreditation workflow, positions, transactions, statements |
| Subscriptions | Kanban + table pipeline: `invited → signed → kyc_review → approved → wire_pending → funded`, with reject/re-invite |
| Capital calls | Pro-rata drawdowns against fund commitments, issue notices, record wires, auto status (`partially_funded` / `funded`) |
| Distributions | Waterfall preview (return of capital → preferred return → carry), approve, pay and book to ledger |
| Ledger | All cash movements with filters, manual entries, CSV export |
| Tasks | Compliance/ops tasks grouped by due date, auto-created by workflows (KYC review, Form D, wire tracking) |
| Documents | Operating agreements, subscription docs, K-1s, Form D with signature/filing states |
| Reports | Vehicle performance (DPI/MOIC), investor capital-account statements, GP economics |

## Business rules enforced

- A raise can't launch until the operating agreement is **signed**.
- A subscription can't be **approved** until the investor's KYC is approved **and** accreditation is verified; hard cap of 120% of target raise.
- **Final close** requires every approved subscription to be funded or rejected; unsigned invites are dropped automatically and a Form D filing task is created.
- SPV contributions post to the ledger when a subscription is funded; fund contributions post when a capital-call wire is recorded.
- Capital calls can't exceed uncalled commitments; cancelling is blocked once wires are received.
- Paying a distribution writes per-LP ledger entries, books carry to the GP and reduces the holding value.
- Every mutation is written to the activity log.

Keyboard: `⌘K` / `Ctrl+K` opens global search.
