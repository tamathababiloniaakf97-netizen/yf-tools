# Expression Training Life Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/life` expression-training page, persistent stage progress, Codex result intake and confirmation, and stage unlocking while reusing the existing plans, reminders, and relationships systems.

**Architecture:** Add two Supabase tables for one expression track and its training records. Keep all state-changing rules in focused validation/transition helpers and authenticated Next.js route handlers; the client page only renders state and invokes those APIs. Codex writes only pending results through the shared contract, and one user confirmation either accepts a practice result or atomically accepts a passing stage validation and advances the stage.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, Ant Design 6, Supabase PostgreSQL/RLS, Vitest, Testing Library.

---

## File map

- Create `supabase/migrations/013_expression_training.sql`: tables, constraints, indexes, RLS, grants, and atomic confirmation function.
- Modify `src/types/life-os.ts`: expression stage, progress, training record, evidence, and input types.
- Create `src/lib/life-training/validation.ts`: payload validation and forced pending status for Codex sources.
- Create `src/lib/life-training/validation.test.ts`: contract, evidence-limit, and source-status tests.
- Create `src/lib/life-training/stages.ts`: stage order and transition helper.
- Create `src/lib/life-training/stages.test.ts`: transition tests.
- Create `src/app/api/life/expression/route.ts`: read/create the expression track and current records.
- Create `src/app/api/life/expression/tasks/route.ts`: create a training task record with intended message.
- Create `src/app/api/life/expression/results/route.ts`: accept a pending Codex/JSON result with idempotency.
- Create `src/app/api/life/expression/results/[id]/confirm/route.ts`: approve/reject a result and call the atomic stage transition.
- Create `src/app/life/page.tsx`: authenticated expression training page.
- Create `src/app/life/components/CurrentStageCard.tsx`: current stage and route position.
- Create `src/app/life/components/WeeklyTrainingCard.tsx`: existing life-plan reminder summary.
- Create `src/app/life/components/TodayPracticeCard.tsx`: topic, intended message, and task creation.
- Create `src/app/life/components/CodexResultReview.tsx`: pending result confirmation.
- Create `src/app/life/components/TrainingHistory.tsx`: minimal confirmed result/outcome list.
- Create component tests beside the components.
- Modify `src/components/shell/navigation.ts` and `navigation.test.ts`: enable `/life`.
- Modify `src/app/globals.css`: responsive life-training layout styles.

### Task 1: Lock Next.js conventions and domain contracts

**Files:**
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Modify: `src/types/life-os.ts`
- Create: `src/lib/life-training/stages.ts`
- Test: `src/lib/life-training/stages.test.ts`

- [ ] **Step 1: Read the bundled Next.js 16 guides**

Run:

```powershell
Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md
Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md
Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
Get-Content -Raw node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
```

Expected: current App Router guidance is available locally; implementation follows these files rather than remembered APIs.

- [ ] **Step 2: Write the failing stage transition test**

```ts
import { describe, expect, it } from 'vitest';
import { nextExpressionStage } from './stages';

describe('nextExpressionStage', () => {
  it('advances only through the approved first-version route', () => {
    expect(nextExpressionStage('structured')).toBe('video');
    expect(nextExpressionStage('video')).toBe('conversation');
    expect(nextExpressionStage('conversation')).toBe('completed');
    expect(nextExpressionStage('completed')).toBe('completed');
  });
});
```

- [ ] **Step 3: Run the focused test and verify failure**

Run: `npx vitest run src/lib/life-training/stages.test.ts`

Expected: FAIL because `stages.ts` does not exist.

- [ ] **Step 4: Add exact types and minimal stage helper**

Add to `src/types/life-os.ts`:

