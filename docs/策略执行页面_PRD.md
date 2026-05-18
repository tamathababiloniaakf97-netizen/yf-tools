# 策略执行页面 — 完整 PRD

> 版本：v1.0 | 日期：2026-05-18 | 状态：已确认

---

## 1. 页面概述

| 项 | 内容 |
|---|------|
| 页面名称 | 策略执行 |
| 路由 | `/execution` |
| 认证 | `<AuthGuard>` 包裹，需登录 |
| 核心目标 | 导入已保存策略，一眼看清各档位执行状态，撰写执行反思 |
| 设计原则 | 不自动匹配交易记录；手动标记执行，可选填备注；零新表 |

---

## 2. 核心决策

| # | 决策 | 结论 |
|---|------|------|
| 1 | 数据来源 | 从 `/api/strategies` 拉取已保存策略，选 3 个各占一列 |
| 2 | 布局 | 三栏并排，响应式降级 |
| 3 | 标记执行 | 方案 B：打勾 + 可选填实际价格/数量/备注 |
| 4 | 执行数据存储 | 写入 `strategies.edited_playbook`，复用 `PUT /api/strategies/[id]` |
| 5 | 反思存储 | 同上，存入 `edited_playbook.reflection` |
| 6 | 新表 | 不需要 |
| 7 | 新 API | 不需要 |

---

## 3. 数据流

```
GET /api/strategies → 拉取策略列表 → 三列下拉框选择
GET /api/strategies/[id] → 拉取策略完整数据 → 渲染列内容
GET /api/positions → 拉取持仓数据 → 计算标的信息卡（现价/成本/盈亏）
PUT /api/strategies/[id] → 保存执行状态 + 反思 → 写入 edited_playbook
```

---

## 4. 页面布局

三栏并排，顶部三个策略下拉框。每列从上到下：
1. **标的信息卡**（现价/成本/盈亏/参考高价跌幅）— 始终展开
2. **买入计划**（折叠，标题显示执行进度）— 每档可标记执行
3. **卖出计划**（折叠，同上）
4. **期权计划**（折叠，同上）
5. **风控状态**（四合一紧凑展示）— 始终展开
6. **策略反思**（TextArea + 保存按钮）— 始终展开

响应式：≥1440px 三列 / 1024-1439px 两列 / <1024px 单列

---

## 5. 交互设计

### 5.1 标记执行（方案 B）
- 点击 [标记执行] 弹出 Modal
- 所有字段选填：实际成交价、实际数量、执行日期、备注
- 确认后 ☐→☑，显示实际数据
- 已执行档位可再次点击修改或取消执行

### 5.2 策略反思
- 多行 TextArea
- 保存时自动追加时间戳 `[YYYY-MM-DD HH:mm]`
- 调用 `PUT /api/strategies/[id]` 保存

---

## 6. 数据模型

执行状态和反思全部存入 `strategies.edited_playbook` JSONB：

```typescript
// 买入/卖出档位扩展
interface TierExecution {
  status: 'pending' | 'executed';
  actualPrice?: number;
  actualQuantity?: number;
  executedAt?: string;
  note?: string;
}

// edited_playbook 扩展
{
  overview: {...},
  entryPlan: [{ ..., execution: TierExecution }],
  exitPlan: [{ ..., execution: TierExecution }],
  optionsPlan: [{ ..., execution: TierExecution }],
  riskControl: {...},
  reflection: string  // 策略反思
}
```

---

## 7. 文件结构

```
src/app/execution/
├── page.tsx
└── components/
    ├── ColumnSelector.tsx
    ├── SymbolCard.tsx
    ├── ExecutionPlanList.tsx
    ├── ExecutionTierItem.tsx
    ├── MarkExecutionModal.tsx
    ├── OptionsExecutionList.tsx
    ├── OptionsExecutionItem.tsx
    ├── RiskControlCard.tsx
    ├── ReflectionEditor.tsx
    └── ExecutionColumn.tsx
```
