import { describe, expect, it } from 'vitest';
import { financeDataKey, summarizePositions } from './finance-data';

describe('financeDataKey', () => {
  it('builds a stable cache key for the selected period', () => {
    expect(financeDataKey('quarter', 2026, 4)).toBe('/api/household-finance?mode=quarter&year=2026&index=4');
  });
});

describe('summarizePositions', () => {
  it('returns zero values when there is no portfolio data', () => {
    expect(summarizePositions({ tickers: [], transactions: [], opening: null, openingPositions: [] })).toEqual({
      totalAssets: 0,
      marketValue: 0,
      cashBalance: 0,
    });
  });
});
