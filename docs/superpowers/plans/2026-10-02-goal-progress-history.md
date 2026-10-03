# Goal Progress History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve dated annual-goal progress updates while keeping each goal card synchronized to the latest milestone and next action.

**Architecture:** Add a user-owned `goal_progress_updates` table and an atomic database function that inserts history and updates the goal. Expose GET/POST through the existing goal route hierarchy and use one modal from the current goals page for entry and history.

**Tech Stack:** Next.js 16, React 19, Ant Design 6, Supabase/PostgreSQL, TypeScript, Vitest.

---

### Task 1: Progress model and validation
- [ ] Add failing validation tests for common and goal-type-specific fields.
- [ ] Add progress types and validation, then make tests pass.

### Task 2: Atomic persistence API
- [ ] Add failing GET/POST route tests.
- [ ] Add migration, RLS, atomic save function, and route implementation.
- [ ] Run route tests.

### Task 3: Existing-page modal
- [ ] Add failing component tests for recording and displaying history.
- [ ] Add the progress modal and wire it to each goal card.
- [ ] Run goal-page tests, lint, and production build.
