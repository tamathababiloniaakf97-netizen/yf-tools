# Goals and Relationships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the annual-goal placeholder with type-aware, honest progress displays and add a private relationship follow-up module with manual next-contact reminders.

**Architecture:** Extend the existing Supabase schema with goal progress fields plus `contacts` and `contact_interactions`. Keep authenticated Route Handlers server-owned, reuse the current client-page pattern, and merge contact follow-ups into the existing reminder/dashboard read models without converting every contact into a plan.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL with RLS, Vitest and Testing Library.

---

## File structure

- `supabase/migrations/007_goals_relationships.sql`: additive schema, constraints, indexes, trigger, RLS and grants.
- `src/types/life-os.ts`: goal, contact and interaction contracts shared by UI and APIs.
- `src/lib/goals/progress.ts`: pure goal presentation and stagnation rules.
- `src/lib/goals/validation.ts`: type-aware goal input validation.
- `src/app/api/goals/route.ts` and `src/app/api/goals/[id]/route.ts`: authenticated goal CRUD.
- `src/app/goals/page.tsx` and `src/app/goals/components/GoalCard.tsx`: editor and type-aware cards.
- `src/lib/relationships/validation.ts`: contact and interaction validation.
- `src/lib/relationships/reminders.ts`: pure manual next-contact reminder builder.
- `src/app/api/relationships/route.ts`, `src/app/api/relationships/[id]/route.ts`, and `src/app/api/relationships/[id]/interactions/route.ts`: authenticated relationship CRUD.
- `src/app/relationships/page.tsx` and focused components beside it: relationship UI.
- `src/lib/reminders/due-reminders.ts`, `src/app/api/reminders/due/route.ts`, `src/components/reminders/ReminderCenter.tsx`: merged plan/contact reminders.
- `src/lib/dashboard/build-dashboard.ts` and `src/app/page.tsx`: relationship follow-ups in “需要处理”.
- `src/components/shell/navigation.ts`, `src/components/shell/AppSidebar.tsx`, and `src/app/globals.css`: navigation and responsive presentation.

### Task 1: Add the schema and shared contracts

**Files:**
- Create: `supabase/migrations/007_goals_relationships.sql`
- Modify: `supabase/migrations/006_life_os_table_grants.sql`
- Modify: `src/types/life-os.ts`
- Test: `src/types/life-os.test.ts`

- [ ] **Step 1: Extend the failing type fixtures**

Add fixtures that require `Goal.goal_type`, type-specific progress fields, `Contact`, and `ContactInteraction`. Assert the runtime arrays exactly match:

```ts
expect(goalTypes).toEqual(['result', 'project', 'habit', 'direction']);
expect(relationshipTypes).toEqual(['family', 'friend', 'work', 'professional', 'other']);
```

- [ ] **Step 2: Run the type test and verify it fails**

Run: `npm test -- src/types/life-os.test.ts`
Expected: FAIL because the new exports and required properties do not exist.

- [ ] **Step 3: Add the TypeScript contracts**

Add these runtime unions and fields to `src/types/life-os.ts`:

```ts
export const goalTypes = ['result', 'project', 'habit', 'direction'] as const;
export const relationshipTypes = ['family', 'friend', 'work', 'professional', 'other'] as const;
export type GoalType = typeof goalTypes[number];
export type RelationshipType = typeof relationshipTypes[number];

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  year: number;
  description: string;
  goal_type: GoalType;
  completion_criteria: string;
  current_state: string;
  current_milestone: string;
  next_action: string;
  target_value: number | null;
  current_value: number | null;
  value_unit: string;
  habit_target_count: number | null;
  habit_completed_count: number | null;
  habit_period: 'weekly' | 'monthly' | 'quarterly' | null;
  last_progress_at: string | null;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  relationship_type: RelationshipType;
  role: string;
  met_context: string;
  family_context: string;
  work_context: string;
  important_notes: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  next_action: string;
  notes: string;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ContactInteraction {
  id: string;
  user_id: string;
  contact_id: string;
  occurred_at: string;
  summary: string;
  next_action: string;
  next_contact_at: string | null;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  created_at: string;
}
```

Define `GoalInput`, `ContactInput`, and `ContactInteractionInput` from these interfaces without allowing caller-supplied `id` or `user_id`.

