# Decision Draft Export and Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow saved draft decisions to export clearly labeled PDFs and allow finalized decisions to be copied into new editable drafts without altering history.

**Architecture:** Keep export in the existing decision PDF route and add status metadata to the existing report model. Add one pure copy-normalization helper and a focused POST route that inserts a draft, then expose it through a small client button on finalized decision pages.

**Tech Stack:** Next.js App Router route handlers, React, Ant Design, Supabase, PDFKit, Vitest, Testing Library, TypeScript.

---

### Task 1: Decision report status and draft PDF

**Files:**
- Modify: `src/lib/investment/decision-report.ts`
- Modify: `src/lib/investment/decision-report.test.ts`
- Modify: `src/lib/investment/decision-pdf.ts`
- Modify: `src/lib/investment/decision-pdf.test.ts`

- [ ] Add failing report tests asserting a draft produces `status: 'draft'`, `statusLabel: '草稿'`, and `recordedAt` from `updated_at`; finalized produces `已定稿`.
- [ ] Run `npx vitest run src/lib/investment/decision-report.test.ts` and confirm the missing metadata assertions fail.
- [ ] Extend `DecisionReport.meta` and `buildDecisionReport` with status metadata and a neutral `recordedAt` field.
- [ ] Add failing PDF helper tests for status-dependent title, time label, and disclaimer text.
- [ ] Run `npx vitest run src/lib/investment/decision-pdf.test.ts` and confirm the missing helper failures.
- [ ] Add pure formatting helpers and use them so draft PDFs display `投资决策草稿`, `最后保存时间`, and a changeable-draft notice; finalized PDFs retain `已定稿投资决策报告`, `定稿时间`, and the immutable-record notice.
- [ ] Run both decision report and PDF tests and confirm they pass.

### Task 2: Export saved drafts

**Files:**
- Modify: `src/app/api/investment/decisions/[id]/export/route.ts`
- Modify: `src/app/api/investment/decisions/[id]/export/route.test.ts`
- Modify: `src/app/investment/decisions/[id]/page.tsx`

- [ ] Change the route test so a draft with an associated research snapshot returns a PDF response instead of 409; retain ownership, missing-decision, and missing-snapshot checks.
- [ ] Run `npx vitest run src/app/api/investment/decisions/[id]/export/route.test.ts` and confirm the draft-export test fails with 409.
- [ ] Remove only the finalized-status restriction from the export route.
- [ ] Change the page condition from `decision.status === 'finalized'` to `decision.id` so every saved decision shows the existing export button.
- [ ] Run the route and export-button tests and confirm they pass.

### Task 3: Copy a finalized decision to a draft

**Files:**
- Modify: `src/lib/investment/decision-api.ts`
- Modify: `src/lib/investment/decision-api.test.ts`
- Create: `src/app/api/investment/decisions/[id]/copy/route.ts`

- [ ] Add a failing unit test for `copyFinalizedDecisionToDraft`, asserting copied content and research snapshot are retained while `status` becomes `draft`, `decision_date` becomes `null`, `source_type` becomes `manual`, and `source_ref` becomes the source id.
- [ ] Run `npx vitest run src/lib/investment/decision-api.test.ts` and confirm the helper is missing.
- [ ] Implement the pure copy helper using the existing decision fields and no new schema.
- [ ] Implement the authenticated POST route: load the owned source record, return 404 when missing, return 409 unless finalized, normalize the copied input, insert it for the current user, and return 201 with the new draft.
- [ ] Run the decision API tests and TypeScript checking.

### Task 4: Copy button and navigation

**Files:**
- Create: `src/app/investment/decisions/components/DecisionCopyButton.tsx`
- Create: `src/app/investment/decisions/components/DecisionCopyButton.test.tsx`
- Modify: `src/app/investment/decisions/[id]/page.tsx`

- [ ] Add a failing component test asserting a click POSTs to `/api/investment/decisions/{id}/copy`, disables while loading, and navigates to the returned draft id; add an error-response assertion.
- [ ] Run the new component test and confirm it fails because the component does not exist.
- [ ] Implement the focused button with Ant Design loading and error feedback.
- [ ] Render it only for finalized decisions next to the always-available PDF button.
- [ ] Run the copy-button and existing decision component tests.

### Task 5: PDF visual and regression verification

**Files:**
- Generated output: `output/pdf/investment-decision-sample.pdf`

- [ ] Generate a finalized PDF fixture and a draft variant through the renderer test fixture.
- [ ] Render cover and representative content pages with Poppler and visually verify state labels, time labels, Chinese text, spacing, page numbers, and absence of clipping.
- [ ] Run `npx vitest run src/lib/investment/decision-api.test.ts src/lib/investment/decision-report.test.ts src/lib/investment/decision-pdf.test.ts src/app/api/investment/decisions/[id]/export/route.test.ts src/app/investment/decisions/components/DecisionPdfExportButton.test.tsx src/app/investment/decisions/components/DecisionCopyButton.test.tsx`.
- [ ] Run `npx eslint` on changed source and test files, `npx tsc --noEmit`, and `git diff --check`.
- [ ] Commit the implementation with `git commit -m "feat: export and revise investment decisions"`.
