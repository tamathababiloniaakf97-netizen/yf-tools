import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateLedgerEntry } from '@/lib/household-finance/validation';

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateLedgerEntry(await request.json());
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const { data, error } = await supabase.from('household_ledger_entries').insert({ ...validation.value, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await request.json() as { id?: string };
  if (!id) return NextResponse.json({ error: '缺少记录 ID' }, { status: 400 });
  const { error } = await supabase.from('household_ledger_entries').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
