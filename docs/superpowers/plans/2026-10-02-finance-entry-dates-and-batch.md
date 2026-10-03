# Finance Entry Dates And Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate cash-event dates from system recording timestamps, support atomic cross-month batch entry, and align monthly review reminders with the agreed seven-day completion window.

**Architecture:** Existing `entry_date` remains the user-selected cash receipt/payment date and `created_at` remains the immutable server-generated recording timestamp. Business and household rows are submitted to one authenticated batch route and inserted in one statement; capital/liability workflows keep their existing single-entry route. The pure Shanghai-calendar reminder function owns all month-window semantics for the dashboard and bell.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL, Ant Design 6, Vitest, Testing Library.

---

### Task 1: Date terminology and timestamp display

**Files:**
- Modify: `src/app/finance/components/MonthlyEntryPanel.test.tsx`
- Modify: `src/app/finance/components/MonthlyEntryPanel.tsx`

- [ ] Add a failing component test requiring “收付款日期” in the form and table, plus formatted “录入时间” from `created_at`.
- [ ] Run the focused test and confirm it fails because the UI still says “日期” and omits `created_at`.
- [ ] Rename the user field/column and render the immutable timestamp as `YYYY-MM-DD HH:mm` in Asia/Shanghai, with `—` when absent.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Atomic batch entry

**Files:**
- Create: `src/app/api/household-finance/entries/batch/route.test.ts`
- Create: `src/app/api/household-finance/entries/batch/route.ts`
- Modify: `src/app/finance/components/MonthlyEntryPanel.test.tsx`
- Modify: `src/app/finance/components/MonthlyEntryPanel.tsx`

- [ ] Add failing route tests for authentication, empty/oversized arrays, row-numbered validation errors, closed periods, and one-statement authenticated insertion.
- [ ] Implement `POST /api/household-finance/entries/batch` with a 50-row limit, per-row `validateLedgerEntry`, all-period editability checks, and one `.insert(rows)` call.
- [ ] Add a failing component test requiring an add-row action and one batch request containing different months.
- [ ] Implement `Form.List` rows for new business/household entries, retain the single form for editing and capital/liability entries, and show a saved-month summary.
- [ ] Run route and component tests until green.

### Task 3: Monthly review window

**Files:**
- Modify: `src/lib/household-finance/entry-review-reminder.test.ts`
- Modify: `src/lib/household-finance/entry-review-reminder.ts`
- Modify: `src/lib/dashboard/build-dashboard.test.ts`
- Modify: `src/lib/dashboard/build-dashboard.ts`

- [ ] Add failing tests for month-end pre-check, next-month days 1–7 normal completion, and overdue beginning on day 8.
- [ ] Return the next month’s seventh day as the deadline and an explicit non-overdue status label.
- [ ] Make dashboard actions display the reminder-provided label.
- [ ] Run reminder and dashboard tests until green.

### Task 4: Verification

- [ ] Run all focused finance, reminder, dashboard, and reminder-route tests.
- [ ] Run ESLint on changed source/test files and `git diff --check`.
- [ ] Run TypeScript/build verification and report any unrelated pre-existing failures separately.
