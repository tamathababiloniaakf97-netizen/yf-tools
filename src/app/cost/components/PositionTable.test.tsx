import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import PositionTable from './PositionTable';
import type { Position } from '@/types';

const position: Position = {
  ticker: { id: 'nvda', user_id: 'u1', name: '英伟达', code: 'NVDA', type: 'stock_us', currency: 'USD', current_price: 165, price_updated_at: null, style: null, created_at: '' },
  totalShares: 10, costPerShare: 150, totalCost: 1500, currentPrice: 165,
  marketValue: 1650, optionPnl: 0, pnl: 150, pnlPercent: 10, allocPercent: 100, isNegativeCost: false,
};

describe('PositionTable pending-order shortcut', () => {
  it('opens pending orders filtered to the holding ticker', () => {
    const onViewPendingOrders = vi.fn();
    render(<App><PositionTable positions={[position]} loading={false} onViewTransactions={vi.fn()} onViewPendingOrders={onViewPendingOrders} onPriceChange={vi.fn()} onSyncPrices={vi.fn()} onRefresh={vi.fn()} syncing={false} priceUpdatedAt={{}} /></App>);
    fireEvent.click(screen.getByRole('button', { name: /挂单/ }));
    expect(onViewPendingOrders).toHaveBeenCalledWith('nvda');
  });
});
