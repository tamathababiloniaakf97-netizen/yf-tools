import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validatePortfolioOpening } from '@/lib/portfolio-opening';
import type { PortfolioOpeningInput } from '@/types';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const [{ data: opening, error: openingError }, { data: positions, error: positionsError }] = await Promise.all([
    supabase.from('portfolio_openings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('portfolio_opening_positions').select('*').eq('user_id', user.id),
  ]);
  if (openingError || positionsError) return NextResponse.json({ error: openingError?.message || positionsError?.message }, { status: 500 });
  return NextResponse.json({ opening, positions: positions ?? [] });
}

export async function PUT(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as PortfolioOpeningInput;
  const { data: earliest } = await supabase.from('transactions').select('trade_date').eq('user_id', user.id).order('trade_date', { ascending: true }).limit(1).maybeSingle();
  const validation = validatePortfolioOpening(body, earliest?.trade_date ?? null);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const tickerIds = validation.value.positions.map(position => position.ticker_id);
  if (tickerIds.length > 0) {
    const { data: ownedTickers, error } = await supabase.from('tickers').select('id').eq('user_id', user.id).in('id', tickerIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if ((ownedTickers?.length ?? 0) !== tickerIds.length) return NextResponse.json({ error: '期初持仓包含无权操作的标的' }, { status: 403 });
  }
  const { error } = await supabase.rpc('save_portfolio_opening', {
    p_opening_date: validation.value.opening_date,
    p_opening_cash: validation.value.opening_cash,
    p_positions: validation.value.positions,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
