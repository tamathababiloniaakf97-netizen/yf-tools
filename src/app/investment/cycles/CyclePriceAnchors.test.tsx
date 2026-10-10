import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CyclePriceAnchors from './CyclePriceAnchors';
import type { MarketCycleProfile } from '@/types/life-os';

const profile = {
  ticker_id: 'ticker-1',
  ticker: { id: 'ticker-1', name: '比特币', code: 'BTC', currency: 'USD' },
  cycle_started_on: '2026-01-01', cycle_start_price: 50000,
  latest_price: 70000, latest_price_on: '2026-10-09',
} as MarketCycleProfile;

describe('CyclePriceAnchors', () => {
  it('shows the selected benchmark and four manual anchors', () => {
    render(<CyclePriceAnchors profile={profile} />);
    expect(screen.getByText('比特币 · BTC')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01')).toBeInTheDocument();
    expect(screen.getByText('50,000')).toBeInTheDocument();
    expect(screen.getByText('70,000')).toBeInTheDocument();
    expect(screen.getByText('2026-10-09')).toBeInTheDocument();
  });

  it('uses honest empty values when no benchmark or prices exist', () => {
    render(<CyclePriceAnchors profile={{} as MarketCycleProfile} />);
    expect(screen.getByText('未关联')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  it('offers one-click updating only for a selected benchmark', () => {
    const onFetch=vi.fn();
    const { rerender }=render(<CyclePriceAnchors profile={profile} onFetch={onFetch}/>);
    fireEvent.click(screen.getByRole('button',{name:'获取当前价格'}));
    expect(onFetch).toHaveBeenCalledOnce();
    rerender(<CyclePriceAnchors profile={{} as MarketCycleProfile} onFetch={onFetch}/>);
    expect(screen.queryByRole('button',{name:'获取当前价格'})).not.toBeInTheDocument();
  });
});
