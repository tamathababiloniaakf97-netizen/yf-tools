# 市场周期观察与拐点提醒 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在投资概览提供四类大周期的思考提醒，并提供手工复核、指标维护和历史快照页面。

**Architecture:** 两张 Supabase 用户级表分别保存当前周期档案与不可变复核快照。领域纯函数负责初始化模板、清洗输入和计算提醒，Route Handlers 负责用户隔离读写，投资概览只消费摘要组件，完整编辑集中在 `/investment/cycles`。

**Tech Stack:** Next.js App Router、React、TypeScript、Ant Design、SWR、Supabase、Vitest、Testing Library。

---

### Task 1: 周期领域模型与提醒规则

**Files:** `src/types/life-os.ts`、`src/lib/investment/cycles.ts`、`src/lib/investment/cycles.test.ts`

- [ ] 写失败测试覆盖四个模板、输入清洗、到期、观察区和数据过期提醒。
- [ ] 运行测试并确认因模块不存在而失败。
- [ ] 实现最小类型与纯函数。
- [ ] 重跑测试并确认通过。

### Task 2: 数据迁移与接口

**Files:** `supabase/migrations/030_market_cycle_observer.sql`、`src/app/api/investment/cycles/route.ts`、`src/app/api/investment/cycles/[id]/reviews/route.ts`、`src/lib/investment/cycles-migration.test.ts`

- [ ] 写失败迁移测试，要求两张表、RLS、authenticated 权限和用户策略。
- [ ] 实现迁移、首次读取初始化和保存复核接口。
- [ ] 验证迁移与领域测试通过。

### Task 3: 投资概览摘要

**Files:** `src/app/investment/components/MarketCycleSummaryCard.tsx`、对应测试、`src/app/investment/page.tsx`

- [ ] 写失败组件测试，覆盖四行摘要、空状态和待思考状态。
- [ ] 实现摘要组件并接入投资概览。
- [ ] 验证组件和投资概览测试。

### Task 4: 周期复核工作台

**Files:** `src/app/investment/cycles/page.tsx`、对应测试、`src/app/globals.css`

- [ ] 写失败页面测试，覆盖周期切换、当前判断、待思考、指标和历史区域。
- [ ] 实现统一复核弹窗和动态指标编辑。
- [ ] 验证页面测试和响应式布局。

### Task 5: 完整验证

- [ ] 运行周期模块与投资概览相关测试。
- [ ] 运行生产构建。
- [ ] 在本地浏览器检查投资概览摘要和周期工作台。
