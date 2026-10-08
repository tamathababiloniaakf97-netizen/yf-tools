# Lightweight Industry Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight industry research, core-company and indicator lists, object-specific external variables, and one-industry company associations without disrupting the existing company-research workflow.

**Architecture:** Add normalized Supabase tables for industries and repeatable child records, while extending `research_profiles` only with the company-specific association and impact text. Keep validation and ownership rules in focused library modules, expose route handlers under `/api/investment/industries`, and add an industry workspace beside the existing company workspace on the current `/investment/research` page.

**Tech Stack:** Next.js 16 App Router route handlers, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL RLS, Vitest, Testing Library.

---

### Task 1: Database schema and domain types

**Files:**
- Create: `supabase/migrations/030_lightweight_industry_research.sql`
- Modify: `src/types/life-os.ts`
- Modify: `src/types/life-os.test.ts`

- [ ] **Step 1: Write failing type expectations**

Add tests asserting the exported enums `industryCompanyStages`, `industryCompanyRoles`, and `externalVariableOwnerTypes`, plus representative `IndustryProfile`, `IndustryCompany`, `IndustryIndicator`, and `ExternalVariable` objects with the exact fields from the design.

- [ ] **Step 2: Run the type test and verify failure**

Run: `npm test -- src/types/life-os.test.ts`
Expected: FAIL because the industry exports do not exist.

- [ ] **Step 3: Add types and the incremental migration**

Define:

```ts
export const industryCompanyStages = ['upstream', 'industry', 'downstream'] as const;
export const industryCompanyRoles = ['leader', 'challenger', 'supplier', 'customer', 'substitute', 'other'] as const;
export const externalVariableOwnerTypes = ['industry', 'company'] as const;
```

Add interfaces matching tables `industry_profiles`, `industry_companies`, `industry_indicators`, and `external_variables`. Extend `ResearchProfile` and `ResearchProfileInput` with `industry_profile_id` and `industry_impact`.

The migration must create the four tables with `user_id`, timestamps, foreign keys, indexes, RLS policies, authenticated grants, and `on delete set null` links to company research. Add nullable `industry_profile_id` and non-null default-empty `industry_impact` to `research_profiles`. Use a composite owner check on external variables so an `industry` row has only `industry_profile_id` and a `company` row has only `research_profile_id`.

- [ ] **Step 4: Run the type test**

Run: `npm test -- src/types/life-os.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit the schema and types**

```powershell
git add -- supabase/migrations/030_lightweight_industry_research.sql src/types/life-os.ts src/types/life-os.test.ts
git commit -m "feat: add industry research data model"
```

### Task 2: Validation and record builders

**Files:**
- Create: `src/lib/investment/industry-validation.ts`
- Create: `src/lib/investment/industry-validation.test.ts`
- Modify: `src/lib/investment/research-validation.ts`
- Modify: `src/lib/investment/research-validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Cover trimmed industry names, empty-name rejection, valid and invalid stage/role values, trimmed indicators and external variables, correct owner IDs, and company input normalization of `industry_profile_id` and `industry_impact`.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/lib/investment/industry-validation.test.ts src/lib/investment/research-validation.test.ts`
Expected: FAIL because industry validators and company fields are missing.

- [ ] **Step 3: Implement focused normalizers**

Export `normalizeIndustryProfileInput`, `normalizeIndustryCompanyInput`, `normalizeIndustryIndicatorInput`, and `normalizeExternalVariableInput`. Each must trim text, reject unsupported enum values, and return `{ ok: false, errors }` rather than throwing. Extend the existing company normalizer to preserve a nullable industry ID and trim company-specific impact.

- [ ] **Step 4: Run validation tests**

Run: `npm test -- src/lib/investment/industry-validation.test.ts src/lib/investment/research-validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit validation**

```powershell
git add -- src/lib/investment/industry-validation.ts src/lib/investment/industry-validation.test.ts src/lib/investment/research-validation.ts src/lib/investment/research-validation.test.ts
git commit -m "feat: validate lightweight industry research"
```

### Task 3: Industry CRUD API with ownership checks

