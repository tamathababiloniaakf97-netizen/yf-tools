import { describe, expect, it } from 'vitest';
import { contactDaysLabel } from './contact-days';

describe('contact days label', () => {
  it('shows zero for a contact recorded today', () => {
    expect(contactDaysLabel('2026-09-29', '2026-09-29')).toBe('0天');
  });

  it('shows the exact elapsed day count across months and years', () => {
    expect(contactDaysLabel('2026-09-09', '2026-09-29')).toBe('20天');
    expect(contactDaysLabel('2025-09-08', '2026-09-29')).toBe('386天');
  });

  it('shows an explicit empty state when no contact was recorded', () => {
    expect(contactDaysLabel(null, '2026-09-29')).toBe('未记录');
  });

  it('does not show negative days for a future imported date', () => {
    expect(contactDaysLabel('2026-09-30', '2026-09-29')).toBe('0天');
  });
});
