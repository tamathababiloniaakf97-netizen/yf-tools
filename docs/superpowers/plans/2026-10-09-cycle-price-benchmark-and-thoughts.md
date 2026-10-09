# Cycle Price Benchmark and Thoughts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users optionally bind any owned ticker to a market cycle, fetch its latest available close into the editable review form, show price anchors in the current card, and display manual thoughts separately from automatic alerts.

**Architecture:** Add an optional profile-level `ticker_id` foreign key and expose lightweight joined ticker metadata from the cycle API. Keep market data retrieval in the existing previous-close endpoint, isolate quote-filling UI in the progress form, and reuse `uncertainties` as the sole manual-thought field.

**Tech Stack:** Next.js App Router route handlers, React 19, Ant Design, SWR, Supabase/PostgreSQL, TypeScript, Vitest, Testing Library.

---

### Task 1: Add optional cycle-to-ticker persistence

**Files:**
- Create: `supabase/migrations/035_cycle_price_benchmark.sql`
- Modify: `src/types/life-os.ts`
- Modify: `src/lib/investment/cycles.ts`
- Test: `src/lib/investment/cycles-migration.test.ts`
- Test: `src/lib/investment/cycles.test.ts`

- [ ] **Step 1: Write failing migration and domain tests**

Assert that migration 035 adds nullable `ticker_id`, an index, and a foreign key using `on delete set null`. Assert placeholder/template profiles keep `ticker_id: null` and never infer a ticker from `cycle_key`.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx vitest run src/lib/investment/cycles-migration.test.ts src/lib/investment/cycles.test.ts`

Expected: FAIL because migration 035 and the new typed fields do not exist.

- [ ] **Step 3: Add the migration and types**

Add:

```sql
alter table public.market_cycle_profiles
  add column if not exists ticker_id uuid references public.tickers(id) on delete set null;

create index if not exists market_cycle_profiles_ticker_id_idx
  on public.market_cycle_profiles(ticker_id);
```

Add `ticker_id?: string | null` and optional display-only `ticker?: { id: string; name: string; code: string; currency: string } | null` to `MarketCycleProfile`. Set both to `null` in `placeholderProfile`.

- [ ] **Step 4: Run focused tests and confirm pass**

Run: `npx vitest run src/lib/investment/cycles-migration.test.ts src/lib/investment/cycles.test.ts`

Expected: PASS.

### Task 2: Validate ticker ownership in cycle APIs

**Files:**
- Modify: `src/app/api/investment/cycles/route.ts`
- Modify: `src/app/api/investment/cycles/[id]/route.ts`
- Create: `src/app/api/investment/cycles/route.test.ts`
- Create: `src/app/api/investment/cycles/[id]/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Cover creating and editing with an owned ticker, clearing with `null`, rejecting a missing/unowned ticker with status 400, and seeding preset profiles without `ticker_id`. Verify GET uses a relation select that returns ticker identity needed by the UI.

- [ ] **Step 2: Run route tests and confirm failure**

Run: `npx vitest run src/app/api/investment/cycles/route.test.ts src/app/api/investment/cycles/[id]/route.test.ts`

Expected: FAIL because route payloads ignore `ticker_id` and do not validate ownership.

- [ ] **Step 3: Implement shared ownership behavior in both handlers**

Normalize with:

```ts
const tickerId = body.ticker_id === null || body.ticker_id === ''
  ? null
  : String(body.ticker_id ?? '').trim() || undefined;
```

When `tickerId` is a string, query `tickers.select('id').eq('id', tickerId).eq('user_id', user.id).maybeSingle()` and return `{ error: '关联标的不存在' }` with status 400 if missing. Persist only the validated ID. Read cycle profiles with joined fields equivalent to `*,ticker:tickers(id,name,code,currency)`.

- [ ] **Step 4: Run route tests and confirm pass**

Run: `npx vitest run src/app/api/investment/cycles/route.test.ts src/app/api/investment/cycles/[id]/route.test.ts`

Expected: PASS.

### Task 3: Add the user-selected benchmark and quote-fill interaction

**Files:**
- Create: `src/app/investment/cycles/CyclePriceAnchors.tsx`
- Create: `src/app/investment/cycles/CyclePriceAnchors.test.tsx`
- Modify: `src/app/investment/cycles/CycleProgressFields.tsx`
- Modify: `src/app/investment/cycles/CycleProgressFields.test.tsx`
- Modify: `src/app/investment/cycles/page.tsx`
- Modify: `src/app/investment/cycles/page.test.tsx`

- [ ] **Step 1: Write failing component tests**

