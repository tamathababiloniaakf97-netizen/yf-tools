import { describe, expect, it, vi } from 'vitest';
import { buildQuoteRequest, parseCoinbaseDailyClose, parseTencentPreviousClose, resolveDailyPrice, toUsd } from './quotes';

describe('scheduled snapshot quotes', () => {
  it('builds A-share, Hong Kong, US and crypto quote symbols', () => {
    expect(buildQuoteRequest({ code: '159201', type: 'stock_a' })?.symbol).toBe('sz159201');
    expect(buildQuoteRequest({ code: '00700', type: 'stock_hk' })?.symbol).toBe('hk00700');
    expect(buildQuoteRequest({ code: 'MSFT', type: 'stock_us' })?.symbol).toBe('usMSFT');
    expect(buildQuoteRequest({ code: 'BTC-USD', type: 'crypto' })?.symbol).toBe('BTC-USD');
  });

  it('converts native CNY and HKD closes to USD with the existing fixed rates', () => {
    expect(toUsd(7.2, 'CNY')).toBeCloseTo(1);
    expect(toUsd(7.8, 'HKD')).toBeCloseTo(1);
    expect(toUsd(12, 'USD')).toBe(12);
  });

  it('parses completed market closes', () => {
    expect(parseTencentPreviousClose('v_hk00700="100~腾讯控股~00700~430.00~420.00";')).toBe(420);
    expect(parseCoinbaseDailyClose([[1_780_000_000, 1, 2, 1, 88_000]], new Date('2026-06-01T00:00:00Z')))
      .toMatchObject({ price: 88_000 });
  });

  it('uses a fresh quote when available and otherwise marks the last price as fallback', async () => {
    const ticker = { id: 't1', code: 'MSFT', type: 'stock_us' as const, currency: 'USD' as const, currentPriceUsd: 500, priceUpdatedAt: '2026-10-09' };
    await expect(resolveDailyPrice(ticker, vi.fn(async () => ({ ok: true as const, priceNative: 510, source: '腾讯行情', observedOn: '2026-10-10' }))))
      .resolves.toMatchObject({ priceUsd: 510, fallback: false, source: '腾讯行情' });
    await expect(resolveDailyPrice(ticker, vi.fn(async () => ({ ok: false as const, error: '超时' }))))
      .resolves.toMatchObject({ priceUsd: 500, fallback: true, error: '超时', observedOn: '2026-10-09' });
  });

  it('returns no price when both the quote and stored fallback are absent', async () => {
    const ticker = { id: 't1', code: 'MSFT', type: 'stock_us' as const, currency: 'USD' as const, currentPriceUsd: null, priceUpdatedAt: null };
    await expect(resolveDailyPrice(ticker, vi.fn(async () => ({ ok: false as const, error: '无行情' })))).resolves.toBeNull();
  });
});
