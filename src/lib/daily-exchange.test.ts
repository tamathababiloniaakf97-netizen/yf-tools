import { expect, it, vi } from 'vitest';
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
import { parseDailyExchange, getDailyExchange } from './daily-exchange';
import { calculateAccountSummary } from './cost-engine';
import type { Ticker, Transaction } from '@/types';
it('parses reference dates and inverse rates', () => {
  expect(parseDailyExchange([{ base: 'USD', quote: 'CNY', rate: 7, date: '2026-10-13' }, { base: 'USD', quote: 'HKD', rate: 8, date: '2026-10-13' }])).toMatchObject({ rates: { USD: 1, CNY: 1 / 7, HKD: 1 / 8 }, date: '2026-10-13' });
  expect(() => parseDailyExchange([])).toThrow();
});
it('marks an offline cold start clearly', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  try { expect(await getDailyExchange()).toMatchObject({ date: null, fallback: true }); } finally { vi.unstubAllGlobals(); }
});
it('changes only USD valuation, preserving native price and cost', () => {
  const ticker = { id: 'hk', currency: 'HKD' } as Ticker;
  const tx = { type: 'buy', ticker_id: 'hk', quantity: 10, amount_orig: 780, amount_usd: 100, trade_date: '2026-10-01' } as Transaction;
  const result = calculateAccountSummary([tx], [ticker], { hk: 11 }, null, { USD: 1, HKD: 1 / 8, CNY: 1 / 7 });
  const p = result.positions[0];
  expect(p.marketValue).toBeCloseTo(107.25);
  expect(p.costPerShare / p.valuationRate!).toBeCloseTo(78);
  expect(p.currentPrice / p.valuationRate!).toBeCloseTo(85.8);
  expect(p.pnlPercent).toBeCloseTo(10);
});
