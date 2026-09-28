import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateContactInput } from '@/lib/relationships/validation';
import type { ContactInput } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { data, error } = await supabase.from('contacts').select('*').eq('user_id', user.id).order('next_contact_at', { ascending: true, nullsFirst: false }).order('last_contact_at', { ascending: false, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateContactInput(await request.json() as ContactInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('contacts').insert({ ...validation.value, user_id: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