```ts
export const expressionStages = ['structured', 'video', 'conversation', 'completed'] as const;
export type ExpressionStage = typeof expressionStages[number];
export type TrainingRecordType = 'practice' | 'stage_validation';
export type TrainingDecision = 'pending' | 'pass' | 'continue';

export interface TrainingEvidence {
  summary: string;
  quote: string;
  time_range?: string;
}

export interface LifeSkillProgress {
  id: string;
  user_id: string;
  skill_key: 'expression';
  current_stage: ExpressionStage;
  next_action: string;
  active_plan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LifeTrainingRecord {
  id: string;
  task_id: string;
  user_id: string;
  skill_key: 'expression';
  stage: Exclude<ExpressionStage, 'completed'>;
  record_type: TrainingRecordType;
  topic: string;
  intended_message: string;
  decision: TrainingDecision;
  evidence: TrainingEvidence[];
  next_action: string;
  artifact_ref: string | null;
  contact_id: string | null;
  source_type: SourceType;
  source_ref: string | null;
  review_status: ReviewStatus;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

Create `stages.ts`:

```ts
import type { ExpressionStage } from '@/types/life-os';

const nextStage: Record<ExpressionStage, ExpressionStage> = {
  structured: 'video',
  video: 'conversation',
  conversation: 'completed',
  completed: 'completed',
};

export function nextExpressionStage(stage: ExpressionStage) {
  return nextStage[stage];
}
```

- [ ] **Step 5: Run the test and commit**

Run: `npx vitest run src/lib/life-training/stages.test.ts`

Expected: PASS.

Commit:

```powershell
git add -- src/types/life-os.ts src/lib/life-training/stages.ts src/lib/life-training/stages.test.ts
git commit -m "feat: define expression training stages"
```

### Task 2: Validate the shared Codex result contract

**Files:**
- Create: `src/lib/life-training/validation.ts`
- Test: `src/lib/life-training/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

```ts
import { describe, expect, it } from 'vitest';
import { validateTrainingResult } from './validation';

const base = {
  task_id: '11111111-1111-4111-8111-111111111111',
  stage: 'structured', record_type: 'practice',
  intended_message: '先管理仓位，再判断涨跌', decision: 'continue',
  evidence: [{ summary: '结论太晚', quote: '直到后半段才谈仓位', time_range: '01:10-01:25' }],
  next_action: '前15秒先说观点', artifact_ref: 'sha256:abc',
  source_type: 'codex', source_ref: 'report:abc', review_status: 'approved',
};

describe('validateTrainingResult', () => {
  it('forces Codex results to pending', () => {
    expect(validateTrainingResult(base)).toMatchObject({ ok: true, value: { review_status: 'pending' } });
  });

  it('rejects more than two evidence items', () => {
    expect(validateTrainingResult({ ...base, evidence: [base.evidence[0], base.evidence[0], base.evidence[0]] }).ok).toBe(false);
  });

  it('requires a source reference for Codex results', () => {
    expect(validateTrainingResult({ ...base, source_ref: null }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx vitest run src/lib/life-training/validation.test.ts`

Expected: FAIL because `validateTrainingResult` does not exist.

- [ ] **Step 3: Implement strict validation**

Create a validator that trims strings, accepts only the three active stages, accepts only `pass|continue`, limits evidence to two non-empty entries, rejects a `pass` for ordinary `practice`, requires `source_ref` for `codex`, and always returns `review_status: 'pending'` for non-manual input. Use the existing `{ ok, value } | { ok, errors }` pattern from goals/plans validators.

Core rule:

```ts
if (input.record_type === 'practice' && input.decision === 'pass') {
  errors.push('日常训练不能触发阶段通过');
}
const reviewStatus = input.source_type === 'manual' ? (input.review_status ?? 'approved') : 'pending';
```

- [ ] **Step 4: Run tests and commit**

Run: `npx vitest run src/lib/life-training/validation.test.ts`

Expected: PASS.

Commit:

```powershell
git add -- src/lib/life-training/validation.ts src/lib/life-training/validation.test.ts
git commit -m "feat: validate expression training results"
```

### Task 3: Add persistence and atomic confirmation

**Files:**
- Create: `supabase/migrations/013_expression_training.sql`

- [ ] **Step 1: Write the migration**

Create `life_skill_progress` and `life_training_records` exactly as specified in the design. Add database checks for active stages, record types, decisions, source/review enums, evidence JSON array length at most two, and Codex sources requiring `source_ref`. Add a unique constraint on `(user_id, skill_key)` and `(user_id, task_id, source_ref)` for idempotency.

The confirmation function must lock both rows, verify ownership and current stage, set `approved`, copy `next_action`, and advance only when `record_type='stage_validation'` and `decision='pass'`:

