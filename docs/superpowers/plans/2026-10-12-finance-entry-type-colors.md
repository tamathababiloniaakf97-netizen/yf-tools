# Finance Entry Type Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Distinguish debt-related ledger entry types with stable semantic tag colors while preserving the existing signed amount colors.

**Architecture:** Keep the change inside `MonthlyEntryPanel`: extend the existing pure `kindTagColor` mapping with explicit debt-kind overrides, then fall back to the current cash-flow-based colors for all other kinds. Lock the visible behavior with the existing component test suite.

**Tech Stack:** React, TypeScript, Ant Design, Vitest, Testing Library

---

### Task 1: Add semantic colors to debt entry tags

**Files:**
- Modify: `src/app/finance/components/MonthlyEntryPanel.tsx`
- Test: `src/app/finance/components/MonthlyEntryPanel.test.tsx`

- [ ] **Step 1: Write the failing component test**

Add a test that renders one row for each debt kind, switches to `其他大额事项`, and asserts the rendered Ant Design tags have the corresponding semantic color classes:

```tsx
it('uses semantic colors for debt entry types', () => {
  render(<App><MonthlyEntryPanel entries={[
    { id:'interest', entry_date:'2026-09-30', kind:'loan_interest', amount_cny:500, liability_id:'loan-1' },
    { id:'principal', entry_date:'2026-09-30', kind:'loan_principal_payment', amount_cny:3000, liability_id:'loan-1' },
    { id:'card', entry_date:'2026-09-30', kind:'credit_card_payment', amount_cny:2000, liability_id:'card-1' },
    { id:'drawdown', entry_date:'2026-09-30', kind:'loan_drawdown', amount_cny:10000, liability_id:'loan-1' },
  ]} liabilities={[]} loading={false} onRefresh={vi.fn()} /></App>);

  fireEvent.click(screen.getByText('其他大额事项'));
  expect(screen.getByText('贷款利息').closest('.ant-tag')).toHaveClass('ant-tag-orange');
  expect(screen.getByText('偿还本金').closest('.ant-tag')).toHaveClass('ant-tag-blue');
  expect(screen.getByText('偿还信用卡').closest('.ant-tag')).toHaveClass('ant-tag-purple');
  expect(screen.getByText('新增借款').closest('.ant-tag')).toHaveClass('ant-tag-green');
});
```

- [ ] **Step 2: Run the test and verify the intended failure**

Run:

```bash
npx vitest run src/app/finance/components/MonthlyEntryPanel.test.tsx
```

Expected: the new test fails because interest, principal, and credit-card tags still use the generic red outflow color.

- [ ] **Step 3: Implement the explicit debt color mapping**

Replace the current one-line tag color helper with an explicit override followed by the existing fallback:

```tsx
const debtKindColors: Partial<Record<HouseholdEntryKind, string>> = {
  loan_interest: 'orange',
  loan_principal_payment: 'blue',
  credit_card_payment: 'purple',
  loan_drawdown: 'green',
};

const kindTagColor = (kind: HouseholdEntryKind) => debtKindColors[kind]
  ?? (entryFlow(kind) === 'inflow' ? 'green' : entryFlow(kind) === 'outflow' ? 'red' : 'default');
```

Do not change `entryFlow`, `flowClassName`, or amount rendering.

- [ ] **Step 4: Run focused verification**

Run:

```bash
npx vitest run src/app/finance/components/MonthlyEntryPanel.test.tsx
npx eslint src/app/finance/components/MonthlyEntryPanel.tsx src/app/finance/components/MonthlyEntryPanel.test.tsx
git diff --check
```

Expected: all component tests pass, ESLint exits successfully, and `git diff --check` produces no errors.

- [ ] **Step 5: Commit the implementation**

```bash
git add -- src/app/finance/components/MonthlyEntryPanel.tsx src/app/finance/components/MonthlyEntryPanel.test.tsx
git commit -m "feat: distinguish finance debt entry colors"
```
