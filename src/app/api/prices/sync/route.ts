import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

interface EastMoneyResult {
  id: string;
  name: string;
  code: string;
  price: number | null;
}

/**
 * 获取东方财富的 secid 前缀
 * 优先级：105(NASDAQ) > 106(NYSE) > 107(AMEX/ARCA)
 */
const US_PREFIXES = ['105', '106', '107'];

function getSecId(code: string, type: string): string | string[] | null {
  switch (type) {
    case 'stock_us': return US_PREFIXES.map(p => `${p}.${code}`);
    case 'stock_hk': return `116.${code}`;
    case 'stock_a': {
      const upper = code.toUpperCase();
      if (upper.startsWith('6') || upper.startsWith('9')) return `1.${upper}`;
      return `0.${upper}`;
    }
    default: return null;
  }
}

/**
 * 获取 US 股票价格，尝试多个交易所前缀
 */
async function fetchUSPrice(code: string): Promise<number | null> {
  for (const prefix of US_PREFIXES) {
    try {
      const secId = `${prefix}.${code}`;
      const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secId}&fields=f43,f44,f45,f46,f47,f48,f50,f57,f58,f170`;
      const res = await fetch(url, {
        headers: { 'Referer': 'https://quote.eastmoney.com/' },
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const rawPrice = data?.data?.f43 || data?.data?.f47;
      if (rawPrice) return rawPrice / 1000;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * 通过东方财富 API 获取单只股票的实时价格
 */
async function fetchEastMoneyPrice(code: string, type: string): Promise<number | null> {
  // 加密货币用 Binance API
  if (type === 'crypto') {
    const symbol = code.includes('-') ? code.replace('-', '') : `${code}USDT`;
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return parseFloat(data.price) || null;
    } catch {
      return null;
    }
  }

  // 美股走专用函数（尝试105/106/107）
  if (type === 'stock_us') return fetchUSPrice(code);

  const secId = getSecId(code, type);
  if (!secId) return null;

  try {
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secId}&fields=f43,f44,f45,f46,f47,f48,f50,f57,f58,f170`;
    const res = await fetch(url, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const rawPrice = data?.data?.f43 || data?.data?.f47;
    if (!rawPrice) return null;
    // A股: ÷100 (分→元)，港股: ÷1000 (千分→元)
    return type === 'stock_a' ? rawPrice / 100 : rawPrice / 1000;
  } catch {
    return null;
  }
}

/**
 * POST /api/prices/sync
 * 批量获取所有标的的最新价格（东方财富 + Binance）
 */
export async function POST() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data: tickers, error: tickerErr } = await supabase
    .from('tickers')
    .select('id, name, code, type')
    .eq('user_id', user.id);

  if (tickerErr) return NextResponse.json({ error: tickerErr.message }, { status: 500 });
  if (!tickers || tickers.length === 0) {
    return NextResponse.json({ error: '没有标的' }, { status: 400 });
  }

  const results: EastMoneyResult[] = [];
  const errors: { code: string; error: string }[] = [];

  // 并发获取所有价格
  const promises = tickers.map(async (ticker) => {
    try {
      const price = await fetchEastMoneyPrice(ticker.code, ticker.type);

      if (price !== null && price > 0) {
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('tickers')
          .update({ current_price: price, price_updated_at: today })
          .eq('id', ticker.id);
      }

      results.push({ id: ticker.id, name: ticker.name, code: ticker.code, price });
    } catch (err) {
      errors.push({ code: ticker.code, error: String(err) });
      results.push({ id: ticker.id, name: ticker.name, code: ticker.code, price: null });
    }
  });

  await Promise.all(promises);

  return NextResponse.json({ results, errors });
}
