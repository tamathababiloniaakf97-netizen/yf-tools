import type { TickerType } from '@/types';

export type QuoteTicker = { code: string; type: TickerType };
export type QuoteSource = '腾讯行情' | 'Coinbase';
export type QuoteResult =
  | { ok: true; price: number; source: QuoteSource }
  | { ok: false; price: null; source: QuoteSource | null; error: string };

type QuoteRequest = { source: QuoteSource; symbol: string; url: string };

function positiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function buildQuoteRequest(ticker: QuoteTicker): QuoteRequest | null {
  const code = ticker.code.trim().toUpperCase();
  if (!code) return null;

  if (ticker.type === 'stock_us') {
    const symbol = `us${code}`;
    return { source: '腾讯行情', symbol, url: `https://qt.gtimg.cn/q=${symbol}` };
  }
  if (ticker.type === 'stock_hk') {
    const digits = code.replace(/\D/g, '').padStart(5, '0');
    const symbol = `hk${digits}`;
    return { source: '腾讯行情', symbol, url: `https://qt.gtimg.cn/q=${symbol}` };
  }
  if (ticker.type === 'stock_a') {
    const digits = code.replace(/^(SH|SZ)/, '');
    const symbol = `${digits.startsWith('6') || digits.startsWith('9') ? 'sh' : 'sz'}${digits}`;
    return { source: '腾讯行情', symbol, url: `https://qt.gtimg.cn/q=${symbol}` };
  }
  if (ticker.type === 'crypto') {
    const symbol = code.includes('-') ? code : `${code}-USD`;
    return { source: 'Coinbase', symbol, url: `https://api.coinbase.com/v2/prices/${symbol}/spot` };
  }
  return null;
}

export function parseTencentPrice(payload: string) {
  const quoted = payload.match(/="([^"]*)"/)?.[1];
  if (!quoted) return null;
  return positiveNumber(quoted.split('~')[3]);
}

export function parseCoinbasePrice(payload: unknown) {
  const amount = (payload as { data?: { amount?: unknown } } | null)?.data?.amount;
  return positiveNumber(amount);
}

export async function fetchMarketPrice(ticker: QuoteTicker, fetcher: typeof fetch = fetch): Promise<QuoteResult> {
  const request = buildQuoteRequest(ticker);
  if (!request) return { ok: false, price: null, source: null, error: '暂不支持该标的类型' };

  try {
    const response = await fetcher(request.url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
      headers: request.source === '腾讯行情' ? { Referer: 'https://gu.qq.com/' } : undefined,
    });
    if (!response.ok) return { ok: false, price: null, source: request.source, error: `${request.source}返回 ${response.status}` };
    const price = request.source === '腾讯行情'
      ? parseTencentPrice(await response.text())
      : parseCoinbasePrice(await response.json());
    if (price === null) return { ok: false, price: null, source: request.source, error: `${request.source}未返回有效价格` };
    return { ok: true, price, source: request.source };
  } catch (error) {
    return { ok: false, price: null, source: request.source, error: `${request.source}请求失败：${error instanceof Error ? error.message : String(error)}` };
  }
}
