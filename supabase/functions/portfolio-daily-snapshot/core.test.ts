import { describe, expect, it } from 'vitest';
import { buildDailySnapshot, buildOpeningBaseline, calculateHistoryMetrics } from './core';

const opening = {
  openingDate: '2026-10-10',
  openingCash: 5_000,
  positions: [{ tickerId: 'msft', quantity: 10, openingMarketValueUsd: 5_000 }],
};

describe('portfolio daily snapshot core', () => {
  it('creates an auditable opening baseline at NAV 1', () => {
    expect(buildOpeningBaseline(opening)).toMatchObject({
      date: '2026-10-10', totalAssets: 10_000, cashBalance: 5_000,
      marketValue: 5_000, shares: 10_000, nav: 1, externalFlow: 0,
    });
  });

  it('changes NAV for investment gains but not for a later deposit', () => {
    const previous = buildOpeningBaseline(opening);
    const result = buildDailySnapshot({
      date: '2026-10-11', opening,
      transactions: [{ date: '2026-10-11', type: 'deposit', tickerId: null, quantity: null, amountUsd: 2_000 }],
      prices: { msft: { priceUsd: 550, source: '腾讯行情', observedOn: '2026-10-10', fallback: false } },
      previous,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.cashBalance).toBe(7_000);
    expect(result.snapshot.totalAssets).toBe(12_500);
    expect(result.snapshot.shares).toBe(12_000);
    expect(result.snapshot.nav).toBeCloseTo(12_500 / 12_000);
    expect(result.snapshot.externalFlow).toBe(2_000);
  });

  it('treats buys, sells, dividends and option cash as internal account flows', () => {
    const result = buildDailySnapshot({
      date: '2026-10-11', opening,
      transactions: [
        { date: '2026-10-11', type: 'buy', tickerId: 'msft', quantity: 2, amountUsd: 1_000 },
        { date: '2026-10-11', type: 'sell', tickerId: 'msft', quantity: 1, amountUsd: 600 },
        { date: '2026-10-11', type: 'dividend', tickerId: 'msft', quantity: null, amountUsd: 30 },
        { date: '2026-10-11', type: 'option_income', tickerId: 'msft', quantity: null, amountUsd: 40 },
      ],
      prices: { msft: { priceUsd: 500, source: '腾讯行情', observedOn: '2026-10-10', fallback: false } },
      previous: buildOpeningBaseline(opening),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.externalFlow).toBe(0);
    expect(result.snapshot.cashBalance).toBe(4_670);
    expect(result.snapshot.marketValue).toBe(5_500);
    expect(result.snapshot.totalAssets).toBe(10_170);
  });

  it('uses only flows after the previous snapshot and stays idempotent on rerun', () => {
    const previous = { ...buildOpeningBaseline(opening), date: '2026-10-11', totalAssets: 10_500, nav: 1.05 };
    const input = {
      date: '2026-10-12', opening,
      transactions: [
        { date: '2026-10-11', type: 'deposit' as const, tickerId: null, quantity: null, amountUsd: 1_000 },
        { date: '2026-10-12', type: 'deposit' as const, tickerId: null, quantity: null, amountUsd: 500 },
      ],
      prices: { msft: { priceUsd: 500, source: '腾讯行情', observedOn: '2026-10-11', fallback: false } },
      previous,
    };
    const first = buildDailySnapshot(input);
    const rerun = buildDailySnapshot(input);
    expect(first).toEqual(rerun);
    expect(first.ok && first.snapshot.externalFlow).toBe(500);
  });

  it('refuses to value a held ticker without any usable price', () => {
    const result = buildDailySnapshot({ date: '2026-10-11', opening, transactions: [], prices: {}, previous: buildOpeningBaseline(opening) });
    expect(result).toEqual({ ok: false, errors: ['msft：没有可用价格'] });
  });

  it('calculates TWR, drawdown and the 60-day annualization threshold', () => {
    const short = calculateHistoryMetrics([
      { date: '2026-10-10', nav: 1 }, { date: '2026-10-20', nav: 1.1 }, { date: '2026-10-30', nav: 0.99 },
    ]);
    expect(short.twrReturn).toBeCloseTo(-1);
    expect(short.maxDrawdown).toBeCloseTo(10);
    expect(short.annualizedReturn).toBeNull();
    const long = calculateHistoryMetrics([{ date: '2026-01-01', nav: 1 }, { date: '2026-04-01', nav: 1.1 }]);
    expect(long.annualizedReturn).toBeGreaterThan(40);
  });
});
