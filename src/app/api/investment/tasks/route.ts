import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateInvestmentTaskInput } from '@/lib/investment/task-validation';
import type { InvestmentTaskInput } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { data, error } = await supabase.from('investment_tasks').select('*').eq('user_id', user.id).order('reminder_date', { ascending: true, nullsFirst: false }).order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateInvestmentTaskInput(await request.json() as InvestmentTaskInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  if (validation.value.ticker_id) {
    const { data: ticker, error: tickerError } = await supabase.from('tickers').select('id').eq('id', validation.value.ticker_id).eq('user_id', user.id).maybeSingle();
    if (tickerError) return NextResponse.json({ error: tickerError.message }, { status: 500 });
    if (!ticker) return NextResponse.json({ error: '关联标的不存在' }, { status: 400 });
  }
  const { data, error } = await supabase.from('investment_tasks').insert({ ...validation.value, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