Test that the current card displays start date, start price, current price, price date, and associated ticker with `—` for missing values. Test that the review modal only shows “获取当前价格” when `ticker_id` exists, calls `/api/prices/previous-close?ticker_id=...`, writes `price` and `observedOn` into the form, preserves values on failure, and allows later editing. Test that the profile editor loads `/api/tickers`, offers searchable options, and submits the chosen `ticker_id` without defaults.

- [ ] **Step 2: Run component tests and confirm failure**

Run: `npx vitest run src/app/investment/cycles/CyclePriceAnchors.test.tsx src/app/investment/cycles/CycleProgressFields.test.tsx src/app/investment/cycles/page.test.tsx`

Expected: FAIL because the price-anchor component, picker, and fetch action do not exist.

- [ ] **Step 3: Implement the focused price-anchor component**

`CyclePriceAnchors` accepts the profile and renders only formatted display data. Use `profile.ticker ? `${profile.ticker.name} · ${profile.ticker.code}` : '未关联'`; show `—` for null dates/prices and do not synthesize zeroes.

- [ ] **Step 4: Extend the progress form with quote filling**

Pass `tickerId` and ticker label into `CycleProgressFields`. On click, request the existing previous-close route. Validate `result.price > 0` and `result.observedOn` as `YYYY-MM-DD` before setting both fields. If the returned date would be earlier than the entered start date, show an error and leave the original fields unchanged. Label the button “获取当前价格”, not “实时价格”.

- [ ] **Step 5: Add ticker selection to topic management**

Load `/api/tickers` with SWR, map each item to `{ value: id, label: `${name} · ${code}` }`, add an allow-clear searchable select, and include `ticker_id` in POST/PATCH payloads. Changing the selection must not clear existing cycle prices.

- [ ] **Step 6: Run component tests and confirm pass**

Run: `npx vitest run src/app/investment/cycles/CyclePriceAnchors.test.tsx src/app/investment/cycles/CycleProgressFields.test.tsx src/app/investment/cycles/page.test.tsx`

Expected: PASS.

### Task 4: Reframe manual thoughts and automatic alerts

**Files:**
- Modify: `src/app/investment/cycles/page.tsx`
- Modify: `src/app/investment/cycles/page.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add failing presentation tests**

Render a profile with `uncertainties: '核实需求是否真实增长'` and no alerts. Assert the right card contains “我的待思考”、the saved text、“系统提醒” and “当前没有条件提醒”. Assert the review form label is “待思考事项” and that “关键未知” is not duplicated in the left evidence row.

- [ ] **Step 2: Run the page test and confirm failure**

Run: `npx vitest run src/app/investment/cycles/page.test.tsx`

Expected: FAIL on the new labels and placement.

- [ ] **Step 3: Implement the two-source right panel**

Keep one `uncertainties` field. Rename its form label to “待思考事项”, move its current value into the right card under “我的待思考”, and render automatic `buildCycleAlerts` results under “系统提醒”. Keep the two empty states independent.

- [ ] **Step 4: Add minimal responsive styling**

Add compact grid styles for price anchors and spacing between the two right-panel sections. On narrow screens, allow anchor cells to wrap without horizontal scrolling.

- [ ] **Step 5: Run the page test and confirm pass**

Run: `npx vitest run src/app/investment/cycles/page.test.tsx`

Expected: PASS.

### Task 5: Verify the integrated increment

**Files:**
- Modify if needed: files touched in Tasks 1–4 only

- [ ] **Step 1: Run all cycle and quote-focused tests**

Run: `npx vitest run src/lib/investment/cycles.test.ts src/lib/investment/cycles-migration.test.ts src/app/api/investment/cycles/route.test.ts src/app/api/investment/cycles/[id]/route.test.ts src/app/api/prices/previous-close/route.test.ts src/app/investment/cycles/CyclePriceAnchors.test.tsx src/app/investment/cycles/CycleProgressFields.test.tsx src/app/investment/cycles/page.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run targeted lint and type checking**

Run: `npx eslint src/app/investment/cycles src/app/api/investment/cycles src/lib/investment/cycles.ts src/types/life-os.ts`

Run: `npx tsc --noEmit`

Expected: no new errors in touched files. If the repository has unrelated pre-existing errors, record them separately instead of editing unrelated files.

- [ ] **Step 3: Run one production build**

Run: `npm run build`

Expected: successful production build, or a clearly identified pre-existing unrelated failure.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and inspect only the files listed in this plan. Confirm no default ticker mapping, no duplicate manual-thought field, no automatic stage judgment, and no unrelated edits.
