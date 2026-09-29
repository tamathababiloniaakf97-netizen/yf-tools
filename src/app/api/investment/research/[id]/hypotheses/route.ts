import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeHypothesisInput } from '@/lib/investment/research-validation';
import { researchOwnershipFilter } from '@/lib/investment/research-api';
import type { ResearchHypothesisInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

async function ownedProfile(supabase: Awaited<ReturnType<typeof createServerSideClient>>, userId: string, profileId: string) {
  return supabase.from('research_profiles').select('id').eq('id', profileId).eq('user_id', userId).maybeSingle();
}

export async function GET(_: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const profile = await ownedProfile(supabase, user.id, id);
  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });
  if (!profile.data) return NextResponse.json({ error: '研究档案不存在' }, { status: 404 });
  const filter = researchOwnershipFilter(user.id, id);
  const { data, error } = await supabase.from('research_hypotheses').select('*').match(filter).order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const profile = await ownedProfile(supabase, user.id, id);
  if (profile.error) return NextResponse.json({ error: profile.error.message }, { status: 500 });
  if (!profile.data) return NextResponse.json({ error: '研究档案不存在' }, { status: 404 });
  const validation = normalizeHypothesisInput(await request.json() as ResearchHypothesisInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('research_hypotheses').insert({ ...validation.value, user_id: user.id, research_profile_id: id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
