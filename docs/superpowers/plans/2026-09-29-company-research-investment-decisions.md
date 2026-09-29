# Company Research and Investment Decisions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade company research into a structured, snapshot-capable research workflow and add immutable, research-linked investment decisions without changing existing holdings or trade behavior.

**Architecture:** Extend the current Supabase research records additively, keep hypotheses and evidence normalized, store immutable point-in-time research snapshots as JSON, and add normalized investment decision records that reference a snapshot when finalized. Keep the research and decision UIs separate but linked, and reuse investment tasks and reviews through explicit foreign-key or URL-prefill integration.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design, Supabase/PostgreSQL with RLS, Vitest, Testing Library, ESLint.

---

## File map

- `supabase/migrations/010_research_decisions.sql`: additive profile fields, snapshots, decision table, review link, grants and RLS.
- `src/types/life-os.ts`: research, hypothesis, snapshot and decision domain types.
- `src/lib/investment/research-validation.ts`: profile, hypothesis and snapshot-core validation.
- `src/lib/investment/decision-validation.ts`: decision draft normalization and finalization gates.
- `src/app/api/investment/research/**`: profile, hypothesis and snapshot endpoints.
- `src/app/api/investment/decisions/**`: decision list/create/read/update/delete/finalize endpoints.
- `src/app/investment/research/**`: company-centered current research, hypotheses/evidence, snapshots and company decisions.
- `src/app/investment/decisions/**`: cross-company decision list and full-page editor.
- `src/app/investment/tasks/page.tsx`: confirmed URL-prefill handoff from a decision.
- `src/app/investment/reviews/page.tsx`: optional decision link and original-decision context.
- `src/components/shell/navigation.ts`: active investment decision navigation item.

### Task 1: Add domain types and the additive database migration

**Files:**
- Modify: `src/types/life-os.ts`
- Modify: `src/types/life-os.test.ts`
- Create: `supabase/migrations/010_research_decisions.sql`

- [ ] **Step 1: Write failing type-contract tests**

Add assertions for decision statuses/types and a compile-time fixture containing the six research core answers:

```ts
expect(investmentDecisionStatuses).toEqual(['draft', 'finalized']);
expect(investmentDecisionTypes).toEqual(['buy', 'add', 'hold', 'reduce', 'sell', 'watch', 'skip']);
const profile: ResearchProfileInput = {
  asset_name: '腾讯', business_model: '社交与内容生态变现', customer_value: '用户关系链与商家触达',
  competitive_advantage: '关系链与规模', long_term_assumptions: '用户与商业化保持平衡',
  invalidation_conditions: '关系链显著迁移', earnings_quality: '经营现金流长期覆盖利润',
};
expect(profile.asset_name).toBe('腾讯');
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/types/life-os.test.ts --maxWorkers=1`

Expected: FAIL because the new exports and types do not exist.

- [ ] **Step 3: Add explicit domain contracts**

Add `ResearchProfileInput`, `ResearchHypothesis`, `ResearchSnapshot`, `InvestmentDecision`, and `InvestmentDecisionInput`. Use these exact core profile keys:

```ts
business_model: string;
customer_value: string;
competitive_advantage: string;
long_term_assumptions: string;
invalidation_conditions: string;
earnings_quality: string;
management_culture: string;
unknowns: string;
checklist_state: Record<string, { status: 'considered' | 'not_applicable' | 'needs_validation'; note: string }>;
```

Use these decision core keys: `market_expectation`, `personal_divergence`, `valuation_conclusion`, `valuation_assumptions`, `safety_margin`, `investment_plan`, `error_signals`, `error_response`, `do_not_list`, `decision_type`, `final_reason`, `decision_date`, `status`, `research_snapshot_id`.

- [ ] **Step 4: Create migration 010**

The migration must:

1. Add the new research-profile columns with non-null empty-string or empty-JSON defaults.
2. Create `research_snapshots` with `snapshot_version`, `snapshot_data jsonb`, `evidence_snapshot jsonb`, a unique `(research_profile_id, snapshot_version)` constraint, timestamps and user ownership.
3. Create `investment_decisions` with draft/finalized status, all decision fields, `research_profile_id`, nullable `research_snapshot_id`, source audit fields and a constraint requiring snapshot/date for finalized rows.
4. Add nullable `decision_id` to `investment_reviews` with `on delete set null`.
5. Add user/date/status indexes, enable RLS, create select/insert/update/delete policies, and grant authenticated CRUD.
6. Never update or delete existing research, evidence, review, holding or transaction rows.

- [ ] **Step 5: Run the focused test and inspect migration safety**

Run: `npx vitest run src/types/life-os.test.ts --maxWorkers=1`

Expected: PASS.

Run: `rg -n "drop table|drop column|truncate|delete from|update public\.research" supabase/migrations/010_research_decisions.sql`

Expected: no matches.

- [ ] **Step 6: Commit**

```powershell
git add -- src/types/life-os.ts src/types/life-os.test.ts supabase/migrations/010_research_decisions.sql
git commit -m "feat: add research and decision data model"
```

### Task 2: Implement research and decision validation

**Files:**
- Create: `src/lib/investment/research-validation.ts`
- Create: `src/lib/investment/research-validation.test.ts`
- Create: `src/lib/investment/decision-validation.ts`
- Create: `src/lib/investment/decision-validation.test.ts`

- [ ] **Step 1: Write failing research validation tests**

Cover draft normalization, the six snapshot requirements, and preservation of “暂不知道” as a valid non-empty answer:

```ts
expect(validateResearchSnapshotCore(completeProfile)).toEqual({ ok: true, errors: [] });
expect(validateResearchSnapshotCore({ ...completeProfile, earnings_quality: '' }).errors)
  .toContain('请回答：挣到的钱质量如何');
expect(validateResearchSnapshotCore({ ...completeProfile, earnings_quality: '暂不知道，需要核对现金流量表' }).ok)
  .toBe(true);
```

- [ ] **Step 2: Write failing decision validation tests**

Verify drafts can be incomplete, finalization requires a snapshot plus five core result groups, invalid decision types fail, and finalized records cannot be normalized back to drafts.

- [ ] **Step 3: Run both tests and verify RED**

Run: `npx vitest run src/lib/investment/research-validation.test.ts src/lib/investment/decision-validation.test.ts --maxWorkers=1`

Expected: FAIL because validation modules do not exist.

- [ ] **Step 4: Implement minimal validators**

Expose:

```ts
normalizeResearchProfileInput(input: ResearchProfileInput)
validateResearchSnapshotCore(profile: ResearchProfileInput)
normalizeHypothesisInput(input: ResearchHypothesisInput)
normalizeDecisionDraft(input: InvestmentDecisionInput)
validateDecisionFinalization(input: InvestmentDecisionInput)
```

Trim strings, normalize optional values, validate enums, require automation source references, and return `{ ok: false, errors }` or `{ ok: true, value }`. Do not score writing quality or require minimum character counts.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npx vitest run src/lib/investment/research-validation.test.ts src/lib/investment/decision-validation.test.ts --maxWorkers=1`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src/lib/investment/research-validation.ts src/lib/investment/research-validation.test.ts src/lib/investment/decision-validation.ts src/lib/investment/decision-validation.test.ts
git commit -m "feat: validate research snapshots and decisions"
```

### Task 3: Extend research APIs and expose hypotheses

**Files:**
- Modify: `src/app/api/investment/research/route.ts`
- Create: `src/app/api/investment/research/[id]/hypotheses/route.ts`
- Create: `src/app/api/investment/research/[id]/hypotheses/[hypothesisId]/route.ts`
- Create: `src/lib/investment/research-api.test.ts`

- [ ] **Step 1: Write failing contract tests**

Test pure request payload helpers or mocked Supabase routes for these rules: profile save accepts all new fields while preserving legacy fields; hypothesis queries require both `user_id` and `research_profile_id`; mutation cannot update another user's row.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/lib/investment/research-api.test.ts --maxWorkers=1`