**Files:**
- Create: `src/app/api/investment/industries/route.ts`
- Create: `src/app/api/investment/industries/route.test.ts`
- Create: `src/app/api/investment/industries/[id]/route.ts`
- Create: `src/app/api/investment/industries/[id]/route.test.ts`
- Create: `src/lib/investment/industry-api.ts`

- [ ] **Step 1: Write failing route tests**

Mock `requireUser` and Supabase chains. Verify list/create/update/delete are scoped with `.eq('user_id', user.id)`, validation failures return 400, missing records return 404, and delete returns the number of linked companies before removing the industry.

- [ ] **Step 2: Run route tests and verify failure**

Run: `npm test -- src/app/api/investment/industries/route.test.ts src/app/api/investment/industries/[id]/route.test.ts`
Expected: FAIL because route handlers do not exist.

- [ ] **Step 3: Implement routes using Next.js 16 conventions**

Use `RouteContext<'/api/investment/industries/[id]'>` and `const { id } = await context.params`. GET returns industries ordered by `updated_at desc`; POST inserts normalized data with current `user_id`; PATCH updates only an owned record; DELETE first counts owned linked company profiles, deletes only after explicit `confirm: true`, and relies on the foreign key to clear company links.

- [ ] **Step 4: Run route tests**

Run: `npm test -- src/app/api/investment/industries/route.test.ts src/app/api/investment/industries/[id]/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit industry CRUD API**

```powershell
git add -- src/app/api/investment/industries src/lib/investment/industry-api.ts
git commit -m "feat: add industry research API"
```

### Task 4: Child-record APIs

**Files:**
- Create: `src/app/api/investment/industries/[id]/companies/route.ts`
- Create: `src/app/api/investment/industries/[id]/companies/[itemId]/route.ts`
- Create: `src/app/api/investment/industries/[id]/indicators/route.ts`
- Create: `src/app/api/investment/industries/[id]/indicators/[itemId]/route.ts`
- Create: `src/app/api/investment/external-variables/route.ts`
- Create: `src/app/api/investment/external-variables/[id]/route.ts`
- Create: `src/app/api/investment/industry-children-routes.test.ts`

- [ ] **Step 1: Write failing child-route tests**

Verify parent industry ownership before create/list, child updates and deletes match both `user_id` and parent ID, linked company IDs must refer to an owned `research_profiles` row, and external-variable owner type must match exactly one owned parent.

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test -- src/app/api/investment/industry-children-routes.test.ts`
Expected: FAIL because the routes do not exist.

- [ ] **Step 3: Implement list/create/update/delete handlers**

Keep each handler small: authenticate, validate, verify owned parent, perform the scoped query, and return JSON with 400/404/500 status as appropriate. Use `RouteContext` with awaited params for every dynamic handler.

- [ ] **Step 4: Run child-route tests**

Run: `npm test -- src/app/api/investment/industry-children-routes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit child APIs**

```powershell
git add -- src/app/api/investment/industries src/app/api/investment/external-variables src/app/api/investment/industry-children-routes.test.ts
git commit -m "feat: add industry detail APIs"
```

### Task 5: Industry workspace UI

**Files:**
- Create: `src/app/investment/research/components/IndustryWorkspace.tsx`
- Create: `src/app/investment/research/components/IndustryWorkspace.test.tsx`
- Create: `src/app/investment/research/components/IndustryEditor.tsx`
- Create: `src/app/investment/research/components/IndustryCompaniesEditor.tsx`
- Create: `src/app/investment/research/components/IndustryIndicatorsEditor.tsx`
- Create: `src/app/investment/research/components/ExternalVariablesEditor.tsx`
- Modify: `src/app/investment/research/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing workspace test**

Render with mocked fetch. Assert the page exposes company/industry views, can create an industry with name only, loads a selected industry, renders the three-part industry map, and exposes core companies, indicators, and external variables without requiring them.

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/app/investment/research/components/IndustryWorkspace.test.tsx`
Expected: FAIL because the workspace does not exist.

- [ ] **Step 3: Implement the workspace and focused editors**

Use the existing left-list/right-detail pattern. Keep the industry master form explicitly saved. Use small modal or inline editors for repeatable items. Preserve input when a request fails and show errors through Ant Design `App.useApp().message`. Read `view=industry` from the URL without breaking existing `profile` and `tab` company deep links.

- [ ] **Step 4: Add responsive styling**

Use a three-column industry map above the existing tablet breakpoint and a one-column layout below it. Reuse existing card, list, and spacing tokens rather than introducing a new visual system.

- [ ] **Step 5: Run the UI test**

Run: `npm test -- src/app/investment/research/components/IndustryWorkspace.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit industry UI**

