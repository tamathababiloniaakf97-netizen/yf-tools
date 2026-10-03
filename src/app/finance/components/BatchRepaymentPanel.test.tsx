import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { firstRepaymentDate } from './BatchRepaymentPanel';

describe('BatchRepaymentPanel', () => {
  it('copies the first row date whenever a repayment row is added', () => {
    const firstDate = dayjs('2026-09-02');
    const laterDate = dayjs('2026-09-18');
    expect(firstRepaymentDate([{ entry_date:firstDate }, { entry_date:laterDate }], dayjs('2026-09-30'))).toBe(firstDate);
  });

  it('falls back to the selected-period default when the first row has no date', () => {
    const fallback = dayjs('2026-09-30');
    expect(firstRepaymentDate([{}], fallback)).toBe(fallback);
  });
});
