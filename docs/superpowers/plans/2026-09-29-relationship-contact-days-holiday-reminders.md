# Relationship Contact Days and Holiday Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show elapsed days since the last contact and generate opt-in Spring Festival, Dragon Boat Festival, and Mid-Autumn Festival contact reminders during the three-day lead window.

**Architecture:** Extend `contacts` with one additive boolean flag and keep elapsed days and holiday reminders derived rather than persisted. Put date calculations in focused relationship helpers, compose holiday reminders into the existing reminder pipeline, and reuse the existing contact editor and list.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Ant Design, Supabase/PostgreSQL, Vitest, React Testing Library

---

### Task 1: Add the opt-in contact field safely

**Files:**
- Create: `supabase/migrations/011_relationship_holiday_reminders.sql`
- Modify: `src/types/life-os.ts`
- Modify: `src/lib/relationships/validation.test.ts`
- Modify: `src/lib/relationships/validation.ts`

- [ ] **Step 1: Write the failing validation test**

Add assertions that an omitted `holiday_contact_reminder_enabled` becomes `false` and an explicit `true` is preserved.

```ts
it('defaults holiday contact reminders off and preserves an explicit opt-in', () => {
  expect(validateContactInput({ name: '甲', relationship_type: 'friend' }))
    .toMatchObject({ ok: true, value: { holiday_contact_reminder_enabled: false } });
  expect(validateContactInput({ name: '乙', relationship_type: 'friend', holiday_contact_reminder_enabled: true }))
    .toMatchObject({ ok: true, value: { holiday_contact_reminder_enabled: true } });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run src/lib/relationships/validation.test.ts --maxWorkers=1`

Expected: the new assertion fails because the normalized value lacks `holiday_contact_reminder_enabled`.

- [ ] **Step 3: Add the type, validation default, and additive migration**

Add `holiday_contact_reminder_enabled: boolean` to `Contact`, include it in `ContactInput`, and normalize it with `input.holiday_contact_reminder_enabled ?? false`.

Create migration:

```sql
alter table public.contacts
  add column if not exists holiday_contact_reminder_enabled boolean not null default false;
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run src/lib/relationships/validation.test.ts --maxWorkers=1`

Expected: all relationship validation tests pass.

- [ ] **Step 5: Commit the data model change**

```powershell
git add -- supabase/migrations/011_relationship_holiday_reminders.sql src/types/life-os.ts src/lib/relationships/validation.ts src/lib/relationships/validation.test.ts
git commit -m "feat: add holiday contact reminder preference"
```

### Task 2: Calculate elapsed contact days

**Files:**
- Create: `src/lib/relationships/contact-days.test.ts`
- Create: `src/lib/relationships/contact-days.ts`
- Modify: `src/app/relationships/components/ContactList.test.tsx`
- Modify: `src/app/relationships/components/ContactList.tsx`

- [ ] **Step 1: Write failing helper tests**

Test same-day, multi-day, year-boundary, and missing-date cases using date-only strings.

```ts
expect(contactDaysLabel('2026-09-29', '2026-09-29')).toBe('0天');
expect(contactDaysLabel('2026-09-09', '2026-09-29')).toBe('20天');
expect(contactDaysLabel('2025-09-08', '2026-09-29')).toBe('386天');
expect(contactDaysLabel(null, '2026-09-29')).toBe('未记录');
```

- [ ] **Step 2: Run the helper test and verify RED**

Run: `npx vitest run src/lib/relationships/contact-days.test.ts --maxWorkers=1`

Expected: module resolution fails because `contact-days.ts` does not exist.

- [ ] **Step 3: Implement the minimal date-only helper**

Parse `YYYY-MM-DD` at UTC midnight, subtract timestamps, clamp future values to zero, divide by 86,400,000, and return either `${days}天` or `未记录`.

- [ ] **Step 4: Run the helper test and verify GREEN**

Run: `npx vitest run src/lib/relationships/contact-days.test.ts --maxWorkers=1`

Expected: all helper cases pass.

- [ ] **Step 5: Write the failing list rendering test**

Render one contacted and one never-contacted person and assert `20天` and `未记录` appear in the full-contact list.

- [ ] **Step 6: Run the component test and verify RED**

Run: `npx vitest run src/app/relationships/components/ContactList.test.tsx --maxWorkers=1`

Expected: the elapsed-day labels are absent.

- [ ] **Step 7: Render the low-emphasis elapsed-day tag**

Pass `today` into the internal list renderer and add a small neutral `Tag` next to the relationship type using `contactDaysLabel(contact.last_contact_at, today)`.

- [ ] **Step 8: Run component and helper tests and verify GREEN**

Run: `npx vitest run src/lib/relationships/contact-days.test.ts src/app/relationships/components/ContactList.test.tsx --maxWorkers=1`

Expected: both test files pass.

- [ ] **Step 9: Commit the list feature**

```powershell
git add -- src/lib/relationships/contact-days.ts src/lib/relationships/contact-days.test.ts src/app/relationships/components/ContactList.tsx src/app/relationships/components/ContactList.test.tsx
git commit -m "feat: show days since last contact"
```

