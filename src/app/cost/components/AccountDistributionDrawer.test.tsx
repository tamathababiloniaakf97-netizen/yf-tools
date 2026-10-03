import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AccountDistributionDrawer from './AccountDistributionDrawer';
import type { Position, Ticker } from '@/types';

const btc: Ticker = { id: 'btc', user_id: 'u1', name: '比特币', code: 'BTC', type: 'crypto', currency: 'USD', current_price: 90000, price_updated_at: null, style: null, created_at: '' };
const position: Position = { ticker: btc, totalShares: 0.1, costPerShare: 80000, totalCost: 8000, currentPrice: 90000, marketValue: 9000, optionPnl: 0, pnl: 1000, pnlPercent: 12.5, allocPercent: 90, isNegativeCost: false };
const account = {
  id: 'a1', name: 'BTC 冷钱包', account_type: 'crypto_wallet', login_url: '', login_account: '', password_hint: '保险箱提示', two_factor_hint: '', location_note: '', broker_reported_total_usd: 10050,
  cash_balances: [{ currency: 'USD', amount: 1000, usd_rate: 1 }], positions: [{ ticker_id: 'btc', quantity: 0.1 }], sort_order: 0,
};

afterEach(() => vi.unstubAllGlobals());

describe('AccountDistributionDrawer', () => {
  it('shows a calculated total and broker difference without a manual-total input', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ accounts: [account] }) })));
    render(<App><AccountDistributionDrawer open onClose={vi.fn()} positions={[position]} cashBalance={1000} /></App>);

    expect(await screen.findByText('BTC 冷钱包')).toBeInTheDocument();
    expect(screen.getByText(/系统计算合计 \$10,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/券商显示差额.*\$50\.00/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '编辑 BTC 冷钱包' }));
    expect(await screen.findByLabelText('券商显示总资产（USD，可选）')).toBeInTheDocument();
    expect(screen.queryByLabelText('账户总额')).not.toBeInTheDocument();
    expect(screen.getByLabelText('持仓数量')).toHaveValue('0.10000000');
    expect(screen.getByText('BTC 数量可填写小数；账户总额由系统自动计算。')).toBeInTheDocument();
  });

  it('saves only source data through the snapshot API', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ accounts: [account] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<App><AccountDistributionDrawer open onClose={vi.fn()} positions={[position]} cashBalance={1000} /></App>);
    await screen.findByText('BTC 冷钱包');
    fireEvent.click(screen.getByRole('button', { name: '保存账户分布' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, options] = fetchMock.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(options.body));
    expect(body.accounts[0]).not.toHaveProperty('calculated_total_usd');
    expect(body.accounts[0].positions[0]).toEqual({ ticker_id: 'btc', quantity: 0.1 });
  });
});
