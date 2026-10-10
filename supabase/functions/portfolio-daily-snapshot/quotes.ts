export type ScheduledTicker = {
  id: string;
  code: string;
  type: 'stock_us' | 'stock_hk' | 'stock_a' | 'option' | 'crypto';
  currency: 'USD' | 'HKD' | 'CNY';
  currentPriceUsd: number | null;
  priceUpdatedAt: string | null;
};

export type NativeQuoteResult =
  | { ok: true; priceNative: number; source: string; observedOn: string | null }
  | { ok: false; error: string };

const USD_RATES = { USD: 1, HKD: 1 / 7.8, CNY: 1 / 7.2 } as const;

export function toUsd(amount: number, currency: keyof typeof USD_RATES) {
  return amount * USD_RATES[currency];
}

export function buildQuoteRequest(ticker: Pick<ScheduledTicker, 'code' | 'type'>) {
  const code = ticker.code.trim().toUpperCase();
  if (!code || ticker.type === 'option') return null;
  if (ticker.type === 'stock_a') {
    const digits = code.replace(/^(SH|SZ)/, '');
    const symbol = `${digits.startsWith('6') || digits.startsWith('9') ? 'sh' : 'sz'}${digits}`;
    return { symbol, source: '腾讯行情', url: `https://qt.gtimg.cn/q=${symbol}` };
  }
  if (ticker.type === 'stock_hk') {
    const symbol = `hk${code.replace(/\D/g, '').padStart(5, '0')}`;
    return { symbol, source: '腾讯行情', url: `https://qt.gtimg.cn/q=${symbol}` };
  }
  if (ticker.type === 'stock_us') {
    const symbol = `us${code}`;
    return { symbol, source: '腾讯行情', url: `https://qt.gtimg.cn/q=${symbol}` };
  }
  const symbol = code.includes('-') ? code : `${code}-USD`;
  return { symbol, source: 'Coinbase', url: `https://api.exchange.coinbase.com/products/${symbol}/candles?granularity=86400` };
}

function positiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function parseTencentPreviousClose(payload: string) {
  const quoted = payload.match(/="([^"]*)"/)?.[1];
  return quoted ? positiveNumber(quoted.split('~')[4]) : null;
}

export function parseCoinbaseDailyClose(payload: unknown, now = new Date()) {
  if (!Array.isArray(payload)) return null;
  const latest = payload
    .filter((entry): entry is unknown[] => Array.isArray(entry) && Number(entry[0]) * 1000 + 86_400_000 <= now.getTime() && positiveNumber(entry[4]) !== null)
    .sort((a, b) => Number(b[0]) - Number(a[0]))[0];
  if (!latest) return null;
  return { price: positiveNumber(latest[4]) as number, observedOn: new Date(Number(latest[0]) * 1000).toISOString().slice(0, 10) };
}

export async function fetchDailyClose(ticker: ScheduledTicker, fetcher: typeof fetch = fetch): Promise<NativeQuoteResult> {
  const request = buildQuoteRequest(ticker);
  if (!request) return { ok: false, error: '暂不支持该标的类型' };
  try {
    const response = await fetcher(request.url, {
      headers: request.source === '腾讯行情' ? { Referer: 'https://gu.qq.com/' } : undefined,
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return { ok: false, error: `${request.source}返回 ${response.status}` };
    if (ticker.type === 'crypto') {
      const candle = parseCoinbaseDailyClose(await response.json());
      return candle
        ? { ok: true, priceNative: candle.price, source: request.source, observedOn: candle.observedOn }
        : { ok: false, error: 'Coinbase没有已完成的日线数据' };
    }
    const price = parseTencentPreviousClose(await response.text());
    return price
      ? { ok: true, priceNative: price, source: request.source, observedOn: null }
      : { ok: false, error: '腾讯行情未返回前一日收盘价' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveDailyPrice(
  ticker: ScheduledTicker,
  quoteFetcher: (ticker: ScheduledTicker) => Promise<NativeQuoteResult> = fetchDailyClose,
) {
  const quote = await quoteFetcher(ticker);
  if (quote.ok) {
    return {
      priceUsd: toUsd(quote.priceNative, ticker.currency),
      source: quote.source,
      observedOn: quote.observedOn,
      fallback: false,
    };
  }
  if (ticker.currentPriceUsd && ticker.currentPriceUsd > 0) {
    return {
      priceUsd: ticker.currentPriceUsd,
      source: '最后有效价格',
      observedOn: ticker.priceUpdatedAt,
      fallback: true,
      error: quote.error,
    };
  }
  return null;
}
