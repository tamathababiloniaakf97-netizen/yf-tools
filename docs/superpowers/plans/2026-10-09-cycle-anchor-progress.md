# Cycle Anchor Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend cycle observation with editable manual start anchors, manual latest prices, automatic return/duration calculations, and Howard Marks-inspired stage prompts.

**Architecture:** Add nullable anchor and price fields to current cycle profiles and immutable review snapshots. Put calculation, validation, stage options, and prompt lookup in `src/lib/investment/cycles.ts`; API routes persist normalized inputs and snapshot computed values; the existing cycle page renders a compact progress area without adding another workflow.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, SWR, Vitest, Testing Library.

---

### Task 1: Pure cycle progress rules

**Files:**
- Modify: `src/types/life-os.ts`
- Modify: `src/lib/investment/cycles.ts`
- Modify: `src/lib/investment/cycles.test.ts`

- [ ] Add failing tests for `calculateCycleProgress`, covering positive and negative returns, calendar-day duration, missing inputs, and an end date before the start date.
- [ ] Add failing tests for six `cyclePhaseOptions` and `getCyclePhasePrompt`, including the exact prompts approved in the design.
- [ ] Run `npm test -- src/lib/investment/cycles.test.ts` and confirm failure because the new exports are absent.
- [ ] Extend profile and review types with nullable `cycle_started_on`, `cycle_start_price`, `latest_price`, `latest_price_on`, `return_percent`, and `running_days` fields.
- [ ] Implement pure calculation and prompt helpers. Return `null` for incomplete calculations and a validation error for reversed dates; never infer a phase.
- [ ] Run the focused test and confirm it passes.

### Task 2: Input validation and immutable snapshot values

**Files:**
- Modify: `src/lib/investment/cycles.ts`
- Modify: `src/lib/investment/cycles.test.ts`

- [ ] Add failing tests showing that review normalization trims text, accepts fully empty price fields, rejects non-positive prices, requires latest price and date together, and writes calculated return/duration values into normalized review data.
- [ ] Run the focused test and confirm the new cases fail for the intended missing behavior.
- [ ] Extend `normalizeCycleReviewInput` to normalize ISO dates and finite positive prices, call the shared calculation helper, and include immutable calculated values.
- [ ] Run the focused test and confirm all cycle rules pass.

### Task 3: Additive database migration and API persistence

**Files:**
- Create: `supabase/migrations/033_cycle_anchor_progress.sql`
- Modify: `src/app/api/investment/cycles/[id]/reviews/route.ts`
- Modify: `src/app/api/investment/cycles/[id]/route.ts`
- Test: `src/lib/investment/cycles-migration.test.ts`

- [ ] Add a failing migration contract test that requires the six nullable fields on both profile and review tables and positive-price checks.
- [ ] Run `npm test -- src/lib/investment/cycles-migration.test.ts` and confirm failure because migration 033 is absent.
- [ ] Create an additive migration. Use `numeric` for prices/return, `date` for dates, and `integer` for running days; preserve every existing row.
- [ ] Extend review creation so the inserted snapshot and current profile receive the normalized anchor, price, and computed fields.
- [ ] Extend profile PATCH to validate direct anchor edits and reject non-positive prices or reversed dates.
- [ ] Run migration and cycle tests and confirm they pass.

### Task 4: Compact progress and stage-prompt UI

**Files:**
- Create: `src/app/investment/cycles/CycleProgressFields.tsx`
- Create: `src/app/investment/cycles/CycleProgressFields.test.tsx`
- Modify: `src/app/investment/cycles/page.tsx`
- Modify: `src/app/investment/cycles/page.test.tsx`
- Modify: `src/app/globals.css`

- [ ] Add failing component tests for the fixed short warning, empty-state results, calculated result display, six phase choices, selected-phase prompt, and today's default only when a latest price is first entered.
- [ ] Run focused UI tests and confirm failure because the progress component is absent.
- [ ] Implement the progress component using date inputs, positive numeric inputs, shared pure calculation, and a phase selector with contextual prompt text.
- [ ] Insert it into the existing review form and current-judgment card; do not add a new tab or page.
- [ ] Update history rows to show return and running days only when their values exist.
- [ ] Add responsive styles that collapse four inputs to one column on narrow screens.
- [ ] Run focused UI tests and confirm they pass.

### Task 5: Anchor-change confirmation and verification

**Files:**
- Modify: `src/app/investment/cycles/page.tsx`
- Modify: `src/app/investment/cycles/page.test.tsx`
- Modify: `docs/life-os-mvp-release-checklist.md`

- [ ] Add a failing page test showing that changing an existing anchor with history requires confirmation, while a topic without history saves directly.
- [ ] Implement confirmation immediately before save with the approved text; cancellation must preserve form input and create no request.
- [ ] Document migration 033 and its backward-compatible nullable fields.
- [ ] Run `npm test -- src/lib/investment/cycles.test.ts src/lib/investment/cycles-migration.test.ts src/app/investment/cycles/CycleProgressFields.test.tsx src/app/investment/cycles/page.test.tsx`.
- [ ] Run ESLint on all changed cycle files.
- [ ] Run `npm run build` and confirm the Next.js production build succeeds.
- [ ] Run `npm test`; record unrelated pre-existing failures separately rather than changing out-of-scope modules.
