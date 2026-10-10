import { NextResponse } from 'next/server';
import { fetchMarketPrice } from '@/lib/market-data/quotes';
import { createServerSideClient } from '@/lib/supabase/server';
import type { Currency, TickerType } from '@/types';

export async function GET(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const tickerId = new URL(request.url).searchParams.get('ticker_id')?.trim();
  if (!tickerId) return NextResponse.json({ error: '缺少关联标的' }, { status: 400 });

  const { data: ticker, error } = await supabase
    .from('tickers')
    .select('id,code,type,currency')
    .eq('id', tickerId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ticker) return NextResponse.json({ error: '关联标的不存在' }, { status: 404 });

  const result = await fetchMarketPrice({ code: ticker.code, type: ticker.type as TickerType });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ...result, currency: ticker.currency as Currency });
}
