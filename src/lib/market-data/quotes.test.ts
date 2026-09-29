import { describe, expect, it, vi } from 'vitest';
import { buildQuoteRequest, fetchMarketPrice, parseCoinbasePrice, parseTencentPrice } from './quotes';

describe('market quote adapters', () => {
  it('builds provider symbols for every supported market', () => {
    expect(buildQuoteRequest({ code: 'spy', type: 'stock_us' })).toMatchObject({ symbol: 'usSPY', source: '腾讯行情' });
    expect(buildQuoteRequest({ code: '700', type: 'stock_hk' })).toMatchObject({ symbol: 'hk00700', source: '腾讯行情' });
    expect(buildQuoteRequest({ code: '600519', type: 'stock_a' })).toMatchObject({ symbol: 'sh600519' });
    expect(buildQuoteRequest({ code: '000001', type: 'stock_a' })).toMatchObject({ symbol: 'sz000001' });
    expect(buildQuoteRequest({ code: 'btc', type: 'crypto' })).toMatchObject({ symbol: 'BTC-USD', source: 'Coinbase' });
    expect(buildQuoteRequest({ code: 'ETH-USD', type: 'crypto' })).toMatchObject({ symbol: 'ETH-USD' });
    expect(buildQuoteRequest({ code: 'SPY', type: 'option' })).toBeNull();
  });

  it('parses Tencent and Coinbase prices while rejecting empty responses', () => {
    expect(parseTencentPrice('v_usSPY="200~标普500~SPY.AM~765.61~771.35";')).toBe(765.61);
    expect(parseTencentPrice('v_usSPY="";')).toBeNull();
    expect(parseCoinbasePrice({ data: { amount: '83978.005' } })).toBe(83978.005);
    expect(parseCoinbasePrice({ data: { amount: '0' } })).toBeNull();
  });

  it('requests without cache and returns a structured success', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('v_usSPY="200~SPY~SPY.AM~765.61";', { status: 200 }));
    await expect(fetchMarketPrice({ code: 'SPY', type: 'stock_us' }, fetcher)).resolves.toMatchObject({ ok: true, price: 765.61, source: '腾讯行情' });
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('q=usSPY'), expect.objectContaining({ cache: 'no-store' }));
  });

  it('returns readable failures for unsupported types, upstream errors, and empty prices', async () => {
    await expect(fetchMarketPrice({ code: 'SPY', type: 'option' })).resolves.toMatchObject({ ok: false, error: '暂不支持该标的类型' });
    await expect(fetchMarketPrice({ code: 'SPY', type: 'stock_us' }, vi.fn().mockResolvedValue(new Response('', { status: 503 })))).resolves.toMatchObject({ ok: false, error: '腾讯行情返回 503' });
    await expect(fetchMarketPrice({ code: 'SPY', type: 'stock_us' }, vi.fn().mockResolvedValue(new Response('v_usSPY="";', { status: 200 })))).resolves.toMatchObject({ ok: false, error: '腾讯行情未返回有效价格' });
  });
});
