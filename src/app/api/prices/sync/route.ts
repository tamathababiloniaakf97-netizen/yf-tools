import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { fetchMarketPrice } from '@/lib/market-data/quotes';
import { syncTickerPrice, type SyncTicker } from '@/lib/market-data/sync-results';

export async function POST() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data: tickers, error: tickerError } = await supabase
    .from('tickers')
    .select('id, name, code, type, currency')
    .eq('user_id', user.id);

  if (tickerError) return NextResponse.json({ error: tickerError.message }, { status: 500 });
  if (!tickers?.length) return NextResponse.json({ error: '没有标的' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const persistPrice = async (tickerId: string, price: number, date: string) => {
    const { error } = await supabase
      .from('tickers')
      .update({ current_price: price, price_updated_at: date })
      .eq('id', tickerId)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);
  };

  const results = await Promise.all(
    (tickers as SyncTicker[]).map((ticker) =>
      syncTickerPrice(ticker, fetchMarketPrice, persistPrice, today),
    ),
  );
  const updated = results.filter((result) => result.status === 'updated').length;

  return NextResponse.json({
    results,
    summary: { updated, failed: results.length - updated },
  });
}
