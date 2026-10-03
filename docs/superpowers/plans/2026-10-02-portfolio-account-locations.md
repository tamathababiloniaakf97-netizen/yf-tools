# Portfolio Account Locations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an account-distribution drawer to the existing cost page where users record cash, holdings locations, and login hints while all account totals remain calculated.

**Architecture:** Keep the transaction/cost engine unchanged. Store one user-owned account record with JSON cash and position allocations, calculate USD totals from current ticker prices in a pure helper, and use an optional broker-reported total only for reconciliation display.

**Tech Stack:** Next.js 16 App Router, React 19, Ant Design 6, Supabase/PostgreSQL, TypeScript, Vitest.

---

### Task 1: Calculation and validation model

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/lib/portfolio-account-locations.ts`
- Test: `src/lib/portfolio-account-locations.test.ts`

- [ ] Write failing tests for calculated account totals, decimal crypto quantities, original-currency cash conversion, optional broker reconciliation, and position-allocation differences.
- [ ] Run the focused test and confirm failure because the helper does not exist.
- [ ] Add the minimal types, normalization, validation, and calculation helper.
- [ ] Run the focused test and confirm it passes.

### Task 2: Persistence API

**Files:**
- Create: `supabase/migrations/018_portfolio_account_locations.sql`
- Create: `src/app/api/portfolio-accounts/route.ts`
- Test: `src/app/api/portfolio-accounts/route.test.ts`

- [ ] Write failing route tests for authenticated GET and replacing the user's account snapshot with validated input.
- [ ] Run the route test and confirm failure because the route does not exist.
- [ ] Add the RLS-protected table and GET/PUT route.
- [ ] Run the route test and confirm it passes.

### Task 3: Drawer and entry form

**Files:**
- Create: `src/app/cost/components/AccountDistributionDrawer.tsx`
- Test: `src/app/cost/components/AccountDistributionDrawer.test.tsx`

- [ ] Write failing component tests proving totals are read-only, broker total is optional, account names are editable, BTC accepts decimals, and login fields are hints.
- [ ] Run the focused component test and confirm failure because the component does not exist.
- [ ] Build the drawer, expandable account overview, and account editor.
- [ ] Run the focused component test and confirm it passes.

### Task 4: Existing-page integration

**Files:**
- Modify: `src/app/cost/components/AccountSummaryCards.tsx`
- Modify: `src/app/cost/components/AccountSummaryCards.test.tsx`
- Modify: `src/app/cost/page.tsx`
- Modify: `src/app/cost/page.test.tsx`

- [ ] Write failing tests for opening the account-distribution drawer from the existing net-assets card.
- [ ] Run the focused tests and confirm the new behavior is missing.
- [ ] Wire the drawer into the existing page without changing cost-engine calculations.
- [ ] Run all cost-page and account-location tests, typecheck, lint changed files, and production build.
