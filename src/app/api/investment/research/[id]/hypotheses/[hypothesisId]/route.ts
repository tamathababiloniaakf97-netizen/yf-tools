import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeHypothesisInput } from '@/lib/investment/research-validation';
import type { ResearchHypothesisInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string; hypothesisId: string }> };

export async function PATCH(request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id, hypothesisId } = await context.params;
  const validation = normalizeHypothesisInput(await request.json() as ResearchHypothesisInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('research_hypotheses').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', hypothesisId).eq('research_profile_id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '研究假设不存在' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id, hypothesisId } = await context.params;
  const { data, error } = await supabase.from('research_hypotheses').delete().eq('id', hypothesisId).eq('research_profile_id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '研究假设不存在' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