```powershell
git add -- src/app/investment/research src/app/globals.css
git commit -m "feat: add lightweight industry workspace"
```

### Task 6: Company association and company external variables

**Files:**
- Modify: `src/app/investment/research/components/ResearchEditor.tsx`
- Create: `src/app/investment/research/components/CompanyIndustrySection.tsx`
- Create: `src/app/investment/research/components/CompanyIndustrySection.test.tsx`
- Modify: `src/app/investment/research/page.tsx`
- Modify: `src/app/api/investment/research/route.ts`
- Modify: `src/app/api/investment/research/[id]/snapshots/route.ts`
- Modify: `src/lib/investment/research-validation.test.ts`

- [ ] **Step 1: Write failing company-association tests**

Verify an owned industry can be selected, an unowned industry ID is rejected by the company API, association removal saves `null`, the industry summary and link are shown, the stale-industry hint follows `industry.updated_at > company.updated_at`, and company external variables are scoped to the selected research profile.

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test -- src/app/investment/research/components/CompanyIndustrySection.test.tsx src/lib/investment/research-validation.test.ts`
Expected: FAIL because company industry UI and fields are absent.

- [ ] **Step 3: Enforce association ownership in the API**

Before upserting a company profile with a non-null industry ID, query `industry_profiles` for both ID and current `user_id`; return 400 if not found. Ensure the snapshot route continues serializing the extended profile so company-specific industry impact is retained.

- [ ] **Step 4: Implement the company section**

Add the industry selector, linked summary, last-updated display, industry navigation, company-specific impact text, stale hint, and `ExternalVariablesEditor` to the current research form. Do not add another company tab.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/app/investment/research/components/CompanyIndustrySection.test.tsx src/lib/investment/research-validation.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit company integration**

```powershell
git add -- src/app/investment/research src/app/api/investment/research src/lib/investment/research-validation.test.ts
git commit -m "feat: connect company and industry research"
```

### Task 7: Navigation, regression coverage, and final verification

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/navigation.test.ts`
- Modify: `src/components/shell/AppSidebar.test.tsx`
- Modify: `docs/life-os-mvp-release-checklist.md`

- [ ] **Step 1: Update failing navigation expectations first**

Change expected label from `公司研究` to `投资研究` while keeping `/investment/research`. Add an assertion that existing company deep links remain under the same selected navigation entry.

- [ ] **Step 2: Run navigation tests and verify failure**

Run: `npm test -- src/components/shell/navigation.test.ts src/components/shell/AppSidebar.test.tsx`
Expected: FAIL until the label is updated.

- [ ] **Step 3: Update navigation and release documentation**

Rename only the visible navigation label. Document migration `030_lightweight_industry_research.sql`, its additive behavior, and the fact that company research remains backward compatible.

- [ ] **Step 4: Run all focused investment-research tests**

Run: `npm test -- src/types/life-os.test.ts src/lib/investment/industry-validation.test.ts src/lib/investment/research-validation.test.ts src/app/api/investment/industries/route.test.ts src/app/api/investment/industries/[id]/route.test.ts src/app/api/investment/industry-children-routes.test.ts src/app/investment/research/components/IndustryWorkspace.test.tsx src/app/investment/research/components/CompanyIndustrySection.test.tsx src/components/shell/navigation.test.ts src/components/shell/AppSidebar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run repository verification**

Run: `npm run typecheck`
Expected: exit 0.

Run: `npm run lint`
Expected: exit 0 with no new lint errors.

Run: `npm test`
Expected: all tests pass; if unrelated pre-existing failures occur, record the exact failing files and verify all feature-focused tests still pass.

Run: `npm run build`
Expected: production build succeeds.

- [ ] **Step 6: Commit final integration**

```powershell
git add -- src/components/shell/navigation.ts src/components/shell/navigation.test.ts src/components/shell/AppSidebar.test.tsx docs/life-os-mvp-release-checklist.md
git commit -m "docs: finalize industry research integration"
```
