import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateInvestmentTaskInput } from '@/lib/investment/task-validation';
import type { InvestmentTask, InvestmentTaskInput } from '@/types/life-os';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data: existing } = await supabase.from('investment_tasks').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: '投资待办不存在' }, { status: 404 });
  const input = await request.json() as InvestmentTaskInput;
  const validation = validateInvestmentTaskInput({ ...input, completed_at: input.status === 'completed' ? (input.completed_at ?? (existing as InvestmentTask).completed_at) : null });
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('investment_tasks').update({ ...validation.value, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '投资待办不存在' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { error, count } = await supabase.from('investment_tasks').delete({ count: 'exact' }).eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: '投资待办不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}
