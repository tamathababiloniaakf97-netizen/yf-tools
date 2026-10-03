import { describe, expect, it } from 'vitest';
import { calculatePortfolioAccountLocations, validatePortfolioAccounts } from './portfolio-account-locations';
import type { PortfolioAccountLocation, Position, Ticker } from '@/types';

const apple: Ticker = { id: 'apple', user_id: 'u1', name: '苹果', code: 'AAPL', type: 'stock_us', currency: 'USD', current_price: 200, price_updated_at: null, style: null, created_at: '' };
const btc: Ticker = { id: 'btc', user_id: 'u1', name: '比特币', code: 'BTC', type: 'crypto', currency: 'USD', current_price: 90000, price_updated_at: null, style: null, created_at: '' };
const marketPositions: Position[] = [
  { ticker: apple, totalShares: 10, costPerShare: 100, totalCost: 1000, currentPrice: 200, marketValue: 2000, optionPnl: 0, pnl: 1000, pnlPercent: 100, allocPercent: 10, isNegativeCost: false },
  { ticker: btc, totalShares: 0.1, costPerShare: 80000, totalCost: 8000, currentPrice: 90000, marketValue: 9000, optionPnl: 0, pnl: 1000, pnlPercent: 12.5, allocPercent: 45, isNegativeCost: false },
];

const account: PortfolioAccountLocation = {
  id: 'account-1', name: '盈透主账户', account_type: 'brokerage', login_url: '', login_account: '', password_hint: '', two_factor_hint: '', location_note: '', broker_reported_total_usd: 12850,
  cash_balances: [{ currency: 'USD', amount: 1000, usd_rate: 1 }, { currency: 'HKD', amount: 7800, usd_rate: 0.1282051282 }],
  positions: [{ ticker_id: 'apple', quantity: 10 }, { ticker_id: 'btc', quantity: 0.1 }], sort_order: 0,
};

describe('portfolio account location calculations', () => {
  it('derives totals from cash conversion and decimal asset quantities', () => {
    const result = calculatePortfolioAccountLocations([account], marketPositions, 2000);
    expect(result.accounts[0].cash_value_usd).toBeCloseTo(2000, 2);
    expect(result.accounts[0].position_value_usd).toBe(11000);
    expect(result.accounts[0].calculated_total_usd).toBeCloseTo(13000, 2);
    expect(result.accounts[0].broker_difference_usd).toBeCloseTo(-150, 2);
    expect(result.calculated_total_usd).toBeCloseTo(13000, 2);
  });

  it('reconciles quantities independently from changing market prices', () => {
    const result = calculatePortfolioAccountLocations([{ ...account, positions: [{ ticker_id: 'apple', quantity: 8 }, { ticker_id: 'btc', quantity: 0.1 }] }], marketPositions, 2000);
    expect(result.position_reconciliation).toEqual([
      expect.objectContaining({ ticker_id: 'apple', expected_quantity: 10, allocated_quantity: 8, difference: -2 }),
      expect.objectContaining({ ticker_id: 'btc', expected_quantity: 0.1, allocated_quantity: 0.1, difference: 0 }),
    ]);
    expect(result.is_reconciled).toBe(false);
  });

  it('treats the broker total as optional comparison data, not an input to calculated total', () => {
    const result = calculatePortfolioAccountLocations([{ ...account, broker_reported_total_usd: null }], marketPositions, 2000);
    expect(result.accounts[0].calculated_total_usd).toBeCloseTo(13000, 2);
    expect(result.accounts[0].broker_difference_usd).toBeNull();
  });
});

describe('portfolio account input validation', () => {
  it('accepts a custom account name and decimal BTC quantity without a manual total field', () => {
    const result = validatePortfolioAccounts([{ ...account, name: '我的 BTC 冷钱包' }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].name).toBe('我的 BTC 冷钱包');
      expect(result.value[0].positions[1].quantity).toBe(0.1);
      expect(result.value[0]).not.toHaveProperty('calculated_total_usd');
    }
  });

  it('rejects invalid rates and negative quantities', () => {
    expect(validatePortfolioAccounts([{ ...account, cash_balances: [{ currency: 'HKD', amount: 1, usd_rate: 0 }] }]).ok).toBe(false);
    expect(validatePortfolioAccounts([{ ...account, positions: [{ ticker_id: 'btc', quantity: -0.1 }] }]).ok).toBe(false);
  });
});
