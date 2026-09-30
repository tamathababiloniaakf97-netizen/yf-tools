# Household Finance Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add concise, example-driven filling instructions and context-sensitive accounting hints to the household-finance workspace.

**Architecture:** Keep all guidance copy in a focused client component rendered as an Ant Design Drawer. Open it from the finance page header, and expose a pure hint lookup used by the monthly-entry form so accounting rules stay testable and consistent.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest and Testing Library.

---

### Task 1: Guidance drawer

**Files:**
- Create: `src/app/finance/components/FinanceGuideDrawer.tsx`
- Create: `src/app/finance/components/FinanceGuideDrawer.test.tsx`
- Modify: `src/app/finance/page.tsx`

- [ ] Write a failing component test that opens the guide and verifies the quick-start sequence, the mortgage `¥8,000` example, the credit-card no-double-count rule, the `¥50,000` investment-transfer example, and month-end steps.
- [ ] Run `npx vitest run src/app/finance/components/FinanceGuideDrawer.test.tsx --maxWorkers=1` and confirm it fails because the component does not exist.
- [ ] Implement the right-side drawer with short sections and concrete examples, then add a `填写说明` button beside `月度结账` in the finance header.
- [ ] Re-run the test and confirm it passes.

### Task 2: Context-sensitive form hints

**Files:**
- Create: `src/lib/household-finance/entry-guidance.ts`
- Create: `src/lib/household-finance/entry-guidance.test.ts`
- Modify: `src/app/finance/components/MonthlyEntryPanel.tsx`

- [ ] Write failing tests for mortgage, credit-loan, credit-card, investment-transfer, business-income, and household-income hints.
- [ ] Run the focused test and confirm the missing helper fails.
- [ ] Implement `entryGuidance(kind)` and render its result as a compact info alert beneath the active entry form.
- [ ] Re-run the focused tests and component tests.

### Task 3: Verification and commit

**Files:**
- Verify only the files from Tasks 1–2 and this plan.

- [ ] Run `npx vitest run src/lib/household-finance src/app/finance --maxWorkers=1`.
- [ ] Run `npx tsc --noEmit` and ESLint on changed files.
- [ ] Run `npm test -- --maxWorkers=1` and `npm run build`.
- [ ] Stage exact feature files and commit `feat: add household finance filling guide`; do not merge into `main` without explicit authorization.
