import { describe, expect, it } from 'vitest';
import type { Contact } from '@/types/life-os';
import { buildBirthdayReminders, nextBirthdayOccurrence } from './birthdays';

function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'c1', user_id: 'u1', name: '胡琴', relationship_type: 'friend',
    role: '', met_context: '', family_context: '', work_context: '', important_notes: '',
    birthday_calendar: 'solar', birthday_year: null, birthday_month: 10, birthday_day: 6,
    birthday_is_leap_month: false, birthday_reminder_enabled: true, holiday_contact_reminder_enabled: false,
    last_contact_at: null, next_contact_at: null, next_action: '', notes: '',
    source_type: 'manual', source_ref: null, review_status: 'approved',
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('relationship birthdays', () => {
  it('finds this-year and next-year Gregorian occurrences in Shanghai', () => {
    expect(nextBirthdayOccurrence(contact(), new Date('2026-09-29T04:00:00Z'))).toBe('2026-10-06');
    expect(nextBirthdayOccurrence(contact(), new Date('2026-10-07T04:00:00Z'))).toBe('2027-10-06');
  });

  it('uses February 28 for a February 29 birthday in a non-leap year', () => {
    expect(nextBirthdayOccurrence(contact({ birthday_month: 2, birthday_day: 29 }), new Date('2027-01-01T04:00:00Z'))).toBe('2027-02-28');
  });

  it('converts ordinary and leap lunar birthdays', () => {
    expect(nextBirthdayOccurrence(contact({ birthday_calendar: 'lunar', birthday_month: 8, birthday_day: 15 }), new Date('2026-09-01T04:00:00Z'))).toBe('2026-09-25');
    expect(nextBirthdayOccurrence(contact({ birthday_calendar: 'lunar', birthday_month: 6, birthday_day: 1, birthday_is_leap_month: true }), new Date('2025-07-01T04:00:00Z'))).toBe('2025-07-25');
  });

  it('falls back to the ordinary lunar month when the year has no requested leap month', () => {
    const occurrence = nextBirthdayOccurrence(contact({ birthday_calendar: 'lunar', birthday_month: 6, birthday_day: 1, birthday_is_leap_month: true }), new Date('2026-01-01T04:00:00Z'));
    expect(occurrence).not.toBeNull();
    expect(new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric' }).format(new Date(`${occurrence}T12:00:00+08:00`))).toBe('六月1日');
  });

  it('reminds exactly seven days before and on the birthday', () => {
    expect(buildBirthdayReminders([contact()], new Date('2026-09-29T04:00:00Z'))).toMatchObject([{ kind: 'birthday_upcoming', due_date: '2026-10-06', subject_id: 'c1' }]);
    expect(buildBirthdayReminders([contact()], new Date('2026-10-06T04:00:00Z'))).toMatchObject([{ kind: 'birthday_today', due_date: '2026-10-06', subject_id: 'c1' }]);
    expect(buildBirthdayReminders([contact()], new Date('2026-09-30T04:00:00Z'))).toEqual([]);
  });

  it('omits disabled, incomplete, and unapproved birthday reminders', () => {
    expect(buildBirthdayReminders([
      contact({ id: 'disabled', birthday_reminder_enabled: false }),
      contact({ id: 'incomplete', birthday_calendar: null, birthday_month: null, birthday_day: null }),
      contact({ id: 'pending', review_status: 'pending' }),
    ], new Date('2026-09-29T04:00:00Z'))).toEqual([]);
  });
});
