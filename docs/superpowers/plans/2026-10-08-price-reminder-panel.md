# Price Reminder Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make investment tasks with a filled reference price permanently visible in the reminder panel and let users fetch the linked ticker's previous completed daily close on demand.

**Architecture:** Add nullable ticker and price columns to investment tasks, then extend the pure reminder builder so price presence is an OR condition alongside the existing due-date rule. Resolve previous-close quotes through an authenticated ticker-scoped API and render per-item loading/results in the reminder popover.

**Tech Stack:** Next.js App Router route handlers, React, Ant Design, Supabase/PostgreSQL, TypeScript, Vitest/Testing Library.

---

### Task 1: Extend the investment task contract

**Files:**
- Create: `supabase/migrations/033_investment_task_price_reminders.sql`
- Modify: `src/types/life-os.ts`
- Modify: `src/lib/investment/task-validation.ts`
- Test: `src/lib/investment/task-validation.test.ts`

- [ ] Write failing validation and migration contract tests for nullable `ticker_id`, positive `price`, and the requirement that a priced task has a ticker.
- [ ] Run `npm test -- src/lib/investment/task-validation.test.ts` and confirm the new assertions fail because the fields are absent.
- [ ] Add the migration, types, normalization, ownership validation in task routes, and minimal validation errors.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Make price presence a reminder inclusion rule

**Files:**
- Modify: `src/lib/reminders/types.ts`
- Modify: `src/lib/investment/task-reminders.ts`
- Test: `src/lib/investment/task-reminders.test.ts`

- [ ] Write failing tests showing priced tasks appear without a date and with a future date, while future unpriced, completed, cancelled, and unapproved tasks remain hidden.
- [ ] Run `npm test -- src/lib/investment/task-reminders.test.ts` and verify the new cases fail for the missing price rule.
- [ ] Add `investment_task_price` reminder output with ticker and reference-price metadata while preserving the existing date behavior.
- [ ] Re-run the focused test and confirm it passes.

### Task 3: Fetch the previous completed close

**Files:**
- Modify: `src/lib/market-data/quotes.ts`
- Test: `src/lib/market-data/quotes.test.ts`
- Create: `src/app/api/prices/previous-close/route.ts`
- Create: `src/app/api/prices/previous-close/route.test.ts`

- [ ] Write failing parser tests for Tencent previous close and for excluding an unfinished Coinbase daily candle, plus route tests for authentication, ticker ownership, success, and provider failure.
- [ ] Run the focused quote and route tests and confirm failures are caused by the missing previous-close API.
- [ ] Implement `fetchPreviousClose`, returning `{ price, currency, observedOn, source }`, and an authenticated `ticker_id` route that never accepts arbitrary external symbols.
- [ ] Re-run both focused test files and confirm they pass.

### Task 4: Add task fields and per-reminder quote controls

**Files:**
- Modify: `src/app/investment/tasks/components/InvestmentTaskEditor.tsx`
- Modify: `src/app/investment/tasks/components/InvestmentTaskEditor.test.tsx`
- Modify: `src/app/investment/tasks/page.tsx`
- Modify: `src/app/investment/tasks/components/InvestmentTaskList.tsx`
- Modify: `src/components/reminders/ReminderCenter.tsx`
- Modify: `src/components/reminders/ReminderCenter.test.tsx`

- [ ] Write failing component tests for selecting an owned ticker with a price and for a price reminder button that fetches and displays the previous close without navigating the row.
- [ ] Run the focused component tests and verify the controls are missing.
- [ ] Load ticker options in the tasks page, add linked-ticker and positive-price fields, display them in the task list, and implement isolated reminder-row quote state with propagation stopped on button clicks.
- [ ] Re-run the focused component tests and confirm they pass.

### Task 5: Verify the complete workflow

**Files:**
- Modify only files required by failures attributable to this feature.

- [ ] Run `npm test -- src/lib/investment/task-validation.test.ts src/lib/investment/task-reminders.test.ts src/lib/market-data/quotes.test.ts src/app/api/prices/previous-close/route.test.ts src/app/investment/tasks/components/InvestmentTaskEditor.test.tsx src/components/reminders/ReminderCenter.test.tsx`.
- [ ] Run `npm run build` and confirm the production build completes.
- [ ] Apply migration 033 in the configured database, create or edit a Tencent priced task, confirm it appears regardless of date, and confirm its button shows the previous close without changing the reference price.
