import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const numeric = ['actual_cash_cny','theoretical_cash_cny','investment_value_usd','securities_usd','investment_cash_usd','usd_cny_rate'];
  if (!body.period_month || !body.snapshot_date || numeric.some(key => !Number.isFinite(Number(body[key]))) || Number(body.usd_cny_rate) <= 0) return NextResponse.json({ error: '请完整填写结账数据和正数汇率' }, { status: 400 });
  const { error } = await supabase.rpc('close_household_month', { p_period_month: body.period_month, p_snapshot_date: body.snapshot_date, p_actual_cash: body.actual_cash_cny, p_theoretical_cash: body.theoretical_cash_cny, p_investment_value_usd: body.investment_value_usd, p_securities_usd: body.securities_usd, p_investment_cash_usd: body.investment_cash_usd, p_usd_cny_rate: body.usd_cny_rate, p_account_snapshots: body.account_snapshots || [], p_liability_snapshots: body.liability_snapshots || [] });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
