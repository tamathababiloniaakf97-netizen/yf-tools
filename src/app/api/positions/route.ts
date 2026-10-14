import { NextResponse } from 'next/server';
import { getDailyExchange } from '@/lib/daily-exchange';
import { createServerSideClient } from '@/lib/supabase/server';

// GET /api/positions — 获取持仓汇总和成本数据
export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  // 获取所有标的（含现价）
  const { data: tickers, error: tickerErr } = await supabase
    .from('tickers')
    .select('*')
    .eq('user_id', user.id);

  if (tickerErr) return NextResponse.json({ error: tickerErr.message }, { status: 500 });

  // 获取所有交易
  const { data: transactions, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: true });

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

  const [{ data: opening, error: openingErr }, { data: openingPositions, error: openingPositionsErr }] = await Promise.all([
    supabase.from('portfolio_openings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('portfolio_opening_positions').select('*').eq('user_id', user.id),
  ]);
  if (openingErr || openingPositionsErr) return NextResponse.json({ error: openingErr?.message || openingPositionsErr?.message }, { status: 500 });

  return NextResponse.json({ tickers, transactions, opening, openingPositions: openingPositions ?? [], exchange: await getDailyExchange() });
}
