import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { canEditDecision } from '@/lib/investment/decision-api';
import { normalizeDecisionDraft } from '@/lib/investment/decision-validation';
import type { InvestmentDecision, InvestmentDecisionInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params; const { data, error } = await supabase.from('investment_decisions').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '投资决策不存在' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, context: Context) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const existing = await supabase.from('investment_decisions').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (!existing.data) return NextResponse.json({ error: '投资决策不存在' }, { status: 404 });
  if (!canEditDecision((existing.data as InvestmentDecision).status)) return NextResponse.json({ error: '已定稿决策不能修改，请新建一条决策' }, { status: 409 });
  const validation = normalizeDecisionDraft({ ...existing.data, ...await request.json() } as InvestmentDecisionInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('investment_decisions').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, context: Context) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params; const { data, error } = await supabase.from('investment_decisions').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '投资决策不存在' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
