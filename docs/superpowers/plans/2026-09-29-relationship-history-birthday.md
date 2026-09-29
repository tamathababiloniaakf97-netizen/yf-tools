# Relationship History and Birthday Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing relationship module with classmates, Gregorian/lunar birthdays and reminders, clearer field guidance, typed relationship history, and a visible contact history without replacing the current architecture.

**Architecture:** Keep `contacts` as the overwriteable current profile and `contact_interactions` as the append-only history. Add a backward-compatible migration, isolate birthday conversion/reminder logic in a pure module, reuse the current authenticated APIs, and present history in a focused drawer from the existing relationship list.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design 6, Supabase/PostgreSQL, Vitest/Testing Library.

---

### Task 1: Schema and shared relationship types

**Files:**
- Create: `supabase/migrations/008_relationship_history_birthdays.sql`
- Modify: `src/types/life-os.ts`
- Modify: `src/types/life-os.test.ts`

- [ ] **Step 1: Write failing shared-type assertions**

Add runtime assertions that `relationshipTypes` contains `classmate`, and add exported constants for birthday calendars and interaction types:

```ts
expect(relationshipTypes).toContain('classmate');
expect(birthdayCalendars).toEqual(['solar', 'lunar']);
expect(interactionTypes).toContain('gift_given');
expect(interactionTypes).toContain('advice_received');
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/types/life-os.test.ts`

Expected: FAIL because the new constants and values do not exist.

- [ ] **Step 3: Add types and a backward-compatible migration**

Define:

```ts
export const birthdayCalendars = ['solar', 'lunar'] as const;
export const interactionTypes = ['contact', 'gift_given', 'gift_received', 'advice_received', 'advice_given', 'help_received', 'help_given', 'other'] as const;
```

Extend `Contact` with nullable `birthday_calendar`, `birthday_year`, `birthday_month`, `birthday_day`, boolean `birthday_is_leap_month`, and boolean `birthday_reminder_enabled`. Extend `ContactInteraction` with `interaction_type`. Add the matching input properties.

Migration 008 must replace the relationship-type check constraint so `classmate` is accepted, add birthday fields and range/consistency checks, and add `interaction_type text not null default 'contact'` with an allowed-values check. Existing interactions must remain valid as `contact`.

- [ ] **Step 4: Run type tests and typecheck**

