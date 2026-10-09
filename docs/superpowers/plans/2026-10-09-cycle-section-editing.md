# Cycle Section Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users edit each market-cycle section independently and make indicator deletion persist immediately.

**Architecture:** Extend the owned cycle-profile PATCH route with a strict partial-update validator, then place small section-specific editors around the existing page cards. Keep complete reviews as explicit snapshots and save the profile before inserting a review so a failed profile update cannot create a misleading history entry.

**Tech Stack:** Next.js App Router, React, Ant Design, SWR, Supabase, TypeScript, Vitest, Testing Library.

---

### Task 1: Validate partial profile updates

**Files:**
- Modify: `src/lib/investment/cycles.ts`
- Modify: `src/lib/investment/cycles.test.ts`
- Modify: `src/types/life-os.ts`

- [ ] Write failing tests for a `normalizeCycleProfilePatch` function covering thoughts clearing, price calculation, invalid date order, judgment fields, and cleaned indicator arrays.
- [ ] Run `npx vitest run src/lib/investment/cycles.test.ts` and confirm the new tests fail because the function is absent.
- [ ] Implement a whitelist-only normalizer returning `{ ok, value }`; only keys present in the request may appear in `value`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Support independent PATCH and safer full review order

**Files:**
- Modify: `src/app/api/investment/cycles/[id]/route.ts`
- Create: `src/app/api/investment/cycles/[id]/route.test.ts`
- Modify: `src/app/api/investment/cycles/[id]/reviews/route.ts`
- Create: `src/app/api/investment/cycles/[id]/reviews/route.test.ts`

- [ ] Write failing route tests proving partial updates preserve omitted fields, empty `uncertainties` clears the field, indicator arrays persist, invalid input is rejected, and unowned tickers are rejected.
- [ ] Write a failing review-route test proving profile update occurs before history insertion and insertion is skipped when profile update fails.
- [ ] Run both route tests and confirm the expected failures.
- [ ] Apply the partial normalizer in PATCH, retain ticker ownership validation, and return the joined ticker display data.
- [ ] Reorder review persistence to update the current profile first and insert the history snapshot only after update success.
- [ ] Run both route tests and confirm they pass.

### Task 3: Add reusable section editing behavior

**Files:**
- Create: `src/app/investment/cycles/CycleSectionEditors.tsx`
- Create: `src/app/investment/cycles/CycleSectionEditors.test.tsx`
- Modify: `src/app/investment/cycles/page.tsx`

- [ ] Write failing component tests for price, judgment, evidence, and manual-thought editors opening with current values and submitting only their own fields.
- [ ] Run the component test and confirm missing editors fail.
- [ ] Implement focused modals with a shared `onSave(patch)` callback; price editing includes user-selected ticker and quote retrieval, and thought editing permits an empty string.
- [ ] Add one page-level `saveProfilePatch` function that PATCHes, reports errors, mutates cycle data, and closes only the successful editor.
- [ ] Run the component tests and confirm they pass.

### Task 4: Make indicator management independent and deletion durable

**Files:**
- Create: `src/app/investment/cycles/CycleIndicatorManager.tsx`
- Create: `src/app/investment/cycles/CycleIndicatorManager.test.tsx`
- Modify: `src/app/investment/cycles/page.tsx`

- [ ] Write failing tests for adding, editing, confirming deletion, immediate save of the reduced full array, and retention after a failed save.
- [ ] Run the manager test and confirm it fails because the component is absent.
- [ ] Implement the manager so it calculates the next full array but does not remove the visible card until `onSave(nextIndicators)` resolves successfully.
- [ ] Replace indicator editing inside the complete-review modal with read-only snapshot inputs or retain it only for snapshot capture; all day-to-day add/edit/delete actions use “管理指标”.
- [ ] Run manager and page tests and confirm they pass.

### Task 5: Verify the increment

**Files:**
- Modify if necessary: only files listed above

- [ ] Run focused cycle/API/component tests and require zero failures.
- [ ] Run targeted ESLint over cycle page, components, API routes, domain helpers, and types.
- [ ] Run `npm run build` once and require a successful Next.js production build.
- [ ] Run the full suite once; report unrelated existing failures separately without changing unrelated modules.
- [ ] Run `git diff --check` and inspect the touched files for accidental defaults, autosave, or unrelated edits.
