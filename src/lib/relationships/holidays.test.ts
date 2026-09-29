import { describe, expect, it } from 'vitest';
import { traditionalHolidaysForYear } from './holidays';

describe('traditional holiday dates', () => {
  it('finds the three configured lunar holidays in 2026', () => {
    expect(traditionalHolidaysForYear(2026)).toEqual([
      { key: 'spring_festival', name: '春节', date: '2026-02-17' },
      { key: 'dragon_boat', name: '端午', date: '2026-06-19' },
      { key: 'mid_autumn', name: '中秋', date: '2026-09-25' },
    ]);
  });
});
