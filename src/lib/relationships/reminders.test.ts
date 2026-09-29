import { describe, expect, it } from 'vitest';
import type { Contact } from '@/types/life-os';
import { buildAllRelationshipReminders, buildHolidayContactReminders, buildRelationshipReminders } from './reminders';
function contact(overrides: Partial<Contact>): Contact { return { id: 'c1', user_id: 'u1', name: '联系人', relationship_type: 'friend', role: '', met_context: '', family_context: '', work_context: '', important_notes: '', birthday_calendar: null, birthday_year: null, birthday_month: null, birthday_day: null, birthday_is_leap_month: false, birthday_reminder_enabled: true, holiday_contact_reminder_enabled: false, last_contact_at: null, next_contact_at: null, next_action: '', notes: '', source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', ...overrides }; }
describe('relationship reminders', () => {
  const now = new Date('2026-09-28T01:00:00Z');
  it('shows only approved overdue and today manual follow-ups', () => {
    const result = buildRelationshipReminders([contact({ id: 'late', next_contact_at: '2026-09-27' }), contact({ id: 'today', next_contact_at: '2026-09-28' }), contact({ id: 'future', next_contact_at: '2026-09-29' }), contact({ id: 'pending', next_contact_at: '2026-09-27', review_status: 'pending' })], now);
    expect(result.map((item) => [item.subject_id, item.kind])).toEqual([['late', 'relationship_overdue'], ['today', 'relationship_today']]);
  });
  it('does not infer reminders from last contact alone', () => { expect(buildRelationshipReminders([contact({ last_contact_at: '2020-01-01' })], now)).toEqual([]); });
  it('merges birthday reminders with manual follow-ups', () => {
    const result = buildAllRelationshipReminders([
      contact({ id: 'birthday', name: '生日联系人', birthday_calendar: 'solar', birthday_month: 10, birthday_day: 5 }),
      contact({ id: 'follow-up', next_contact_at: '2026-09-28' }),
      contact({ id: 'disabled', birthday_calendar: 'solar', birthday_month: 10, birthday_day: 5, birthday_reminder_enabled: false }),
    ], now);
    expect(result.map((item) => [item.subject_id, item.kind])).toEqual([
      ['follow-up', 'relationship_today'],
      ['birthday', 'birthday_upcoming'],
    ]);
  });

  it.each([
    ['2026-02-14T01:00:00Z', '春节'],
    ['2026-06-16T01:00:00Z', '端午'],
    ['2026-09-22T01:00:00Z', '中秋'],
  ])('shows an opted-in contact from three days before %s', (date, holidayName) => {
    const result = buildHolidayContactReminders([
      contact({ id: 'enabled', name: '胡琴', holiday_contact_reminder_enabled: true }),
    ], new Date(date));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      subject_id: 'enabled',
      kind: 'relationship_holiday',
      title: `${holidayName}将至，考虑联系胡琴`,
      href: '/relationships?contact=enabled',
    });
  });

  it('keeps the reminder through the holiday and removes it afterwards', () => {
    const enabled = contact({ holiday_contact_reminder_enabled: true });
    expect(buildHolidayContactReminders([enabled], new Date('2026-09-25T01:00:00Z'))).toHaveLength(1);
    expect(buildHolidayContactReminders([enabled], new Date('2026-09-26T01:00:00Z'))).toEqual([]);
  });

  it('excludes opt-outs, pending contacts, and contacts reached during the window', () => {
    const result = buildHolidayContactReminders([
      contact({ id: 'disabled' }),
      contact({ id: 'pending', holiday_contact_reminder_enabled: true, review_status: 'pending' }),
      contact({ id: 'reached', holiday_contact_reminder_enabled: true, last_contact_at: '2026-09-22' }),
      contact({ id: 'before-window', holiday_contact_reminder_enabled: true, last_contact_at: '2026-09-21' }),
    ], new Date('2026-09-24T01:00:00Z'));
    expect(result.map((item) => item.subject_id)).toEqual(['before-window']);
  });
});
