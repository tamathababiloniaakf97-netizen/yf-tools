import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PendingOrderModal from './PendingOrderModal';
import type { PendingOrder, Ticker } from '@/types';

const ticker: Ticker = { id: 't1', user_id: 'u1', name: '腾讯', code: '700', type: 'stock_hk', currency: 'HKD', current_price: null, price_updated_at: null, style: null, created_at: '' };
const order: PendingOrder = { id: 'o1', user_id: 'u1', ticker_id: 't1', category: 'stock', side: 'buy', option_action: null, option_type: null, position_id: null, quantity: 1, price: 400, reference_price: null, strike_price: null, expiration_date: null, order_date: '2026-10-09', created_at: '', updated_at: '' };

afterEach(() => vi.unstubAllGlobals());

describe('PendingOrderModal', () => {
  it('fills an editable reference price from the previous-close endpoint', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ price: 420.6, currency: 'HKD' }) }));
    vi.stubGlobal('fetch', fetcher);
    render(<App><PendingOrderModal open category="stock" order={order} tickers={[ticker]} openPositions={[]} onClose={vi.fn()} onSuccess={vi.fn()} /></App>);
    fireEvent.click(screen.getByRole('button', { name: '获取前一日收盘价' }));
    await waitFor(() => expect(screen.getByLabelText('参考价格').getAttribute('value')).toBe('420.6000'));
    expect(fetcher).toHaveBeenCalledWith('/api/prices/previous-close?ticker_id=t1');
  });
});
