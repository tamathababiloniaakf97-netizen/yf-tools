# Goal Action Deadlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist and surface editable deadlines for annual-goal next actions.

**Architecture:** Add nullable deadline columns for backward compatibility, expose the deadline in both goal editing flows, then use the same field for dashboard urgency and due reminders.

**Tech Stack:** Next.js, React, TypeScript, Ant Design, Supabase/PostgreSQL, Vitest

---

### Task 1: Define and validate the deadline

**Files:** `src/types/life-os.ts`, `src/lib/goals/validation.ts`, `src/lib/goals/progress-update.ts`

- [x] Add `next_action_due_at` to current goals and progress snapshots.
- [x] Validate progress updates require an ISO date and preserve it in normalized output.
- [x] Verify validator tests fail before implementation and pass afterward.

### Task 2: Add editing and display controls

**Files:** `src/app/goals/components/GoalEditor.tsx`, `src/app/goals/components/GoalProgressModal.tsx`, `src/app/goals/components/GoalCard.tsx`

- [x] Add required date inputs beside the next action in both editing flows.
- [x] Show the current deadline on cards and the historical deadline in progress records.
- [x] Verify component tests fail before implementation and pass afterward.

### Task 3: Drive the dashboard and bell from the deadline

**Files:** `src/lib/dashboard/build-dashboard.ts`, `src/lib/goals/reminders.ts`, `src/app/api/reminders/due/route.ts`, `src/components/reminders/ReminderCenter.tsx`

- [x] Classify dashboard goal actions using their actual deadline.
- [x] Add today and overdue goal reminders to the reminder API and bell labels.
- [x] Verify reminder and dashboard tests fail before implementation and pass afterward.

### Task 4: Persist the deadline

**Files:** `supabase/migrations/021_goal_action_deadlines.sql`

- [x] Add nullable date columns and an active-goal lookup index.
- [x] Replace `save_goal_progress` so one transaction records the snapshot and updates the goal.
- [x] Run targeted tests, ESLint, diff checks, and the production build.
