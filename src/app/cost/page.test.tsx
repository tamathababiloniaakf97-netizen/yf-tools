import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CostPage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('./components/AccountSummaryCards', () => ({ default: ({ onOpenAccountDistribution }: { onOpenAccountDistribution?: () => void }) => <button onClick={onOpenAccountDistribution}>查看账户分布</button> }));
vi.mock('./components/AccountDistributionDrawer', () => ({ default: ({ open }: { open: boolean }) => open ? <div>账户分布抽屉已打开</div> : null }));
vi.mock('./components/PositionTable', () => ({ default: () => null }));
vi.mock('./components/TransactionModal', () => ({ default: () => null }));
vi.mock('./components/TickerModal', () => ({ default: () => null }));
vi.mock('./components/TickerManagerModal', () => ({ default: () => null }));
vi.mock('./components/PendingOrdersPanel', () => ({ default: () => null }));
vi.mock('./components/PortfolioOpeningModal', () => ({ default: () => null }));
vi.mock('./components/TransactionPanel', () => ({
  default: ({ transactions }: { transactions: Array<{ tickers?: { name: string; code: string } }> }) => (
    <div data-testid="transaction-names">
      {transactions.map((transaction, index) => (
        <span key={index}>{transaction.tickers ? `${transaction.tickers.name} (${transaction.tickers.code})` : '—'}</span>
      ))}
    </div>
  ),
}));

afterEach(() => vi.unstubAllGlobals());

describe('CostPage transaction loading', () => {
  it('opens account distribution without navigating away from the cost page', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/positions') return Promise.resolve({ ok: true, json: async () => ({ tickers: [], transactions: [], opening: null, openingPositions: [] }) } as Response);
      if (url === '/api/transactions' || url === '/api/pending-orders') return Promise.resolve({ ok: true, json: async () => [] } as Response);
      throw new Error(`Unexpected request: ${url}`);
    }));
    render(<App><CostPage /></App>);
    fireEvent.click(screen.getByRole('button', { name: '查看账户分布' }));
    expect(await screen.findByText('账户分布抽屉已打开')).toBeInTheDocument();
  });

  it('不会让较慢的持仓响应覆盖流水中的标的名称', async () => {
    let resolvePositions!: (value: Response) => void;
    const positionsResponse = new Promise<Response>((resolve) => { resolvePositions = resolve; });
    const transaction = {
      id: 'tx-1', user_id: 'u1', ticker_id: 'goog', type: 'buy', quantity: 1, price: 100,
      amount_orig: 100, amount_usd: 100, currency: 'USD', option_detail: null, note: '',
      trade_date: '2026-09-30', created_at: '',
    };
    const enrichedTransaction = { ...transaction, tickers: { name: '谷歌', code: 'GOOG' } };

    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/positions') return positionsResponse;
      if (url === '/api/transactions') {
        return Promise.resolve({ ok: true, json: async () => [enrichedTransaction] } as Response);
      }
      if (url === '/api/pending-orders') {
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      throw new Error(`Unexpected request: ${url}`);
    }));

    render(<App><CostPage /></App>);
    await waitFor(() => expect(screen.getByText('谷歌 (GOOG)')).toBeInTheDocument());

    await act(async () => {
      resolvePositions({
        ok: true,
        json: async () => ({ tickers: [], transactions: [transaction], opening: null, openingPositions: [] }),
      } as Response);
      await positionsResponse;
    });

    expect(screen.getByText('谷歌 (GOOG)')).toBeInTheDocument();
  });
});
