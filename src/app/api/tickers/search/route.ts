import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import {
  normalizeCryptoCandidates,
  normalizeStockCandidates,
  type CoinbaseProduct,
  type EastMoneySearchItem,
} from '@/lib/market-data/ticker-search';

const COMMON_CRYPTO_PRODUCTS: CoinbaseProduct[] = [
  { id: 'BTC-USD', base_currency: 'BTC', quote_currency: 'USD', display_name: 'BTC-USD' },
  { id: 'ETH-USD', base_currency: 'ETH', quote_currency: 'USD', display_name: 'ETH-USD' },
  { id: 'SOL-USD', base_currency: 'SOL', quote_currency: 'USD', display_name: 'SOL-USD' },
];

export async function GET(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || '';
  const category = searchParams.get('category');
  if (!query) return NextResponse.json({ error: '请输入名称或代码' }, { status: 400 });
  if (category !== 'stock' && category !== 'crypto') {
    return NextResponse.json({ error: '不支持的搜索类型' }, { status: 400 });
  }

  try {
    if (category === 'stock') {
      const response = await fetch(
        `https://searchadapter.eastmoney.com/api/suggest/get?input=${encodeURIComponent(query)}&type=14&token=`,
        { cache: 'no-store', headers: { Referer: 'https://quote.eastmoney.com/' } },
      );
      if (!response.ok) throw new Error(`标的搜索服务返回 ${response.status}`);
      const payload = await response.json();
      const items = (payload?.QuotationCodeTable?.Data || []) as EastMoneySearchItem[];
      return NextResponse.json({ candidates: normalizeStockCandidates(items).slice(0, 10) });
    }

    const commonCandidates = normalizeCryptoCandidates(COMMON_CRYPTO_PRODUCTS, query);
    try {
      const response = await fetch('https://api.exchange.coinbase.com/products', {
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`加密货币搜索服务返回 ${response.status}`);
      const products = await response.json() as CoinbaseProduct[];
      return NextResponse.json({ candidates: normalizeCryptoCandidates([...COMMON_CRYPTO_PRODUCTS, ...products], query) });
    } catch (error) {
      if (commonCandidates.length) return NextResponse.json({ candidates: commonCandidates });
      throw error;
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
