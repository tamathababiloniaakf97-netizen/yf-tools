import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { buildDecisionFilters } from '@/lib/investment/decision-api';
import { normalizeDecisionDraft } from '@/lib/investment/decision-validation';
import type { InvestmentDecisionInput } from '@/types/life-os';

export async function GET(request: Request) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const filters = buildDecisionFilters(new URL(request.url).searchParams);
  let query = supabase.from('investment_decisions').select('*').eq('user_id', user.id);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = normalizeDecisionDraft(await request.json() as InvestmentDecisionInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const profile = await supabase.from('research_profiles').select('id, asset_name').eq('id', validation.value.research_profile_id).eq('user_id', user.id).maybeSingle();
  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });
  if (!profile.data) return NextResponse.json({ error: '公司研究不存在' }, { status: 404 });
  const { data, error } = await supabase.from('investment_decisions').insert({ ...validation.value, asset_name: profile.data.asset_name, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
