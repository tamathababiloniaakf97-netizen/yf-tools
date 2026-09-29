import type { Currency, TickerType } from '@/types';

export interface TickerCandidate {
  id: string;
  name: string;
  code: string;
  type: TickerType;
  currency: Currency;
  market: string;
}

export interface EastMoneySearchItem {
  Code?: string;
  Name?: string;
  JYS?: string;
  MktNum?: string | number;
}

export interface CoinbaseProduct {
  id?: string;
  base_currency?: string;
  quote_currency?: string;
  display_name?: string;
}

const CRYPTO_ALIASES: Record<string, { symbol: string; name: string }> = {
  '比特币': { symbol: 'BTC', name: '比特币' },
  bitcoin: { symbol: 'BTC', name: '比特币' },
  '以太坊': { symbol: 'ETH', name: '以太坊' },
  ethereum: { symbol: 'ETH', name: '以太坊' },
  solana: { symbol: 'SOL', name: 'Solana' },
  '索拉纳': { symbol: 'SOL', name: 'Solana' },
};

export function normalizeStockCandidates(items: EastMoneySearchItem[]): TickerCandidate[] {
  return items.flatMap((item) => {
    const code = item.Code?.trim().toUpperCase();
    const name = item.Name?.trim();
    const marketNumber = String(item.MktNum ?? '');
    if (!code || !name) return [];

    let type: TickerType;
    let currency: Currency;
    if (['105', '106', '107'].includes(marketNumber)) {
      type = 'stock_us'; currency = 'USD';
    } else if (marketNumber === '116') {
      type = 'stock_hk'; currency = 'HKD';
    } else if (['0', '1'].includes(marketNumber)) {
      type = 'stock_a'; currency = 'CNY';
    } else {
      return [];
    }

    return [{ id: `${type}:${code}`, name, code, type, currency, market: item.JYS || '' }];
  });
}

export function normalizeCryptoCandidates(products: CoinbaseProduct[], query: string): TickerCandidate[] {
  const normalizedQuery = query.trim().toLowerCase();
  const alias = CRYPTO_ALIASES[normalizedQuery];
  const searchTerm = alias?.symbol || normalizedQuery.toUpperCase();

  const seen = new Set<string>();
  return products
    .filter((product) => product.quote_currency === 'USD')
    .filter((product) => {
      const haystack = `${product.id || ''} ${product.base_currency || ''} ${product.display_name || ''}`.toUpperCase();
      return haystack.includes(searchTerm);
    })
    .flatMap((product) => {
      const code = product.id?.toUpperCase();
      const base = product.base_currency?.toUpperCase();
      if (!code || !base || seen.has(code)) return [];
      seen.add(code);
      const knownName = Object.values(CRYPTO_ALIASES).find((entry) => entry.symbol === base)?.name;
      return [{
        id: `crypto:${code}`,
        name: alias?.name || knownName || base,
        code,
        type: 'crypto' as const,
        currency: 'USD' as const,
        market: 'Coinbase',
      }];
    })
    .slice(0, 10);
}
