# Professional Portfolio Accounting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inferred portfolio performance with an explicit opening balance, correct cash and weighted-average position accounting, XIRR, and a simplified five-metric summary.

**Architecture:** Store one opening account and its opening positions in RLS-protected tables, saved atomically by RPC. Extend the pure portfolio engine to accept opening data, include every option cash flow, and calculate moving-average stock cost. Keep historical TWR unavailable until real historical valuations exist; expose XIRR as the only time-aware return in this phase.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, Vitest/Testing Library.

---

### Task 1: Opening-account domain and database

**Files:**
- Modify: `src/types/index.ts`
- Create: `supabase/migrations/013_portfolio_opening.sql`
- Create: `src/lib/portfolio-opening.ts`
- Test: `src/lib/portfolio-opening.test.ts`

- [ ] Write failing tests for positive opening net assets, unique ticker rows, positive quantities/non-negative values, and opening date not later than the earliest transaction.
- [ ] Run `npx vitest run src/lib/portfolio-opening.test.ts` and confirm failure for the missing module.
- [ ] Implement types and pure validation; add RLS tables and a security-invoker `save_portfolio_opening` RPC that atomically replaces opening positions.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Professional account engine and XIRR

**Files:**
- Modify: `src/lib/cost-engine.ts`
- Create: `src/lib/cost-engine.test.ts`
- Create: `src/lib/xirr.ts`
- Create: `src/lib/xirr.test.ts`

- [ ] Write failing tests for opening positions, weighted-average partial sale cost, negative cash from financed purchases, all open and closed option cash flows, option-only accounts, net contributions, cumulative profit, and XIRR.
- [ ] Run both new suites and verify expected failures.
- [ ] Implement opening-aware account calculation, moving-average carrying cost, complete option cash treatment, exposure/leverage metrics, and Newton/bisection XIRR with no-result handling.
- [ ] Run both suites and existing portfolio-related tests.

### Task 3: Opening-account API

**Files:**
- Create: `src/app/api/portfolio-opening/route.ts`
- Modify: `src/app/api/positions/route.ts`

- [ ] Add authenticated GET/PUT handlers, validate ticker ownership and earliest transaction date, and call the atomic RPC.
- [ ] Return opening account and positions with `/api/positions` so the page loads one consistent dataset.
- [ ] Run TypeScript and focused domain tests.

### Task 4: Opening setup UI and simplified metrics

**Files:**
- Create: `src/app/cost/components/PortfolioOpeningModal.tsx`
- Create: `src/app/cost/components/PortfolioOpeningModal.test.tsx`
- Modify: `src/app/cost/components/AccountSummaryCards.tsx`
- Create: `src/app/cost/components/AccountSummaryCards.test.tsx`
- Modify: `src/app/cost/page.tsx`

- [ ] Write failing UI tests for explicit opening input, five summary cards, financed-cash labeling, and hidden metrics before setup.
- [ ] Implement the setup/edit modal with transaction-date guard and per-position quantity, historical cost, and opening market value.
- [ ] Reduce the top summary to net assets, cash/financing, net contributions, cumulative profit, and XIRR; show stock exposure, leverage and internal style allocation near holdings.
- [ ] Replace the unreliable NAV chart with a clear historical-valuation pending notice and remove current TWR/annualized/drawdown calculations from the page.
- [ ] Run the UI suites.

### Task 5: Verification and commit

**Files:**
- Verify and stage only files listed in this plan plus the plan itself.

- [ ] Run all new focused tests.
- [ ] Run `npx tsc --noEmit` and ESLint on changed TypeScript/TSX files.
- [ ] Run the full Vitest suite.
- [ ] Inspect `git diff --check`, staged names and remaining unrelated changes.
- [ ] Commit exact files with `feat: add professional portfolio accounting`.
