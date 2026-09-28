import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateContactInteractionInput } from '@/lib/relationships/validation';
import type { ContactInteractionInput } from '@/types/life-os';
type Context = { params: Promise<{ id: string }> };

async function ownerContact(supabase: Awaited<ReturnType<typeof createServerSideClient>>, id: string, userId: string) {
  return supabase.from('contacts').select('id').eq('id', id).eq('user_id', userId).maybeSingle();
}
export async function GET(_request: Request, context: Context) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params; const { data: contact } = await ownerContact(supabase, id, user.id);
  if (!contact) return NextResponse.json({ error: '联系人不存在' }, { status: 404 });
  const { data, error } = await supabase.from('contact_interactions').select('*').eq('contact_id', id).eq('user_id', user.id).order('occurred_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
export async function POST(request: Request, context: Context) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params; const { data: contact } = await ownerContact(supabase, id, user.id);
  if (!contact) return NextResponse.json({ error: '联系人不存在' }, { status: 404 });
  const validation = validateContactInteractionInput(await request.json() as ContactInteractionInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('contact_interactions').insert({ ...validation.value, contact_id: id, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
