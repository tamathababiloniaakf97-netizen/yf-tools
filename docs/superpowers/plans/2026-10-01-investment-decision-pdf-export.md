# Investment Decision PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users download a polished, immutable PDF for a finalized investment decision and its linked research snapshot.

**Architecture:** A pure report builder converts a finalized decision and stored snapshot into stable display data. A PDFKit renderer owns pagination and typography. A user-scoped route verifies finalized status and snapshot ownership, while a client button handles download and appears only for finalized decisions.

**Tech Stack:** Next.js App Router, TypeScript, PDFKit, Supabase, React, Ant Design, Vitest, Poppler visual verification.

---

### Task 1: Build stable decision report data

**Files:**
- Create: `src/lib/investment/decision-report.ts`
- Create: `src/lib/investment/decision-report.test.ts`

- [ ] Write failing tests for decision labels, immutable snapshot content, invalid filename character replacement, and decision-date filename fallback.
- [ ] Run the focused test and confirm it fails because the report module does not exist.
- [ ] Implement the typed report builder and filename helper.
- [ ] Run the focused test and confirm it passes.

### Task 2: Render the report as PDF

**Files:**
- Create: `src/lib/investment/decision-pdf.ts`
- Create: `src/lib/investment/decision-pdf.test.ts`

- [ ] Write a failing renderer test for a valid multi-section PDF buffer.
- [ ] Run the focused test and confirm it fails because the renderer does not exist.
- [ ] Implement the PDFKit renderer using the existing Chinese font, colors, margins, pagination, headers, and footers.
- [ ] Run the focused test and confirm it passes.
- [ ] Generate one representative PDF under `output/pdf/`, render every page to PNG, and inspect the result.

### Task 3: Add ownership-scoped export route

**Files:**
- Create: `src/app/api/investment/decisions/[id]/export/route.ts`
- Create: `src/app/api/investment/decisions/[id]/export/route.test.ts`

- [ ] Write failing route tests for unauthenticated access, missing decision, draft rejection, missing snapshot, ownership scoping, response headers, and successful rendering.
- [ ] Run the focused route test and confirm it fails because the route does not exist.
- [ ] Implement the read-only Node.js route.
- [ ] Run the focused route test and confirm it passes.

### Task 4: Add finalized-only download action

**Files:**
- Create: `src/app/investment/decisions/components/DecisionPdfExportButton.tsx`
- Create: `src/app/investment/decisions/components/DecisionPdfExportButton.test.tsx`
- Modify: `src/app/investment/decisions/[id]/page.tsx`

- [ ] Write a failing component test for download, error handling, object URL cleanup, and filename.
- [ ] Run the focused test and confirm it fails because the component does not exist.
- [ ] Implement the button and render it beside “转成投资待办” only when the decision is finalized.
- [ ] Run the focused component and decision tests.

### Task 5: Verify integration

**Files:**
- Modify if required: files listed above only.

- [ ] Run all decision report, PDF, route, button, and existing decision validation tests.
- [ ] Run targeted ESLint.
- [ ] Run the production build.
- [ ] Open a finalized decision in the local browser and verify the button placement and download behavior.
