# Lightweight Client Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让家庭财务页重复进入时立即显示会话缓存，并通过并行取数和侧栏预取减少等待。

**Architecture:** 使用 SWR 的全局会话内存缓存承载 GET 请求，现有 API 和 Supabase 继续作为唯一数据源。财务页将家庭财务与持仓拆成两个独立缓存键并行订阅，写入后定向重新校准；侧栏只增加路由预取，不改变导航结构。

**Tech Stack:** Next.js 16 App Router、React 19、SWR、Vitest、Testing Library

---

### Task 1: 公共数据缓存配置

**Files:**
- Modify: `package.json`
- Create: `src/lib/api/fetch-json.ts`
- Test: `src/lib/api/fetch-json.test.ts`
- Modify: `src/components/AntdProvider.tsx`

- [ ] 先写测试，要求请求器返回 JSON，且非成功响应抛出 API 错误信息。
- [ ] 运行 `npm test -- src/lib/api/fetch-json.test.ts`，确认因请求器不存在而失败。
- [ ] 安装 SWR，实现 `fetchJson`，并在公共 Provider 中配置请求器、去重时间和焦点行为。
- [ ] 再次运行该测试并确认通过。

### Task 2: 侧栏路由预取

**Files:**
- Modify: `src/components/shell/AppSidebar.tsx`
- Modify: `src/components/shell/AppShell.tsx`
- Test: `src/components/shell/AppSidebar.test.tsx`

- [ ] 先写测试，要求鼠标进入可导航菜单项时调用对应路径的预取回调。
- [ ] 运行侧栏测试，确认新行为测试失败。
- [ ] 给侧栏增加 `onPrefetch` 回调，并由 AppShell 接到 `router.prefetch`。
- [ ] 再次运行侧栏测试并确认通过。

### Task 3: 家庭财务页缓存迁移

**Files:**
- Create: `src/app/finance/finance-data.ts`
- Test: `src/app/finance/finance-data.test.ts`
- Modify: `src/app/finance/page.tsx`

- [ ] 先写测试，固定家庭财务缓存键及持仓摘要转换结果。
- [ ] 运行测试，确认因辅助模块不存在而失败。
- [ ] 实现缓存键和持仓摘要转换，财务页使用两个 SWR 请求并行读取。
- [ ] 保留首次无数据的加载状态；后台校准时继续显示缓存内容；现有写操作完成后调用 `mutate`。
- [ ] 运行财务相关测试并确认通过。

### Task 4: 完整验证

**Files:**
- Modify only if verification exposes a scoped defect.

- [ ] 运行 `npm test`，确认全部测试通过。
- [ ] 运行 `npm run typecheck`，确认没有类型错误。
- [ ] 运行 `npm run build`，确认生产构建成功。
- [ ] 启动本地站点，检查 `/finance` 首次进入、切换页面后返回、写入后重新校准。
