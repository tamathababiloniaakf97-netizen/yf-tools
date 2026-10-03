import { describe, expect, it } from 'vitest';
import { buildTimeProgress } from './time-progress';

describe('buildTimeProgress', () => {
  it('calculates ordinary-year and month progress without counting today as remaining', () => {
    expect(buildTimeProgress(new Date('2026-10-02T08:00:00+08:00'))).toMatchObject({
      dateKey: '2026-10-02', dateLabel: '2026年10月2日', weekdayLabel: '星期五',
      year: 2026, yearDay: 275, yearTotalDays: 365, yearRemainingDays: 90, yearPercent: 75.3,
      month: 10, monthDay: 2, monthTotalDays: 31, monthRemainingDays: 29, monthPercent: 6.5,
    });
  });

  it('handles leap day and the final day of a leap-month', () => {
    expect(buildTimeProgress(new Date('2024-02-29T12:00:00+08:00'))).toMatchObject({
      dateKey: '2024-02-29', yearDay: 60, yearTotalDays: 366, yearRemainingDays: 306,
      monthDay: 29, monthTotalDays: 29, monthRemainingDays: 0, monthPercent: 100,
    });
  });

  it('returns complete progress on December 31', () => {
    expect(buildTimeProgress(new Date('2026-12-31T23:00:00+08:00'))).toMatchObject({
      yearDay: 365, yearRemainingDays: 0, yearPercent: 100,
      monthDay: 31, monthRemainingDays: 0, monthPercent: 100,
    });
  });

  it('uses the Shanghai calendar date across a UTC boundary', () => {
    expect(buildTimeProgress(new Date('2026-10-01T16:30:00Z'))).toMatchObject({
      dateKey: '2026-10-02', dateLabel: '2026年10月2日', weekdayLabel: '星期五',
    });
  });
});
