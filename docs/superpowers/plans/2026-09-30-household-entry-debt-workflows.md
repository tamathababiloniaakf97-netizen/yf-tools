# Household Entry and Debt Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct household ledger filtering and add editable household income, per-liability repayments, credit-card repayments, and investment transfers without double-counting income or expenses.

**Architecture:** Extend the existing unified ledger with explicit entry kinds plus optional liability and transaction-group references. Keep statement classification in pure TypeScript, enforce ownership and closed-period rules in authenticated route handlers, and reuse one form for create/edit flows. Liabilities remain individually named records whose month-end snapshots are authoritative.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, Vitest and Testing Library.

---

### Task 1: Accounting classifications and validation

**Files:**
- Modify: `src/types/household-finance.ts`
- Modify: `src/lib/household-finance/validation.ts`
- Modify: `src/lib/household-finance/validation.test.ts`
- Modify: `src/lib/household-finance/statements.ts`
- Modify: `src/lib/household-finance/statements.test.ts`

- [ ] Add failing tests showing `household_income` increases period surplus, while `credit_card_payment`, `investment_transfer_in`, and `investment_transfer_out` do not affect income or expenses. Verify loan principal remains financing and loan interest remains household expense.
- [ ] Run `npx vitest run src/lib/household-finance --maxWorkers=1`; expect failures because the new kinds are not yet accepted or classified.
- [ ] Extend `HouseholdEntryKind` with the four new kinds and add optional `liability_id` and `transaction_group_id` to `HouseholdLedgerEntry`. Update validation so liability repayment kinds require a liability id.
- [ ] Update `HouseholdStatements.income` to include `householdIncome`, and compute period surplus as `businessSurplus + householdIncome + investmentIncome - householdExpense`. Keep investment transfers and credit-card repayments out of consolidated income and cash-flow totals.
- [ ] Re-run the focused domain tests and confirm they pass.

### Task 2: Schema migration and mutation APIs

**Files:**
- Create: `supabase/migrations/015_household_entry_debt_workflows.sql`
- Modify: `src/app/api/household-finance/entries/route.ts`
- Create: `src/app/api/household-finance/entries/[id]/route.ts`
- Create: `src/app/api/household-finance/repayments/route.ts`
- Create: `src/lib/household-finance/period-lock.ts`
- Create: `src/lib/household-finance/period-lock.test.ts`

- [ ] Write a failing unit test for `assertHouseholdPeriodEditable(entryDate, closures)` that rejects a matching `closed` month and accepts open or `reopened` months.
- [ ] Run the new test and confirm it fails because the helper does not exist.
- [ ] Add nullable `liability_id` and `transaction_group_id` columns, a foreign key to the user-owned liability, indexes, and a revised entry-kind constraint supporting the new kinds while removing `internal_transfer` from new writes.
- [ ] Implement `PATCH` and `DELETE` at `/api/household-finance/entries/[id]`. Load the owned record first, enforce the period lock, validate the replacement payload, verify any referenced liability belongs to the user, and update/delete only the owned id.
- [ ] Keep collection `POST`, but apply the same period-lock and liability-ownership checks. Return `409` for a closed month.
- [ ] Add `/repayments` POST accepting `{ entry_date, liability_id, principal, interest, currency, fx_rate, note }`. Verify the liability belongs to the user, require at least one positive component, and insert grouped `loan_principal_payment` and `loan_interest` rows atomically through a migration RPC.
- [ ] Run the focused unit tests and `npx tsc --noEmit`.

### Task 3: Correct filtered create/edit UI and debt inputs

**Files:**
- Modify: `src/app/finance/components/MonthlyEntryPanel.tsx`
- Modify: `src/app/finance/components/MonthlyEntryPanel.test.tsx`
- Modify: `src/app/finance/page.tsx`
- Modify: `src/app/finance/components/StatementsPanel.tsx`
- Modify: `src/app/finance/components/FinanceOverview.tsx`

- [ ] Write failing component tests proving each tab filters its own records, the family tab exposes income and expense, every row has Edit and Delete, internal transfer is absent, and liability-related actions require a selected liability.
- [ ] Run `npx vitest run src/app/finance/components/MonthlyEntryPanel.test.tsx --maxWorkers=1`; expect the new assertions to fail.
- [ ] Pass liabilities into `MonthlyEntryPanel`. Track the active tab and filter the table by explicit kind sets: business, household, and capital.
- [ ] Reuse the entry form for create and edit. On Edit, populate date, kind, original amount/currency/rate, liability, and note; submit `PATCH /entries/:id`; provide Cancel Edit and preserve the active tab.
- [ ] Rename the household tab to `家庭收支` and add `household_income`/`household_expense`. Replace `internal_transfer` with `investment_transfer_in` and `investment_transfer_out`.
- [ ] For loan repayment, show liability, principal, and interest fields and submit the grouped repayment endpoint. For credit-card repayment, require a credit-card liability and create `credit_card_payment`. Household expense may optionally link to a credit card so monthly card totals remain attributable.
- [ ] Update overview/report labels to show household income and recalculate period surplus from the API result.
- [ ] Re-run the component and domain tests.

### Task 4: Verification and exact commit

**Files:**
- Verify only the files listed in Tasks 1–3 and this plan.

- [ ] Run `npx vitest run src/lib/household-finance src/app/finance --maxWorkers=1`.
- [ ] Run `npx tsc --noEmit` and ESLint on the changed TypeScript/TSX files.
- [ ] Run `npm test -- --maxWorkers=1` and `npm run build`.
- [ ] Inspect `git diff --check`, staged names, and unrelated working-tree files. Stage only this feature's files.
- [ ] Commit with `feat: refine household entries and debt repayments`; do not merge into `main` without explicit user authorization.
