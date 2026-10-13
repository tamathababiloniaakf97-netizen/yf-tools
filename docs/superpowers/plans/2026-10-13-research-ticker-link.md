# 公司研究关联已有标的 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将新建公司研究从手动输入名称改为选择已有标的，并提交稳定的 `ticker_id` 与准确名称。

**Architecture:** 继续复用 `/api/tickers` 与现有研究 POST 接口，不增加数据库迁移。研究页并行加载研究、行业和标的；新建弹窗只展示尚未通过 `ticker_id` 建立研究的标的，提交时由本地标的记录派生 `asset_name`，避免用户输入产生名称漂移。

**Tech Stack:** Next.js 16 App Router、React、Ant Design、TypeScript、Vitest、Testing Library。

---

### Task 1: 用页面测试定义标的选择行为

**Files:**
- Modify: `src/app/investment/research/page.test.tsx`

- [ ] **Step 1: 写选择已有标的并提交准确关联的失败测试**

在测试中按 URL mock `/api/investment/research`、`/api/investment/industries` 和 `/api/tickers`；打开“新建研究”，选择 `Circle · CRCL`，点击创建，并断言 POST body 等于：

```ts
expect(JSON.parse(String(request?.[1]?.body))).toEqual({
  ticker_id: 'ticker-crcl',
  asset_name: 'Circle',
});
```

- [ ] **Step 2: 写过滤已关联标的和空列表提示的失败测试**

让研究列表返回 `{ ticker_id: 'ticker-meta', asset_name: 'Meta' }`，标的列表返回 Meta 与 Circle；断言弹窗中只有 `Circle · CRCL`。另一个测试让标的列表为空，断言出现“没有可用标的，请先到持仓添加标的”。

- [ ] **Step 3: 运行测试并确认按预期失败**

Run: `npx vitest run src/app/investment/research/page.test.tsx`

Expected: FAIL，因为当前弹窗仍是手动 `Input`，不会加载、过滤或提交 `ticker_id`。

### Task 2: 实现已有标的选择与创建

**Files:**
- Modify: `src/app/investment/research/page.tsx`
- Test: `src/app/investment/research/page.test.tsx`

- [ ] **Step 1: 加载标的并维护错误状态**

引入 `Ticker` 类型和 Ant Design `Select`。把 `load` 中的请求扩展为同时读取 `/api/tickers`，成功时保存标的列表；失败时保留研究浏览能力，并记录新建功能不可用的原因。

- [ ] **Step 2: 生成未建立研究的候选项**

根据研究档案中非空 `ticker_id` 建立集合，只保留未被关联的标的，并生成：

```ts
{
  value: ticker.id,
  label: `${ticker.name} · ${ticker.code}`,
}
```

- [ ] **Step 3: 将弹窗输入改为必选下拉框**

表单字段改为 `ticker_id`。`Select` 启用 `showSearch` 和 `optionFilterProp="label"`；无候选时显示“没有可用标的，请先到持仓添加标的”，未选择时由表单规则阻止创建。

- [ ] **Step 4: 从选中标的派生创建请求**

提交时查找选中的标的；找不到则提示“所选标的不存在，请刷新后重试”。找到后仅提交：

```ts
{
  ticker_id: ticker.id,
  asset_name: ticker.name,
}
```

成功后关闭弹窗、清空表单、重新加载，并选择新建研究。

- [ ] **Step 5: 运行页面测试并确认通过**

Run: `npx vitest run src/app/investment/research/page.test.tsx`

Expected: PASS。

- [ ] **Step 6: 提交功能代码**

```bash
git add src/app/investment/research/page.tsx src/app/investment/research/page.test.tsx
git commit -m "feat: link company research to tickers"
```

### Task 3: 全量验证

**Files:**
- Verify only

- [ ] **Step 1: 运行完整测试**

Run: `npm test`

Expected: 所有测试通过。

- [ ] **Step 2: 运行类型检查和 lint**

Run: `npm run typecheck`

Expected: exit 0。

Run: `npm run lint`

Expected: 0 errors；允许保留仓库现有 warnings。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: Next.js 生产构建成功。

- [ ] **Step 4: 检查差异完整性**

Run: `git diff --check`

Expected: 无空白错误；既有未跟踪临时目录不纳入提交。