Expected: FAIL until helpers/routes exist.

- [ ] **Step 3: Extend profile upsert**

Use `normalizeResearchProfileInput`, keep the existing `(user_id, asset_name)` upsert, and include all new fields without removing `investment_thesis`, `current_judgment`, `risks`, or `invalidation_conditions`.

- [ ] **Step 4: Add hypothesis CRUD**

Implement authenticated GET/POST under a research profile and PATCH/DELETE under a hypothesis ID. Await Promise-based Next.js 16 route params and apply both user and parent-profile filters.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run src/lib/investment/research-api.test.ts --maxWorkers=1`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src/app/api/investment/research src/lib/investment/research-api.test.ts
git commit -m "feat: add structured research and hypothesis APIs"
```

### Task 4: Add immutable research snapshot APIs

**Files:**
- Create: `src/lib/investment/snapshot.ts`
- Create: `src/lib/investment/snapshot.test.ts`
- Create: `src/app/api/investment/research/[id]/snapshots/route.ts`
- Create: `src/app/api/investment/research/[id]/snapshots/[snapshotId]/route.ts`

- [ ] **Step 1: Write failing snapshot-builder tests**

Assert that `buildResearchSnapshot(profile, hypotheses, evidence)` copies the six core answers, checklist state, legacy summary/current judgment/risks, hypothesis states, and compact evidence fields; mutating source objects after creation must not change the returned snapshot.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/lib/investment/snapshot.test.ts --maxWorkers=1`

Expected: FAIL because the builder is missing.

- [ ] **Step 3: Implement snapshot builder and routes**

POST must load the user's profile, hypotheses and evidence, validate six core answers server-side, calculate `max(snapshot_version) + 1`, build JSON values, and insert one `research_snapshots` row. GET lists versions newest first; detail GET returns one owned snapshot. Do not implement PATCH.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/lib/investment/snapshot.test.ts --maxWorkers=1`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/lib/investment/snapshot.ts src/lib/investment/snapshot.test.ts src/app/api/investment/research
git commit -m "feat: add immutable research snapshots"
```

### Task 5: Refactor the company research UI around the approved framework

**Files:**
- Modify: `src/app/investment/research/page.tsx`
- Create: `src/app/investment/research/components/ResearchEditor.tsx`
- Create: `src/app/investment/research/components/ResearchChecklist.tsx`
- Create: `src/app/investment/research/components/HypothesisEvidencePanel.tsx`
- Create: `src/app/investment/research/components/SnapshotList.tsx`
- Create: `src/app/investment/research/components/CompanyDecisionList.tsx`
- Create: `src/app/investment/research/components/ResearchEditor.test.tsx`

- [ ] **Step 1: Write failing component tests**

Render the editor and assert the six core prompts exist, optional management/checklist content is not marked required, no completion percentage is shown, and a legacy investment thesis remains visible as “原投资逻辑/研究摘要”.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/app/investment/research/components/ResearchEditor.test.tsx --maxWorkers=1`

Expected: FAIL because components do not exist.

- [ ] **Step 3: Split and implement focused panels**

Keep the company list on the left. On the right use tabs `当前研究`, `假设与证据`, `研究快照`, `投资决策`. Implement compact conclusion inputs, collapsible checklist prompts, hypothesis CRUD, evidence association, snapshot creation/error reporting, and links to decision creation. Preserve existing evidence creation behavior.

- [ ] **Step 4: Verify component and existing research tests**

Run: `npx vitest run src/app/investment/research src/lib/investment --maxWorkers=1`

Expected: PASS, including evidence normalization tests.

- [ ] **Step 5: Commit**

```powershell
git add -- src/app/investment/research
git commit -m "feat: upgrade company research workflow"
```

### Task 6: Add investment decision APIs and immutable finalization

