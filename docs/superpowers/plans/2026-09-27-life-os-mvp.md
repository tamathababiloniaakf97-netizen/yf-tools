# Life OS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current investment-strategy shell with a usable Life OS while preserving the existing `/cost` holdings workflow and data.

**Architecture:** Keep Next.js App Router, React, Ant Design, Supabase Auth, and the existing holdings APIs. Introduce one authenticated application shell, server-owned CRUD APIs, and focused domain modules for plans, goals, and investment research. Investment tasks query the same `plans` table instead of duplicating task data.

**Tech Stack:** Next.js 16.2, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL with RLS, Vitest and Testing Library.

---

## File structure

New shell files live in `src/components/shell/`. Shared domain types live in `src/types/life-os.ts`. Each domain keeps page components beside its route and server access in `src/lib/<domain>/`. Route handlers remain under `src/app/api/`. The existing `src/app/cost/` implementation remains intact.

### Task 1: Establish tests and the Life OS navigation contract

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/components/shell/navigation.ts`
- Test: `src/components/shell/navigation.test.ts`

- [ ] **Step 1: Read the installed Next.js guides before implementation**

Read `node_modules/next/dist/docs/01-app/03-building-your-application/01-routing/03-layouts-and-templates.mdx` and the installed testing guide matching Vitest. Do not substitute remembered Next.js APIs.

- [ ] **Step 2: Add the test dependencies and scripts**

Add `vitest`, `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom` as dev dependencies. Add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write the failing navigation test**

```ts
import { describe, expect, it } from 'vitest';
import { lifeOsNavigation } from './navigation';

describe('lifeOsNavigation', () => {
  it('keeps holdings and excludes legacy strategy routes', () => {
    const paths = lifeOsNavigation.flatMap((item) => [item.href, ...(item.children ?? []).map((child) => child.href)]);
    expect(paths).toContain('/cost');
    expect(paths).not.toContain('/strategy');
    expect(paths).not.toContain('/execution');
    expect(paths).not.toContain('/about');
  });
});
```

- [ ] **Step 4: Run the test and verify it fails**

Run: `npm test -- src/components/shell/navigation.test.ts`  
Expected: FAIL because `navigation.ts` does not exist.

- [ ] **Step 5: Implement the navigation contract**

Export typed entries for `/`, `/plans`, expandable investment children `/investment`, `/cost`, `/investment/watchlist`, `/investment/research`, `/investment/tasks`, `/investment/reviews`, `/investment/methodology`, and `/goals`. Include disabled entries for `/life`, `/reviews`, and `/investment/viewpoints` with `phase: 'later'`.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- src/components/shell/navigation.test.ts`  
Expected: PASS.  
Commit: `test: establish life os navigation contract`

### Task 2: Replace the top navbar with the authenticated application shell

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Create: `src/components/shell/AppSidebar.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Delete from render path only: `src/components/Navbar.tsx`
- Test: `src/components/shell/AppSidebar.test.tsx`

- [ ] **Step 1: Write a failing sidebar rendering test**

Render `AppSidebar` at pathname `/investment/research` and assert that “人生工作台”, “投资”, “公司研究”, and “持仓” are visible, while “AI策略构建” is absent.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/components/shell/AppSidebar.test.tsx`  
Expected: FAIL because the shell components do not exist.

- [ ] **Step 3: Implement the shell**

Use Ant Design `Layout.Sider`, `Menu`, and the existing Supabase logout flow. Keep the sidebar collapsible, expand investment on investment routes, and show later-phase items as disabled. Do not delete legacy route files.

- [ ] **Step 4: Update root metadata and content layout**

