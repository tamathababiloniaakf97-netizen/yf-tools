# Automatic Portfolio History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist an auditable daily portfolio NAV from a Supabase scheduled Edge Function and display TWR, drawdown, annualized return, and SPY comparison without requiring the website to be open.

**Architecture:** A Deno-compatible pure calculation core converts opening data, transactions, holdings, prices, and the previous snapshot into an idempotent daily snapshot. A Supabase Edge Function refreshes completed market prices, falls back to last valid prices, writes account and position snapshots through service-role access, and is invoked by Supabase Cron. The authenticated Next.js API reads the stored history; the existing ECharts component renders metrics from persisted data.

**Tech Stack:** Supabase Postgres/RLS/Cron/Edge Functions, TypeScript, Next.js 16 Route Handlers, React 19, Ant Design, ECharts, Vitest

---

### Task 1: Daily NAV calculation core

**Files:**
- Create: `supabase/functions/portfolio-daily-snapshot/core.ts`
- Create: `supabase/functions/portfolio-daily-snapshot/core.test.ts`

- [ ] Write failing tests for opening baseline, later deposits adjusting shares without changing NAV, price gains changing NAV, rerun inputs using the prior day only, internal cash flows, and missing held prices.
- [ ] Run `npx vitest run supabase/functions/portfolio-daily-snapshot/core.test.ts` and confirm failures occur because the core is absent.
- [ ] Implement `buildDailySnapshot` as a dependency-free function. It calculates quantities, cash, market value, total assets, external flow, shares and NAV, returning `failed` when a held ticker has no usable USD price.
- [ ] Add `calculateHistoryMetrics` for TWR, 60-day annualized return, and rolling-peak maximum drawdown.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Snapshot database schema

**Files:**
- Create: `supabase/migrations/036_portfolio_daily_history.sql`
- Create: `src/lib/portfolio-history-migration.test.ts`
- Modify: `src/types/index.ts`

- [ ] Write a failing migration contract test requiring account snapshot audit columns, `portfolio_position_snapshots`, unique daily keys, RLS policies, and authenticated read grants.
- [ ] Run `npx vitest run src/lib/portfolio-history-migration.test.ts` and confirm the migration file is absent.
- [ ] Add columns to `nav_history`: `market_value`, `external_flow`, `valuation_status`, `price_errors`, `benchmark_price`, `benchmark_nav`, and `updated_at`; add the position snapshot table with user/date/ticker uniqueness and own-row RLS.
- [ ] Extend `NavHistory` and add `PortfolioPositionSnapshot` types.
- [ ] Re-run the migration contract test.

### Task 3: Supabase Edge Function orchestration

**Files:**
- Create: `supabase/functions/portfolio-daily-snapshot/quotes.ts`
- Create: `supabase/functions/portfolio-daily-snapshot/quotes.test.ts`
- Create: `supabase/functions/portfolio-daily-snapshot/index.ts`
- Create: `supabase/functions/portfolio-daily-snapshot/README.md`

- [ ] Write failing quote tests for A-share/HK/US symbols, native-to-USD conversion, Tencent previous close parsing, Coinbase completed daily close parsing, and fallback selection.
- [ ] Run the quote tests and confirm the module is absent.
- [ ] Implement Deno-compatible quote helpers with injectable `fetch`, fixed existing FX rates, timeout, and last-valid-price fallback metadata.
- [ ] Implement the Edge Function: verify `CRON_SECRET`, load configured users and their portfolio data, refresh unique tickers, create an opening baseline when needed, build today’s snapshot from the previous valid day, upsert account and position snapshots, and return per-user status counts.
- [ ] Document required secrets and the daily `0 30 0 * * *` UTC Cron schedule (08:30 Asia/Shanghai).
- [ ] Run core and quote tests.

### Task 4: Authenticated history API

**Files:**
- Create: `src/app/api/nav/route.ts`
- Create: `src/app/api/nav/route.test.ts`

- [ ] Write failing route tests for unauthenticated access, own-user filtering, ascending ordering, and serialized numeric fields.
- [ ] Run `npx vitest run src/app/api/nav/route.test.ts` and confirm failure because the route is absent.
- [ ] Implement a dynamic GET Route Handler using `createServerSideClient`, selecting stored `nav_history` rows scoped to the authenticated user.
- [ ] Re-run the route tests.

### Task 5: Historical performance UI

**Files:**
- Create: `src/app/cost/components/PortfolioHistoryPanel.tsx`
- Create: `src/app/cost/components/PortfolioHistoryPanel.test.tsx`
- Modify: `src/app/cost/components/NavChart.tsx`
- Modify: `src/app/cost/page.tsx`
- Modify: `src/app/cost/page.test.tsx`

- [ ] Write failing component tests for loading history, fewer-than-two-days accumulation state, TWR/XIRR explanation, partial valuation warning, and chart-ready normalized SPY data.
- [ ] Run the focused component tests and confirm the panel does not exist.
- [ ] Implement the panel to fetch `/api/nav`, calculate metrics from stored NAV, normalize benchmark points, and pass data to `NavChart`.
- [ ] Update `NavChart` empty state and persistent explanations; replace the disabled-history alert on the cost page with the panel.
- [ ] Update the cost page fetch mocks and run all cost-page tests.

### Task 6: Verification and deployment handoff

**Files:**
- Modify only if verification reveals an in-scope defect.

- [ ] Run all new and cost-module Vitest tests.
- [ ] Run ESLint on all modified TypeScript/TSX files and `git diff --check`.
- [ ] Run the repository test suite and report unrelated pre-existing failures separately.
- [ ] Commit implementation without `tmp/` or `output/`.
- [ ] Inspect Supabase project tooling. Do not deploy migrations, secrets, Edge Functions, or Cron until the exact remote project is identified and the user approves that online change.

