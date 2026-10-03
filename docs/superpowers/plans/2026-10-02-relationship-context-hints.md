# Relationship Context Hints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent, concrete writing guidance below the existing family and work context fields.

**Architecture:** Keep the existing contact model and API unchanged. Add presentation-only `extra` text to the two existing Ant Design form items and protect the copy with a component test.

**Tech Stack:** Next.js, React, TypeScript, Ant Design, Vitest, Testing Library

---

### Task 1: Add and verify the field guidance

**Files:**
- Modify: `src/app/relationships/components/ContactEditor.test.tsx`
- Modify: `src/app/relationships/components/ContactEditor.tsx`

- [ ] **Step 1: Write the failing test**

Add assertions for `孩子几个及年龄阶段` and `所在行业与公司` to the existing editor rendering test.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/relationships/components/ContactEditor.test.tsx`

Expected: FAIL because neither help text exists yet.

- [ ] **Step 3: Write minimal implementation**

Add `extra` copy to `family_context` and `work_context` form items. Do not change field names, submission behavior, types, API routes, or database schema.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/relationships/components/ContactEditor.test.tsx`

Expected: PASS.

- [ ] **Step 5: Verify code quality and compilation**

Run ESLint on both modified source files, then run `npm run build`. Both commands must exit with code 0.