- [ ] **Step 4: Add migration 007**

Alter `goals` with the fields above, defaulting existing rows to `direction`. Create `contacts` and `contact_interactions` with foreign keys, audit fields, type checks, automation-source checks, user/date indexes and user-scoped RLS. Use `on delete cascade` for interactions. Add an `after insert` trigger on `contact_interactions` that updates the owning contact's `last_contact_at`, `next_action`, `next_contact_at`, and `updated_at` only when `contact_id` and `user_id` both match.

Grant `select, insert, update, delete` on both tables to `authenticated`. Update migration 006 as a clean-install reference, while migration 007 remains the production upgrade.

- [ ] **Step 5: Verify types and SQL invariants**

Run: `npm test -- src/types/life-os.test.ts && npm run typecheck`
Expected: PASS. Manually inspect migration 007 for `enable row level security`, four policies per table, source checks, and authenticated grants.

- [ ] **Step 6: Commit**

```bash
git add src/types/life-os.ts src/types/life-os.test.ts supabase/migrations/006_life_os_table_grants.sql supabase/migrations/007_goals_relationships.sql
git commit -m "feat: add goal progress and relationship schema"
```

### Task 2: Implement honest goal progress rules

**Files:**
- Create: `src/lib/goals/progress.ts`
- Create: `src/lib/goals/progress.test.ts`
- Modify: `src/lib/goals/validation.ts`
- Modify: `src/lib/goals/validation.test.ts`

- [ ] **Step 1: Write failing progress tests**

Cover these exact behaviors:

```ts
expect(buildGoalProgress(resultGoal, now)).toMatchObject({ kind: 'value', percent: 40 });
expect(buildGoalProgress(projectGoal, now)).toMatchObject({ kind: 'milestone', percent: null });
expect(buildGoalProgress(habitGoal, now)).toMatchObject({ kind: 'habit', completed: 2, target: 3 });
expect(buildGoalProgress(directionGoal, now)).toMatchObject({ kind: 'direction', percent: null });
expect(getStagnation(resultGoal, new Date('2026-10-15T00:00:00+08:00'))).toBe('check');
expect(getStagnation(resultGoal, new Date('2026-10-31T00:00:00+08:00'))).toBe('stalled');
```

Use dates exactly 14 and 30 full days after `last_progress_at`, calculated from timestamps rather than local string comparison.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/lib/goals/progress.test.ts`
Expected: FAIL because `progress.ts` does not exist.

- [ ] **Step 3: Implement the pure presentation rules**

Export a discriminated `GoalProgress` union, `buildGoalProgress(goal)`, and `getStagnation(goal, now)`. Only a result goal with non-null target/current values may produce a percent. Clamp percent to `0..100`. Project and direction goals always return `percent: null`; habits return counts and period, not a percentage bar. Completed, paused and cancelled goals return no stagnation warning.

- [ ] **Step 4: Add type-aware validation tests**

Require common fields `title`, `year`, `goal_type`, `completion_criteria`, and `next_action`. Require target/current/unit for result goals, milestone for project goals, and positive target/non-negative completed count plus period for habits. Confirm automation inputs require `source_ref` and default to `review_status: 'pending'`; manual inputs default to `approved`.

- [ ] **Step 5: Implement validation and run tests**

Run: `npm test -- src/lib/goals/progress.test.ts src/lib/goals/validation.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/goals/progress.ts src/lib/goals/progress.test.ts src/lib/goals/validation.ts src/lib/goals/validation.test.ts
git commit -m "feat: add type-aware goal progress"
```

### Task 3: Complete goal CRUD and goal cards

**Files:**
- Create: `src/app/api/goals/[id]/route.ts`
- Modify: `src/app/api/goals/route.ts`
- Create: `src/app/goals/components/GoalCard.tsx`
- Create: `src/app/goals/components/GoalCard.test.tsx`
- Create: `src/app/goals/components/GoalEditor.tsx`
- Modify: `src/app/goals/page.tsx`

- [ ] **Step 1: Write the failing GoalCard tests**

Render one goal of each type. Assert result goals show current/target values, project goals show the milestone but no progress bar, habits show period counts, directions show current state, and a 30-day active goal shows “已停滞”. Assert every card shows completion criteria and next action.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/app/goals/components/GoalCard.test.tsx`
Expected: FAIL because `GoalCard.tsx` does not exist.

