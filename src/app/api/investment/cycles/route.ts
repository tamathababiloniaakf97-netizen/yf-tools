import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { cycleTemplates } from '@/lib/investment/cycles';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const profileSelect = '*,ticker:tickers!market_cycle_profiles_ticker_id_fkey(id,name,code,currency)';
  const current = await supabase.from('market_cycle_profiles').select(profileSelect).eq('user_id', user.id);
  if (current.error) return NextResponse.json({ error: current.error.message }, { status: 500 });
  const existing = new Set((current.data ?? []).map((item) => item.cycle_key));
  const missing = cycleTemplates.filter((item) => !existing.has(item.key));
  let profiles = current.data ?? [];
  if (missing.length) {
    const seeded = await supabase.from('market_cycle_profiles').insert(missing.map((item) => ({
      user_id: user.id, cycle_key: item.key, name: item.name, review_frequency_days: item.reviewFrequencyDays, indicators: item.indicators,
    }))).select(profileSelect);
    if (seeded.error) return NextResponse.json({ error: seeded.error.message }, { status: 500 });
    profiles = [...profiles, ...(seeded.data ?? [])];
  }
  const order = new Map(cycleTemplates.map((item, index) => [item.key, index]));
  return NextResponse.json(profiles.sort((a, b) => (order.get(a.cycle_key) ?? 99) - (order.get(b.cycle_key) ?? 99)));
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = await request.json() as { name?: string; review_frequency_days?: number; ticker_id?: string | null };
  const name = String(body.name ?? '').trim();
  const frequency = Math.max(7, Math.min(365, Number(body.review_frequency_days) || 30));
  if (!name) return NextResponse.json({ error: '请填写观察主题名称' }, { status: 400 });
  const tickerId = body.ticker_id === null || body.ticker_id === '' ? null : String(body.ticker_id ?? '').trim() || null;
  if (tickerId) {
    const owned = await supabase.from('tickers').select('id').eq('id', tickerId).eq('user_id', user.id).maybeSingle();
    if (owned.error) return NextResponse.json({ error: owned.error.message }, { status: 500 });
    if (!owned.data) return NextResponse.json({ error: '关联标的不存在' }, { status: 400 });
  }
  const cycleKey = `custom_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`;
  const result = await supabase.from('market_cycle_profiles').insert({ user_id: user.id, cycle_key: cycleKey, name, review_frequency_days: frequency, indicators: [], ticker_id: tickerId }).select('*,ticker:tickers!market_cycle_profiles_ticker_id_fkey(id,name,code,currency)').single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(result.data, { status: 201 });
}
