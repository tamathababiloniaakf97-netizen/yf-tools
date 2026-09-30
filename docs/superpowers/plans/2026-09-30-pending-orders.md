# Pending Order Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent stock and option pending-order management with safe conversion into existing transaction records.

**Architecture:** Store pending orders in a dedicated RLS-protected Supabase table so they never enter portfolio calculations. Keep validation and conversion mapping in a pure TypeScript module, expose authenticated Next.js Route Handlers for CRUD and conversion, and add one focused client panel plus modal to the existing cost page. Conversion uses a PostgreSQL RPC so transaction insertion and pending-order deletion are atomic.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, Vitest/Testing Library.

---

### Task 1: Pending-order domain model and validation

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/pending-orders.ts`
- Test: `src/lib/pending-orders.test.ts`

- [ ] Write failing tests for valid stock orders, valid option open/close orders, positive quantity/price checks, required option fields, required `position_id` for closing orders, and conversion payloads that preserve the current “premium already ×100” convention.
- [ ] Run `npx vitest run src/lib/pending-orders.test.ts` and confirm the module/tests fail before implementation.
- [ ] Add `PendingOrder` and input types to `src/types/index.ts`; implement `validatePendingOrderInput()` and `buildTransactionFromPendingOrder()` in `src/lib/pending-orders.ts`. Stock conversion returns `buy`/`sell`, native currency, quantity and price. Option conversion returns `option_income`, USD, signed premium cash flow derived from direction, and the existing `OptionDetail` structure.
- [ ] Run `npx vitest run src/lib/pending-orders.test.ts` and confirm all domain tests pass.

### Task 2: Database table and atomic conversion RPC

**Files:**
- Create: `supabase/migrations/012_pending_orders.sql`

- [ ] Define `pending_orders` with UUID ownership, ticker foreign key, stock/option category, side, option action/type/position, quantity, price, strike, expiry, order date, timestamps, checks, user/status index, RLS policies, and authenticated grants.
- [ ] Add `convert_pending_order(p_order_id uuid, p_trade_date date)` as a security-invoker PL/pgSQL function. It must lock and verify the authenticated user's order, load the ticker currency, validate a closing option's referenced open position and remaining quantity, insert the mapped `transactions` row, delete the pending order, and return the transaction id in the same database transaction.
- [ ] Check the SQL manually for idempotent object creation, ownership isolation, positive numeric checks, and no use of elevated `security definer` privileges.

### Task 3: Authenticated CRUD and conversion APIs

**Files:**
- Create: `src/app/api/pending-orders/route.ts`
- Create: `src/app/api/pending-orders/[id]/route.ts`
- Create: `src/app/api/pending-orders/[id]/convert/route.ts`
- Test: `src/lib/pending-orders-api.test.ts`

- [ ] Write failing service-level tests using a small Supabase repository adapter for list/create/update/delete/convert ownership and error mapping.
- [ ] Run `npx vitest run src/lib/pending-orders-api.test.ts` and confirm failure before implementation.
- [ ] Implement GET/POST, PATCH/DELETE, and conversion POST Route Handlers using async `params`, authenticated user checks, exact user filters, shared domain validation, ticker ownership validation, and readable 400/401/403/404/409/500 responses.
- [ ] Run `npx vitest run src/lib/pending-orders.test.ts src/lib/pending-orders-api.test.ts` and confirm both suites pass.

### Task 4: Pending-order modal and panel

**Files:**
- Create: `src/app/cost/components/PendingOrderModal.tsx`
- Create: `src/app/cost/components/PendingOrdersPanel.tsx`
- Test: `src/app/cost/components/PendingOrdersPanel.test.tsx`

- [ ] Write failing component tests proving stock/option tabs have different columns, ticker filtering includes symbols without positions, edit/delete actions call the correct endpoint, and conversion asks for a default-today but editable trade date.
- [ ] Run `npx vitest run src/app/cost/components/PendingOrdersPanel.test.tsx` and confirm failure before implementation.
- [ ] Implement a modal whose stock fields are side/quantity/price/date and whose option fields are action/direction/CALL-PUT/contracts/actual premium already ×100/strike/expiry/date. Closing options select an existing open option position and derive its position id.
- [ ] Implement a panel with stock/option segmented tabs, ticker selector, category-specific add button and columns, modify/delete actions, and a compact conversion confirmation modal.
- [ ] Run `npx vitest run src/app/cost/components/PendingOrdersPanel.test.tsx` and confirm the suite passes.

### Task 5: Cost-page integration and holding shortcut

**Files:**
- Modify: `src/app/cost/page.tsx`
- Modify: `src/app/cost/components/PositionTable.tsx`
- Modify: `src/app/cost/components/PositionTable.test.tsx` (create if absent)

- [ ] Write a failing component test showing the holding-row “挂单” action invokes a callback with the ticker id.
- [ ] Run `npx vitest run src/app/cost/components/PositionTable.test.tsx` and confirm failure before implementation.
- [ ] Load pending orders independently on the cost page; render the panel between NAV chart and transaction history; refresh orders and transactions after conversion; preserve the selected ticker filter; scroll the shortcut into view.
- [ ] Add the “挂单” link beside “流水” in each holding row while retaining existing behavior.
- [ ] Run the four focused pending-order/position suites and confirm they pass.

### Task 6: Verification and exact-file commit

**Files:**
- Verify only the files listed above plus this plan.

- [ ] Run `npx vitest run src/lib/pending-orders.test.ts src/lib/pending-orders-api.test.ts src/app/cost/components/PendingOrdersPanel.test.tsx src/app/cost/components/PositionTable.test.tsx`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run ESLint only on the changed TypeScript/TSX files.
- [ ] Inspect `git diff --check` and `git status --short`; confirm unrelated dirty files remain untouched and unstaged.
- [ ] Stage only the pending-order implementation, migration, tests, spec and plan; commit with `feat: add pending order management`.
