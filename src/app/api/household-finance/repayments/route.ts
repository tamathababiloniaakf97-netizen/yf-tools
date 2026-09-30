import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { cnyAmount } from '@/lib/household-finance/statements';

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { entry_date?: string; liability_id?: string; principal?: number; interest?: number; currency?: string; fx_rate?: number; note?: string };
  if (!body.entry_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.entry_date) || !body.liability_id) return NextResponse.json({ error: '请选择日期和对应负债' }, { status: 400 });
  const principal = Number(body.principal || 0), interest = Number(body.interest || 0), currency = body.currency || 'CNY';
  if ((!Number.isFinite(principal) || principal < 0) || (!Number.isFinite(interest) || interest < 0) || principal + interest <= 0) return NextResponse.json({ error: '本金和利息至少填写一项正数' }, { status: 400 });
  const rate = currency === 'CNY' ? null : Number(body.fx_rate);
  if (currency !== 'CNY' && (!Number.isFinite(rate) || Number(rate) <= 0)) return NextResponse.json({ error: '外币还款必须填写正数汇率' }, { status: 400 });
  const principalCny = currency === 'CNY' ? principal : cnyAmount(principal, Number(rate));
  const interestCny = currency === 'CNY' ? interest : cnyAmount(interest, Number(rate));
  const { data, error } = await supabase.rpc('record_household_repayment', { p_entry_date: body.entry_date, p_liability_id: body.liability_id, p_principal: principalCny, p_interest: interestCny, p_currency: currency, p_original_principal: currency === 'CNY' ? null : principal, p_original_interest: currency === 'CNY' ? null : interest, p_fx_rate: rate, p_note: body.note?.trim() || '' });
  if (error) return NextResponse.json({ error: error.message }, { status: error.message.includes('已结账') ? 409 : 500 });
  return NextResponse.json({ transaction_group_id: data }, { status: 201 });
}
