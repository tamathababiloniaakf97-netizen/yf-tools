import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateGoalInput } from '@/lib/goals/validation';
import type { GoalInput } from '@/types/life-os';

type GoalRouteContext = { params: Promise<{ id: string }> };
const progressFields = ['current_state', 'current_milestone', 'current_value', 'habit_completed_count', 'next_action'] as const;

export async function PATCH(request: Request, context: GoalRouteContext) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const validation = validateGoalInput(await request.json() as GoalInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data: current } = await supabase.from('goals').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!current) return NextResponse.json({ error: '目标不存在' }, { status: 404 });
  const progressed = progressFields.some((field) => validation.value[field] !== current[field]);
  const { data, error } = await supabase.from('goals').update({ ...validation.value, last_progress_at: progressed ? new Date().toISOString() : current.last_progress_at, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '目标不存在' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: GoalRouteContext) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { error, count } = await supabase.from('goals').delete({ count: 'exact' }).eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: '目标不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}
