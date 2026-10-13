# Research Hypothesis and Evidence Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to edit existing research hypotheses and edit or delete existing evidence records.

**Architecture:** Reuse the existing Ant Design modal forms for create and edit modes. Keep the existing hypothesis item API, add a focused evidence item API, and scope every mutation by authenticated user ID.

**Tech Stack:** Next.js route handlers, React, Ant Design, Supabase, Vitest, Testing Library, TypeScript.

---

### Task 1: Evidence item API

**Files:**
- Create: `src/app/api/investment/evidence/[id]/route.ts`
- Create: `src/app/api/investment/evidence/[id]/route.test.ts`

- [x] Write failing route tests for authenticated PATCH, authenticated DELETE, and missing records.
- [x] Run `npm test -- "src/app/api/investment/evidence/[id]/route.test.ts"` and confirm failure because the route does not exist.
- [x] Implement PATCH using `normalizeEvidenceInput`, an ID and user-scoped Supabase update, and `maybeSingle()`.
- [x] Implement DELETE using an ID and user-scoped Supabase delete and `maybeSingle()`.
- [x] Re-run the route test and confirm all cases pass.

### Task 2: Reusable create/edit dialogs

**Files:**
- Modify: `src/app/investment/research/components/HypothesisEvidencePanel.tsx`
- Modify: `src/app/investment/research/components/HypothesisEvidencePanel.test.tsx`

- [x] Add failing component tests that open edit actions, verify form values are prefilled, and verify PATCH request URLs.
- [x] Run the component test and confirm it fails because edit actions are absent.
- [x] Track the hypothesis or evidence being edited, call `setFieldsValue` before opening the matching modal, and change modal titles according to mode.
- [x] Submit hypothesis edits to `/api/investment/research/{profileId}/hypotheses/{hypothesisId}` with PATCH.
- [x] Submit evidence edits to `/api/investment/evidence/{evidenceId}` with PATCH.
- [x] Add evidence deletion with the existing confirmation pattern and DELETE endpoint.
- [x] Re-run component tests and confirm they pass.

### Task 3: Verification

**Files:**
- Verify all files changed by Tasks 1–2.

- [x] Run targeted route, component, normalization, report, and PDF tests.
- [x] Run ESLint on changed TypeScript files.
- [x] Run `npx tsc --noEmit`.
- [x] Run `git diff --check`, review the final diff, and commit only relevant files.
