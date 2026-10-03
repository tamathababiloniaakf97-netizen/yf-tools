import { describe, expect, it } from 'vitest';

import { buildEntryReviewReminder } from './entry-review-reminder';

describe('buildEntryReviewReminder', () => {
  it.each([
    ['2026-10-24T12:00:00+08:00', null],
    ['2026-10-25T00:00:00+08:00', '2026-10'],
    ['2026-04-24T12:00:00+08:00', '2026-04'],
    ['2024-02-23T12:00:00+08:00', '2024-02'],
    ['2026-02-22T12:00:00+08:00', '2026-02'],
  ])('uses the final seven natural days at %s', (instant, expectedPeriod) => {
    expect(buildEntryReviewReminder(new Date(instant), expectedPeriod ? `${expectedPeriod}-01` : '2026-10-01', [] )?.periodKey ?? null)
      .toBe(expectedPeriod);
  });

  it('uses the Shanghai date at a UTC boundary', () => {
    expect(buildEntryReviewReminder(new Date('2026-10-24T16:01:00Z'), '2026-10-01', [])?.periodKey)
      .toBe('2026-10');
  });

  it('returns no reminder when the current month is reviewed', () => {
    expect(buildEntryReviewReminder(new Date('2026-10-30T12:00:00+08:00'), '2026-10-01', [
      { period_month: '2026-10-01', reviewed_at: '2026-10-26T02:00:00Z', checks: { business:true, household:true, repayments:true, capital:true, cash_balances:true, liability_balances:true, investment_ready:true } },
    ], ['2026-10-01'])).toBeNull();
  });

  it('returns the earliest unreviewed overdue month', () => {
    expect(buildEntryReviewReminder(new Date('2027-01-10T12:00:00+08:00'), '2026-10-01', [
      { period_month: '2026-10-01', reviewed_at: '2026-10-30T02:00:00Z', checks: { business:true, household:true, repayments:true, capital:true, cash_balances:true, liability_balances:true, investment_ready:true } },
      { period_month: '2026-12-01', reviewed_at: '2026-12-30T02:00:00Z', checks: { business:true, household:true, repayments:true, capital:true, cash_balances:true, liability_balances:true, investment_ready:true } },
    ], ['2026-10-01','2026-12-01'])).toMatchObject({ periodKey: '2026-11', dueDate: '2026-12-07', overdue: true });
  });

  it('uses the next month first seven days as the normal completion window', () => {
    expect(buildEntryReviewReminder(new Date('2026-10-02T12:00:00+08:00'), '2026-09-01', []))
      .toMatchObject({ periodKey: '2026-09', dueDate: '2026-10-07', overdue: false, statusLabel: '上月补录' });
  });

  it('marks the previous month overdue only after the seventh day', () => {
    expect(buildEntryReviewReminder(new Date('2026-10-08T00:00:00+08:00'), '2026-09-01', []))
      .toMatchObject({ periodKey: '2026-09', dueDate: '2026-10-07', overdue: true });
  });

  it('labels the final-seven-days reminder as a month-end pre-check', () => {
    expect(buildEntryReviewReminder(new Date('2026-10-25T12:00:00+08:00'), '2026-10-01', []))
      .toMatchObject({ periodKey: '2026-10', dueDate: '2026-11-07', overdue: false, statusLabel: '月底预检查' });
  });

  it('does not create history before the configured start or when disabled', () => {
    expect(buildEntryReviewReminder(new Date('2026-10-30T12:00:00+08:00'), null, [])).toBeNull();
    expect(buildEntryReviewReminder(new Date('2026-10-30T12:00:00+08:00'), '2026-11-01', [])).toBeNull();
  });

  it('keeps a partial checklist visible and reports its missing items', () => {
    const reminder = buildEntryReviewReminder(new Date('2026-10-03T12:00:00+08:00'), '2026-09-01', [{
      period_month:'2026-09-01', reviewed_at:'2026-10-01T00:00:00Z',
      checks:{ business:true, household:true, repayments:false, capital:false, cash_balances:true, liability_balances:false, investment_ready:true },
    }], []);
    expect(reminder).toMatchObject({ completedCount:4, totalCount:8 });
    expect(reminder?.missingLabels).toContain('还款记录');
    expect(reminder?.missingLabels).toContain('月度结账');
  });
});
