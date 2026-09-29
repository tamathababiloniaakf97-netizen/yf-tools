import { describe, expect, it } from 'vitest';
import { validateContactInput, validateContactInteractionInput } from './validation';

describe('relationship validation', () => {
  it('accepts and trims a manual contact', () => {
    expect(validateContactInput({ name: ' 王律师 ', relationship_type: 'professional', role: ' 律师 ' })).toMatchObject({ ok: true, value: { name: '王律师', role: '律师', review_status: 'approved' } });
  });

  it('defaults holiday contact reminders off and preserves an explicit opt-in', () => {
    expect(validateContactInput({ name: '甲', relationship_type: 'friend' }))
      .toMatchObject({ ok: true, value: { holiday_contact_reminder_enabled: false } });
    expect(validateContactInput({ name: '乙', relationship_type: 'friend', holiday_contact_reminder_enabled: true }))
      .toMatchObject({ ok: true, value: { holiday_contact_reminder_enabled: true } });
  });

  it('rejects blank names, invalid types and reversed dates', () => {
    expect(validateContactInput({ name: ' ', relationship_type: 'friend' }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'invalid' as 'friend' }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'friend', last_contact_at: '2026-10-10', next_contact_at: '2026-10-01' }).ok).toBe(false);
  });

  it('requires automation provenance and defaults it to pending', () => {
    expect(validateContactInput({ name: '甲', relationship_type: 'work', source_type: 'automation' }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'work', source_type: 'automation', source_ref: 'job:1' })).toMatchObject({ ok: true, value: { review_status: 'pending' } });
  });

  it('accepts complete solar and lunar birthdays including classmates', () => {
    expect(validateContactInput({ name: '张三', relationship_type: 'classmate', birthday_calendar: 'lunar', birthday_month: 8, birthday_day: 15, birthday_is_leap_month: false })).toMatchObject({ ok: true, value: { birthday_reminder_enabled: true } });
    expect(validateContactInput({ name: '李四', relationship_type: 'friend', birthday_calendar: 'solar', birthday_year: 1990, birthday_month: 2, birthday_day: 29 })).toMatchObject({ ok: true });
  });

  it('rejects partial or invalid birthdays and solar leap-month flags', () => {
    expect(validateContactInput({ name: '甲', relationship_type: 'friend', birthday_calendar: 'solar', birthday_month: 2 }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'friend', birthday_calendar: 'solar', birthday_month: 2, birthday_day: 30 }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'friend', birthday_calendar: 'lunar', birthday_month: 13, birthday_day: 1 }).ok).toBe(false);
    expect(validateContactInput({ name: '甲', relationship_type: 'friend', birthday_calendar: 'solar', birthday_month: 8, birthday_day: 1, birthday_is_leap_month: true }).ok).toBe(false);
  });

  it('validates an interaction and its next-contact date', () => {
    expect(validateContactInteractionInput({ occurred_at: '2026-10-01', summary: ' 深入交流 ', next_contact_at: '2026-10-10' })).toMatchObject({ ok: true, value: { summary: '深入交流' } });
    expect(validateContactInteractionInput({ occurred_at: '2026-10-10', summary: '交流', next_contact_at: '2026-10-01' }).ok).toBe(false);
  });

  it('validates and defaults relationship interaction types', () => {
    expect(validateContactInteractionInput({ occurred_at: '2026-09-29', interaction_type: 'gift_given', summary: '中秋节送茶' })).toMatchObject({ ok: true, value: { interaction_type: 'gift_given' } });
    expect(validateContactInteractionInput({ occurred_at: '2026-09-29', summary: '见面' })).toMatchObject({ ok: true, value: { interaction_type: 'contact' } });
    expect(validateContactInteractionInput({ occurred_at: '2026-09-29', interaction_type: 'invalid' as 'contact', summary: '见面' }).ok).toBe(false);
  });
});
