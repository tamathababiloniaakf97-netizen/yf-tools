import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateLifeProjectInput } from '@/lib/life-reinforcement/validation';
import type { LifeReinforcementProjectInput } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { error: initializeError } = await supabase.rpc('initialize_life_reinforcement_projects');
  if (initializeError) return NextResponse.json({ error: initializeError.message }, { status: 500 });
  const { data, error } = await supabase.from('life_reinforcement_projects').select('*').eq('user_id', user.id).order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = validateLifeProjectInput(await request.json() as LifeReinforcementProjectInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('life_reinforcement_projects')
    .insert({ ...validation.value, user_id: user.id, is_default: false, default_key: null }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
