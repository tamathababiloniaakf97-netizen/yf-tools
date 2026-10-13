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
  const input = await request.json() as ResearchProfileInput & { id?: string };
  if (input.ticker_id) {
    const { data: ticker } = await supabase.from('tickers').select('id,name').eq('id', input.ticker_id).eq('user_id', user.id).maybeSingle();
    if (!ticker) return NextResponse.json({ error: '所选标的不存在' }, { status: 400 });
    input.asset_name = ticker.name;

    const [{ data: tickerResearch }, { data: nameResearch }] = await Promise.all([
      supabase.from('research_profiles').select('id').eq('ticker_id', ticker.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('research_profiles').select('id').eq('asset_name', ticker.name).eq('user_id', user.id).maybeSingle(),
    ]);
    const conflict = [tickerResearch, nameResearch].find((profile) => profile && profile.id !== input.id);
    if (conflict) return NextResponse.json({ error: '该标的已有公司研究，请直接编辑现有研究' }, { status: 409 });
  }
  const record = buildResearchProfileRecord(user.id, input);
  if (!record.ok) return NextResponse.json({ error: record.errors.join('；') }, { status: 400 });
  if (record.value.industry_profile_id) {
    const { data: industry } = await supabase.from('industry_profiles').select('id').eq('id', record.value.industry_profile_id).eq('user_id', user.id).maybeSingle();
    if (!industry) return NextResponse.json({ error: '关联行业不存在' }, { status: 400 });
  }
  const mutation = input.id
    ? supabase.from('research_profiles').upsert(record.value, { onConflict: 'user_id,asset_name' })
    : supabase.from('research_profiles').insert(record.value);
  const { data, error } = await mutation.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
