import { describe, expect, it, vi } from 'vitest';
import { deleteTickerSafely } from './delete-ticker';

describe('deleteTickerSafely', () => {
  it('存在交易记录时禁止删除', async () => {
    const deleteTicker = vi.fn();
    const result = await deleteTickerSafely('ticker-1', vi.fn().mockResolvedValue(2), deleteTicker);

    expect(result).toEqual({ status: 'has_transactions', transactionCount: 2 });
    expect(deleteTicker).not.toHaveBeenCalled();
  });

  it('没有交易记录时执行删除', async () => {
    const deleteTicker = vi.fn().mockResolvedValue(undefined);
    const result = await deleteTickerSafely('ticker-1', vi.fn().mockResolvedValue(0), deleteTicker);

    expect(deleteTicker).toHaveBeenCalledWith('ticker-1');
    expect(result).toEqual({ status: 'deleted' });
  });

  it('查询或删除失败时返回失败原因', async () => {
    await expect(deleteTickerSafely(
      'ticker-1',
      vi.fn().mockRejectedValue(new Error('统计失败')),
      vi.fn(),
    )).resolves.toEqual({ status: 'failed', error: '统计失败' });

    await expect(deleteTickerSafely(
      'ticker-1',
      vi.fn().mockResolvedValue(0),
      vi.fn().mockRejectedValue(new Error('删除失败')),
    )).resolves.toEqual({ status: 'failed', error: '删除失败' });
  });
});