Set title to `人生工作台` and description to `将目标转化为行动，将行动转化为结果`. Render login without the authenticated shell by making `AppShell` return children directly on `/login`.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/components/shell/AppSidebar.test.tsx && npm run typecheck`  
Expected: PASS.  
Commit: `feat: add life os application shell`

### Task 3: Add the core Life OS schema and RLS

**Files:**
- Create: `supabase/migrations/003_life_os_core.sql`
- Create: `src/types/life-os.ts`
- Test: `src/types/life-os.test.ts`

- [ ] **Step 1: Write type-level fixture tests**

Create fixtures for `Goal`, `Project`, `Plan`, and `Reminder` and assert their allowed statuses with runtime arrays exported from `life-os.ts`.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/types/life-os.test.ts`  
Expected: FAIL because the types are missing.

- [ ] **Step 3: Implement shared types**

Use these exact unions:

```ts
export const planStatuses = ['not_started', 'in_progress', 'completed', 'paused', 'overdue', 'cancelled'] as const;
export const sourceTypes = ['manual', 'codex', 'automation', 'system'] as const;
export const reviewStatuses = ['pending', 'approved', 'rejected'] as const;
export type PlanStatus = typeof planStatuses[number];
export type SourceType = typeof sourceTypes[number];
export type ReviewStatus = typeof reviewStatuses[number];
```

- [ ] **Step 4: Create the migration**

Create `goals`, `projects`, `plans`, and `reminders`, each with `id`, `user_id`, timestamps, `source_type`, nullable `source_ref`, and `review_status`. Plans include `title`, `plan_type`, `domain`, nullable `project_id`, start/due dates, status, notes, `is_weekly_focus`, and `completed_at`. Add a partial unique index that allows at most three active weekly-focus plans per user through a database trigger that raises `weekly focus limit exceeded`. Enable RLS and add select/insert/update/delete policies using `auth.uid() = user_id`.

- [ ] **Step 5: Run schema and type checks**

Run the migration in a local or linked Supabase environment, then run `npm test -- src/types/life-os.test.ts && npm run typecheck`.  
Expected: migration succeeds and tests pass.

- [ ] **Step 6: Commit**

Commit: `feat: add life os core schema`

### Task 4: Implement authenticated plan APIs

**Files:**
- Create: `src/lib/plans/validation.ts`
- Create: `src/lib/plans/repository.ts`
- Create: `src/app/api/plans/route.ts`
- Create: `src/app/api/plans/[id]/route.ts`
- Test: `src/lib/plans/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Cover a valid manual plan, missing title, invalid status, end date before start date, and an automation record without `source_ref`.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/lib/plans/validation.test.ts`  
Expected: FAIL because validation is missing.

- [ ] **Step 3: Implement validation and repository**

Validation returns `{ ok: true, value } | { ok: false, errors: string[] }`. Repository methods receive an authenticated Supabase server client and never accept a caller-supplied `user_id`.

- [ ] **Step 4: Implement routes**

`GET /api/plans` supports `domain`, `status`, and `weekly_focus`. `POST` creates records. `PATCH /api/plans/[id]` updates allowed fields and stamps `completed_at` when completed. `DELETE` removes only the signed-in user's record. Return 401, 400, 404, and 200/201 consistently.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/lib/plans/validation.test.ts && npm run typecheck`  
Expected: PASS.  
Commit: `feat: add authenticated plan api`

### Task 5: Build Plan Management and the weekly-focus workflow

**Files:**
- Create: `src/app/plans/page.tsx`
- Create: `src/app/plans/components/PlanList.tsx`
- Create: `src/app/plans/components/PlanEditor.tsx`
- Create: `src/app/plans/components/WeeklyFocus.tsx`
- Test: `src/app/plans/components/WeeklyFocus.test.tsx`

- [ ] **Step 1: Write a failing weekly-focus test**

Render three selected plans and assert that the add action is disabled with the text “本周重点最多 3 项”. Assert that completing a focus plan remains available.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/app/plans/components/WeeklyFocus.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement the page**

