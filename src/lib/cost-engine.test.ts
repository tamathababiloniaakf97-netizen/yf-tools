import { describe, expect, it } from 'vitest';
import { calculateAccountSummary, calculateCostBasis } from './cost-engine';
import type { PortfolioOpening, PortfolioOpeningPosition, Ticker, Transaction } from '@/types';

const ticker: Ticker = { id: 't1', user_id: 'u1', name: '测试股票', code: 'TEST', type: 'stock_us', currency: 'USD', current_price: 220, price_updated_at: null, style: null, created_at: '' };
const opening: PortfolioOpening = { user_id: 'u1', opening_date: '2025-12-31', opening_cash: 5000, created_at: '', updated_at: '' };
const openingPosition: PortfolioOpeningPosition = { ticker_id: 't1', quantity: 100, total_cost_usd: 14000, opening_market_value_usd: 20000 };

function tx(overrides: Partial<Transaction>): Transaction {
  return { id: crypto.randomUUID(), user_id: 'u1', ticker_id: 't1', type: 'buy', quantity: 10, price: 200, amount_orig: 2000, amount_usd: 2000, currency: 'USD', option_detail: null, note: '', trade_date: '2026-01-01', created_at: '', ...overrides };
}

describe('professional cost basis', () => {
  it('uses moving average cost for partial sales', () => {
    const result = calculateCostBasis([
      tx({ type: 'buy', quantity: 10, amount_usd: 2000 }),
      tx({ type: 'sell', quantity: 20, amount_usd: 4000, trade_date: '2026-01-02' }),
    ], 'USD', openingPosition);
    expect(result.totalShares).toBe(90);
    expect(result.totalCost).toBeCloseTo(13090.91, 2);
    expect(result.costPerShare).toBeCloseTo(145.45, 2);
  });

  it('combines opening assets with later cash flows and allows financing', () => {
    const summary = calculateAccountSummary([
      tx({ type: 'buy', quantity: 10, amount_usd: 2000 }),
      tx({ type: 'sell', quantity: 20, amount_usd: 4000, trade_date: '2026-01-02' }),
    ], [ticker], { t1: 220 }, { opening, positions: [openingPosition] });
    expect(summary.cashBalance).toBe(7000);
    expect(summary.marketValue).toBe(19800);
    expect(summary.totalAssets).toBe(26800);
    expect(summary.netContributions).toBe(25000);
    expect(summary.cumulativePnl).toBe(1800);
    expect(summary.holdingUnrealizedPnl).toBeCloseTo(6709.09, 2);
    expect(summary.stockExposurePercent).toBeCloseTo(73.88, 2);

    const financed = calculateAccountSummary([tx({ type: 'buy', quantity: 100, amount_usd: 20000 })], [ticker], { t1: 220 }, { opening: { ...opening, opening_cash: 1000 }, positions: [] });
    expect(financed.cashBalance).toBe(-19000);
    expect(financed.stockExposurePercent).toBeGreaterThan(100);
  });

  it('puts every option cash flow into cash even without stock holdings', () => {
    const option = tx({ type: 'option_income', quantity: null, price: null, amount_orig: null, amount_usd: 250, option_detail: { direction: 'sell', type: 'put', action: 'open', position_id: 'opt-1', quantity: 1, price: 250 } });
    const summary = calculateAccountSummary([option], [ticker], {}, { opening: { ...opening, opening_cash: 1000 }, positions: [] });
    expect(summary.cashBalance).toBe(1250);
    expect(summary.openOptions).toHaveLength(1);
  });
});
