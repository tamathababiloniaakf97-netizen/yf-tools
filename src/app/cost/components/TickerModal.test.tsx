import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TickerModal from './TickerModal';

afterEach(() => vi.unstubAllGlobals());

describe('TickerModal', () => {
  it('按名称搜索后要求用户明确选择，再固定代码和币种', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { id: 'stock_us:SPYM', name: 'SPDR Portfolio S&P 500 ETF', code: 'SPYM', type: 'stock_us', currency: 'USD', market: 'NYSE' },
          { id: 'stock_us:SPY', name: 'SPDR S&P 500 ETF', code: 'SPY', type: 'stock_us', currency: 'USD', market: 'NYSE' },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<TickerModal open onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/AAPL/), { target: { value: '标普500ETF' } });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));

    expect(await screen.findByText('SPDR S&P 500 ETF (SPY)')).toBeInTheDocument();
    expect(screen.queryByText(/已选：/)).not.toBeInTheDocument();

    const chooseButtons = screen.getAllByRole('button', { name: '选择' });
    fireEvent.click(chooseButtons[1]);
    await waitFor(() => expect(screen.getByText('已选：SPDR S&P 500 ETF (SPY)')).toBeInTheDocument());
    expect(screen.getByText(/stock_us \/ USD/)).toBeInTheDocument();
  });
});
