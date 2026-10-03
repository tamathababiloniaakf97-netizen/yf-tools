# Action Workbench Time and Daily Thought Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the home page to Action Workbench and add Shanghai-calendar year/month progress plus a stable, curated daily thought without changing action aggregation behavior.

**Architecture:** Add two pure dashboard modules: one converts an instant into Shanghai date progress, and one selects a validated daily thought from a static seven-theme catalog. Render both through focused presentational components above the existing action list; client state supplies the current instant after mount to avoid server/client hydration drift.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, CSS Grid, Vitest, Testing Library.

---

### Task 1: Shanghai year and month progress

**Files:**
- Create: `src/lib/dashboard/time-progress.test.ts`
- Create: `src/lib/dashboard/time-progress.ts`

- [ ] **Step 1: Write failing tests**

Define tests for `buildTimeProgress(now)` that assert the exact Shanghai date label, weekday, year day, year total, year remaining, month day, month total, month remaining, and rounded percentages for:

```ts
new Date('2026-10-02T08:00:00+08:00')
new Date('2024-02-29T12:00:00+08:00')
new Date('2026-12-31T23:00:00+08:00')
new Date('2026-10-01T16:30:00Z') // 2026-10-02 in Shanghai
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/dashboard/time-progress.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure calculator**

Export:

```ts
export interface TimeProgress {
  dateKey: string;
  dateLabel: string;
  weekdayLabel: string;
  year: number;
  yearDay: number;
  yearTotalDays: number;
  yearRemainingDays: number;
  yearPercent: number;
  month: number;
  monthDay: number;
  monthTotalDays: number;
  monthRemainingDays: number;
  monthPercent: number;
}

export function buildTimeProgress(now: Date): TimeProgress;
```

Use `Intl.DateTimeFormat(..., { timeZone: 'Asia/Shanghai' })` for date parts, UTC date arithmetic for calendar counts, and `Math.round(value * 10) / 10` for one-decimal percentages.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/lib/dashboard/time-progress.test.ts`

Expected: all tests PASS.

### Task 2: Curated daily thought selection

**Files:**
- Create: `src/lib/dashboard/daily-thought.test.ts`
- Create: `src/lib/dashboard/daily-thoughts.ts`
- Create: `src/lib/dashboard/daily-thought.ts`

- [ ] **Step 1: Write failing selection and catalog tests**

Assert that the catalog contains exactly seven weekday themes and at least five valid entries per theme; every entry has a unique id, nonblank text, attribution, reflection, and source note. Test that the same Shanghai date returns the same entry, five successive weeks on the same weekday return five distinct ids, weekday-to-theme mapping is correct, and an empty/invalid catalog returns the neutral fallback.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/lib/dashboard/daily-thought.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement types, validation, and deterministic selection**

Export `DailyThoughtTheme`, `DailyThought`, `dailyThoughts`, and:

```ts
export function selectDailyThought(
  now: Date,
  catalog: DailyThought[] = dailyThoughts,
): DailyThought;
```

Derive the Shanghai `YYYY-MM-DD` key and weekday, filter valid entries for that weekday theme, and select `Math.floor(daySerial / 7) % themeEntries.length`. Never use `Math.random()`.

- [ ] **Step 4: Add the curated 35-entry catalog**

Add five concise entries for each approved theme. Use original Chinese summaries for Duan Yongping, Buffett, Munger, and Naval unless a short primary-source statement has been verified. Store a short source note for every attributed summary. Parenting, aesthetics, health, and reflection entries use clearly named principle summaries rather than invented celebrity quotations.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/lib/dashboard/daily-thought.test.ts`

Expected: all catalog and selection tests PASS.

### Task 3: Presentational dashboard cards

**Files:**
- Create: `src/app/components/TimeProgressCard.tsx`
- Create: `src/app/components/DailyThoughtCard.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add component expectations to the home-page test**

Use fake system time `2026-10-02T08:00:00+08:00`. Assert visible text includes `2026年10月2日`, `星期五`, `距离年末还有90天`, `本月剩余29`, `每日一念`, one theme tag, and `今日自问`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL because the cards are not rendered.

- [ ] **Step 3: Implement focused presentational components**

`TimeProgressCard` accepts `TimeProgress` and renders the date, two Ant Design progress bars, exact day counts, and accessible labels. `DailyThoughtCard` accepts `DailyThought`, renders text without quotation marks for summaries, attribution, theme tag, and reflection.

- [ ] **Step 4: Add responsive styles**

Add `.workbench-insight-grid` as a two-column grid with a 16px gap and bottom margin. Under 991px, switch to one column. Ensure card content uses `min-width: 0` and long text wraps.

### Task 4: Integrate the home page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Integrate time state after mount**

Rename the title to `行动工作台`, change the future urgency label from `即将到期` to `已安排`, and set a `now` state in the existing effect before loading remote sources. Compute `TimeProgress` and `DailyThought` from that same instant so both use one Shanghai calendar day.

- [ ] **Step 2: Render the two cards before alerts and actions**

Use the responsive insight grid. Until the client instant exists, render stable card skeletons instead of calculating from server time.

- [ ] **Step 3: Verify the home page and existing action behavior**

Run: `npm test -- src/app/page.test.tsx src/lib/dashboard/build-dashboard.test.ts`

Expected: all tests PASS and the existing action links remain unchanged.

### Task 5: Full verification

**Files:**
- Modify only when verification reveals an in-scope defect.

- [ ] **Step 1: Run targeted verification**

Run: `npm test -- src/lib/dashboard/time-progress.test.ts src/lib/dashboard/daily-thought.test.ts src/app/page.test.tsx src/lib/dashboard/build-dashboard.test.ts`

Expected: PASS.

- [ ] **Step 2: Run production checks**

Run: `npm run build`

Expected: exit 0.

Run: `npm run typecheck`

Expected: either exit 0 or only the already documented unrelated life-training / investment overview test errors; no new errors from this feature.

- [ ] **Step 3: Run the complete test suite**

Run: `npm test`

Expected: all implemented suites pass; if the two pre-existing life-training suites still reference missing modules, report them separately and do not attribute them to this feature.

- [ ] **Step 4: Inspect changes**

Run: `git diff --check` and inspect `git status --short`.

Expected: no whitespace errors and no unintended changes outside this feature or pre-existing working-tree edits.
