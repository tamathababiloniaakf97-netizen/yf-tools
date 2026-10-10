import { describe, expect, it } from 'vitest';
import { buildPeriodView, getPeriodStart, type PeriodKey } from './portfolio-period';

const row = (date: string, nav: number, benchmarkNav: number | null = nav) => ({
  date,
  nav,
  benchmark_nav: benchmarkNav,
  valuation_status: 'complete' as const,
  price_errors: [],
});

describe('portfolio period calculations', () => {
  it.each<[PeriodKey, string | null]>([
    ['1m', '2026-09-10'],
    ['3m', '2026-07-10'],
    ['6m', '2026-04-10'],
    ['ytd', '2026-01-01'],
    ['1y', '2025-10-10'],
    ['all', null],
  ])('calculates the %s boundary from the latest snapshot', (period, expected) => {
    expect(getPeriodStart(period, '2026-10-10')).toBe(expected);
  });

  it('filters and rebases portfolio and benchmark NAV inside the selected period', () => {
    const view = buildPeriodView([
      row('2026-06-01', 1, 2),
      row('2026-07-10', 1.1, 2.2),
      row('2026-10-10', 1.21, 2.42),
    ], '3m');

    expect(view.userNav.map((point) => point.date)).toEqual(['2026-07-10', '2026-10-10']);
    expect(view.userNav[0].nav).toBe(1);
    expect(view.userNav[1].nav).toBeCloseTo(1.1);
    expect(view.spyNav.map((point) => point.date)).toEqual(['2026-07-10', '2026-10-10']);
    expect(view.spyNav[0].nav).toBe(1);
    expect(view.spyNav[1].nav).toBeCloseTo(1.1);
    expect(view.shortened).toBe(false);
  });

  it('reports the actual start when stored history is shorter than the requested period', () => {
    const view = buildPeriodView([
      row('2026-09-20', 1),
      row('2026-10-10', 1.02),
    ], '3m');

    expect(view.requestedStart).toBe('2026-07-10');
    expect(view.actualStart).toBe('2026-09-20');
    expect(view.shortened).toBe(true);
  });

  it('keeps honest insufficient data when the selected period contains one point', () => {
    const view = buildPeriodView([
      row('2026-01-01', 1),
      row('2026-10-10', 1.05),
    ], '1m');

    expect(view.userNav).toEqual([{ date: '2026-10-10', nav: 1 }]);
    expect(view.hasEnoughData).toBe(false);
  });
});