```sql
create or replace function public.confirm_expression_training_result(p_record_id uuid)
returns public.life_training_records
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.life_training_records;
  next_stage text;
begin
  select * into result from public.life_training_records
  where id = p_record_id and user_id = auth.uid()
  for update;
  if not found then raise exception 'training result not found'; end if;
  if result.review_status <> 'pending' then raise exception 'training result already reviewed'; end if;

  update public.life_training_records
  set review_status = 'approved', confirmed_at = now(), updated_at = now()
  where id = result.id returning * into result;

  if result.record_type = 'stage_validation' and result.decision = 'pass' then
    next_stage := case result.stage when 'structured' then 'video' when 'video' then 'conversation' else 'completed' end;
    update public.life_skill_progress
    set current_stage = next_stage, next_action = result.next_action, updated_at = now()
    where user_id = auth.uid() and skill_key = 'expression' and current_stage = result.stage;
    if not found then raise exception 'stage changed before confirmation'; end if;
  else
    update public.life_skill_progress set next_action = result.next_action, updated_at = now()
    where user_id = auth.uid() and skill_key = 'expression';
  end if;
  return result;
end;
$$;
```

Enable RLS and add own-row select/insert/update policies consistent with migrations 003 and 007. Grant table and function access only to authenticated users; the external Codex endpoint must still pass through server validation and create pending rows.

- [ ] **Step 2: Verify migration contents**

Run:

```powershell
rg -n "enable row level security|review_status|jsonb_array_length|confirm_expression_training_result|auth.uid" supabase/migrations/013_expression_training.sql
```

Expected: matches for both tables, evidence constraint, RLS policies, and confirmation ownership checks.

- [ ] **Step 3: Commit**

```powershell
git add -- supabase/migrations/013_expression_training.sql
git commit -m "feat: add expression training persistence"
```

### Task 4: Implement authenticated APIs

**Files:**
- Create: `src/app/api/life/expression/route.ts`
- Create: `src/app/api/life/expression/tasks/route.ts`
- Create: `src/app/api/life/expression/results/route.ts`
- Create: `src/app/api/life/expression/results/[id]/confirm/route.ts`
- Test: `src/app/api/life/expression/results/route.test.ts`

- [ ] **Step 1: Write route tests for security rules**

Mock `createServerSideClient` following existing route tests. Assert: unauthenticated result intake returns 401; invalid evidence returns 400; a Codex payload that requests `approved` is inserted as `pending`; duplicate `(task_id, source_ref)` returns the existing record instead of creating another.

Representative assertion:

```ts
expect(insert).toHaveBeenCalledWith(expect.objectContaining({
  user_id: 'user-1',
  source_type: 'codex',
  review_status: 'pending',
}));
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npx vitest run src/app/api/life/expression/results/route.test.ts`

Expected: FAIL because route handlers do not exist.

- [ ] **Step 3: Implement route handlers**

`GET /api/life/expression` authenticates, upserts the single expression progress row when absent, fetches active life plans, latest approved records, and pending records, and returns one page payload.

`POST /api/life/expression/tasks` creates a `pending` practice or validation task with a generated UUID, current stage, topic, and intended message. It never accepts a client-supplied user ID.

`POST /api/life/expression/results` authenticates the caller, validates with `validateTrainingResult`, checks that the task exists for the same user/stage, and inserts/upserts the pending result by idempotency key.

`POST /api/life/expression/results/[id]/confirm` accepts `{ action: 'approve' | 'reject' }`. Reject sets `review_status='rejected'`; approve invokes `confirm_expression_training_result`.

- [ ] **Step 4: Run focused and related tests**

Run:

```powershell
npx vitest run src/app/api/life/expression/results/route.test.ts src/lib/life-training/validation.test.ts src/lib/life-training/stages.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/app/api/life/expression src/lib/life-training
git commit -m "feat: add expression training APIs"
```

### Task 5: Build the focused `/life` page

**Files:**
- Create: `src/app/life/page.tsx`
- Create: `src/app/life/components/CurrentStageCard.tsx`
- Create: `src/app/life/components/WeeklyTrainingCard.tsx`
- Create: `src/app/life/components/TodayPracticeCard.tsx`
- Create: `src/app/life/components/CodexResultReview.tsx`
- Create: `src/app/life/components/TrainingHistory.tsx`
- Test: `src/app/life/components/TodayPracticeCard.test.tsx`
- Test: `src/app/life/components/CodexResultReview.test.tsx`

