import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeInvestmentJournalInput } from '@/lib/investment/journal';
import type { InvestmentJournalInput } from '@/types/life-os';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = normalizeInvestmentJournalInput(await request.json() as InvestmentJournalInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  if (validation.value.decision_id) {
    const decision = await supabase.from('investment_decisions').select('id').eq('id', validation.value.decision_id).eq('user_id', user.id).eq('status', 'finalized').maybeSingle();
    if (decision.error) return NextResponse.json({ error: decision.error.message }, { status: 500 });
    if (!decision.data) return NextResponse.json({ error: '关联的已定稿决策不存在' }, { status: 400 });
  }
  const { id } = await context.params;
  const { data, error } = await supabase.from('investment_reviews').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '日志不存在或无权操作' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { error } = await supabase.from('investment_reviews').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
