import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { assertHouseholdPeriodEditable } from '@/lib/household-finance/period-lock';
import { validateLedgerEntry } from '@/lib/household-finance/validation';

type Context = { params: Promise<{ id: string }> };

async function ownedEntry(id: string) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: '未登录' }, { status: 401 }) };
  const { data: entry } = await supabase.from('household_ledger_entries').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!entry) return { response: NextResponse.json({ error: '流水不存在' }, { status: 404 }) };
  return { supabase, user, entry };
}

async function checkEditable(supabase: Awaited<ReturnType<typeof createServerSideClient>>, userId: string, ...dates: string[]) {
  const { data } = await supabase.from('household_period_closures').select('period_month,status').eq('user_id', userId);
  return dates.map(date => assertHouseholdPeriodEditable(date, data ?? [])).find(result => !result.ok) ?? { ok: true as const };
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params; const owned = await ownedEntry(id); if ('response' in owned) return owned.response;
  const validation = validateLedgerEntry(await request.json());
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const editable = await checkEditable(owned.supabase, owned.user.id, owned.entry.entry_date, validation.value.entry_date);
  if (!editable.ok) return NextResponse.json({ error: editable.error }, { status: 409 });
  if (validation.value.liability_id) {
    const { data } = await owned.supabase.from('household_liabilities').select('id').eq('id', validation.value.liability_id).eq('user_id', owned.user.id).maybeSingle();
    if (!data) return NextResponse.json({ error: '负债不存在或无权操作' }, { status: 400 });
  }
  const { data, error } = await owned.supabase.from('household_ledger_entries').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', owned.user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params; const owned = await ownedEntry(id); if ('response' in owned) return owned.response;
  const editable = await checkEditable(owned.supabase, owned.user.id, owned.entry.entry_date);
  if (!editable.ok) return NextResponse.json({ error: editable.error }, { status: 409 });
  const { error } = await owned.supabase.from('household_ledger_entries').delete().eq('id', id).eq('user_id', owned.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
