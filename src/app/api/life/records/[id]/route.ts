import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateLifeRecordInput } from '@/lib/life-reinforcement/validation';
import type { LifeTrainingRecordInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateLifeRecordInput(await request.json() as LifeTrainingRecordInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('life_training_records').update({
    ...validation.value, updated_at: new Date().toISOString(),
  }).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '训练记录不存在' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { error, count } = await supabase.from('life_training_records').delete({ count: 'exact' })
    .eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: '训练记录不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}