- [ ] **Step 3: Add authenticated update and delete routes**

Use the installed Next.js 16 `RouteContext<'/api/goals/[id]'>` pattern and await `ctx.params`. `PATCH` validates the full goal input, updates only the authenticated user's row, and stamps `last_progress_at` when a progress-bearing field changes. `DELETE` deletes only the authenticated user's row. Return 401, 400, 404 and 200 consistently.

- [ ] **Step 4: Build focused card and editor components**

`GoalCard` receives `{ goal, now, onEdit }` and delegates all display math to `progress.ts`. `GoalEditor` conditionally shows only fields relevant to the selected type and never displays a percent input. The page supports create, edit, pause and cancel; it does not add drag-and-drop or project hierarchy in this task.

- [ ] **Step 5: Verify the goal workflow**

Run: `npm test -- src/app/goals/components/GoalCard.test.tsx src/lib/goals && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/goals src/app/goals src/lib/goals
git commit -m "feat: make annual goals actionable"
```

### Task 4: Add relationship validation and authenticated APIs

**Files:**
- Create: `src/lib/relationships/validation.ts`
- Create: `src/lib/relationships/validation.test.ts`
- Create: `src/app/api/relationships/route.ts`
- Create: `src/app/api/relationships/[id]/route.ts`
- Create: `src/app/api/relationships/[id]/interactions/route.ts`

- [ ] **Step 1: Write failing validation tests**

Cover valid manual contact, blank name, invalid relationship type, next-contact date before last-contact date, automation without `source_ref`, and valid interaction. Confirm text is trimmed and manual/automation review defaults differ.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/lib/relationships/validation.test.ts`
Expected: FAIL because the validation module does not exist.

- [ ] **Step 3: Implement minimal validation**

Export `validateContactInput` and `validateContactInteractionInput` using the same `{ ok, value/errors }` convention as plans and goals. Reject high-risk structured fields by not defining them in the contract; keep family/work context as bounded free text.

- [ ] **Step 4: Implement user-scoped Route Handlers**

`GET /api/relationships` orders due follow-ups first, then recent contacts. `POST` creates a contact. `PATCH` and `DELETE /api/relationships/[id]` mutate only the signed-in user's row. `GET /api/relationships/[id]/interactions` lists that user's interactions; `POST` verifies the parent contact belongs to the user before inserting. Never accept `user_id` from the request body.

- [ ] **Step 5: Verify API-domain behavior**

Run: `npm test -- src/lib/relationships/validation.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/relationships src/app/api/relationships
git commit -m "feat: add authenticated relationship api"
```

### Task 5: Build the relationship page and navigation

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/navigation.test.ts`
- Modify: `src/components/shell/AppSidebar.tsx`
- Create: `src/app/relationships/page.tsx`
- Create: `src/app/relationships/components/ContactEditor.tsx`
- Create: `src/app/relationships/components/ContactList.tsx`
- Create: `src/app/relationships/components/InteractionEditor.tsx`
- Create: `src/app/relationships/components/ContactList.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Extend failing navigation and list tests**

Assert `/relationships` appears as “人际关系” and legacy routes remain absent. Render contacts that are overdue, upcoming and unscheduled; assert the overdue contact appears in “需要跟进”, recent items appear in “最近联系”, and every item remains available in “全部联系人”.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/components/shell/navigation.test.ts src/app/relationships/components/ContactList.test.tsx`
Expected: FAIL because the navigation entry and components do not exist.

- [ ] **Step 3: Implement the page**

Use a single authenticated client page consistent with existing pages. Provide create/edit contact, record interaction, and explicit delete confirmation. The main list shows name, relationship label, concise family/work context, last contact, next contact and next action. Do not add scoring, graph visualization, auto cadence or message sending.

- [ ] **Step 4: Add responsive styling and navigation icon**

Add a `relationships` icon mapping and focused CSS classes. Preserve the existing mobile one-column behavior and avoid changing legacy strategy/cost styles.

- [ ] **Step 5: Verify**

Run: `npm test -- src/components/shell/navigation.test.ts src/app/relationships/components/ContactList.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/shell src/app/relationships src/app/globals.css
git commit -m "feat: add relationship management page"
```

