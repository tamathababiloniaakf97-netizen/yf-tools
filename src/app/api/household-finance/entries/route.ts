import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateLedgerEntry } from '@/lib/household-finance/validation';
import { assertHouseholdPeriodEditable } from '@/lib/household-finance/period-lock';

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateLedgerEntry(await request.json());
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const { data: closures } = await supabase.from('household_period_closures').select('period_month,status').eq('user_id', user.id);
  const editable = assertHouseholdPeriodEditable(validation.value.entry_date, closures ?? []);
  if (!editable.ok) return NextResponse.json({ error: editable.error }, { status: 409 });
  if (validation.value.liability_id) {
    const { data: liability } = await supabase.from('household_liabilities').select('id').eq('id', validation.value.liability_id).eq('user_id', user.id).maybeSingle();
    if (!liability) return NextResponse.json({ error: '负债不存在或无权操作' }, { status: 400 });
  }
  const { data, error } = await supabase.from('household_ledger_entries').insert({ ...validation.value, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
