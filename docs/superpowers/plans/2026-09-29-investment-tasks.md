# Investment Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the investment-plan filter with a self-contained investment task list that saves, browses, edits, completes, cancels, deletes, and reminds without live price monitoring.

**Architecture:** Add a user-scoped `investment_tasks` table and authenticated CRUD routes. Keep task validation/reminder logic pure and tested, render an investment-specific editor and list at `/investment/tasks`, and merge due task reminders into the existing reminder API while routing generic plans back to `/plans`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, Vitest/Testing Library.

---

### Task 1: Model and migrate investment tasks

**Files:**
- Create: `supabase/migrations/009_investment_tasks.sql`
- Modify: `src/types/life-os.ts`
- Modify: `src/types/life-os.test.ts`

- [ ] Add failing assertions for `investmentTaskTypes`, `investmentTaskStatuses`, and a complete `InvestmentTask` fixture.
- [ ] Run `npm test -- src/types/life-os.test.ts` and confirm failure because the exports do not exist.
- [ ] Define task types `price`, `research`, `validation`, `financial_report`, `other`; statuses `pending`, `waiting`, `completed`, `cancelled`; and matching record/input types.
- [ ] Create migration 009 with the fields in the spec, timestamps, source/review constraints, RLS policies, grants, and indexes on user/status/reminder date.
- [ ] Run the focused test and `npm run typecheck`; expect both to pass.
- [ ] Commit with `feat: model investment tasks`.

### Task 2: Validate investment task input

**Files:**
- Create: `src/lib/investment/task-validation.ts`
- Create: `src/lib/investment/task-validation.test.ts`

- [ ] Write failing tests that accept an optional asset, trim text, default manual status/source/review fields, reject blank titles and invalid type/status values, require automation provenance, and set/clear `completed_at` from status.
- [ ] Run `npm test -- src/lib/investment/task-validation.test.ts`; expect missing-module failure.
- [ ] Implement `validateInvestmentTaskInput(input, existing?)` returning the same validation union used by other modules. When status becomes completed, preserve an existing completion time or set now; for every other status return `completed_at: null`.
- [ ] Run the focused tests and `npm run typecheck`; expect pass.
- [ ] Commit with `feat: validate investment tasks`.

### Task 3: Add authenticated CRUD API

**Files:**
- Create: `src/app/api/investment/tasks/route.ts`
- Create: `src/app/api/investment/tasks/[id]/route.ts`

- [ ] Add route behavior through the validated repository pattern already used by `/api/investment/watchlist`: GET lists the signed-in user's records, POST validates/inserts, PATCH validates/updates only an owned record, DELETE removes only an owned record, and unauthenticated requests return 401.
- [ ] Keep Next.js 16 dynamic params as `Promise<{ id: string }>` and await them.
- [ ] Run `npm run typecheck` and targeted lint; expect pass.
- [ ] Commit with `feat: add investment task api`.

### Task 4: Build task reminders

**Files:**
- Create: `src/lib/investment/task-reminders.ts`
- Create: `src/lib/investment/task-reminders.test.ts`
- Modify: `src/lib/reminders/due-reminders.ts`
- Modify: `src/lib/reminders/due-reminders.test.ts`
- Modify: `src/app/api/reminders/due/route.ts`
- Modify: `src/components/reminders/ReminderCenter.tsx`

- [ ] Write failing tests that include pending/waiting tasks due today or overdue, omit future/completed/cancelled/pending-review tasks, use Asia/Shanghai, and route to `/investment/tasks?task=<id>`.
- [ ] Run the focused tests and verify the missing implementation failure.
- [ ] Add `investment_task_today` and `investment_task_overdue` kinds and implement the pure builder.
- [ ] Change generic plan reminder hrefs to `/plans`, fetch approved investment tasks in the due-reminder route, merge their reminders, and label the new kinds in `ReminderCenter`.
- [ ] Run reminder tests and typecheck; expect pass.
- [ ] Commit with `feat: add investment task reminders`.

### Task 5: Replace the investment task page

**Files:**
- Create: `src/app/investment/tasks/components/InvestmentTaskEditor.tsx`
- Create: `src/app/investment/tasks/components/InvestmentTaskList.tsx`
- Create: `src/app/investment/tasks/components/InvestmentTaskList.test.tsx`
- Modify: `src/app/investment/tasks/page.tsx`

- [ ] Write failing list tests covering active default content, type/status labels, asset-optional cards, and edit/complete/cancel/delete callbacks.
- [ ] Run the component test and verify failure.
- [ ] Implement a modal editor with asset, type, title, condition/focus, reminder date, status, and notes. Implement cards and active/type/completed filters with no link to `/plans`.
- [ ] Wire the page to the new CRUD API, destructive confirmation, direct `?task=<id>` editing, and explicit loading/error/empty states.
- [ ] Run component tests, typecheck, and targeted lint; expect pass.
- [ ] Commit with `feat: build standalone investment tasks`.

### Task 6: Release checks and verification

**Files:**
- Modify: `docs/life-os-mvp-release-checklist.md`

- [ ] Add migration 009 and manual cases for optional asset, all five types, edit/status/delete, persistence after refresh, due/overdue reminders, direct reminder navigation, and cross-user RLS.
- [ ] Run `npm test`, `npm run typecheck`, targeted ESLint, and `npm run build`; all must pass.
- [ ] Commit with `docs: add investment task release checks`.
