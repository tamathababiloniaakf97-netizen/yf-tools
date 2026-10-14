import { unstable_cache } from 'next/cache';
import { LEGACY_RATES } from './exchange';

export interface DailyExchange {
  rates: Record<string, number>;
  date: string | null;
  fetchedAt: string | null;
  fallback: boolean;
}

export function parseDailyExchange(data: unknown): DailyExchange {
  if (!Array.isArray(data)) throw new Error('汇率数据无效');
  const rates: Record<string, number> = { USD: 1 };
  let date: string | null = null;
  for (const currency of ['CNY', 'HKD']) {
    const row = data.find(item => item?.base === 'USD' && item?.quote === currency);
    if (!row || !Number.isFinite(row.rate) || row.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || (date && date !== row.date)) throw new Error('汇率数据不完整');
    rates[currency] = 1 / row.rate;
    date = row.date;
  }
  return { rates, date, fetchedAt: new Date().toISOString(), fallback: false };
}

// Cache successful observations only; Next retains the last success if revalidation fails.
// Cache Components are not enabled in this project.
const cached = unstable_cache(async () => {
  const response = await fetch('https://api.frankfurter.dev/v2/rates?base=USD&quotes=CNY,HKD&providers=ECB', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('汇率服务暂不可用');
  return parseDailyExchange(await response.json());
}, ['daily-reference-exchange-v1'], { revalidate: 86400 });

export async function getDailyExchange(): Promise<DailyExchange> {
  try {
    const result = await cached();
    return { ...result, fallback: Date.now() - Date.parse(result.fetchedAt!) > 86400000 };
  } catch {
    return { rates: { ...LEGACY_RATES }, date: null, fetchedAt: null, fallback: true };
  }
}
