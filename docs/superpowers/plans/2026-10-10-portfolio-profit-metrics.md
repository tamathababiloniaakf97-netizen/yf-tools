# Portfolio Profit Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show both cost-based unrealized holding profit and opening-date account profit with durable explanations.

**Architecture:** Aggregate cost-based profit from the existing calculated positions in `calculateAccountSummary`, expose it through `AccountSummary`, then render a separate summary card. Keep opening-date profit logic unchanged and clarify both definitions in the UI.

**Tech Stack:** TypeScript, React, Ant Design, Vitest, Testing Library

---

### Task 1: Calculate holding unrealized profit

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/cost-engine.ts`
- Test: `src/lib/cost-engine.test.ts`

- [ ] Add a failing assertion that `holdingUnrealizedPnl` equals the sum of calculated position P&L.
- [ ] Run `npx vitest run src/lib/cost-engine.test.ts` and confirm the new assertion fails because the field is absent.
- [ ] Add `holdingUnrealizedPnl` to `AccountSummary` and calculate it with `positions.reduce((sum, position) => sum + position.pnl, 0)`.
- [ ] Re-run the cost-engine test and confirm it passes.

### Task 2: Clarify the summary cards

**Files:**
- Modify: `src/app/cost/components/AccountSummaryCards.tsx`
- Test: `src/app/cost/components/AccountSummaryCards.test.tsx`

- [ ] Add failing component expectations for “持仓浮盈亏”, “期初后盈亏”, and their formulas.
- [ ] Run `npx vitest run src/app/cost/components/AccountSummaryCards.test.tsx` and confirm the expectations fail.
- [ ] Add the cost-based card, rename the opening-based card, and show persistent short descriptions beneath both values.
- [ ] Re-run both focused test files and ESLint for the modified production files.
- [ ] Commit the tested implementation.

