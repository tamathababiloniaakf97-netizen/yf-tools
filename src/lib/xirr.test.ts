import { describe, expect, it } from 'vitest';
import { calculateXirr } from './xirr';

describe('XIRR', () => {
  it('calculates an annual money-weighted return', () => {
    expect(calculateXirr([
      { date: '2025-01-01', amount: -10000 },
      { date: '2026-01-01', amount: 11000 },
    ])).toBeCloseTo(10, 4);
  });

  it('returns null without both positive and negative cash flows', () => {
    expect(calculateXirr([{ date: '2025-01-01', amount: -10000 }])).toBeNull();
  });
});
