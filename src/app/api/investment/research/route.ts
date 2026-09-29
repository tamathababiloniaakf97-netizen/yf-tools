import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { buildResearchProfileRecord } from '@/lib/investment/research-api';
import type { ResearchProfileInput } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { data, error } = await supabase.from('research_profiles').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const record = buildResearchProfileRecord(user.id, await request.json() as ResearchProfileInput);
  if (!record.ok) return NextResponse.json({ error: record.errors.join('；') }, { status: 400 });
  const { data, error } = await supabase.from('research_profiles').upsert(record.value, { onConflict: 'user_id,asset_name' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
