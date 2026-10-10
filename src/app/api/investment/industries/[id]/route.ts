import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeIndustryProfileInput } from '@/lib/investment/industry-validation';
import type { IndustryProfileInput } from '@/types/life-os';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const result = normalizeIndustryProfileInput(await request.json() as IndustryProfileInput);
  if (!result.ok) return NextResponse.json({ error: result.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('industry_profiles').update({ ...result.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return data ? NextResponse.json(data) : NextResponse.json({ error: '行业研究不存在' }, { status: 404 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { count } = await supabase.from('research_profiles').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('industry_profile_id', id);
  const body = await request.json().catch(() => ({}));
  if (!body.confirm) return NextResponse.json({ error: '需要确认删除', linked_companies: count ?? 0 }, { status: 409 });
  const { data, error } = await supabase.from('industry_profiles').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return data ? NextResponse.json({ id, linked_companies: count ?? 0 }) : NextResponse.json({ error: '行业研究不存在' }, { status: 404 });
}
