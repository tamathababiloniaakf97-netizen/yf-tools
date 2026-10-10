import type { TickerType } from '@/types';

export type QuoteTicker = { code: string; type: TickerType };
export type QuoteSource = '腾讯行情' | 'Coinbase' | 'CoinLore';
export type QuoteResult =
  | { ok: true; price: number; source: QuoteSource; kind?: 'realtime' | 'hour_close'; observedAt?: string }
  | { ok: false; price: null; source: QuoteSource | null; error: string };
export type PreviousCloseResult =
  | { ok: true; price: number; source: QuoteSource; observedOn: string | null }
  | { ok: false; price: null; source: QuoteSource | null; error: string };

type QuoteRequest = { source: QuoteSource; symbol: string; url: string };

function positiveNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function buildQuoteRequest(ticker: QuoteTicker): QuoteRequest | null {
  const code = ticker.code.trim().toUpperCase();
  if (!code) return null;

  if (ticker.type !== 'crypto' && ticker.type !== 'option' && /^\d{6}$/.test(code)) {
    const symbol = `${code.startsWith('5') || code.startsWith('6') || code.startsWith('9') ? 'sh' : 'sz'}${code}`;
    return { source: '腾讯行情', symbol, url: `https://qt.gtimg.cn/q=${symbol}` };
  }

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

export function parseTencentPreviousClose(payload: string) {
  const quoted = payload.match(/="([^"]*)"/)?.[1];
  if (!quoted) return null;
  return positiveNumber(quoted.split('~')[4]);
}

export function parseCoinbasePrice(payload: unknown) {
  const amount = (payload as { data?: { amount?: unknown } } | null)?.data?.amount;
  return positiveNumber(amount);
}

export function parseCoinLorePrice(payload: unknown, symbol: string) {
  if (!Array.isArray(payload)) return null;
  const item = payload.find((entry) => String((entry as { symbol?: unknown }).symbol ?? '').toUpperCase() === symbol.toUpperCase()) as { price_usd?: unknown } | undefined;
  return positiveNumber(item?.price_usd);
}

export function parseCoinbaseHourClose(payload: unknown, now = new Date()) {
  if (!Array.isArray(payload)) return null;
  const latest = payload
    .filter((entry): entry is unknown[] => Array.isArray(entry) && Number(entry[0]) * 1000 + 3_600_000 <= now.getTime() && positiveNumber(entry[4]) !== null)
    .sort((a, b) => Number(b[0]) - Number(a[0]))[0];
  if (!latest) return null;
  return { price: positiveNumber(latest[4]) as number, observedAt: new Date(Number(latest[0]) * 1000 + 3_600_000).toISOString() };
}

export function parseCoinbaseDailyClose(payload: unknown, now = new Date()) {
  if (!Array.isArray(payload)) return null;
  const latest = payload
    .filter((entry): entry is unknown[] => Array.isArray(entry) && Number(entry[0]) * 1000 + 86_400_000 <= now.getTime() && positiveNumber(entry[4]) !== null)
    .sort((a, b) => Number(b[0]) - Number(a[0]))[0];
  if (!latest) return null;
  return { price: positiveNumber(latest[4]) as number, observedOn: new Date(Number(latest[0]) * 1000).toISOString().slice(0, 10) };
}

const coinLoreIds: Record<string, string> = { BTC: '90', ETH: '80' };

async function fetchJson(fetcher: typeof fetch, url: string) {
  const response = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`返回 ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function fetchCryptoPrice(symbol: string, fetcher: typeof fetch): Promise<QuoteResult> {
  const base = symbol.split('-')[0];
  const failures: string[] = [];
  try {
    const price = parseCoinbasePrice(await fetchJson(fetcher, `https://api.coinbase.com/v2/prices/${symbol}/spot`));
    if (price !== null) return { ok: true, price, source: 'Coinbase', kind: 'realtime' };
    failures.push('Coinbase未返回有效价格');
  } catch (error) { failures.push(`Coinbase请求失败：${error instanceof Error ? error.message : String(error)}`); }

  const coinLoreId = coinLoreIds[base];
  if (coinLoreId) {
    try {
      const price = parseCoinLorePrice(await fetchJson(fetcher, `https://api.coinlore.net/api/ticker/?id=${coinLoreId}`), base);
      if (price !== null) return { ok: true, price, source: 'CoinLore', kind: 'realtime' };
      failures.push('CoinLore未返回有效价格');
    } catch (error) { failures.push(`CoinLore请求失败：${error instanceof Error ? error.message : String(error)}`); }
  }

  try {
    const candle = parseCoinbaseHourClose(await fetchJson(fetcher, `https://api.exchange.coinbase.com/products/${symbol}/candles?granularity=3600`));
    if (candle) return { ok: true, price: candle.price, source: 'Coinbase', kind: 'hour_close', observedAt: candle.observedAt };
    failures.push('Coinbase 1h K线没有已完成数据');
  } catch (error) { failures.push(`Coinbase 1h K线请求失败：${error instanceof Error ? error.message : String(error)}`); }
  return { ok: false, price: null, source: null, error: failures.join('；') };
}

export async function fetchMarketPrice(ticker: QuoteTicker, fetcher: typeof fetch = fetch): Promise<QuoteResult> {
  const request = buildQuoteRequest(ticker);
  if (!request) return { ok: false, price: null, source: null, error: '暂不支持该标的类型' };
  if (ticker.type === 'crypto') return fetchCryptoPrice(request.symbol, fetcher);

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

export async function fetchPreviousClose(ticker: QuoteTicker, fetcher: typeof fetch = fetch): Promise<PreviousCloseResult> {
  const request = buildQuoteRequest(ticker);
  if (!request) return { ok: false, price: null, source: null, error: '暂不支持该标的类型' };
  try {
    if (ticker.type === 'crypto') {
      const payload = await fetchJson(fetcher, `https://api.exchange.coinbase.com/products/${request.symbol}/candles?granularity=86400`);
      const candle = parseCoinbaseDailyClose(payload);
      return candle ? { ok: true, price: candle.price, source: 'Coinbase', observedOn: candle.observedOn } : { ok: false, price: null, source: 'Coinbase', error: '没有已完成的日线数据' };
    }
    const response = await fetcher(request.url, { cache: 'no-store', signal: AbortSignal.timeout(8_000), headers: { Referer: 'https://gu.qq.com/' } });
    if (!response.ok) return { ok: false, price: null, source: request.source, error: `${request.source}返回 ${response.status}` };
    const price = parseTencentPreviousClose(await response.text());
    return price === null ? { ok: false, price: null, source: request.source, error: `${request.source}未返回前一日收盘价` } : { ok: true, price, source: request.source, observedOn: null };
  } catch (error) {
    return { ok: false, price: null, source: request.source, error: `${request.source}请求失败：${error instanceof Error ? error.message : String(error)}` };
  }
}
