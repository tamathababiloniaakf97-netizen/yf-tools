import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, expect, it, vi } from 'vitest';
import TransactionModal from './TransactionModal';
import type { Transaction, Ticker } from '@/types';

afterEach(() => vi.unstubAllGlobals());
it('preserves transaction currency even if the ticker currency changed', async () => {
  const tx = { id: '1', ticker_id: 't', type: 'buy', currency: 'HKD', quantity: 100, price: 10, trade_date: '2026-10-01' } as Transaction;
  const ticker = { id: 't', name: '腾讯', code: '700', currency: 'USD' } as Ticker;
  const fetcher = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetcher);
  render(<App><TransactionModal open editingTransaction={tx} tickers={[ticker]} onClose={vi.fn()} onSuccess={vi.fn()} /></App>);
  expect(screen.getByLabelText('交易类型')).toBeDisabled();
  expect(await screen.findByLabelText('标的')).toBeDisabled();
  expect(screen.getByLabelText('单价（HKD）')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '保存修改' }));
  await waitFor(() => expect(fetcher).toHaveBeenCalled());
  expect(JSON.parse(fetcher.mock.calls[0][1].body).currency).toBe('HKD');
});
