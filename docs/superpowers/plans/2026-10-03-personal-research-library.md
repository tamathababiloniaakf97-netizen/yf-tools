# Personal Research Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight personal research library that stores selected research material, supports simple search and editing, and can cite a material into existing company evidence.

**Architecture:** Add one user-scoped `research_materials` table and an optional foreign key from `evidence_records`. Keep validation and query parsing in a small pure TypeScript module, expose authenticated App Router route handlers, and render one client page with list/detail/modal interactions. Store at most three optional images in a private Supabase Storage bucket through a dedicated authenticated route.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase Postgres/Storage/RLS, Vitest, Testing Library.

---

## File structure

- Create `supabase/migrations/025_research_materials.sql`: table, evidence foreign key, indexes, RLS, grants, private image bucket policies.
- Modify `src/types/life-os.ts`: material types, inputs, records, and evidence material link.
- Create `src/lib/investment/research-materials.ts`: pure validation, query normalization, and image constraints.
- Create `src/lib/investment/research-materials.test.ts`: validation and filter tests.
- Create `src/app/api/investment/materials/route.ts`: authenticated list and create operations.
- Create `src/app/api/investment/materials/[id]/route.ts`: authenticated update and delete operations.
- Create `src/app/api/investment/materials/images/route.ts`: authenticated image upload.
- Modify `src/app/api/investment/evidence/route.ts`: accept and persist optional `material_id` through existing validation.
- Create `src/app/investment/materials/page.tsx`: authenticated page and data orchestration.
- Create `src/app/investment/materials/components/MaterialEditor.tsx`: minimal create/edit form.
- Create `src/app/investment/materials/components/MaterialCitationModal.tsx`: cite-to-research flow.
- Create `src/app/investment/materials/components/ResearchMaterialLibrary.tsx`: list, detail, filters, delete and modal state.
- Create `src/app/investment/materials/components/ResearchMaterialLibrary.test.tsx`: core interaction tests.
- Modify `src/components/shell/navigation.ts` and `src/components/shell/navigation.test.ts`: enable and rename navigation.

### Task 1: Database and domain model

**Files:**
- Create: `supabase/migrations/025_research_materials.sql`
- Modify: `src/types/life-os.ts`
- Create: `src/lib/investment/research-materials.ts`
- Test: `src/lib/investment/research-materials.test.ts`

- [ ] **Step 1: Write failing validation tests**

```ts
import { describe, expect, it } from 'vitest';
import { normalizeResearchMaterialInput, normalizeMaterialFilters } from './research-materials';

describe('research materials', () => {
  it('requires only title, content, and material type', () => {
    expect(normalizeResearchMaterialInput({ material_type: 'fact', title: ' 续费率稳定 ', content: ' 连续三个季度稳定 ' }))
      .toMatchObject({ ok: true, value: { title: '续费率稳定', content: '连续三个季度稳定', asset_name: null, image_paths: [] } });
  });

  it('rejects invalid type and more than three images', () => {
    expect(normalizeResearchMaterialInput({ material_type: 'other', title: 'x', content: 'y' } as never).ok).toBe(false);
    expect(normalizeResearchMaterialInput({ material_type: 'news', title: 'x', content: 'y', image_paths: ['1', '2', '3', '4'] }).ok).toBe(false);
  });

  it('normalizes simple list filters', () => {
    expect(normalizeMaterialFilters(new URL('https://local/api?q= 腾讯 &type=news&asset_name=腾讯').searchParams))
      .toEqual({ query: '腾讯', materialType: 'news', assetName: '腾讯' });
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/investment/research-materials.test.ts`  
Expected: FAIL because `research-materials.ts` does not exist.

- [ ] **Step 3: Add types and minimal pure validation**

Define `ResearchMaterialType`, `ResearchMaterialInput`, and `ResearchMaterial` in `src/types/life-os.ts`. Implement `normalizeResearchMaterialInput` with trimmed required fields, nullable optional text/date fields, and a maximum of three image paths. Implement `normalizeMaterialFilters` accepting only the four known types.

- [ ] **Step 4: Add migration**

Create `public.research_materials` with the fields in the approved spec, `material_type` check constraint, `image_paths jsonb not null default '[]'::jsonb`, timestamps, user/type/company/date indexes, RLS policies matching existing user-owned investment tables, and authenticated grants. Add `evidence_records.material_id uuid references research_materials(id) on delete set null`. Create private bucket `research-material-images` and ownership policies that restrict the first path segment to `auth.uid()::text`.

- [ ] **Step 5: Run the test and verify GREEN**

Run: `npm test -- src/lib/investment/research-materials.test.ts`  
Expected: PASS.

### Task 2: Authenticated material API

**Files:**
- Create: `src/app/api/investment/materials/route.ts`
- Create: `src/app/api/investment/materials/[id]/route.ts`
- Create: `src/app/api/investment/materials/images/route.ts`
- Test: `src/lib/investment/research-materials.test.ts`

- [ ] **Step 1: Add failing query-builder tests**