**Files:**
- Create: `src/app/api/investment/decisions/route.ts`
- Create: `src/app/api/investment/decisions/[id]/route.ts`
- Create: `src/app/api/investment/decisions/[id]/finalize/route.ts`
- Create: `src/lib/investment/decision-api.test.ts`

- [ ] **Step 1: Write failing API contract tests**

Cover: authenticated list filters; draft creation with incomplete content; draft update; finalized update rejected with HTTP 409; finalization rejected without an owned snapshot or missing core fields; finalization writes `status=finalized` and `decision_date`; delete remains user-scoped.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/lib/investment/decision-api.test.ts --maxWorkers=1`

Expected: FAIL because decision routes do not exist.

- [ ] **Step 3: Implement user-scoped routes**

GET supports `status`, `research_profile_id`, and `decision_type` query filters. POST always creates a draft after normalization. PATCH first reads the owned row and rejects finalized rows. Finalize POST loads the owned snapshot/profile, validates the complete decision, then updates once. DELETE deletes only an owned row; the UI will require confirmation for finalized history.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `npx vitest run src/lib/investment/decision-api.test.ts --maxWorkers=1`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/app/api/investment/decisions src/lib/investment/decision-api.test.ts
git commit -m "feat: add investment decision API"
```

### Task 7: Build the independent investment decision interface

**Files:**
- Create: `src/app/investment/decisions/page.tsx`
- Create: `src/app/investment/decisions/[id]/page.tsx`
- Create: `src/app/investment/decisions/components/DecisionEditor.tsx`
- Create: `src/app/investment/decisions/components/DecisionList.tsx`
- Create: `src/app/investment/decisions/components/DecisionEditor.test.tsx`
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/navigation.test.ts`

- [ ] **Step 1: Write failing navigation and editor tests**

Assert the active `/investment/decisions` navigation entry exists. Assert the editor shows market expectation, valuation, safety margin, investment plan, error plan, do-not list and final conclusion; only the approved core groups are marked as finalization requirements; finalized mode has no editable controls.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/components/shell/navigation.test.ts src/app/investment/decisions/components/DecisionEditor.test.tsx --maxWorkers=1`

Expected: FAIL until navigation and components exist.

- [ ] **Step 3: Implement list and full-page editor**

The list filters draft/finalized/company/type. New decision accepts `research_profile_id` and `snapshot_id` query parameters. The editor auto-saves only when the user explicitly clicks “保存草稿”; “定稿” shows server validation errors and, after success, switches to read-only. Show linked snapshot version/date and do not display live prices or automatic advice.

- [ ] **Step 4: Add navigation and company links**

Insert “投资决策” after “公司研究”. Company decision cards link to the shared detail route; “开始投资决策” links with the current profile and latest snapshot.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run src/components/shell/navigation.test.ts src/app/investment/decisions --maxWorkers=1`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src/app/investment/decisions src/components/shell/navigation.ts src/components/shell/navigation.test.ts src/app/investment/research/components/CompanyDecisionList.tsx
git commit -m "feat: add investment decision workspace"
```

### Task 8: Add explicit decision-to-task handoff

**Files:**
- Modify: `src/app/investment/tasks/page.tsx`
- Modify: `src/app/investment/tasks/components/InvestmentTaskEditor.tsx`
- Modify: `src/app/investment/tasks/components/InvestmentTaskList.test.tsx`
- Modify: `src/app/investment/decisions/[id]/page.tsx`

- [ ] **Step 1: Write failing prefill test**

