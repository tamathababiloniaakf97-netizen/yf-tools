import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateGoalProgressInput } from '@/lib/goals/progress-update';
import type { Goal, GoalProgressInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('goal_progress_updates').select('*').eq('goal_id', id).eq('user_id', user.id).order('occurred_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data: goal, error: goalError } = await supabase.from('goals').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (goalError) return NextResponse.json({ error: goalError.message }, { status: 500 });
  if (!goal) return NextResponse.json({ error: '目标不存在' }, { status: 404 });
  const validation = validateGoalProgressInput(await request.json() as GoalProgressInput, goal as Goal);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.rpc('save_goal_progress', { p_goal_id: id, p_update: validation.value });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data }, { status: 201 });
}