### Task 3: Generate traditional holiday reminders

**Files:**
- Create: `src/lib/relationships/holidays.test.ts`
- Create: `src/lib/relationships/holidays.ts`
- Modify: `src/lib/relationships/reminders.test.ts`
- Modify: `src/lib/relationships/reminders.ts`
- Modify: `src/lib/reminders/due-reminders.ts`

- [ ] **Step 1: Write failing holiday occurrence tests**

Verify the Gregorian dates for 2026 Spring Festival (`2026-02-17`), Dragon Boat Festival (`2026-06-19`), and Mid-Autumn Festival (`2026-09-25`) using the Chinese calendar formatter.

- [ ] **Step 2: Run holiday tests and verify RED**

Run: `npx vitest run src/lib/relationships/holidays.test.ts --maxWorkers=1`

Expected: module resolution fails because `holidays.ts` does not exist.

- [ ] **Step 3: Implement reusable holiday occurrence calculation**

Scan the Gregorian year with `Intl.DateTimeFormat('zh-CN-u-ca-chinese')`, match ordinary lunar months `正月`, `五月`, and `八月`, and return `{ key, name, date }` records for the three fixed festivals.

- [ ] **Step 4: Run holiday tests and verify GREEN**

Run: `npx vitest run src/lib/relationships/holidays.test.ts --maxWorkers=1`

Expected: all three 2026 dates pass.

- [ ] **Step 5: Write failing reminder-window tests**

Cover opt-in, opt-out, pending contacts, the three-day start, the holiday day, post-holiday exclusion, and suppression when `last_contact_at` is within the window. Assert one reminder per contact and holiday with kind `relationship_holiday` and link `/relationships?contact=<id>`.

- [ ] **Step 6: Run relationship reminder tests and verify RED**

Run: `npx vitest run src/lib/relationships/reminders.test.ts --maxWorkers=1`

Expected: no holiday reminders are returned.

- [ ] **Step 7: Implement and compose holiday reminders**

Add `relationship_holiday` to `DueReminderKind`, implement `buildHolidayContactReminders`, and include its result in `buildAllRelationshipReminders`. Generate stable IDs as `holiday:<contact-id>:<holiday-key>:<date>` and titles as `<节日名>将至，考虑联系<姓名>`.

- [ ] **Step 8: Run reminder tests and verify GREEN**

Run: `npx vitest run src/lib/relationships/holidays.test.ts src/lib/relationships/reminders.test.ts src/lib/reminders/due-reminders.test.ts --maxWorkers=1`

Expected: all reminder tests pass.

- [ ] **Step 9: Commit holiday reminder logic**

```powershell
git add -- src/lib/relationships/holidays.ts src/lib/relationships/holidays.test.ts src/lib/relationships/reminders.ts src/lib/relationships/reminders.test.ts src/lib/reminders/due-reminders.ts
git commit -m "feat: add traditional holiday contact reminders"
```

### Task 4: Add the contact editor switch and verify the release

**Files:**
- Modify: `src/app/relationships/components/ContactEditor.test.tsx`
- Modify: `src/app/relationships/components/ContactEditor.tsx`
- Modify: `src/app/relationships/components/ContactList.test.tsx`
- Modify: contact fixtures in tests that require the new field

- [ ] **Step 1: Write the failing editor test**

Assert the form shows `重要节日联系提示` and explanatory text `春节、端午和中秋前3天开始提示。`.

- [ ] **Step 2: Run the editor test and verify RED**

Run: `npx vitest run src/app/relationships/components/ContactEditor.test.tsx --maxWorkers=1`

Expected: the switch label is absent.

- [ ] **Step 3: Add the switch with a false default**

Add a `Switch` bound with `valuePropName="checked"`, and include `holiday_contact_reminder_enabled: false` in new-contact defaults while preserving stored values for edits.

- [ ] **Step 4: Run all focused relationship tests**

Run: `npx vitest run src/lib/relationships src/app/relationships/components --maxWorkers=1`

Expected: all focused tests pass.

- [ ] **Step 5: Run project verification**

Run in order:

```powershell
npm test -- --maxWorkers=1
npm run typecheck
npm run lint -- src/lib/relationships src/lib/reminders/due-reminders.ts src/app/relationships src/types/life-os.ts
npm run build
```

Expected: tests, TypeScript, targeted ESLint, and production build all pass.

- [ ] **Step 6: Commit the editor and fixture updates**

```powershell
git add -- src/app/relationships/components/ContactEditor.tsx src/app/relationships/components/ContactEditor.test.tsx src/app/relationships/components/ContactList.test.tsx src/lib/relationships/reminders.test.ts
git commit -m "feat: expose holiday contact reminders"
```

- [ ] **Step 7: Produce the migration handoff**

Report that `supabase/migrations/011_relationship_holiday_reminders.sql` must be executed before using the new switch, and explicitly state that it is additive and preserves existing relationship data.
