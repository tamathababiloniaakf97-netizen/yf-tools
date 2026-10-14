import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import PositionTable from './PositionTable';
import type { Position } from '@/types';

const position: Position = {
  ticker: { id: 'nvda', user_id: 'u1', name: '英伟达', code: 'NVDA', type: 'stock_us', currency: 'USD', current_price: 165, price_updated_at: null, style: 'offensive', created_at: '' },
  totalShares: 10, costPerShare: 150, totalCost: 1500, currentPrice: 165,
  marketValue: 1650, optionPnl: 0, pnl: 150, pnlPercent: 10, allocPercent: 100, isNegativeCost: false,
};

const defensivePosition: Position = {
  ticker: { id: 'unh', user_id: 'u1', name: '联合健康', code: 'UNH', type: 'stock_us', currency: 'USD', current_price: 90, price_updated_at: null, style: 'defensive', created_at: '' },
  totalShares: 20, costPerShare: 90, totalCost: 1800, currentPrice: 90,
  marketValue: 1800, optionPnl: 0, pnl: 0, pnlPercent: 0, allocPercent: 18, isNegativeCost: false,
};

const cryptoPosition: Position = {
  ticker: { id: 'btc', user_id: 'u1', name: '比特币', code: 'BTC-USD', type: 'crypto', currency: 'USD', current_price: 1500, price_updated_at: null, style: 'offensive', created_at: '' },
  totalShares: 1, costPerShare: 1400, totalCost: 1400, currentPrice: 1500,
  marketValue: 1500, optionPnl: 0, pnl: 100, pnlPercent: 7.14, allocPercent: 15, isNegativeCost: false,
};

function renderPositionTable(positions: Position[], onViewPendingOrders = vi.fn(), onPriceChange = vi.fn()) {
  return render(
    <App>
      <PositionTable
        positions={positions}
        totalAssets={10000}
        loading={false}
        onViewTransactions={vi.fn()}
        onViewPendingOrders={onViewPendingOrders}
        onPriceChange={onPriceChange}
        onSyncPrices={vi.fn()}
        onRefresh={vi.fn()}
        syncing={false}
        priceUpdatedAt={{}}
      />
    </App>,
  );
}

describe('PositionTable pending-order shortcut', () => {
  it('edits native prices but preserves legacy storage conversion', () => {
    const onPriceChange = vi.fn();
    renderPositionTable([{ ...position, ticker: { ...position.ticker, currency: 'HKD', type: 'stock_hk' } }], vi.fn(), onPriceChange);
    fireEvent.click(screen.getByText('HK$ 1,287.0000'));
    const input = screen.getByLabelText('现价（HKD）');
    expect(Number((input as HTMLInputElement).value)).toBe(1287);
    fireEvent.change(input, { target: { value: '780' } });
    fireEvent.blur(input);
    expect(onPriceChange.mock.calls[0][0]).toBe('nvda'); expect(onPriceChange.mock.calls[0][1]).toBeCloseTo(100);
  });
  it('shows HKD holding values while keeping the summary in dollars', () => {
    renderPositionTable([{ ...position, ticker: { ...position.ticker, currency: 'HKD', type: 'stock_hk' } }]);
    expect(screen.getByText('HK$ 1,170.0000')).toBeInTheDocument();
    expect(screen.getByText('HK$ 1,287.0000')).toBeInTheDocument();
    expect(screen.getByText('HK$ 12,870.00')).toBeInTheDocument();
    expect(screen.getByText('+HK$ 1,170.00')).toBeInTheDocument();
    expect(within(screen.getByLabelText('筛选结果汇总')).getByText('US$ 1,650.00')).toBeInTheDocument();
  });
  it('opens pending orders filtered to the holding ticker', () => {
    const onViewPendingOrders = vi.fn();
    renderPositionTable([position], onViewPendingOrders);
    fireEvent.click(screen.getByRole('button', { name: /挂单/ }));
    expect(onViewPendingOrders).toHaveBeenCalledWith('nvda');
  });

  it('filters positions by style, type, and ticker search', async () => {
    renderPositionTable([position, defensivePosition, cryptoPosition]);

    const styleFilter = screen.getByRole('combobox', { name: '属性筛选' });
    fireEvent.mouseDown(styleFilter);
    await screen.findByRole('option', { name: '进攻' });
    fireEvent.click(screen.getAllByText('进攻').at(-1)!);
    await waitFor(() => expect(screen.queryByText('联合健康')).not.toBeInTheDocument());
    expect(screen.getByText('英伟达')).toBeInTheDocument();
    expect(screen.getByText('比特币')).toBeInTheDocument();

    const typeFilter = screen.getByRole('combobox', { name: '类型筛选' });
    fireEvent.mouseDown(typeFilter);
    await screen.findByRole('option', { name: '美股' });
    fireEvent.click(screen.getAllByText('美股').at(-1)!);
    await waitFor(() => expect(screen.queryByText('比特币')).not.toBeInTheDocument());
    expect(screen.getByText('英伟达')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索标的' }), { target: { value: 'nvda' } });
    expect(screen.getByText('英伟达')).toBeInTheDocument();
  });

  it('recalculates the visible summary with weighted return and account share', () => {
    renderPositionTable([position, defensivePosition]);
    const summary = within(screen.getByLabelText('筛选结果汇总'));
    expect(summary.getByText('2 / 2')).toBeInTheDocument();
    expect(summary.getByText('US$ 3,450.00')).toBeInTheDocument();
    expect(summary.getByText('+US$ 150.00')).toBeInTheDocument();
    expect(summary.getByText('+4.55%')).toBeInTheDocument();
    expect(summary.getByText('34.50%')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索标的' }), { target: { value: '不存在' } });
    expect(summary.getByText('0 / 2')).toBeInTheDocument();
    expect(summary.getAllByText('US$ 0.00')).toHaveLength(2);
    expect(summary.getByText('—')).toBeInTheDocument();
  });

  it('summarizes arbitrary selected positions and restores the filtered summary when cleared', () => {
    renderPositionTable([position, defensivePosition, cryptoPosition]);
    const summary = within(screen.getByLabelText('筛选结果汇总'));

    fireEvent.click(screen.getByRole('checkbox', { name: '选择 英伟达' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '选择 比特币' }));
    expect(summary.getByText('已选汇总')).toBeInTheDocument();
    expect(summary.getByText('2 / 3')).toBeInTheDocument();
    expect(summary.getByText('US$ 3,150.00')).toBeInTheDocument();
    expect(summary.getByText('+US$ 250.00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: '选择 英伟达' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '选择 比特币' }));
    expect(summary.getByText('筛选汇总')).toBeInTheDocument();
    expect(summary.getByText('3 / 3')).toBeInTheDocument();
    expect(summary.getByText('US$ 4,950.00')).toBeInTheDocument();
  });

  it('clears selected rows when a filter changes', () => {
    renderPositionTable([position, defensivePosition, cryptoPosition]);
    fireEvent.click(screen.getByRole('checkbox', { name: '选择 英伟达' }));
    expect(within(screen.getByLabelText('筛选结果汇总')).getByText('已选汇总')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索标的' }), { target: { value: 'unh' } });
    expect(within(screen.getByLabelText('筛选结果汇总')).getByText('筛选汇总')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '选择 联合健康' })).not.toBeChecked();
  });
});
