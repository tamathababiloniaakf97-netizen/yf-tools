import { describe, expect, it } from 'vitest';
import { buildPortfolioOverview } from './overview';
import type { AccountSummary } from '@/types';

describe('buildPortfolioOverview', () => {
  it('prioritizes financing exposure over concentration risk', () => {
    const summary = {
      totalAssets: 100, cashBalance: -60, marketValue: 160, totalInvested: 80,
      totalPnL: 20, pnlPercent: 25, openOptions: [], stockExposurePercent: 160,
      leverageMultiple: 1.6, positions: [
        { ticker: { id: 'meta', user_id: 'u', name: 'Meta', code: 'META', type: 'stock_us', currency: 'USD', current_price: 65, price_updated_at: null, style: null, created_at: '' }, totalShares: 1, costPerShare: 40, totalCost: 40, currentPrice: 65, marketValue: 65, optionPnl: 0, pnl: 25, pnlPercent: 62.5, allocPercent: 65, isNegativeCost: false },
      ],
    } satisfies AccountSummary;

    const result = buildPortfolioOverview(summary);
    expect(result.primaryRisk).toBe('账户使用融资，股票敞口 160.0%');
    expect(result.primaryRiskLevel).toBe('warning');
  });

  it('flags concentration without pretending to give investment advice', () => {
    const summary = {
      totalAssets: 100, cashBalance: 10, marketValue: 90, totalInvested: 80,
      totalPnL: 20, pnlPercent: 25, openOptions: [], positions: [
        { ticker: { id: 'btc', user_id: 'u', name: '比特币', code: 'BTC', type: 'crypto', currency: 'USD', current_price: 60, price_updated_at: null, style: null, created_at: '' }, totalShares: 1, costPerShare: 40, totalCost: 40, currentPrice: 60, marketValue: 60, optionPnl: 0, pnl: 20, pnlPercent: 50, allocPercent: 60, isNegativeCost: false },
      ],
    } satisfies AccountSummary;

    const result = buildPortfolioOverview(summary);
    expect(result.primaryRisk).toBe('最大单一持仓占比 60.0%');
    expect(result.primaryRiskLevel).toBe('warning');
    expect(result.topPositions[0].ticker.code).toBe('BTC');
  });

  it('uses a success state only when no structural risk rule is triggered', () => {
    const summary = {
      totalAssets: 100, cashBalance: 30, marketValue: 70, totalInvested: 80,
      totalPnL: 20, pnlPercent: 25, openOptions: [], stockExposurePercent: 70,
      leverageMultiple: 0.7, positions: [],
    } satisfies AccountSummary;

    expect(buildPortfolioOverview(summary)).toMatchObject({
      primaryRisk: '暂未发现明显结构风险', primaryRiskLevel: 'success',
    });
  });
});
