import { describe, expect, it } from 'vitest';
import {
  calculateOpeningPositionAmounts,
  deriveOpeningUnitCost,
  validatePortfolioOpening,
} from './portfolio-opening';

describe('portfolio opening amount conversion', () => {
  it('converts a HKD unit cost and current price into USD totals', () => {
    const amounts = calculateOpeningPositionAmounts(200, 480, 'HKD', 520);
    expect(amounts?.total_cost_usd).toBeCloseTo(200 * 480 / 7.8);
    expect(amounts?.opening_market_value_usd).toBeCloseTo(200 * 520 / 7.8);
  });

  it('converts CNY and USD amounts with the configured rates', () => {
    expect(calculateOpeningPositionAmounts(100, 72, 'CNY', 79.2)).toEqual({
      total_cost_usd: 1000,
      opening_market_value_usd: 1100,
    });
    expect(calculateOpeningPositionAmounts(10, 25, 'USD', 30)).toEqual({
      total_cost_usd: 250,
      opening_market_value_usd: 300,
    });
  });

  it('rejects an opening position without a valid current price', () => {
    expect(calculateOpeningPositionAmounts(200, 480, 'HKD', null)).toBeNull();
    expect(calculateOpeningPositionAmounts(200, 480, 'HKD', 0)).toBeNull();
  });

  it('derives the original unit cost from a stored USD total', () => {
    expect(deriveOpeningUnitCost(200 * 480 / 7.8, 200, 'HKD')).toBeCloseTo(480);
  });
});

describe('portfolio opening validation', () => {
  it('accepts positive opening net assets before the first transaction', () => {
    expect(validatePortfolioOpening({
      opening_date: '2025-12-31', opening_cash: 5000,
      positions: [{ ticker_id: 'nvda', quantity: 100, total_cost_usd: 14000, opening_market_value_usd: 20000 }],
    }, '2026-01-01')).toMatchObject({ ok: true });
  });

  it('rejects a non-positive opening account', () => {
    expect(validatePortfolioOpening({ opening_date: '2025-12-31', opening_cash: -100, positions: [] }, null))
      .toEqual({ ok: false, error: '期初账户净资产必须大于 0' });
  });

  it('rejects duplicate tickers and invalid position values', () => {
    const duplicate = { ticker_id: 'nvda', quantity: 1, total_cost_usd: 10, opening_market_value_usd: 10 };
    expect(validatePortfolioOpening({ opening_date: '2025-12-31', opening_cash: 0, positions: [duplicate, duplicate] }, null))
      .toEqual({ ok: false, error: '期初持仓不能包含重复标的' });
    expect(validatePortfolioOpening({ opening_date: '2025-12-31', opening_cash: 0, positions: [{ ...duplicate, quantity: 0 }] }, null))
      .toEqual({ ok: false, error: '期初持仓数量必须大于 0' });
  });

  it('requires the opening date not to follow the earliest transaction', () => {
    expect(validatePortfolioOpening({ opening_date: '2026-01-02', opening_cash: 1000, positions: [] }, '2026-01-01'))
      .toEqual({ ok: false, error: '期初日期不能晚于最早交易日期 2026-01-01' });
  });
});
