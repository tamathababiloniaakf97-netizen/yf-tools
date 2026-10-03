import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { cnyAmount } from '@/lib/household-finance/statements';

type RepaymentType = 'mortgage_repayment' | 'credit_loan_repayment' | 'credit_card_payment';
type InputRow = { repayment_type?: RepaymentType; entry_date?: string; liability_id?: string; principal?: number; interest?: number; amount?: number; currency?: string; fx_rate?: number; note?: string };

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { rows?: InputRow[] };
  if (!Array.isArray(body.rows) || body.rows.length === 0) return NextResponse.json({ error: '请至少填写一行' }, { status: 400 });
  if (body.rows.length > 50) return NextResponse.json({ error: '一次最多保存 50 行' }, { status: 400 });

  const normalized: Record<string, unknown>[] = [];
  for (const [index, row] of body.rows.entries()) {
    const prefix = `第 ${index + 1} 行：`;
    if (!row.entry_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.entry_date) || !row.liability_id) return NextResponse.json({ error: `${prefix}请选择日期和对应负债` }, { status: 400 });
    if (!['mortgage_repayment','credit_loan_repayment','credit_card_payment'].includes(row.repayment_type || '')) return NextResponse.json({ error: `${prefix}请选择还款类型` }, { status: 400 });
    const currency = row.currency || 'CNY';
    const rate = currency === 'CNY' ? null : Number(row.fx_rate);
    if (currency !== 'CNY' && (!Number.isFinite(rate) || Number(rate) <= 0)) return NextResponse.json({ error: `${prefix}外币还款必须填写正数汇率` }, { status: 400 });
    if (row.repayment_type === 'credit_card_payment') {
      const amount = Number(row.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: `${prefix}信用卡还款金额必须大于 0` }, { status: 400 });
      normalized.push({ repayment_type: row.repayment_type, entry_date: row.entry_date, liability_id: row.liability_id, amount_cny: currency === 'CNY' ? amount : cnyAmount(amount, Number(rate)), currency, original_amount: currency === 'CNY' ? null : amount, fx_rate: rate, note: row.note?.trim() || '' });
    } else {
      const principal = Number(row.principal || 0), interest = Number(row.interest || 0);
      if (!Number.isFinite(principal) || principal < 0 || !Number.isFinite(interest) || interest < 0 || principal + interest <= 0) return NextResponse.json({ error: `${prefix}本金和利息至少填写一项正数` }, { status: 400 });
      normalized.push({ repayment_type: row.repayment_type, entry_date: row.entry_date, liability_id: row.liability_id, principal_cny: currency === 'CNY' ? principal : cnyAmount(principal, Number(rate)), interest_cny: currency === 'CNY' ? interest : cnyAmount(interest, Number(rate)), currency, original_principal: currency === 'CNY' ? null : principal, original_interest: currency === 'CNY' ? null : interest, fx_rate: rate, note: row.note?.trim() || '' });
    }
  }
  const { data, error } = await supabase.rpc('record_household_repayments_batch', { p_rows: normalized });
  if (error) return NextResponse.json({ error: error.message }, { status: error.message.includes('已结账') ? 409 : 500 });
  return NextResponse.json({ transaction_group_ids: data }, { status: 201 });
}