Provide weekly focus, domain/status filters, plan list, create/edit drawer, and status changes. Default to list view; do not implement drag-and-drop. Use exact statuses from `life-os.ts`.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/app/plans/components/WeeklyFocus.test.tsx && npm run typecheck`  
Expected: PASS.  
Commit: `feat: add plan management`

### Task 6: Build the action-oriented dashboard

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/lib/dashboard/build-dashboard.ts`
- Create: `src/app/components/Dashboard.tsx`
- Test: `src/lib/dashboard/build-dashboard.test.ts`

- [ ] **Step 1: Write failing aggregation tests**

Given plans and projects, assert that the builder returns at most three weekly-focus items, overdue items in `needsAttention`, active projects, and plans completed during the current week.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/lib/dashboard/build-dashboard.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement aggregation and UI**

The dashboard contains only “本周重点”, “等待处理”, “正在推进的项目”, and “本周完成”. Do not add daily planning, streaks, scores, or decorative metrics.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/lib/dashboard/build-dashboard.test.ts && npm run typecheck`  
Expected: PASS.  
Commit: `feat: add weekly life os dashboard`

### Task 7: Preserve and embed the existing holdings page

**Files:**
- Modify: `src/app/cost/page.tsx`
- Test: `src/app/cost/page.test.tsx`

- [ ] **Step 1: Add a holdings regression test**

Mock existing position and transaction APIs and assert the page still exposes “添加标的”, “录入交易”, “持仓明细”, “净值走势”, and “交易流水”.

- [ ] **Step 2: Verify the baseline**

Run: `npm test -- src/app/cost/page.test.tsx`  
Expected: PASS after mocks are correct; no product behavior changes are required.

- [ ] **Step 3: Make only shell-safe layout changes**

Remove assumptions about the former top navbar width if needed. Do not alter `calculateAccountSummary`, `calculateAllMetrics`, transactions, prices, or chart calculations.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/app/cost/page.test.tsx && npm run typecheck`  
Expected: PASS.  
Commit: `test: protect existing holdings workflow`

### Task 8: Add annual goals and projects

**Files:**
- Create: `src/app/goals/page.tsx`
- Create: `src/app/goals/components/GoalCard.tsx`
- Create: `src/app/goals/components/GoalEditor.tsx`
- Create: `src/app/api/goals/route.ts`
- Create: `src/app/api/projects/route.ts`
- Test: `src/app/goals/components/GoalCard.test.tsx`

- [ ] **Step 1: Write the failing hierarchy test**

Assert that a goal card renders its quarterly project, linked plan count, next action, and progress derived from linked plan completion.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/app/goals/components/GoalCard.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement APIs and UI**

Support create/edit/pause for goals and projects. Derive progress from linked plans; do not add manual scoring. Surface stalled projects when no linked plan has changed for 30 days.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/app/goals/components/GoalCard.test.tsx && npm run typecheck`  
Expected: PASS.  
Commit: `feat: add annual goals and projects`

### Task 9: Add the minimum investment research schema and pages

**Files:**
- Create: `supabase/migrations/004_investment_research.sql`
- Create: `src/app/investment/page.tsx`
- Create: `src/app/investment/watchlist/page.tsx`
- Create: `src/app/investment/research/page.tsx`
- Create: `src/app/investment/tasks/page.tsx`
- Create: `src/app/investment/reviews/page.tsx`
- Create: `src/app/investment/methodology/page.tsx`
- Create: `src/app/api/investment/watchlist/route.ts`
- Create: `src/app/api/investment/research/route.ts`
- Test: `src/lib/investment/research.test.ts`

- [ ] **Step 1: Write failing domain tests**

Assert that evidence must link to an asset, challenge/support/mix is explicit, automation evidence defaults to `pending`, and investment task queries filter the shared plan list with `domain=investment`.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/lib/investment/research.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Add the schema**

Create `watchlist_items`, `research_profiles`, `research_hypotheses`, `evidence_records`, `investment_decisions`, `investment_reviews`, and `methodology_items`. Reuse `tickers.id` as the nullable asset relation initially; allow a text asset name for unlisted companies. Add user-scoped RLS to every table and source/review audit fields to externally writable records.

- [ ] **Step 4: Implement the minimum pages**

Investment overview reads existing `/api/positions` and new investment records. Watchlist supports reasons, conditions, status, and next-check date. Company research supports overview, hypotheses, evidence, decisions/reviews, and links. Investment tasks reuse `/api/plans?domain=investment`. Reviews and methodology provide basic CRUD without scoring or AI advice.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/lib/investment/research.test.ts && npm run typecheck`  
Expected: PASS.  
Commit: `feat: add minimum investment research loop`

