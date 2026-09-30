import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PendingOrdersPanel from './PendingOrdersPanel';
import type { PendingOrder, Ticker } from '@/types';

const tickers: Ticker[] = [
  { id: 'nvda', user_id: 'u1', name: '英伟达', code: 'NVDA', type: 'stock_us', currency: 'USD', current_price: null, price_updated_at: null, style: null, created_at: '' },
  { id: 'tsla', user_id: 'u1', name: '特斯拉', code: 'TSLA', type: 'stock_us', currency: 'USD', current_price: null, price_updated_at: null, style: null, created_at: '' },
];

const orders: PendingOrder[] = [
  { id: 's1', user_id: 'u1', ticker_id: 'tsla', category: 'stock', side: 'buy', option_action: null, option_type: null, position_id: null, quantity: 5, price: 380, strike_price: null, expiration_date: null, order_date: '2026-09-29', created_at: '', updated_at: '', tickers: { name: '特斯拉', code: 'TSLA', currency: 'USD' } },
  { id: 'o1', user_id: 'u1', ticker_id: 'nvda', category: 'option', side: 'sell', option_action: 'open', option_type: 'put', position_id: 'opt-1', quantity: 1, price: 250, strike_price: 160, expiration_date: '2026-10-17', order_date: '2026-09-30', created_at: '', updated_at: '', tickers: { name: '英伟达', code: 'NVDA', currency: 'USD' } },
];

afterEach(() => vi.unstubAllGlobals());

function renderPanel(onRefresh = vi.fn()) {
  render(<App><PendingOrdersPanel orders={orders} tickers={tickers} openPositions={[]} loading={false} onRefresh={onRefresh} /></App>);
  return onRefresh;
}

describe('PendingOrdersPanel', () => {
  it('uses separate stock and option columns', () => {
    renderPanel();
    expect(screen.getAllByText('挂单价').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('期权挂单 1'));
    expect(screen.getAllByText('行权价').length).toBeGreaterThan(0);
    expect(screen.getAllByText('到期日').length).toBeGreaterThan(0);
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('offers every ticker in the independent filter', () => {
    renderPanel();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getByText('英伟达 (NVDA)')).toBeInTheDocument();
    expect(screen.getAllByText('特斯拉 (TSLA)').length).toBeGreaterThan(0);
  });

  it('converts with an editable date and refreshes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const onRefresh = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /成交转流水/ }));
    expect(screen.getByText('确认成交')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '确认并转为流水' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/pending-orders/s1/convert', expect.objectContaining({ method: 'POST' })));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