Run: `npm test -- src/types/life-os.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the schema and types**

```powershell
git add -- src/types/life-os.ts src/types/life-os.test.ts supabase/migrations/008_relationship_history_birthdays.sql
git commit -m "feat: model relationship history and birthdays"
```

### Task 2: Validate birthday and interaction inputs

**Files:**
- Modify: `src/lib/relationships/validation.ts`
- Modify: `src/lib/relationships/validation.test.ts`

- [ ] **Step 1: Add failing validation tests**

Cover valid Gregorian and lunar birthdays, partial birthdays, invalid month/day, leap-month use with a Gregorian birthday, `classmate`, every interaction type, and an invalid interaction type. Representative expectations:

```ts
expect(validateContactInput({ name: '张三', relationship_type: 'classmate', birthday_calendar: 'lunar', birthday_month: 8, birthday_day: 15, birthday_is_leap_month: false }).ok).toBe(true);
expect(validateContactInput({ name: '张三', relationship_type: 'friend', birthday_calendar: 'solar', birthday_month: 2 }).ok).toBe(false);
expect(validateContactInteractionInput({ occurred_at: '2026-09-29', interaction_type: 'gift_given', summary: '中秋节送茶' }).ok).toBe(true);
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test -- src/lib/relationships/validation.test.ts`

Expected: FAIL on the new birthday and interaction-type cases.

- [ ] **Step 3: Implement minimal validation and normalization**

Accept birthday only when calendar, month, and day are all present; allow the whole birthday to be empty; validate Gregorian month/day with a leap-safe reference year; validate lunar ranges as month 1-12 and day 1-30; reject `birthday_is_leap_month` for Gregorian dates. Default `birthday_reminder_enabled` to true and `interaction_type` to `contact` for backward compatibility.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/lib/relationships/validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit validation**

```powershell
git add -- src/lib/relationships/validation.ts src/lib/relationships/validation.test.ts
git commit -m "feat: validate relationship birthdays and events"
```

### Task 3: Birthday occurrence and reminder logic

**Files:**
- Create: `src/lib/relationships/birthdays.ts`
- Create: `src/lib/relationships/birthdays.test.ts`
- Modify: `src/lib/reminders/due-reminders.ts`
- Modify: `src/components/reminders/ReminderCenter.tsx`

- [ ] **Step 1: Write failing birthday tests**

Test same-year and next-year Gregorian birthdays, Feb 29 fallback to Feb 28 in non-leap years, lunar conversion by scanning Gregorian dates with `Intl.DateTimeFormat('zh-CN-u-ca-chinese')`, leap lunar matching and fallback to the non-leap month, disabled reminders, seven-day reminders, and birthday-day reminders.

```ts
expect(nextBirthdayOccurrence(solarContact(10, 6), new Date('2026-09-29T04:00:00Z'))).toBe('2026-10-06');
expect(buildBirthdayReminders([solarContact(10, 6)], new Date('2026-09-29T04:00:00Z'))[0].kind).toBe('birthday_upcoming');
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/lib/relationships/birthdays.test.ts`

Expected: FAIL because the birthday functions do not exist.

- [ ] **Step 3: Implement pure birthday functions**

Export `nextBirthdayOccurrence(contact, now)` and `buildBirthdayReminders(contacts, now)`. Use Asia/Shanghai date boundaries. For lunar birthdays, inspect each candidate Gregorian date in the current and next Gregorian year with Chinese-calendar `formatToParts`; match month, day, and leap-month status. If a requested leap month does not exist in that lunar year, fall back to the same ordinary lunar month/day. Return reminders only at exactly seven days before or on the birthday.

Extend `DueReminderKind` with `birthday_upcoming` and `birthday_today`, using the existing `DueReminder` interface and `/relationships?contact=<id>` href.

- [ ] **Step 4: Add reminder labels and run tests**

Map the new kinds in `ReminderCenter` to `生日将近` and `今天生日`. Run:

`npm test -- src/lib/relationships/birthdays.test.ts src/lib/reminders/due-reminders.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit birthday logic**

```powershell
git add -- src/lib/relationships/birthdays.ts src/lib/relationships/birthdays.test.ts src/lib/reminders/due-reminders.ts src/components/reminders/ReminderCenter.tsx
git commit -m "feat: calculate relationship birthday reminders"
```

### Task 4: Merge birthdays into the authenticated reminder API

**Files:**
- Modify: `src/app/api/reminders/due/route.ts`
- Modify: `src/lib/relationships/reminders.test.ts`

- [ ] **Step 1: Add a failing integration-level reminder test**

Extend reminder tests to assert that a contact with a birthday seven days away produces a birthday reminder alongside contact follow-up reminders and that disabled birthday reminders are omitted.

- [ ] **Step 2: Run the reminder tests and verify failure**

Run: `npm test -- src/lib/relationships/reminders.test.ts src/lib/relationships/birthdays.test.ts`

Expected: FAIL until the merged result includes birthday reminders.

- [ ] **Step 3: Merge birthday reminders in the route**

Fetch the existing approved contacts once, then return:

```ts
return NextResponse.json([
  ...buildDueReminders(plans),
  ...buildRelationshipReminders(contacts),
  ...buildBirthdayReminders(contacts),
]);
```

Preserve authentication, RLS behavior, and existing plan/contact failure handling.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- src/lib/relationships src/lib/reminders`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit reminder integration**

```powershell
git add -- src/app/api/reminders/due/route.ts src/lib/relationships/reminders.test.ts
git commit -m "feat: surface birthday reminders"
```

### Task 5: Update the contact and relationship-event forms

**Files:**
- Modify: `src/app/relationships/components/ContactEditor.tsx`
- Modify: `src/app/relationships/components/InteractionEditor.tsx`
- Create: `src/app/relationships/components/InteractionEditor.test.tsx`
- Modify: `src/app/relationships/components/ContactList.tsx`
- Modify: `src/app/relationships/components/ContactList.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Assert the contact editor exposes `同学`, calendar type, birthday fields and the agreed labels. Assert the interaction editor exposes `往来类型`, changes the content placeholder for `gift_given` and `advice_received`, and uses `我的下一步行动` / `计划联系日期`.

