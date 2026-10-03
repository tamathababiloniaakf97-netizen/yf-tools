# Investment Attention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a no-migration investment attention feed that resurfaces due or neglected watch items and tasks, while simplifying watch capture and aligning sidebar order.

**Architecture:** A pure `buildInvestmentAttentionItems` helper owns reminder eligibility, priority, and labels. The investment overview fetches existing watchlist and task APIs and renders a focused action card; existing PATCH endpoints update dates and completion state. Watchlist copy and validation become permissive enough for one-line capture without changing the database schema.

**Tech Stack:** Next.js App Router, React, TypeScript, Ant Design, Supabase, Vitest, Testing Library.

---

### Task 1: Define attention-feed behavior

**Files:**
- Create: `src/lib/investment/attention.ts`
- Create: `src/lib/investment/attention.test.ts`

- [ ] Write failing tests covering due and overdue dated records, 7-day undated task resurfacing, 14-day undated watch resurfacing, paused/unapproved exclusions, ordering, and display limits.
- [ ] Run `npm test -- src/lib/investment/attention.test.ts` and confirm failure because the helper does not exist.
- [ ] Implement the minimal pure helper and exported attention item type.
- [ ] Run the focused test and confirm it passes.

### Task 2: Support low-friction watch-item updates

**Files:**
- Modify: `src/lib/investment/records.test.ts`
- Modify: `src/lib/investment/records.ts`
- Create: `src/app/api/investment/watchlist/[id]/route.test.ts`
- Modify: `src/app/api/investment/watchlist/[id]/route.ts`

- [ ] Change the validation test to require only a non-empty attention title and to normalize optional reason and condition to empty strings.
- [ ] Run the validation test and confirm the current required-field behavior fails it.
- [ ] Relax and normalize watch-item validation.
- [ ] Add a failing route test proving an authenticated user can PATCH only their own watch item and that `updated_at` is refreshed.
- [ ] Implement PATCH by loading the existing record, validating the merged input, and scoping the update by both id and user id.
- [ ] Run both focused test files and confirm they pass.

### Task 3: Render and operate the overview attention card

**Files:**
- Create: `src/app/investment/components/InvestmentAttentionCard.tsx`
- Create: `src/app/investment/components/InvestmentAttentionCard.test.tsx`
- Modify: `src/app/investment/page.tsx`

- [ ] Write a failing component test for the title, reason label, task completion, seven-day snooze, watch review, and conversion link.
- [ ] Run the component test and confirm failure because the component does not exist.
- [ ] Implement the card with compact actions and no destructive delete shortcut.
- [ ] Update the overview to fetch positions, watch items, and tasks in parallel; build the attention feed and PATCH the existing APIs for actions.
- [ ] Run the component test and the overview helper tests.

### Task 4: Simplify watch capture and connect it to tasks

**Files:**
- Create: `src/app/investment/watchlist/page.test.tsx`
- Modify: `src/app/investment/watchlist/page.tsx`

- [ ] Write a failing page test proving the form says “关注事项”, only that field is required, and an existing item exposes edit/review/snooze/create-task actions.
- [ ] Run the focused page test and confirm the current stock-only form fails it.
- [ ] Implement updated copy, optional detail fields, edit support, reviewed and snooze PATCH actions, and a prefilled task link.
- [ ] Run the focused page test and confirm it passes.

### Task 5: Align sidebar order

**Files:**
- Modify: `src/components/shell/navigation.test.ts`
- Modify: `src/components/shell/navigation.ts`

- [ ] Add a failing test for the agreed investment navigation order.
- [ ] Run the navigation test and confirm it fails on the current order.
- [ ] Move investment tasks directly after the watchlist while retaining overview and holdings first.
- [ ] Run the navigation test and confirm it passes.

### Task 6: Verify the integrated change

**Files:**
- Modify if needed: files listed above only.

- [ ] Run all focused investment and navigation tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Review `git diff` to confirm no migration or unrelated user changes were introduced.
