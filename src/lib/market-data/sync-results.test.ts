import { describe, expect, it, vi } from 'vitest';
import { syncTickerPrice } from './sync-results';

const ticker = {
  id: 't-1',
  name: '腾讯控股',
  code: '00700',
  type: 'stock_hk' as const,
  currency: 'HKD' as const,
};

describe('syncTickerPrice', () => {
  it('只在行情取得且写库成功后返回 updated，并将本币价格折算为 USD', async () => {
    const persist = vi.fn().mockResolvedValue(undefined);
    const result = await syncTickerPrice(
      ticker,
      vi.fn().mockResolvedValue({ ok: true, price: 780, source: '腾讯行情' }),
      persist,
      '2026-09-29',
    );

    expect(persist).toHaveBeenCalledWith('t-1', 100, '2026-09-29');
    expect(result).toMatchObject({ status: 'updated', price: 100, source: '腾讯行情' });
  });

  it('行情获取失败时返回原因，不写库', async () => {
    const persist = vi.fn();
    const result = await syncTickerPrice(
      ticker,
      vi.fn().mockResolvedValue({ ok: false, error: '行情服务返回 503', source: '腾讯行情' }),
      persist,
      '2026-09-29',
    );

    expect(persist).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'failed', error: '行情服务返回 503' });
  });

  it('数据库写入失败不得报成功', async () => {
    const result = await syncTickerPrice(
      ticker,
      vi.fn().mockResolvedValue({ ok: true, price: 780, source: '腾讯行情' }),
      vi.fn().mockRejectedValue(new Error('数据库拒绝写入')),
      '2026-09-29',
    );

    expect(result).toMatchObject({ status: 'failed', error: '保存失败：数据库拒绝写入' });
  });
});