### Task 10: Add reliable in-app reminders

**Files:**
- Create: `src/lib/reminders/due-reminders.ts`
- Create: `src/app/api/reminders/due/route.ts`
- Create: `src/components/reminders/ReminderCenter.tsx`
- Test: `src/lib/reminders/due-reminders.test.ts`

- [ ] **Step 1: Write failing reminder tests**

Cover due today, recurring weekly, unfinished overdue, paused plans, completed plans, and timezone boundaries using `Asia/Shanghai`.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/lib/reminders/due-reminders.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement in-app reminders**

Return actionable reminders without duplicating the same plan/reminder/date tuple. Display them in the shell and dashboard. Do not claim email, WeChat, or mobile push support in this task.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/lib/reminders/due-reminders.test.ts && npm run typecheck`  
Expected: PASS.  
Commit: `feat: add reliable in-app reminders`

### Task 11: Hide legacy routes and add future-module boundaries

**Files:**
- Create: `src/app/life/page.tsx`
- Create: `src/app/reviews/page.tsx`
- Create: `src/app/investment/viewpoints/page.tsx`
- Modify: `src/components/shell/navigation.ts`
- Test: `src/components/shell/navigation.test.ts`

- [ ] **Step 1: Extend navigation tests**

Assert future pages are disabled in navigation and legacy routes remain absent.

- [ ] **Step 2: Implement boundary pages**

Each page states its purpose and “后续阶段”; it must not expose fake forms or store data. Keep legacy `/strategy`, `/execution`, and `/about` source files untouched but unreachable from normal navigation.

- [ ] **Step 3: Verify and commit**

Run: `npm test -- src/components/shell/navigation.test.ts && npm run typecheck`  
Expected: PASS.  
Commit: `feat: mark future modules and retire legacy navigation`

### Task 12: Full verification and migration checklist

**Files:**
- Create: `docs/life-os-mvp-release-checklist.md`
- Modify only if failures require it: files from Tasks 1–11

- [ ] **Step 1: Run automated verification**

Run: `npm test && npm run typecheck && npm run lint && npm run build`  
Expected: all commands exit 0. Existing lint debt must either be fixed or explicitly separated before claiming completion.

- [ ] **Step 2: Run manual acceptance**

Verify login, new shell, weekly focus limit, plan CRUD, reminders, goal hierarchy, investment overview, watchlist, research, investment task filtering, review CRUD, and methodology CRUD. Verify the existing holdings page can add a ticker, record/edit a transaction, refresh prices, display positions, and render the NAV chart with unchanged results.

- [ ] **Step 3: Verify security and audit behavior**

Confirm one user cannot read or mutate another user's new records. Confirm browser bundles contain no Supabase secret key. Confirm automation/Codex writes default to pending when configured and retain source references.

- [ ] **Step 4: Record migration results and commit**

Document migration IDs, environment, row counts before/after, known calculation caveats, and rollback steps in the release checklist.  
Commit: `docs: add life os mvp release checklist`

## Self-review findings

This plan covers the first-stage product requirements while preserving the existing holdings workflow. Life improvement, global review, and viewpoint ingestion remain explicit future boundaries. External email/WeChat/mobile reminders and automated collection are intentionally excluded until the in-app reminder and manual evidence workflows are proven. Before investment overview is treated as reliable, the current negative cash and position-weight calculation must be audited as a separate diagnostic task rather than silently changed during UI work.