Add tests for a `buildMaterialSearchTerm` helper that escapes `%`, `_`, and `,` before constructing the Supabase `.or(...)` expression, so user search text cannot alter filter grammar.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/investment/research-materials.test.ts`  
Expected: FAIL because the search helper is missing.

- [ ] **Step 3: Implement the collection route**

`GET` authenticates with `createServerSideClient`, filters by `user_id`, optional type/company, and escaped keyword across `title`, `content`, `source_name`, and `asset_name`, then orders by `created_at desc`. `POST` authenticates, validates with `normalizeResearchMaterialInput`, inserts `user_id`, and returns status 201.

- [ ] **Step 4: Implement item and image routes**

`PATCH` validates and updates only the current user's row. `DELETE` first reads `image_paths`, deletes owned Storage objects, then deletes the current user's row; the database preserves linked evidence via `SET NULL`. The image route accepts `multipart/form-data`, permits JPEG/PNG/WebP only, rejects files above 5 MB, counts existing paths plus uploads to enforce three images, and writes to `${user.id}/${crypto.randomUUID()}-${safeName}`.

- [ ] **Step 5: Implement the escaped search helper and verify GREEN**

Run: `npm test -- src/lib/investment/research-materials.test.ts`  
Expected: PASS.

### Task 3: Evidence citation link

**Files:**
- Modify: `src/types/life-os.ts`
- Modify: `src/lib/investment/records.test.ts`
- Modify: `src/lib/investment/records.ts`
- Modify: `src/app/api/investment/evidence/route.ts`

- [ ] **Step 1: Write a failing evidence normalization test**

```ts
it('keeps a research material link when citing it as evidence', () => {
  const result = normalizeEvidenceInput({
    asset_name: '腾讯控股', content: '续约率保持稳定', impact: 'neutral', material_id: ' material-1 ',
  });
  expect(result.ok && result.value.material_id).toBe('material-1');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/lib/investment/records.test.ts`  
Expected: FAIL because `material_id` is not normalized.

- [ ] **Step 3: Implement optional material linkage**

Add `material_id?: string | null` to `EvidenceInput`. Normalize whitespace to an ID or `null`. The existing evidence route already spreads normalized values into the insert, so no second insert path is introduced.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm test -- src/lib/investment/records.test.ts`  
Expected: PASS.

### Task 4: Lightweight page and interactions

**Files:**
- Create: `src/app/investment/materials/page.tsx`
- Create: `src/app/investment/materials/components/ResearchMaterialLibrary.tsx`
- Create: `src/app/investment/materials/components/MaterialEditor.tsx`
- Create: `src/app/investment/materials/components/MaterialCitationModal.tsx`
- Test: `src/app/investment/materials/components/ResearchMaterialLibrary.test.tsx`

- [ ] **Step 1: Write failing component tests**

Mock `fetch` only at the network boundary. Verify the initial heading and type filters, opening “新增资料” exposes only title/content/type/company while optional fields remain collapsed, a minimal submission posts the three required fields, and “引用到研究” requires a company while defaulting impact to `neutral`.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/app/investment/materials/components/ResearchMaterialLibrary.test.tsx`  
Expected: FAIL because the page components do not exist.

- [ ] **Step 3: Implement the editor**

Use Ant Design `Modal`, `Form`, `Input`, `Select`, `DatePicker`, `Upload`, and `Collapse`. Keep title/content/type visible; show company as optional; place source, date, personal note, and images inside one collapsed “补充信息（可选）” section. Preserve form values when API saving fails.

- [ ] **Step 4: Implement the list/detail library**

Use one client component because search, selection, modals, and uploads are interactive. Debounce keyword filtering, call `/api/investment/materials`, keep the selected item when still present, and show a simple empty state. Detail actions are edit, delete, and cite. Do not add metrics, scores, tags, review states, or AI controls.

- [ ] **Step 5: Implement citation modal**

Load existing research profiles, load hypotheses after company selection, and post to `/api/investment/evidence` with `material_id`, company, optional hypothesis, impact defaulting to `neutral`, and editable content prefilled from the material. On success show a message and close the modal.

- [ ] **Step 6: Run the component test and verify GREEN**

Run: `npm test -- src/app/investment/materials/components/ResearchMaterialLibrary.test.tsx`  
Expected: PASS.

### Task 5: Navigation and full verification

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/navigation.test.ts`

- [ ] **Step 1: Write a failing navigation test**

```ts
it('makes the research library available', () => {
  const investment = lifeOsNavigation.find((item) => item.key === 'investment');
  expect(investment?.children?.find((item) => item.key === 'research-materials')).toMatchObject({
    label: '研究资料库', href: '/investment/materials', disabled: false, phase: 'now',
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/components/shell/navigation.test.ts`  
Expected: FAIL because navigation still contains the disabled “观点库”.

- [ ] **Step 3: Enable the renamed navigation item**

Replace the `viewpoints` entry with key `research-materials`, label `研究资料库`, path `/investment/materials`, `disabled: false`, and phase `now`. Update the expected navigation order.

- [ ] **Step 4: Run focused and full verification**

Run:

```text
npm test -- src/lib/investment/research-materials.test.ts src/lib/investment/records.test.ts src/app/investment/materials/components/ResearchMaterialLibrary.test.tsx src/components/shell/navigation.test.ts
npm run typecheck
npm run lint
npm run build
```

Expected: all tests pass; TypeScript, ESLint, and production build exit with code 0.

- [ ] **Step 5: Review the final diff**

Run `git diff --check` and `git status --short`. Confirm only research-library-related changes are attributed to this feature and that pre-existing unrelated dirty files remain untouched.
