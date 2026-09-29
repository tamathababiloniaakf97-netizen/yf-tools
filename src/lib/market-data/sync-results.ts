import type { Currency, TickerType } from '@/types';
import { toUSD } from '@/lib/exchange';
import type { QuoteResult } from './quotes';

export interface SyncTicker {
  id: string;
  name: string;
  code: string;
  type: TickerType;
  currency: Currency;
}

export type PriceSyncResult =
  | (Pick<SyncTicker, 'id' | 'name' | 'code'> & {
      status: 'updated';
      price: number;
      source: string;
      updated_at: string;
    })
  | (Pick<SyncTicker, 'id' | 'name' | 'code'> & {
      status: 'failed';
      price: null;
      source?: string;
      error: string;
    });

type QuoteFetcher = (ticker: Pick<SyncTicker, 'code' | 'type'>) => Promise<QuoteResult>;
type PricePersister = (tickerId: string, priceUsd: number, date: string) => Promise<void>;

export async function syncTickerPrice(
  ticker: SyncTicker,
  fetchQuote: QuoteFetcher,
  persistPrice: PricePersister,
  date: string,
): Promise<PriceSyncResult> {
  const identity = { id: ticker.id, name: ticker.name, code: ticker.code };
  const quote = await fetchQuote(ticker);

  if (!quote.ok) {
    return { ...identity, status: 'failed', price: null, source: quote.source ?? undefined, error: quote.error };
  }

  const priceUsd = Math.round(toUSD(quote.price, ticker.currency) * 1_000_000) / 1_000_000;
  try {
    await persistPrice(ticker.id, priceUsd, date);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ...identity, status: 'failed', price: null, source: quote.source, error: `保存失败：${reason}` };
  }

  return {
    ...identity,
    status: 'updated',
    price: priceUsd,
    source: quote.source,
    updated_at: date,
  };
}
