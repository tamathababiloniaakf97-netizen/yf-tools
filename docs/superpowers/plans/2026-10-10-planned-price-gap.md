# Planned Price Gap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the planned buy price's percentage distance from the fetched previous close in each price-attention row.

**Architecture:** Add a small pure formatter beside the existing attention-card component, then use it after quote retrieval. Keep quote data local to the component and derive the percentage at render time; no API or persistence changes are required.

**Tech Stack:** React 19, TypeScript, Ant Design, Vitest, Testing Library

---

### Task 1: Define the calculation and display behavior

**Files:**
- Modify: `src/app/investment/components/InvestmentAttentionCard.test.tsx`
- Modify: `src/app/investment/components/InvestmentAttentionCard.tsx`

- [ ] **Step 1: Write failing formatter tests**

Import `formatPlannedPriceGap` and assert:

```ts
expect(formatPlannedPriceGap(400, 411.4)).toBe('-2.77%');
expect(formatPlannedPriceGap(420, 400)).toBe('+5.00%');
expect(formatPlannedPriceGap(400, 0)).toBeNull();
expect(formatPlannedPriceGap(null, 411.4)).toBeNull();
```

Update the existing quote test to expect `计划买入价：400` before fetching and `计划价距前收：-6.67%` after fetching a close of 428.6.

- [ ] **Step 2: Run the focused test and confirm it fails for the missing formatter and old label**

Run: `npm test -- src/app/investment/components/InvestmentAttentionCard.test.tsx`

Expected: FAIL because `formatPlannedPriceGap` is not exported and the component still renders `参考价`.

- [ ] **Step 3: Implement the pure formatter**

```ts
export function formatPlannedPriceGap(plannedPrice: number | null | undefined, previousClose: number | null | undefined) {
  if (!Number.isFinite(plannedPrice) || !Number.isFinite(previousClose) || previousClose == null || previousClose <= 0) return null;
  const percentage = (((plannedPrice as number) - previousClose) / previousClose) * 100;
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}
```

- [ ] **Step 4: Store the numeric quote and derive the inline label**

Extend the local quote state with `price?: number`, save `Number(data.price)` on success, change `参考价` to `计划买入价`, and render this after the close text when the formatter returns a value:

```tsx
<Typography.Text type="secondary">计划价距前收：{gap}</Typography.Text>
```

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/app/investment/components/InvestmentAttentionCard.test.tsx`

Expected: all component tests pass.

### Task 2: Verify integration

**Files:**
- Modify: `src/app/investment/components/InvestmentAttentionCard.tsx`
- Test: `src/app/investment/components/InvestmentAttentionCard.test.tsx`

- [ ] **Step 1: Run related investment overview tests**

Run: `npm test -- src/app/investment/components/InvestmentAttentionCard.test.tsx src/app/investment/components/InvestmentMotto.test.tsx src/app/investment/components/MarketCycleSummaryCard.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 2: Run lint and production build**

Run: `npx eslint src/app/investment/components/InvestmentAttentionCard.tsx src/app/investment/components/InvestmentAttentionCard.test.tsx`

Expected: exit code 0.

Run: `npm run build`

Expected: Next.js build exits with code 0.

- [ ] **Step 3: Commit the implementation**

```bash
git add src/app/investment/components/InvestmentAttentionCard.tsx src/app/investment/components/InvestmentAttentionCard.test.tsx
git commit -m "feat: show planned price gap"
```
