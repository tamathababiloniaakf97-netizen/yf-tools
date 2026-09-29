import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { canEditDecision, finalizeDecisionRecord } from '@/lib/investment/decision-api';
import type { InvestmentDecision, InvestmentDecisionInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const existing = await supabase.from('investment_decisions').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (!existing.data) return NextResponse.json({ error: '投资决策不存在' }, { status: 404 });
  if (!canEditDecision((existing.data as InvestmentDecision).status)) return NextResponse.json({ error: '投资决策已经定稿' }, { status: 409 });
  const validation = finalizeDecisionRecord({ ...existing.data, ...await request.json() } as InvestmentDecisionInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；'), errors: validation.errors }, { status: 400 });
  const snapshot = await supabase.from('research_snapshots').select('id').eq('id', validation.value.research_snapshot_id).eq('research_profile_id', validation.value.research_profile_id).eq('user_id', user.id).maybeSingle();
  if (snapshot.error) return NextResponse.json({ error: snapshot.error.message }, { status: 500 });
  if (!snapshot.data) return NextResponse.json({ error: '研究快照不存在或不属于该公司' }, { status: 400 });
  const { data, error } = await supabase.from('investment_decisions').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
