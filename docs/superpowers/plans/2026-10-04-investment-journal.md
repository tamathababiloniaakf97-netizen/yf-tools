# Investment Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将投资复盘改造成可搜索、可阅读详情并能关联内部研究记录的轻量投资日志。

**Architecture:** 继续使用 `investment_reviews` 保存旧数据并增量增加日志字段与 JSONB 引用，避免迁移到第二套内容系统。API 返回统一日志结构；客户端一次加载个人规模数据后完成即时搜索和类型筛选。

**Tech Stack:** Next.js 16、React 19、Ant Design、Supabase、Vitest

---

### Task 1: 日志数据模型与兼容规则

**Files:** `supabase/migrations/027_investment_journal.sql`、`src/types/life-os.ts`、`src/lib/investment/journal.ts`、对应测试。

- [ ] 先写失败测试，覆盖三种类型、旧复盘正文合成、标签与引用清洗。
- [ ] 增加迁移和最小实现，使测试通过。

### Task 2: API 与引用选项

**Files:** `src/app/api/investment/reviews/route.ts`、`src/app/api/investment/reviews/[id]/route.ts`、`src/app/api/investment/reference-options/route.ts`。

- [ ] 让日志支持新增、编辑、删除，并返回决策、公司研究、假设、资料和日志的标准化引用选项。
- [ ] 保留用户隔离并校验输入。

### Task 3: 轻博客主从页面

**Files:** `src/app/investment/reviews/page.tsx`、`src/app/globals.css`、`src/components/shell/navigation.ts`、页面测试。

- [ ] 先写失败测试锁定搜索、类型筛选、详情阅读、引用跳转和轻量表单。
- [ ] 实现列表加详情布局，新建编辑共用表单，旧记录正常显示。

### Task 4: 验证

- [ ] 运行投资日志与投资模块测试。
- [ ] 运行相关 ESLint 和生产构建。
