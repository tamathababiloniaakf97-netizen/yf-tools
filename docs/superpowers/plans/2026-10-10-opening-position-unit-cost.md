# Opening Position Unit Cost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户用原币每股成本价录入期初持仓，由系统自动生成 USD 总成本与期初市场价值。

**Architecture:** 在 `portfolio-opening.ts` 增加无副作用的换算函数，统一复用现有固定汇率。弹窗只维护面向用户的每股成本价，保存时转换成现有 API 所需的两个 USD 字段，因此数据库和接口结构保持不变。

**Tech Stack:** Next.js client components、React、Ant Design Form、TypeScript、Vitest、Testing Library

---

### Task 1: 期初持仓金额换算

**Files:**
- Modify: `src/lib/portfolio-opening.ts`
- Modify: `src/lib/portfolio-opening.test.ts`

- [ ] **Step 1: 写失败测试**

为 `calculateOpeningPositionAmounts` 添加 USD、HKD、CNY、缺少当前价格四组测试。断言 HKD 的 `200 × 480 ÷ 7.8` 成为 USD 总成本，期初市值使用 `200 × current_price ÷ 7.8`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/portfolio-opening.test.ts`

Expected: FAIL，提示 `calculateOpeningPositionAmounts` 尚未导出。

- [ ] **Step 3: 实现最小换算函数**

在 `src/lib/portfolio-opening.ts` 中新增：

```ts
export function calculateOpeningPositionAmounts(
  quantity: number,
  unitCost: number,
  currency: Currency,
  currentPrice: number | null,
) {
  if (!(quantity > 0) || !(unitCost > 0)) return null;
  if (currentPrice == null || !(currentPrice > 0)) return null;
  return {
    total_cost_usd: toUSD(quantity * unitCost, currency),
    opening_market_value_usd: toUSD(quantity * currentPrice, currency),
  };
}
```

同时增加从已有 USD 总成本反算原币每股成本的函数，供编辑期初账户时回填：

```ts
export function deriveOpeningUnitCost(totalCostUsd: number, quantity: number, currency: Currency) {
  if (!(quantity > 0)) return 0;
  return totalCostUsd / quantity / getRate(currency);
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/portfolio-opening.test.ts`

Expected: PASS。

### Task 2: 改造期初账户弹窗

**Files:**
- Modify: `src/app/cost/components/PortfolioOpeningModal.tsx`
- Modify: `src/app/cost/components/PortfolioOpeningModal.test.tsx`

- [ ] **Step 1: 写失败的组件测试**

使用带 `currency`、`current_price` 的腾讯标的渲染弹窗，断言页面显示“每股成本价（HKD）”“总成本（USD）”“期初市场价值（USD）”，且不再出现可编辑的“历史总成本（USD）”。再覆盖没有当前价格时显示“请先更新当前价格”。

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/app/cost/components/PortfolioOpeningModal.test.tsx`

Expected: FAIL，旧表单仍显示历史总成本输入框。

- [ ] **Step 3: 改造表单数据与展示**

将表单行数据改为：

```ts
interface OpeningPositionFormValue {
  ticker_id: string;
  quantity: number;
  unit_cost: number;
}
```

选择标的后从 `ticker.currency` 生成标签；使用 `Form.useWatch('positions', form)` 和 Task 1 的函数实时显示 USD 总成本及 USD 期初市值。编辑已有数据时用 `deriveOpeningUnitCost` 回填 `unit_cost`。

保存时把每一行映射回：

```ts
{
  ticker_id,
  quantity,
  total_cost_usd: amounts.total_cost_usd,
  opening_market_value_usd: amounts.opening_market_value_usd,
}
```

若标的没有有效当前价格，阻止保存并提示“请先更新当前价格”。

- [ ] **Step 4: 运行组件与业务测试**

Run: `npx vitest run src/app/cost/components/PortfolioOpeningModal.test.tsx src/lib/portfolio-opening.test.ts`

Expected: PASS。

- [ ] **Step 5: 运行类型检查**

Run: `npx tsc --noEmit`

Expected: exit code 0。

### Task 3: 回归验证

**Files:**
- Verify only

- [ ] **Step 1: 运行成本记录相关测试**

Run: `npx vitest run src/app/cost src/lib/portfolio-opening.test.ts src/lib/cost-engine.test.ts`

Expected: PASS。

- [ ] **Step 2: 检查改动范围**

Run: `git diff -- src/lib/portfolio-opening.ts src/lib/portfolio-opening.test.ts src/app/cost/components/PortfolioOpeningModal.tsx src/app/cost/components/PortfolioOpeningModal.test.tsx`

Expected: 仅包含每股成本录入、自动换算、自动期初市值及相应测试。

