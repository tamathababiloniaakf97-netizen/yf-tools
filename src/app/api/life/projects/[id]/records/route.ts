import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateLifeRecordInput } from '@/lib/life-reinforcement/validation';
import type { LifeTrainingRecordInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

async function getOwnerProject(supabase: Awaited<ReturnType<typeof createServerSideClient>>, id: string, userId: string) {
  return supabase.from('life_reinforcement_projects').select('id').eq('id', id).eq('user_id', userId).maybeSingle();
}

export async function GET(_request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data: project } = await getOwnerProject(supabase, id, user.id);
  if (!project) return NextResponse.json({ error: '补强项目不存在' }, { status: 404 });
  const { data, error } = await supabase.from('life_training_records').select('*')
    .eq('project_id', id).eq('user_id', user.id).order('trained_on', { ascending: false }).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data: project } = await getOwnerProject(supabase, id, user.id);
  if (!project) return NextResponse.json({ error: '补强项目不存在' }, { status: 404 });
  const validation = validateLifeRecordInput(await request.json() as LifeTrainingRecordInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('life_training_records')
    .insert({ ...validation.value, project_id: id, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
