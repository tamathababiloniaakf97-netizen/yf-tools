# Home Action Aggregation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicate generic plan system and make the home page a read-only aggregation of actions owned by investment, goals, and relationships.

**Architecture:** Replace the Plan-based dashboard builder with a pure `buildDashboardActions` projection over existing domain entities. The client home page loads each domain endpoint independently, renders partial successes, and only links users back to the owning module. Remove the plan route, API, navigation item, types, and plan reminder query without changing historical SQL migrations.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Vitest, Testing Library.

---

### Task 1: Build the read-only action projection

**Files:**
- Replace: `src/lib/dashboard/build-dashboard.test.ts`
- Replace: `src/lib/dashboard/build-dashboard.ts`

- [ ] **Step 1: Write failing projection tests**

Create fixtures for `InvestmentTask`, `Goal`, and `Contact`. Assert that `buildDashboardActions`:

```ts
const actions = buildDashboardActions({ tasks: [task], goals: [goal], contacts: [contact] }, now);
expect(actions.map((item) => item.source)).toEqual(['investment', 'relationship', 'goal']);
expect(actions.find((item) => item.source === 'investment')?.href)
  .toBe('/investment/tasks?task=task-1');
```

Add separate tests proving inactive/unapproved/blank actions are excluded and overdue/today/future/undated ordering is stable.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/dashboard/build-dashboard.test.ts`

Expected: FAIL because `buildDashboardActions` and `DashboardAction` do not exist.

- [ ] **Step 3: Implement the minimal projection**

Replace the Plan dashboard API with:

```ts
export type DashboardActionSource = 'investment' | 'goal' | 'relationship';
export type DashboardActionUrgency = 'overdue' | 'today' | 'upcoming' | 'undated';

export interface DashboardAction {
  id: string;
  source: DashboardActionSource;
  title: string;
  context: string;
  dueDate: string | null;
  href: string;
  urgency: DashboardActionUrgency;
}

export function buildDashboardActions(
  input: { tasks: InvestmentTask[]; goals: Goal[]; contacts: Contact[] },
  now = new Date(),
): DashboardAction[] { /* normalize, filter, sort */ }
```

Use Shanghai calendar dates, trim blank text, and never mutate inputs.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/lib/dashboard/build-dashboard.test.ts`

Expected: all projection tests PASS.

### Task 2: Replace the Plan-based home page

**Files:**
- Create: `src/app/page.test.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write failing home-page tests**

Mock `fetch` responses by URL for `/api/investment/tasks`, `/api/goals`, and `/api/relationships`. Assert that the page shows all three action sources, renders `去处理` links with domain URLs, keeps successful actions when one request fails, and shows `暂无待推进行动` when all lists are empty.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL because the existing page still fetches `/api/plans` and renders Plan summaries.

- [ ] **Step 3: Implement independent loading and the read-only list**

Fetch the three sources with independent result handling. Store domain arrays and source-specific errors. Feed successful arrays to `buildDashboardActions`. Render one Ant Design `List`/`Card` with source label, context, urgency text, and a `Link` or router button to `action.href`. Remove `WeeklyFocus`, Plan status mutations, and the `管理计划` button.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/app/page.test.tsx src/lib/dashboard/build-dashboard.test.ts`

Expected: both suites PASS.

### Task 3: Remove the navigation entry

**Files:**
- Modify: `src/components/shell/navigation.test.ts`
- Modify: `src/components/shell/navigation.ts`

- [ ] **Step 1: Add a failing assertion**

```ts
expect(paths).not.toContain('/plans');
expect(lifeOsNavigation.map((item) => item.label)).not.toContain('计划管理');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/components/shell/navigation.test.ts`

Expected: FAIL because `/plans` is still present.

- [ ] **Step 3: Remove the plans navigation item**

Delete only `{ key: 'plans', label: '计划管理', href: '/plans', icon: 'plans' }`.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/components/shell/navigation.test.ts`

Expected: PASS.

### Task 4: Remove generic plans from reminders

**Files:**
- Create: `src/app/api/reminders/due/route.test.ts`
- Modify: `src/app/api/reminders/due/route.ts`
- Delete: `src/lib/reminders/due-reminders.ts`
- Delete: `src/lib/reminders/due-reminders.test.ts`

- [ ] **Step 1: Write a failing route test**

Mock the server Supabase client and assert the route queries `contacts` and `investment_tasks`, does not query `plans`, and returns the combined relationship and investment reminders.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/app/api/reminders/due/route.test.ts`

Expected: FAIL because the route still calls `supabase.from('plans')`.

- [ ] **Step 3: Remove the plan query and reminder builder**

Keep the two supported data sources in `Promise.all`, preserve authentication and error behavior, and return:

```ts
return NextResponse.json([
  ...buildAllRelationshipReminders((contactsResult.data ?? []) as Contact[]),
  ...buildInvestmentTaskReminders((tasksResult.data ?? []) as InvestmentTask[]),
]);
```

Delete the now-unused Plan reminder module and its tests.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/app/api/reminders/due/route.test.ts src/lib/investment/task-reminders.test.ts src/lib/relationships/reminders.test.ts`

Expected: PASS.

### Task 5: Delete the generic plan surface and types

**Files:**
- Delete: `src/app/plans/page.tsx`
- Delete: `src/app/plans/components/PlanEditor.tsx`
- Delete: `src/app/plans/components/PlanList.tsx`
- Delete: `src/app/plans/components/WeeklyFocus.tsx`
- Delete: `src/app/plans/components/WeeklyFocus.test.tsx`
- Delete: `src/app/api/plans/route.ts`
- Delete: `src/app/api/plans/[id]/route.ts`
- Delete: `src/lib/plans/validation.ts`
- Delete: `src/lib/plans/validation.test.ts`
- Modify: `src/types/life-os.ts`

- [ ] **Step 1: Search for remaining Plan dependencies**

Run: `rg -n "Plan(Input|Status|Domain|Type)?|/api/plans|/plans|buildDueReminders|WeeklyFocus" src`

Expected: only files in the deletion list plus the Plan declarations remain.

- [ ] **Step 2: Delete the plan implementation files**

Use patch deletion so unrelated working-tree content is preserved. Do not edit `supabase/migrations/003_life_os_core.sql`.

- [ ] **Step 3: Remove Plan declarations**

Delete `planStatuses`, `planDomains`, `planTypes`, their type aliases, `Plan`, and `PlanInput` from `src/types/life-os.ts`. Preserve shared `SourceType` and `ReviewStatus` declarations used by domain entities.

- [ ] **Step 4: Verify no runtime references remain**

Run: `rg -n "Plan(Input|Status|Domain|Type)?|/api/plans|/plans|buildDueReminders|WeeklyFocus" src`

Expected: no matches except incidental prose in tests, if any.

### Task 6: Verify the complete change

**Files:**
- Modify only if verification exposes an in-scope defect.

- [ ] **Step 1: Run targeted tests**

Run: `npm test -- src/lib/dashboard/build-dashboard.test.ts src/app/page.test.tsx src/components/shell/navigation.test.ts src/app/api/reminders/due/route.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`

Expected: PASS with zero failed tests.

- [ ] **Step 3: Run static verification**

Run: `npm run typecheck`

Expected: exit 0.

Run: `npm run build`

Expected: production build succeeds and generated routes contain `/` but not `/plans` or `/api/plans`.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only intended files from this feature are changed/deleted in addition to pre-existing unrelated user changes.