- [ ] **Step 2: Run component tests and verify failure**

Run: `npm test -- src/app/relationships/components/ContactList.test.tsx src/app/relationships/components/InteractionEditor.test.tsx`

Expected: FAIL on the new controls and labels.

- [ ] **Step 3: Implement the agreed form copy and controls**

Add `classmate` to the relationship select. Add birthday calendar/year/month/day, lunar leap-month, and reminder toggle without introducing a large date picker abstraction. Rename and add helper text exactly as specified in the design. Rename `记录联系` to `记录往来`, add the interaction type select, and use a small pure map for dynamic content placeholders.

- [ ] **Step 4: Run component tests**

Run: `npm test -- src/app/relationships/components/ContactList.test.tsx src/app/relationships/components/InteractionEditor.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit forms**

```powershell
git add -- src/app/relationships/components/ContactEditor.tsx src/app/relationships/components/InteractionEditor.tsx src/app/relationships/components/InteractionEditor.test.tsx src/app/relationships/components/ContactList.tsx src/app/relationships/components/ContactList.test.tsx
git commit -m "feat: improve relationship entry forms"
```

### Task 6: Display contact profile and append-only history

**Files:**
- Create: `src/app/relationships/components/ContactDetail.tsx`
- Create: `src/app/relationships/components/ContactDetail.test.tsx`
- Modify: `src/app/relationships/components/ContactList.tsx`
- Modify: `src/app/relationships/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing detail-view tests**

Render a contact and multiple interactions. Assert current profile fields appear once, interaction labels appear in descending date order, and each historical summary remains separately visible.

```ts
expect(screen.getAllByText(/2026-09-/)[0]).toHaveTextContent('2026-09-29');
expect(screen.getByText('我送礼/表达感谢')).toBeInTheDocument();
expect(screen.getByText('我向对方请教')).toBeInTheDocument();
```

- [ ] **Step 2: Run the detail test and verify failure**

Run: `npm test -- src/app/relationships/components/ContactDetail.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the detail drawer and loading flow**

Create an Ant Design drawer with a current-profile section and a timeline/history section. Add a `查看` action to each contact. When opened, fetch `GET /api/relationships/[id]/interactions`, show loading and retryable error states, and pass the returned records to `ContactDetail`. Respect `?contact=<id>` so birthday reminders can open the matching contact.

- [ ] **Step 4: Run UI tests and typecheck**

Run: `npm test -- src/app/relationships/components`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit history UI**

```powershell
git add -- src/app/relationships/components/ContactDetail.tsx src/app/relationships/components/ContactDetail.test.tsx src/app/relationships/components/ContactList.tsx src/app/relationships/page.tsx src/app/globals.css
git commit -m "feat: show relationship history"
```

### Task 7: Documentation and full verification

**Files:**
- Modify: `docs/life-os-mvp-release-checklist.md`

- [ ] **Step 1: Update the release checklist**

Add migration 008, classmate creation, Gregorian/lunar/leap-month birthdays, seven-day and birthday-day reminders, all relationship-event types, history ordering, existing-data compatibility, and privacy checks.

- [ ] **Step 2: Run the complete automated suite**

Run: `npm test`

Expected: all tests pass.

Run: `npm run typecheck`

Expected: PASS.

Run targeted lint for all changed relationship/reminder/type files; expected zero errors. Run `npm run build`; expected a successful production build.

- [ ] **Step 3: Perform authenticated manual acceptance**

After applying migration 008, create a classmate with a Gregorian birthday, a contact with a lunar birthday, and history entries for a gift and advice. Confirm the history is visible and ordered, current next action updates, seven-day/today birthday reminders route to the correct contact, and existing contacts still load.

- [ ] **Step 4: Commit the release checklist**

```powershell
git add -- docs/life-os-mvp-release-checklist.md
git commit -m "docs: add relationship history release checks"
```
