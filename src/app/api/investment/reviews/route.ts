import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateInvestmentReviewInput } from '@/lib/investment/records';
import type { InvestmentReviewInput } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { data, error } = await supabase.from('investment_reviews').select('*').eq('user_id', user.id).order('review_date', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateInvestmentReviewInput(await request.json() as InvestmentReviewInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  if (validation.value.decision_id) {
    const decision = await supabase.from('investment_decisions').select('id').eq('id', validation.value.decision_id).eq('user_id', user.id).eq('status', 'finalized').maybeSingle();
    if (decision.error) return NextResponse.json({ error: decision.error.message }, { status: 500 });
    if (!decision.data) return NextResponse.json({ error: '关联的已定稿决策不存在' }, { status: 400 });
  }
  const { data, error } = await supabase.from('investment_reviews').insert({ ...validation.value, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
