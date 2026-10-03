import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateLifeProjectInput } from '@/lib/life-reinforcement/validation';
import type { LifeReinforcementProjectInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateLifeProjectInput(await request.json() as LifeReinforcementProjectInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('life_reinforcement_projects').update({
    ...validation.value, updated_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '补强项目不存在' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data: project, error: findError } = await supabase.from('life_reinforcement_projects')
    .select('id,is_default').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!project) return NextResponse.json({ error: '补强项目不存在' }, { status: 404 });
  if (project.is_default) return NextResponse.json({ error: '默认项目不能删除，可以停用' }, { status: 400 });
  const { error } = await supabase.from('life_reinforcement_projects').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
