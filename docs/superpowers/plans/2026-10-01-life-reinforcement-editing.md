# Editable Life Reinforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/life` into a private, editable list of reinforcement projects with simple stage management and dated training records.

**Architecture:** Store projects and records in two Supabase tables protected by per-user RLS. Expose small App Router route handlers for CRUD and keep the client page focused by splitting project and record forms into components. Stage names are stored as a JSON text array on projects and copied into records as historical snapshots.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, Vitest, Testing Library.

---

### Task 1: Database schema and domain types

**Files:**
- Create: `supabase/migrations/016_life_reinforcement.sql`
- Modify: `src/types/life-os.ts`
- Create: `src/lib/life-reinforcement/validation.ts`
- Test: `src/lib/life-reinforcement/validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Test that a project requires a non-empty name, normalizes blank optional text and stage names, and that a record requires `trained_on` plus `activity`. Test invalid dates and excessive lengths.

- [ ] **Step 2: Run the validation test and confirm RED**

Run: `npm test -- src/lib/life-reinforcement/validation.test.ts`
Expected: FAIL because the validation module does not exist.

- [ ] **Step 3: Add types and validators**

Add `LifeReinforcementProject`, `LifeReinforcementProjectInput`, `LifeTrainingRecord`, and `LifeTrainingRecordInput`. Implement `validateLifeProjectInput` and `validateLifeRecordInput` returning `{ ok, value }` or `{ ok, errors }`, with project name and record date/activity as the only required fields.

- [ ] **Step 4: Add migration**

Create `life_reinforcement_projects` with `stages jsonb not null default '[]'`, `is_default`, `is_active`, timestamps, and a unique `(user_id, default_key)` constraint for non-null default keys. Create `life_training_records` with `project_id on delete cascade` and copied `stage_name`. Add RLS policies, authenticated grants, indexes, and an `initialize_life_reinforcement_projects()` security-invoker SQL function that inserts the four defaults using `on conflict do nothing`.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/lib/life-reinforcement/validation.test.ts`
Expected: PASS.

### Task 2: Project API

**Files:**
- Create: `src/app/api/life/projects/route.ts`
- Create: `src/app/api/life/projects/[id]/route.ts`
- Test: `src/app/api/life/projects/route.test.ts`
- Test: `src/app/api/life/projects/[id]/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Cover unauthenticated rejection, initialization before listing, user-scoped insert/update, default-project delete rejection, custom-project delete, and validation errors.

- [ ] **Step 2: Run route tests and confirm RED**

Run: `npm test -- src/app/api/life/projects/route.test.ts src/app/api/life/projects/[id]/route.test.ts`
Expected: FAIL because route modules do not exist.

- [ ] **Step 3: Implement project routes**

`GET /api/life/projects` authenticates, invokes the idempotent initializer, and returns active and inactive projects ordered by creation time. `POST` validates and creates a custom active project. `PATCH /api/life/projects/[id]` updates editable fields for the current user. `DELETE` checks `is_default`; default projects return 400, custom projects are deleted with their records.

- [ ] **Step 4: Run route tests**

Run: `npm test -- src/app/api/life/projects/route.test.ts src/app/api/life/projects/[id]/route.test.ts`
Expected: PASS.

### Task 3: Training record API

**Files:**
- Create: `src/app/api/life/projects/[id]/records/route.ts`
- Create: `src/app/api/life/records/[id]/route.ts`
- Test: `src/app/api/life/records/route.test.ts`

- [ ] **Step 1: Write failing record route tests**

Cover current-user project ownership, record creation with copied stage text, descending-date listing, update, delete, required fields, and unauthenticated access.

- [ ] **Step 2: Run route tests and confirm RED**

Run: `npm test -- src/app/api/life/records/route.test.ts`
Expected: FAIL because route modules do not exist.

- [ ] **Step 3: Implement record routes**

The project records route lists and creates records only after confirming the project belongs to the current user. The record route patches and deletes by both record id and `user_id`. Return 404 when the scoped row does not exist.

- [ ] **Step 4: Run route tests**

Run: `npm test -- src/app/api/life/records/route.test.ts`
Expected: PASS.

### Task 4: Editors and project card

**Files:**
- Create: `src/app/life/components/LifeProjectEditor.tsx`
- Create: `src/app/life/components/LifeRecordEditor.tsx`
- Create: `src/app/life/components/LifeProjectCard.tsx`
- Test: `src/app/life/components/LifeProjectEditor.test.tsx`
- Test: `src/app/life/components/LifeRecordEditor.test.tsx`
- Test: `src/app/life/components/LifeProjectCard.test.tsx`

- [ ] **Step 1: Write failing component tests**

Test editable stage rows, adding/removing stages, required project name, record date/activity requirements, stage selection, record display, edit callbacks, default project delete omission, and custom project delete confirmation callback.

- [ ] **Step 2: Run component tests and confirm RED**

Run: `npm test -- src/app/life/components`
Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement focused components**

Use Ant Design `Modal`, `Form.List`, `DatePicker`, `Select`, `Input`, and `Popconfirm`. Keep network state outside the components. Project editor emits a normalized project input; record editor emits an ISO date string plus text fields; card renders stages, methods, records, and action callbacks.

- [ ] **Step 4: Run component tests**

Run: `npm test -- src/app/life/components`
Expected: PASS.

### Task 5: Integrate the `/life` page

**Files:**
- Modify: `src/app/life/page.tsx`
- Modify: `src/app/life/page.test.tsx`

- [ ] **Step 1: Replace static-page tests with failing behavior tests**

Mock `fetch` and verify loading projects, opening the new-project editor, saving a project, creating a record, editing existing data, showing inactive projects, retrying load failures, and not rendering dashboard/score/reminder controls.

- [ ] **Step 2: Run page tests and confirm RED**

Run: `npm test -- src/app/life/page.test.tsx`
Expected: FAIL because the static page has no editors or API loading.

- [ ] **Step 3: Implement page state and mutations**

Load `/api/life/projects`, hold the selected project and record, call the project and record routes, disable duplicate saves, keep editors open on errors, reload after successful changes, and separate active from inactive projects. Keep the page independent from dashboard APIs.

- [ ] **Step 4: Run page and focused feature tests**

Run: `npm test -- src/app/life src/app/api/life src/lib/life-reinforcement`
Expected: PASS.

### Task 6: Verification

**Files:**
- Verify only; no new files expected.

- [ ] **Step 1: Run lint and type checks**

Run: `npx eslint src/app/life src/app/api/life src/lib/life-reinforcement src/types/life-os.ts`
Expected: no errors in touched files.

Run: `npm run typecheck`
Expected: PASS, or report pre-existing failures separately with exact output.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS, or report pre-existing unrelated failures separately.

- [ ] **Step 3: Browser verification**

At `/life`, verify the four defaults, project create/edit/disable, custom delete warning, record create/edit/delete, inactive-project reactivation, mobile-width layout, and absence of dashboard aggregation.
