import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeEvidenceInput } from '@/lib/investment/records';
import type { EvidenceInput } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = normalizeEvidenceInput(await request.json() as EvidenceInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('evidence_records').update(validation.value).eq('id', id).eq('user_id', user.id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '证据不存在或无权操作' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('evidence_records').delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: '证据不存在或无权操作' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
