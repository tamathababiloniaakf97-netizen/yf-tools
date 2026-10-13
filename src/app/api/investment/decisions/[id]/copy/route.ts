import { NextResponse } from 'next/server';
import { buildDecisionDraftCopy } from '@/lib/investment/decision-api';
import { normalizeDecisionDraft } from '@/lib/investment/decision-validation';
import { createServerSideClient } from '@/lib/supabase/server';
import type { InvestmentDecision } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await context.params;
  const sourceResult = await supabase.from('investment_decisions').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (sourceResult.error) return NextResponse.json({ error: sourceResult.error.message }, { status: 500 });
  if (!sourceResult.data) return NextResponse.json({ error: '投资决策不存在' }, { status: 404 });

  const source = sourceResult.data as InvestmentDecision;
  if (source.status !== 'finalized') return NextResponse.json({ error: '只有已定稿决策可以复制为新草稿' }, { status: 409 });

  const validation = normalizeDecisionDraft(buildDecisionDraftCopy(source));
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });

  const { data, error } = await supabase.from('investment_decisions').insert({ ...validation.value, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
