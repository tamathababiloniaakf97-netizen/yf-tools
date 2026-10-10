import { render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import type { Ticker } from '@/types';
import PortfolioOpeningModal from './PortfolioOpeningModal';

const hkdTicker: Ticker = {
  id: 'tencent',
  user_id: 'user',
  name: '腾讯控股',
  code: '00700',
  type: 'stock_hk',
  currency: 'HKD',
  current_price: 520,
  price_updated_at: '2026-10-09',
  style: null,
  created_at: '2026-01-01',
};

describe('PortfolioOpeningModal', () => {
  it('accepts native-currency unit cost and shows calculated USD amounts', async () => {
    render(<App><PortfolioOpeningModal
      open
      tickers={[hkdTicker]}
      opening={{ user_id: 'user', opening_date: '2026-01-01', opening_cash: 0, created_at: '', updated_at: '' }}
      positions={[{ ticker_id: 'tencent', quantity: 200, total_cost_usd: 200 * 480 / 7.8, opening_market_value_usd: 200 * 520 / 7.8 }]}
      earliestTransactionDate="2026-01-01"
      onClose={vi.fn()}
      onSuccess={vi.fn()}
    /></App>);
    expect(screen.getByText('期初现金（USD）')).toBeInTheDocument();
    expect(await screen.findByText('每股成本价（HKD）')).toBeInTheDocument();
    expect(screen.getByText('总成本（USD）')).toBeInTheDocument();
    expect(screen.getByText('期初市场价值（USD）')).toBeInTheDocument();
    expect(screen.queryByText(/历史总成本/)).not.toBeInTheDocument();
    await waitFor(() => {
      const input = screen.getByRole('spinbutton', { name: /每股成本价/ }) as HTMLInputElement;
      expect(Number(input.value)).toBeCloseTo(480);
    });
    expect(screen.getByText(/不能晚于 2026-01-01/)).toBeInTheDocument();
  });

  it('warns when the selected ticker has no current price', async () => {
    render(<App><PortfolioOpeningModal
      open
      tickers={[{ ...hkdTicker, current_price: null }]}
      opening={{ user_id: 'user', opening_date: '2026-01-01', opening_cash: 0, created_at: '', updated_at: '' }}
      positions={[{ ticker_id: 'tencent', quantity: 200, total_cost_usd: 1000, opening_market_value_usd: 1000 }]}
      earliestTransactionDate={null}
      onClose={vi.fn()}
      onSuccess={vi.fn()}
    /></App>);
    expect(await screen.findByText('请先更新当前价格')).toBeInTheDocument();
  });
});
