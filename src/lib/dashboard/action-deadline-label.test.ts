import { describe, expect, it } from 'vitest';
import { actionDeadlineLabel } from './action-deadline-label';

describe('actionDeadlineLabel', () => {
  const today = '2026-10-02';

  it('describes near deadlines and overdue dates precisely', () => {
    expect(actionDeadlineLabel('2026-10-02', today)).toBe('今日截止');
    expect(actionDeadlineLabel('2026-10-03', today)).toBe('明日截止');
    expect(actionDeadlineLabel('2026-10-06', today)).toBe('还有 4 天');
    expect(actionDeadlineLabel('2026-10-01', today)).toBe('逾期 1 天');
  });

  it('uses an exact date for distant actions and marks missing dates', () => {
    expect(actionDeadlineLabel('2026-10-15', today)).toBe('10月15日截止');
    expect(actionDeadlineLabel(null, today)).toBe('未定日期');
  });
});
