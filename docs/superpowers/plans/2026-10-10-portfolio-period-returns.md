# Portfolio Period Returns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add honest, selectable period returns to the existing automatically accumulated portfolio NAV history.

**Architecture:** Keep persistence and `/api/nav` unchanged. Add a focused client-side period utility that slices and rebases stored NAV rows, then let `PortfolioHistoryPanel` own the selected period and pass period-specific data and metrics to `NavChart`.

**Tech Stack:** Next.js client components, React, TypeScript, Ant Design, Vitest, Testing Library.

---

### Task 1: Period calculation utility

**Files:**
- Create: `src/app/cost/components/portfolio-period.ts`
- Create: `src/app/cost/components/portfolio-period.test.ts`

- [ ] Write failing tests for fixed month windows, YTD, inception, insufficient history, and NAV rebasing.
- [ ] Run `npx vitest run src/app/cost/components/portfolio-period.test.ts` and confirm the missing module/function failure.
- [ ] Implement typed period definitions, date boundary selection, actual-start metadata, and rebasing.
- [ ] Re-run the utility tests and confirm they pass.

### Task 2: Period selector and metrics

**Files:**
- Modify: `src/app/cost/components/PortfolioHistoryPanel.tsx`
- Modify: `src/app/cost/components/PortfolioHistoryPanel.test.tsx`
- Modify: `src/app/cost/components/NavChart.tsx`

- [ ] Add failing component tests for the default inception view, selecting 1 month, an honest shortened-history notice, and excess return.
- [ ] Run `npx vitest run src/app/cost/components/PortfolioHistoryPanel.test.tsx` and confirm the new assertions fail.
- [ ] Add the Ant Design segmented period selector and calculate period-specific user/benchmark series and metrics.
- [ ] Add actual-period context and excess return to the chart card without changing stored history.
- [ ] Re-run both component and utility tests and confirm they pass.

### Task 3: Regression verification

**Files:**
- No production files expected.

- [ ] Run the cost-page and portfolio-history related Vitest suite.
- [ ] Run ESLint on the modified source and test files.
- [ ] Inspect `git diff --check` and `git status --short`, preserving unrelated untracked files.
- [ ] Commit the focused feature changes.
