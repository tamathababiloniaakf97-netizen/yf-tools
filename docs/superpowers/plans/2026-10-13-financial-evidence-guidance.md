# Financial Evidence Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unobtrusive financial-evidence reminders to three core research fields.

**Architecture:** Extend the shared field guidance component with an optional second line, then configure only the three approved research fields. No data model or submission behavior changes.

**Tech Stack:** React, Ant Design, Vitest, Testing Library, TypeScript.

---

### Task 1: Financial evidence guidance

**Files:**
- Modify: `src/app/investment/components/FieldGuidance.tsx`
- Modify: `src/app/investment/research/components/ResearchEditor.tsx`
- Modify: `src/app/investment/research/components/ResearchEditor.test.tsx`

- [ ] Add a failing test that expects exactly three financial-evidence reminders and their approved copy.
- [ ] Extend `FieldGuidance` with an optional financial evidence line beneath the original guidance.
- [ ] Configure the three approved core fields and leave all others unchanged.
- [ ] Run the component tests, ESLint, TypeScript, and `git diff --check`.