### Task 6: Merge manual relationship follow-ups into reminders and dashboard

**Files:**
- Create: `src/lib/relationships/reminders.ts`
- Create: `src/lib/relationships/reminders.test.ts`
- Modify: `src/lib/reminders/due-reminders.ts`
- Modify: `src/lib/reminders/due-reminders.test.ts`
- Modify: `src/app/api/reminders/due/route.ts`
- Modify: `src/components/reminders/ReminderCenter.tsx`
- Modify: `src/lib/dashboard/build-dashboard.ts`
- Modify: `src/lib/dashboard/build-dashboard.test.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write failing manual-reminder tests**

Given Shanghai time, assert a contact with a past `next_contact_at` becomes `relationship_overdue`, today becomes `relationship_today`, future and null dates are excluded, and pending/rejected automated contacts are excluded until approved. Assert no cadence-based reminder is generated from `last_contact_at` alone.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/lib/relationships/reminders.test.ts`
Expected: FAIL because the reminder builder does not exist.

- [ ] **Step 3: Generalize the reminder read model**

Replace plan-only routing fields with:

```ts
export interface DueReminder {
  id: string;
  subject_type: 'plan' | 'contact';
  subject_id: string;
  title: string;
  kind: 'overdue' | 'due_today' | 'scheduled' | 'recurring' | 'relationship_overdue' | 'relationship_today';
  due_date: string | null;
  href: string;
}
```

Keep existing plan reminder behavior and map contacts to `/relationships`. Sort all overdue items before today's items, then scheduled and recurring items.

- [ ] **Step 4: Query and merge contacts in the due-reminders API**

Fetch plans and approved contacts in parallel after authentication. If either query fails, return 500 with the database error. Merge the two pure builders without writing reminder rows or changing contact state.

- [ ] **Step 5: Add relationship follow-ups to the dashboard**

Extend `DashboardData` with `relationshipAttention`. Fetch contacts beside plans on the home page and render them inside “需要处理” with links to `/relationships`. Do not count them as plans or weekly-focus slots.

- [ ] **Step 6: Verify**

Run: `npm test -- src/lib/relationships/reminders.test.ts src/lib/reminders/due-reminders.test.ts src/lib/dashboard/build-dashboard.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/relationships src/lib/reminders src/lib/dashboard src/app/api/reminders src/components/reminders src/app/page.tsx
git commit -m "feat: surface relationship follow-ups"
```

### Task 7: Full verification and release handoff

**Files:**
- Modify: `docs/life-os-mvp-release-checklist.md`
- Modify only if verification exposes defects: files from Tasks 1–6

- [ ] **Step 1: Run the migration in Supabase**

Execute `supabase/migrations/007_goals_relationships.sql` after migrations 003–006. Confirm existing goals become `direction`, both new tables exist, RLS is enabled, and authenticated grants are present.

- [ ] **Step 2: Run automated verification**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all commands exit 0. Do not claim completion if full-project lint exposes pre-existing debt; separate unchanged debt from new-file errors and require zero errors/warnings in the new scope.

- [ ] **Step 3: Perform manual acceptance**

Create result, project, habit and direction goals and verify each card uses the correct progress form. Create family, work and professional contacts; record an interaction; set yesterday/today/future follow-ups; confirm reminder center and dashboard behavior. Verify another user cannot read or mutate these rows.

- [ ] **Step 4: Verify preserved behavior**

Open `/cost`, add no data, and confirm positions, transaction flow and NAV rendering still load. Verify weekly focus remains limited to three and existing investment reminders still route correctly.

- [ ] **Step 5: Update the release checklist**

Record migration 007, manual RLS results, known privacy boundary, and the two-week real-use acceptance period. Do not mark the October workbench goal complete until the two-week observation succeeds.

- [ ] **Step 6: Commit**

```bash
git add docs/life-os-mvp-release-checklist.md
git commit -m "docs: add goals and relationships release checks"
```

## Self-review

The plan covers every confirmed specification requirement: four goal types without universal percentages, 14/30-day stagnation, manual relationship follow-ups, private contact history, source auditing, RLS, reminder/dashboard integration, scope exclusions and the two-week acceptance period. Goal hierarchy expansion, automatic contact cadence, relationship scoring, external notifications, messaging and social graphs remain intentionally excluded.
