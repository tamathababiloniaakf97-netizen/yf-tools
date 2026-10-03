# Monthly Finance Entry Review Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a persistent month-end finance-entry review action on the home page and let the user confirm the selected month from the finance entry tab.

**Architecture:** A pure Shanghai-calendar function derives the single actionable review month from a persisted start month and reviewed months. A dedicated authenticated API owns review reads and idempotent writes; the home page only aggregates the derived action, while the finance page owns confirmation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL RLS, Ant Design 6, Vitest, Testing Library.

---

### Task 1: Persisted review state

**Files:**
- Create: `supabase/migrations/017_household_entry_reviews.sql`
- Modify: `src/types/household-finance.ts`
- Modify: `src/app/api/household-finance/route.ts`

- [ ] Add `entry_review_started_month` to settings, backfill existing settings with the migration month, create `household_entry_reviews` with `(user_id, period_month)` uniqueness, RLS, own-row policy, and authenticated grants.
- [ ] When enabling household finance, set the review start to the first day of the enabled month.
- [ ] Add `HouseholdEntryReview` and settings response types.

### Task 2: Pure reminder calculation

**Files:**
- Create: `src/lib/household-finance/entry-review-reminder.test.ts`
- Create: `src/lib/household-finance/entry-review-reminder.ts`

- [ ] Write failing tests for 31-day, 30-day, February/leap-year, Shanghai UTC boundary, reviewed current month, overdue earliest month, and disabled/pre-start states.
- [ ] Run `npm test -- src/lib/household-finance/entry-review-reminder.test.ts` and verify RED.
- [ ] Implement `buildEntryReviewReminder(now, startedMonth, reviews)` returning one normalized reminder or `null`.
- [ ] Re-run the test and verify GREEN.

### Task 3: Authenticated review API

**Files:**
- Create: `src/app/api/household-finance/entry-reviews/route.ts`
- Create: `src/app/api/household-finance/entry-reviews/route.test.ts`

- [ ] Write failing route tests for unauthenticated access, GET own data, invalid/pre-start POST, and idempotent upsert.
- [ ] Implement GET and POST using the server-side authenticated Supabase client; normalize `period_month` as `YYYY-MM-01` and never accept `user_id` from the client.
- [ ] Run the route test and verify GREEN.

### Task 4: Home-page aggregation

**Files:**
- Modify: `src/lib/dashboard/build-dashboard.ts`
- Modify: `src/lib/dashboard/build-dashboard.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] Extend dashboard source with `finance`, allow an optional finance reminder input, and test correct title, deadline, urgency and `/finance?tab=entry&period=YYYY-MM` href.
- [ ] Load `/api/household-finance/entry-reviews` as a fourth independent source and derive the reminder from the same mounted `now` instant.
- [ ] Render source label “家庭财务” and current-month status “月底检查”; retain “已过期” for overdue months.
- [ ] Verify homepage and dashboard tests pass while the three existing domain links remain unchanged.

### Task 5: Finance-page confirmation flow

**Files:**
- Create: `src/app/finance/components/EntryReviewStatus.tsx`
- Create: `src/app/finance/components/EntryReviewStatus.test.tsx`
- Modify: `src/app/finance/page.tsx`
- Create or modify: `src/app/finance/page.test.tsx`

- [ ] Write failing tests for the unreviewed button, reviewed date, successful POST refresh, and failure message.
- [ ] Implement a focused status component with an idempotent confirmation request.
- [ ] Read `tab` and `period` using `useSearchParams`, initialize month/year and active tab, and pass the selected month review into the component.
- [ ] Verify query parameters open the monthly entry tab and historical target month.

### Task 6: Verification

- [ ] Run targeted tests for reminder logic, route, dashboard, homepage, review component and finance page.
- [ ] Run ESLint on changed TypeScript files and `git diff --check`.
- [ ] Run `npm run build`, `npm run typecheck`, and `npm test`; report unrelated pre-existing failures separately.
