import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeIndustryProfileInput } from '@/lib/investment/industry-validation';
import type { IndustryProfileInput } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { data, error } = await supabase.from('industry_profiles').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const result = normalizeIndustryProfileInput(await request.json() as IndustryProfileInput);
  if (!result.ok) return NextResponse.json({ error: result.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('industry_profiles').insert({ ...result.value, user_id: user.id }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data, { status: 201 });
}
