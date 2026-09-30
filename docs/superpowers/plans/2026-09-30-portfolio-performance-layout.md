# Portfolio Performance Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the existing historical-performance card below the account summary and above holdings.

**Architecture:** This is a render-order-only change in the cost page. Reuse the existing card without changing its props, content, styling, data flow, or surrounding components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6.

---

### Task 1: Reorder the historical-performance card

**Files:**
- Modify: `src/app/cost/page.tsx`

- [ ] **Step 1: Move the existing JSX block**

Move this unchanged block:

```tsx
<Card title="历史绩效" size="small" style={{ marginBottom: 16 }}>
  <Alert type="info" showIcon message="历史净值暂未启用" description="目前只有当前价格，用它回填历史会产生错误的 TWR、年化收益率和最大回撤。待补齐每日历史价格后，再恢复净值曲线与标普500对比。" />
</Card>
```

Place it immediately after `AccountSummaryCards` and before the `持仓明细` card.

- [ ] **Step 2: Verify types and production compilation**

Run: `npx tsc --noEmit`

Expected: exit code 0 with no diagnostics.

Run: `npm run build`

Expected: the Next.js production build completes successfully.

- [ ] **Step 3: Inspect and commit the exact change**

Run `git diff --check` and inspect `git diff -- src/app/cost/page.tsx` to confirm the block content is unchanged and only its position moved. Stage the page and this plan, then commit with `fix: move portfolio performance above holdings`.
