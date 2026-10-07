# 认知提升模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可记录认知错误、沉淀认知方法并推动复盘的独立认知提升模块。

**Architecture:** 使用三张带 RLS 的 Supabase 表保存可管理分类、认知日志与认知方法论；Next.js Route Handlers 提供用户隔离的 CRUD，客户端页面复用现有主从阅读组件。纯函数负责输入归一化、筛选和概览聚合，避免把业务判断散落在页面中。

**Tech Stack:** Next.js App Router、React、TypeScript、Ant Design、SWR、Supabase、Vitest、Testing Library。

---

### Task 1: 领域模型、验证与概览聚合

**Files:**
- Modify: `src/types/life-os.ts`
- Create: `src/lib/cognition/records.ts`
- Test: `src/lib/cognition/records.test.ts`

- [ ] 先写失败测试，覆盖日志与方法论必填项、标签去重截断、可选反思字段清洗、近 30 天重复错误计数和待处理项筛选。
- [ ] 运行 `npm test -- src/lib/cognition/records.test.ts`，确认因模块不存在而失败。
- [ ] 增加认知分类、日志、方法论类型和最小归一化、聚合实现。
- [ ] 重跑测试并确认通过。

### Task 2: 数据迁移与用户隔离接口

**Files:**
- Create: `supabase/migrations/028_cognition_improvement.sql`
- Create: `src/app/api/cognition/categories/route.ts`
- Create: `src/app/api/cognition/journals/route.ts`
- Create: `src/app/api/cognition/journals/[id]/route.ts`
- Create: `src/app/api/cognition/methods/route.ts`
- Create: `src/app/api/cognition/methods/[id]/route.ts`
- Test: `src/lib/cognition/migration.test.ts`

- [ ] 先写失败迁移测试，要求三张表、RLS、用户策略、分类唯一约束和日志到方法论关联字段。
- [ ] 运行迁移测试并确认失败。
- [ ] 编写迁移和按用户 ID 限定的 GET、POST、PATCH、DELETE Route Handlers。
- [ ] 重跑迁移与领域测试并确认通过。

### Task 3: 主导航与概览页

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/AppSidebar.tsx`
- Modify: `src/components/shell/navigation.test.ts`
- Modify: `src/components/shell/AppSidebar.test.tsx`
- Create: `src/app/cognition/page.tsx`
- Create: `src/app/cognition/page.test.tsx`

- [ ] 先写失败测试，要求“认知提升”含概览、日志、方法论三个入口，并验证概览的待处理区与真实空状态。
- [ ] 运行相关测试并确认失败原因是入口和页面尚不存在。
- [ ] 增加导航图标、自动展开规则和复盘工作台页面。
- [ ] 重跑测试并确认通过。

### Task 4: 认知日志页面

**Files:**
- Create: `src/app/cognition/journals/page.tsx`
- Create: `src/app/cognition/journals/page.test.tsx`
- Modify: `src/app/globals.css`

- [ ] 先写失败测试，覆盖主从阅读、搜索、可选反思区和“沉淀为方法论”预填交互。
- [ ] 运行页面测试并确认失败。
- [ ] 复用 `ResizableSplitPane` 实现日志列表、详情与统一新增/编辑表单。
- [ ] 重跑页面测试并确认通过。

### Task 5: 认知方法论与分类管理页面

**Files:**
- Create: `src/app/cognition/methods/page.tsx`
- Create: `src/app/cognition/methods/page.test.tsx`
- Create: `src/app/cognition/components/CategoryManager.tsx`
- Modify: `src/app/globals.css`

- [ ] 先写失败测试，覆盖分类筛选、方法详情、可选边界字段、状态和分类的新增、改名、停用。
- [ ] 运行页面测试并确认失败。
- [ ] 实现方法论主从页面和分类管理弹窗。
- [ ] 重跑页面测试并确认通过。

### Task 6: 全量验证

**Files:**
- Modify: `docs/life-os-mvp-release-checklist.md`

- [ ] 更新发布清单，写明迁移 028 和第一版明确不包含的自动化能力。
- [ ] 运行 `npm test`，预期所有测试通过。
- [ ] 运行 `npm run lint`，预期无错误。
- [ ] 运行 `npx tsc --noEmit`，预期退出码为 0。
- [ ] 运行 `npm run build`，预期生产构建成功。
