# Ticker Management and Safe Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to remove duplicate unused tickers without disconnecting historical transactions.

**Architecture:** Extract the deletion guard into a small tested service that counts related transactions before deleting. The existing authenticated ticker route delegates to that service and returns `409` when history exists. A focused management modal lists the already-loaded tickers and performs confirmed deletes, then asks the cost page to reload.

**Tech Stack:** Next.js 16 Route Handlers, React 19, Ant Design 6, Supabase, TypeScript, Vitest, Testing Library.

---

### Task 1: Server-side deletion guard

**Files:**
- Create: `src/lib/tickers/delete-ticker.ts`
- Create: `src/lib/tickers/delete-ticker.test.ts`
- Modify: `src/app/api/tickers/[id]/route.ts`

- [ ] **Step 1: Write failing service tests**

Test that a positive transaction count returns `has_transactions` without calling delete, zero count deletes successfully, and count/delete database errors are returned as failures.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/lib/tickers/delete-ticker.test.ts --maxWorkers=1`

Expected: FAIL because `delete-ticker.ts` does not exist.

- [ ] **Step 3: Implement the minimal deletion service**

Expose `deleteTickerSafely(tickerId, countTransactions, deleteTicker)` returning a discriminated result: `deleted`, `has_transactions`, or `failed`.

- [ ] **Step 4: Run the service tests and verify GREEN**

Run the same focused command and expect all tests to pass.

- [ ] **Step 5: Wire the route to the service**

After the existing ownership check, count `transactions` rows with the ticker ID using Supabase `count: 'exact', head: true`. Return `409` with `该标的已有交易记录，不能删除` when count is positive. Delete only when it is zero, and constrain deletion by both ticker ID and user ID.

### Task 2: Ticker management modal

**Files:**
- Create: `src/app/cost/components/TickerManagerModal.tsx`
- Create: `src/app/cost/components/TickerManagerModal.test.tsx`
- Modify: `src/app/cost/page.tsx`

- [ ] **Step 1: Write the failing component test**

Render two duplicate tickers, click delete, confirm, and assert `DELETE /api/tickers/<id>` is requested and `onDeleted` runs after success. Add an error response case showing the server message.

- [ ] **Step 2: Run the focused component test and verify RED**

Run: `npx vitest run src/app/cost/components/TickerManagerModal.test.tsx --maxWorkers=1`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the modal**

Use an Ant Design `Modal` and `List`; show name, code, and localized type. Wrap deletion in `Popconfirm`, display API errors through `App.useApp().message`, and call `onDeleted` only after a successful response.

- [ ] **Step 4: Connect the cost page**

Add a `管理标的` button beside the existing add-ticker action. Open the modal with the current `tickers` array. On deletion, call the existing data reload functions so dropdowns and positions update immediately.

- [ ] **Step 5: Run component and related tests**

Run both new test files plus the existing ticker modal and market-data tests with one worker.

### Task 3: Verification and commit

**Files:**
- Verify all files above.

- [ ] **Step 1: Run TypeScript and targeted lint**

Run `npx tsc --noEmit --pretty false`, followed by ESLint on only the files touched by this feature.

- [ ] **Step 2: Run diff safety checks**

Run `git diff --check` and verify that unrelated dirty files remain unstaged.

- [ ] **Step 3: Commit exact files**

Stage only the deletion service, route, management modal, tests, page change, and this plan. Commit with `feat: add safe ticker management`.
