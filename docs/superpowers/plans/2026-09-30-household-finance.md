# Household Finance Statements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a low-maintenance household-finance module that records simple business/household cash entries, maintains asset and liability snapshots, captures month-end investment values, and produces consistent monthly, quarterly, and annual management statements in CNY.

**Architecture:** Store user-owned finance records in RLS-protected Supabase tables. Keep accounting calculations in pure TypeScript functions shared by one authenticated aggregate API and a client page. The UI exposes simple forms while internal entry kinds preserve balance-sheet, income/expense, and cash-flow classifications.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, Vitest and Testing Library.

---

### Task 1: Domain types, validation, and statement engine

**Files:**
- Create: `src/types/household-finance.ts`
- Create: `src/lib/household-finance/validation.ts`
- Create: `src/lib/household-finance/validation.test.ts`
- Create: `src/lib/household-finance/statements.ts`
- Create: `src/lib/household-finance/statements.test.ts`

- [ ] Write failing tests proving that manual FX locks CNY amounts, transfers do not affect income, loan principal is financing rather than expense, interest is expense, unrealized valuation changes stay outside income, and asset minus liability equals net worth.
- [ ] Run `npx vitest run src/lib/household-finance --maxWorkers=1` and confirm the missing implementations fail.
- [ ] Define `HouseholdLedgerEntry`, `HouseholdAccount`, `HouseholdAsset`, `HouseholdLiability`, snapshot, closure, period, and report result types. Implement:

```ts
export function cnyAmount(originalAmount: number, fxRate: number): number;
export function periodBounds(year: number, mode: 'month' | 'quarter' | 'year', index: number): { start: string; end: string };
export function buildHouseholdStatements(input: StatementInput): HouseholdStatements;
```

- [ ] Re-run the focused suites and confirm all domain tests pass.

### Task 2: RLS database schema and authenticated API

**Files:**
- Create: `supabase/migrations/014_household_finance.sql`
- Create: `src/app/api/household-finance/route.ts`
- Create: `src/app/api/household-finance/entries/route.ts`
- Create: `src/app/api/household-finance/items/route.ts`
- Create: `src/app/api/household-finance/snapshots/route.ts`
- Create: `src/app/api/household-finance/close/route.ts`

- [ ] Create settings, ledger entries, accounts, assets, asset snapshots, liabilities, liability snapshots, account snapshots, investment snapshots, and period closure tables. Every table carries `user_id`, enables RLS, and grants only authenticated users with own-row policies.
- [ ] Add an atomic `close_household_month` security-invoker RPC that saves account/liability/investment snapshots and upserts the closure row in one transaction.
- [ ] Implement authenticated route handlers. Validate finite non-negative amounts, ISO dates, ownership values, entry kinds, manual FX, and user ownership before writes. The aggregate GET returns records plus reports for requested period bounds.
- [ ] Run TypeScript and the domain suites.

### Task 3: Navigation and household-finance workspace

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/AppSidebar.tsx`
- Create: `src/app/finance/page.tsx`
- Create: `src/app/finance/components/FinanceOverview.tsx`
- Create: `src/app/finance/components/MonthlyEntryPanel.tsx`
- Create: `src/app/finance/components/BalanceSheetPanel.tsx`
- Create: `src/app/finance/components/StatementsPanel.tsx`
- Create: `src/app/finance/components/MonthCloseModal.tsx`
- Create: `src/app/finance/components/MonthlyEntryPanel.test.tsx`
- Create: `src/app/finance/components/StatementsPanel.test.tsx`

- [ ] Write failing component tests proving that business entry exposes only date, income/expense, amount and note; household expense stays separate; period selection exposes month/quarter/year; and the reports use the household management names rather than a corporate profit-and-loss label.
- [ ] Add a top-level `家庭财务` navigation item at `/finance` and a wallet icon mapping.
- [ ] Implement a single interactive page with four tabs: overview, monthly input, assets/liabilities, and statements. Use the aggregate API, keep empty/loading/error states explicit, and refresh after successful writes.
- [ ] Implement the close modal with actual account balances, liability balances, manual USD/CNY rate, current investment USD value, calculated CNY snapshot, and unexplained cash difference. Do not fetch automatic FX.
- [ ] Run the two UI suites and inspect the page at desktop and narrow widths.

### Task 4: Verification and exact commit

**Files:**
- Verify all files listed above and this plan only.

- [ ] Run `npx vitest run src/lib/household-finance src/app/finance --maxWorkers=1`.
- [ ] Run `npx tsc --noEmit` and ESLint on the changed TypeScript/TSX files.
- [ ] Run `npm test -- --maxWorkers=1` and `npm run build`.
- [ ] Inspect `git diff --check`, staged names, and remaining unrelated dirty files.
- [ ] Commit exact feature files with `feat: add household finance statements`; do not merge into `main` without the user's explicit request.
