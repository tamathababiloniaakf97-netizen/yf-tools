# 投资方法论阅读版面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将投资方法论改为左侧检索列表、右侧阅读详情，并增加安全的编辑能力。

**Architecture:** 保留现有 `methodology_items` 表与搜索函数，页面本地维护选中记录和统一新增/编辑弹窗；详情更新通过现有动态路由新增 PATCH 完成。样式复用投资日志的视觉语言，但使用独立类名避免两个页面相互影响。

**Tech Stack:** Next.js 16 App Router、React 19、Ant Design、Supabase、Vitest、Testing Library

---

### Task 1: 用页面测试定义主从布局与编辑行为

**Files:**
- Modify: `src/app/investment/methodology/page.test.tsx`

- [ ] **Step 1: 添加会失败的主从布局测试**

在现有测试中断言列表同时显示两条标题，右侧默认显示第一条的完整正文；点击“分批建仓”后，右侧显示对应正文和“待确认”状态。

- [ ] **Step 2: 添加会失败的编辑测试**

点击右侧“编辑”，断言弹窗标题为“编辑投资方法”，标题和规则内容被预填；提交后断言向 `/api/investment/methodology/m1` 发起 PATCH。

- [ ] **Step 3: 运行测试并确认失败原因**

Run: `npm test -- src/app/investment/methodology/page.test.tsx`

Expected: FAIL，因为当前页面没有独立详情区、编辑按钮和 PATCH 请求。

### Task 2: 实现方法论主从阅读页面

**Files:**
- Modify: `src/app/investment/methodology/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: 增加选中和编辑状态**

加入 `selectedId`、`editing` 和 `saving`。选中项只能从 `filteredItems` 中解析：当前选择被筛掉时自动回退到第一条。

- [ ] **Step 2: 将卡片网格替换为左右主从布局**

左侧渲染 `MethodologyFilters` 和可点击列表条目；每条显示分类、标题、正文摘要与待确认状态。右侧显示当前条目的分类、状态、标题、完整正文、编辑和删除按钮。

- [ ] **Step 3: 复用弹窗支持新增与编辑**

新增时清空表单并设置默认分类 `discipline`；编辑时填入当前记录。保存根据 `editing` 决定 POST 或 PATCH，失败时保留弹窗，成功后刷新列表并选中新记录。

- [ ] **Step 4: 添加响应式样式**

添加 `.methodology-shell`、`.methodology-list`、`.methodology-row` 和 `.methodology-reader` 等独立样式。桌面端左栏约 36%、右栏约 64%；小屏改为单列。

- [ ] **Step 5: 运行页面测试**

Run: `npm test -- src/app/investment/methodology/page.test.tsx src/app/investment/methodology/components/MethodologyFilters.test.tsx src/lib/investment/methodology-search.test.ts`

Expected: PASS。

### Task 3: 用接口测试定义 PATCH 权限与校验

**Files:**
- Create: `src/app/api/investment/methodology/[id]/route.test.ts`
- Modify: `src/app/api/investment/methodology/[id]/route.ts`

- [ ] **Step 1: 添加会失败的 PATCH 测试**

模拟已登录用户和 Supabase 链式调用，验证合法输入只更新匹配 `id` 与 `user_id` 的记录；无效标题返回 400；没有匹配记录返回 404。

- [ ] **Step 2: 运行接口测试并确认失败**

Run: `npm test -- src/app/api/investment/methodology/[id]/route.test.ts`

Expected: FAIL，因为动态路由当前只导出 DELETE。

- [ ] **Step 3: 实现 PATCH**

复用 `validateMethodologyInput`，更新校验后的字段和 `updated_at`，通过 `.eq('id', id).eq('user_id', user.id).select().maybeSingle()` 限定记录；分别返回 400、404 或数据库错误。

- [ ] **Step 4: 运行接口和记录校验测试**

Run: `npm test -- src/app/api/investment/methodology/[id]/route.test.ts src/lib/investment/records.test.ts`

Expected: PASS。

### Task 4: 综合验证

**Files:**
- Verify: `src/app/investment/methodology/page.tsx`
- Verify: `src/app/api/investment/methodology/[id]/route.ts`
- Verify: `src/app/globals.css`

- [ ] **Step 1: 运行相关测试**

Run: `npm test -- src/app/investment/methodology/page.test.tsx src/app/investment/methodology/components/MethodologyFilters.test.tsx src/lib/investment/methodology-search.test.ts src/app/api/investment/methodology/[id]/route.test.ts src/lib/investment/records.test.ts`

Expected: 所有测试通过，无未处理异常。

- [ ] **Step 2: 运行代码检查**

Run: `npx eslint src/app/investment/methodology/page.tsx src/app/investment/methodology/page.test.tsx src/app/api/investment/methodology/[id]/route.ts src/app/api/investment/methodology/[id]/route.test.ts`

Expected: 退出码 0。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: Next.js 构建成功，方法论页面与接口均通过类型检查。

