import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Ticker } from '@/types';
import TickerManagerModal from './TickerManagerModal';

const ethTicker = (id: string): Ticker => ({
  id,
  user_id: 'user-1',
  name: '以太坊',
  code: 'ETH-USD',
  type: 'crypto',
  currency: 'USD',
  current_price: null,
  price_updated_at: null,
  style: null,
  created_at: '2026-09-29T00:00:00Z',
});

afterEach(() => vi.unstubAllGlobals());

function renderManager(onDeleted = vi.fn()) {
  render(
    <App>
      <TickerManagerModal open tickers={[ethTicker('eth-1'), ethTicker('eth-2')]} onClose={vi.fn()} onDeleted={onDeleted} />
    </App>,
  );
  return onDeleted;
}

describe('TickerManagerModal', () => {
  it('确认后删除指定标的并刷新列表', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const onDeleted = renderManager();

    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[1]);
    fireEvent.click(await screen.findByRole('button', { name: /确\s*定/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/tickers/eth-2', { method: 'DELETE' }));
    expect(onDeleted).toHaveBeenCalledOnce();
  });

  it('有交易记录时显示服务端拒绝原因，不刷新', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: '该标的已有 2 条交易记录，不能删除' }),
    }));
    const onDeleted = renderManager();

    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[0]);
    fireEvent.click(await screen.findByRole('button', { name: /确\s*定/ }));

    expect(await screen.findByText('该标的已有 2 条交易记录，不能删除')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
