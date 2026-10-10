import { describe, expect, it, vi } from 'vitest';
import { buildQuoteRequest, fetchMarketPrice, fetchPreviousClose, parseCoinbaseDailyClose, parseCoinbaseHourClose, parseCoinbasePrice, parseCoinLorePrice, parseTencentPreviousClose, parseTencentPrice } from './quotes';

describe('market quote adapters', () => {
  it('builds provider symbols for every supported market', () => {
    expect(buildQuoteRequest({ code: 'spy', type: 'stock_us' })).toMatchObject({ symbol: 'usSPY', source: '腾讯行情' });
    expect(buildQuoteRequest({ code: '700', type: 'stock_hk' })).toMatchObject({ symbol: 'hk00700', source: '腾讯行情' });
    expect(buildQuoteRequest({ code: '600519', type: 'stock_a' })).toMatchObject({ symbol: 'sh600519' });
    expect(buildQuoteRequest({ code: '000001', type: 'stock_a' })).toMatchObject({ symbol: 'sz000001' });
    expect(buildQuoteRequest({ code: 'btc', type: 'crypto' })).toMatchObject({ symbol: 'BTC-USD', source: 'Coinbase' });
    expect(buildQuoteRequest({ code: 'ETH-USD', type: 'crypto' })).toMatchObject({ symbol: 'ETH-USD' });
    expect(buildQuoteRequest({ code: '513130', type: 'stock_us' })).toMatchObject({ symbol: 'sh513130', source: '腾讯行情' });
    expect(buildQuoteRequest({ code: 'SPY', type: 'option' })).toBeNull();
  });

  it('parses CoinLore prices for the expected crypto symbol', () => {
    expect(parseCoinLorePrice([{ symbol: 'BTC', price_usd: '82706.10' }], 'BTC')).toBe(82706.1);
    expect(parseCoinLorePrice([{ symbol: 'ETH', price_usd: '2549.96' }], 'BTC')).toBeNull();
  });

  it('uses only the latest completed Coinbase hourly candle', () => {
    const now = new Date('2026-10-08T12:30:00Z');
    expect(parseCoinbaseHourClose([
      [Date.parse('2026-10-08T12:00:00Z') / 1000, 82000, 83000, 82500, 82900, 1],
      [Date.parse('2026-10-08T11:00:00Z') / 1000, 81000, 82800, 81500, 82600, 1],
    ], now)).toMatchObject({ price: 82600, observedAt: '2026-10-08T12:00:00.000Z' });
  });

  it('falls back to CoinLore when Coinbase times out', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ symbol: 'BTC', price_usd: '82706.10' }]), { status: 200 }));
    await expect(fetchMarketPrice({ code: 'BTC-USD', type: 'crypto' }, fetcher)).resolves.toMatchObject({ ok: true, price: 82706.1, source: 'CoinLore', kind: 'realtime' });
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://api.coinlore.net/api/ticker/?id=90', expect.objectContaining({ cache: 'no-store' }));
  });

  it('parses Tencent and Coinbase prices while rejecting empty responses', () => {
    expect(parseTencentPrice('v_usSPY="200~标普500~SPY.AM~765.61~771.35";')).toBe(765.61);
    expect(parseTencentPrice('v_usSPY="";')).toBeNull();
    expect(parseCoinbasePrice({ data: { amount: '83978.005' } })).toBe(83978.005);
    expect(parseCoinbasePrice({ data: { amount: '0' } })).toBeNull();
  });

  it('parses the Tencent previous close and the latest completed Coinbase daily close', () => {
    expect(parseTencentPreviousClose('v_hk00700="100~腾讯控股~00700~430.00~420.00";')).toBe(420);
    const now = new Date('2026-10-08T12:00:00Z');
    expect(parseCoinbaseDailyClose([
      [Date.parse('2026-10-08T00:00:00Z') / 1000, 1, 2, 1, 2, 1],
      [Date.parse('2026-10-07T00:00:00Z') / 1000, 1, 420, 1, 418, 1],
    ], now)).toMatchObject({ price: 418, observedOn: '2026-10-07' });
  });

  it('fetches a stock previous close without returning the intraday price', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('v_hk00700="100~腾讯控股~00700~430.00~420.00";', { status: 200 }));
    await expect(fetchPreviousClose({ code: '700', type: 'stock_hk' }, fetcher)).resolves.toMatchObject({ ok: true, price: 420, source: '腾讯行情' });
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