- [ ] **Step 1: Write failing component tests**

Test that `TodayPracticeCard` requires one intended-message sentence before creating a task and renders the generated task text. Test that `CodexResultReview` renders at most two evidence items, one next action, and explicit approve/reject buttons without any score.

```tsx
expect(screen.queryByText(/分数|雷达|等级/)).not.toBeInTheDocument();
expect(screen.getByRole('button', { name: '确认结果' })).toBeInTheDocument();
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npx vitest run src/app/life/components/*.test.tsx`

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement focused components**

Use Ant Design `Card`, `Steps`, `Form`, `Input`, `Button`, `Alert`, `List`, and `Tag`. The task text generated after task creation must include task ID, stage, topic, intended message, the local-only audio rule, and the exact JSON response contract. Do not render upload controls.

`CodexResultReview` must show the decision label, evidence list, next action, source reference, and two actions. For a passing stage validation, the approve button label is `确认并解锁下一阶段`; all other approvals use `确认结果`.

- [ ] **Step 4: Implement the page data flow**

`page.tsx` follows existing client-page patterns: `AuthGuard`, `useCallback` loader, fetch from `/api/life/expression`, targeted error alert for missing migration, and reload after creating tasks or confirming results. Render only the expression track; do not render empty cards for other life dimensions.

- [ ] **Step 5: Run component tests and commit**

Run: `npx vitest run src/app/life/components/*.test.tsx`

Expected: PASS.

Commit:

```powershell
git add -- src/app/life
git commit -m "feat: add focused expression training page"
```

### Task 6: Enable navigation and responsive styling

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/navigation.test.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update the failing navigation expectation**

Replace the future-module assertion so it expects only `全局复盘` to remain disabled and expects the life item to be available:

```ts
expect(lifeOsNavigation.find((item) => item.key === 'life')).toMatchObject({
  href: '/life', disabled: false, phase: 'now',
});
```

- [ ] **Step 2: Run the navigation test and verify failure**

Run: `npx vitest run src/components/shell/navigation.test.ts`

Expected: FAIL because life remains disabled/later.

- [ ] **Step 3: Enable navigation and add scoped styles**

Change the life navigation item to `{ disabled: false, phase: 'now' }`. Add `.life-training-grid`, `.life-training-main`, `.life-training-aside`, `.life-training-result-grid`, and mobile breakpoints to `globals.css`; do not alter unrelated legacy execution styles.

- [ ] **Step 4: Run navigation and component tests**

Run:

```powershell
npx vitest run src/components/shell/navigation.test.ts src/app/life/components/*.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/components/shell/navigation.ts src/components/shell/navigation.test.ts src/app/globals.css
git commit -m "feat: enable life training navigation"
```

### Task 7: Verify integration and contract boundaries

**Files:**
- Modify if failures require it: files introduced in Tasks 1-6 only

- [ ] **Step 1: Run focused test suite**

Run:

```powershell
npx vitest run src/lib/life-training src/app/api/life/expression src/app/life src/components/shell/navigation.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run repository verification**

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all commands exit 0. If unrelated pre-existing failures occur, record the exact command and failure without modifying unrelated user work.

- [ ] **Step 3: Manual acceptance check**

With migration 013 applied and a logged-in account:

1. Open `/life`; verify only the expression track appears.
2. Create a practice task after entering one intended-message sentence.
3. Verify the generated Codex text explicitly requires local-only processing.
4. Submit/import a Codex result that asks for `approved`; verify the page still shows it as pending.
5. Confirm an ordinary practice result; verify the stage does not change.
6. Confirm a passing stage validation; verify one confirmation advances exactly one stage.
7. Reject a result; verify progress and next action remain unchanged.
8. Open `/relationships`; verify existing contacts and interactions still work.

- [ ] **Step 4: Record the verified state**

Run `git status --short` and confirm no expression-training implementation file remains unintentionally unstaged. If verification required a fix, return to the task that owns that file, repeat its focused test and commit step with the exact file list already specified there. Do not create an empty verification commit and do not stage unrelated user changes.
