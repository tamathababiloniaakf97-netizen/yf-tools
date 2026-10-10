import { describe, expect, it } from 'vitest';
import type { Position } from '@/types';
import { filterPositions, summarizePositions } from './position-table-summary';

const positions: Position[] = [
  {
    ticker: { id: 'meta', user_id: 'u1', name: 'Meta', code: 'META', type: 'stock_us', currency: 'USD', current_price: 120, price_updated_at: null, style: 'offensive', created_at: '' },
    totalShares: 10, costPerShare: 100, totalCost: 1000, currentPrice: 120,
    marketValue: 1200, optionPnl: 40, pnl: 200, pnlPercent: 20, allocPercent: 12, isNegativeCost: false,
  },
  {
    ticker: { id: 'unh', user_id: 'u1', name: '联合健康', code: 'UNH', type: 'stock_us', currency: 'USD', current_price: 90, price_updated_at: null, style: 'defensive', created_at: '' },
    totalShares: 20, costPerShare: 100, totalCost: 2000, currentPrice: 90,
    marketValue: 1800, optionPnl: 10, pnl: -200, pnlPercent: -10, allocPercent: 18, isNegativeCost: false,
  },
  {
    ticker: { id: 'btc', user_id: 'u1', name: '比特币', code: 'BTC-USD', type: 'crypto', currency: 'USD', current_price: 1500, price_updated_at: null, style: 'offensive', created_at: '' },
    totalShares: 1, costPerShare: -100, totalCost: -100, currentPrice: 1500,
    marketValue: 1500, optionPnl: 0, pnl: 1600, pnlPercent: 0, allocPercent: 15, isNegativeCost: true,
  },
];

describe('position table filtering', () => {
  it('keeps every position when all filters are empty', () => {
    expect(filterPositions(positions, { style: null, type: null, query: '' })).toEqual(positions);
  });

  it('combines style, type, and case-insensitive name/code search', () => {
    expect(filterPositions(positions, { style: 'offensive', type: 'stock_us', query: 'meta' }).map(item => item.ticker.id)).toEqual(['meta']);
    expect(filterPositions(positions, { style: null, type: null, query: '联合' }).map(item => item.ticker.id)).toEqual(['unh']);
    expect(filterPositions(positions, { style: null, type: 'crypto', query: 'btc' }).map(item => item.ticker.id)).toEqual(['btc']);
  });
});

describe('position table summary', () => {
  it('uses aggregate cost instead of averaging row percentages', () => {
    expect(summarizePositions(positions.slice(0, 2), positions.length, 10000)).toEqual({
      visibleCount: 2, totalCount: 3, marketValue: 3000, pnl: 0, returnPercent: 0, accountPercent: 30,
    });
  });

  it('returns null for ratios with non-positive denominators', () => {
    expect(summarizePositions([positions[2]], positions.length, 0)).toEqual({
      visibleCount: 1, totalCount: 3, marketValue: 1500, pnl: 1600, returnPercent: null, accountPercent: null,
    });
  });

  it('returns zero values for an empty result', () => {
    expect(summarizePositions([], positions.length, 10000)).toEqual({
      visibleCount: 0, totalCount: 3, marketValue: 0, pnl: 0, returnPercent: null, accountPercent: 0,
    });
  });
});