Extract and test a `taskPrefillFromSearchParams` helper. Given `asset_name=腾讯`, `task_type=validation`, `title=验证广告增长`, and `condition_note=下季财报确认`, it returns an unsaved `InvestmentTaskInput` with `status='pending'`.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/app/investment/tasks --maxWorkers=1`

Expected: FAIL until prefill support exists.

- [ ] **Step 3: Implement confirmed prefill flow**

From a decision, “转成投资待办” navigates with encoded, non-sensitive form values. The tasks page opens a new unsaved editor exactly once. No POST occurs until the user reviews and clicks save. Cancelling clears the query string.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/app/investment/tasks src/app/investment/decisions --maxWorkers=1`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/app/investment/tasks src/app/investment/decisions
git commit -m "feat: hand decision actions to investment tasks"
```

### Task 9: Link investment reviews to original decisions

**Files:**
- Modify: `src/types/life-os.ts`
- Modify: `src/lib/investment/records.ts`
- Modify: `src/lib/investment/records.test.ts`
- Modify: `src/app/api/investment/reviews/route.ts`
- Modify: `src/app/investment/reviews/page.tsx`

- [ ] **Step 1: Write failing review-link tests**

Verify `decision_id` is optional and retained when supplied, while existing review input without a decision still validates unchanged.

- [ ] **Step 2: Run test and verify RED**

Run: `npx vitest run src/lib/investment/records.test.ts --maxWorkers=1`

Expected: FAIL until the decision link is modeled.

- [ ] **Step 3: Implement optional decision selection**

Load finalized decisions, allow filtering by selected company, and when a decision is selected show its date/type/final reason as read-only context. Store only `decision_id`; do not copy or overwrite historical decision content. Keep all old reviews valid.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/lib/investment/records.test.ts --maxWorkers=1`

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/types/life-os.ts src/lib/investment/records.ts src/lib/investment/records.test.ts src/app/api/investment/reviews/route.ts src/app/investment/reviews/page.tsx
git commit -m "feat: link reviews to investment decisions"
```

### Task 10: Update release documentation and run full verification

**Files:**
- Modify: `docs/life-os-mvp-release-checklist.md`

- [ ] **Step 1: Document migration order and manual acceptance**

Add migration `010_research_decisions.sql` after 009. Document that it is additive, preserves old research/evidence/reviews, and must be applied before using snapshots or decisions. Add manual checks for snapshot immutability, finalized decision immutability, task prefill confirmation and old review compatibility.

- [ ] **Step 2: Run all tests with constrained workers**

Run: `npx vitest run --maxWorkers=1`

Expected: all test files and tests pass. Use one worker because this Windows environment previously exhausted memory with Vitest's default parallel workers.

- [ ] **Step 3: Run static verification sequentially**

Run: `npm run typecheck`

Run: `npx eslint src/types/life-os.ts src/lib/investment src/app/api/investment src/app/investment src/components/shell/navigation.ts src/components/shell/navigation.test.ts`

Run: `npm run build`

Expected: every command exits 0. Run sequentially to avoid Node/Turbopack memory contention.

- [ ] **Step 4: Inspect the final diff for scope and migration safety**

Run: `git diff --check`

Run: `git status --short`

Run: `rg -n "drop table|drop column|truncate|delete from" supabase/migrations/010_research_decisions.sql`

Expected: no whitespace errors, only intended files are staged for this feature, and no destructive SQL matches.

- [ ] **Step 5: Commit release checks**

```powershell
git add -- docs/life-os-mvp-release-checklist.md
git commit -m "docs: add research decision release checks"
```

### Task 11: Apply migration and perform authenticated smoke testing

**Files:**
- Use: `supabase/migrations/010_research_decisions.sql`

- [ ] **Step 1: Ask the user to execute migration 010**

The user runs the migration in Supabase SQL Editor and reports success. Do not claim runtime persistence before this succeeds.

- [ ] **Step 2: Verify the end-to-end research flow**

With the authenticated app: open an existing research profile, confirm legacy content and evidence remain, save incomplete current research, verify snapshot rejection with one missing core answer, complete it, save snapshot, edit current research, and confirm the snapshot remains unchanged.

- [ ] **Step 3: Verify the decision and review flow**

Create a draft decision, confirm incomplete draft save, finalize only after linking a snapshot and completing core fields, confirm finalized content is read-only, prefill but cancel an investment task to prove no automatic write, then confirm the decision is selectable from investment review.

- [ ] **Step 4: Report completion with evidence**

Report automated command results, migration status, manual smoke-test results, exact commits, and any remaining limitations. Do not claim live-price or automatic-advice behavior.
