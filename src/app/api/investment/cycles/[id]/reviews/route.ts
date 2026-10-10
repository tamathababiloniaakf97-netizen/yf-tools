import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeCycleReviewInput } from '@/lib/investment/cycles';
import type { MarketCycleReviewInput } from '@/types/life-os';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const profile = await supabase.from('market_cycle_profiles').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });
  if (!profile.data) return NextResponse.json({ error: '周期不存在' }, { status: 404 });
  const result = await supabase.from('market_cycle_reviews').select('*').eq('profile_id', id).eq('user_id', user.id).order('reviewed_on', { ascending: false });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data ?? []);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const profile = await supabase.from('market_cycle_profiles').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });
  if (!profile.data) return NextResponse.json({ error: '周期不存在' }, { status: 404 });
  const validation = normalizeCycleReviewInput(await request.json() as MarketCycleReviewInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const value = validation.value;
  const updated = await supabase.from('market_cycle_profiles').update({
    current_phase: value.phase, confidence: value.confidence, summary: value.summary, support_evidence: value.support_evidence,
    counter_evidence: value.counter_evidence, uncertainties: value.uncertainties, last_reviewed_at: new Date().toISOString().slice(0, 10),
    next_review_at: value.next_review_at, indicators: value.indicators, cycle_started_on:value.cycle_started_on,
    cycle_start_price:value.cycle_start_price, latest_price:value.latest_price, latest_price_on:value.latest_price_on,
    return_percent:value.return_percent, running_days:value.running_days, updated_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', user.id).select('*').single();
  if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 });
  const review = await supabase.from('market_cycle_reviews').insert({ ...value, user_id: user.id, profile_id: id }).select('*').single();
  if (review.error) return NextResponse.json({ error: review.error.message }, { status: 500 });
  return NextResponse.json({ profile: updated.data, review: review.data }, { status: 201 });
}
