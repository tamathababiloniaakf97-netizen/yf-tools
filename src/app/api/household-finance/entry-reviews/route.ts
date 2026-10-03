import { NextResponse } from 'next/server';

import { createServerSideClient } from '@/lib/supabase/server';
import { manualFinanceChecks } from '@/lib/household-finance/monthly-checklist';
import type { HouseholdEntryReviewChecks } from '@/types/household-finance';

async function getUserAndSettings() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, settings: null, error: null };
  const { data: settings, error } = await supabase
    .from('household_finance_settings')
    .select('entry_review_started_month')
    .eq('user_id', user.id)
    .maybeSingle();
  return { supabase, user, settings, error };
}

export async function GET() {
  const { supabase, user, settings, error } = await getUserAndSettings();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!settings) return NextResponse.json({ enabled: false, startedMonth: null, reviews: [] });

  const [reviewResult,closureResult]=await Promise.all([
    supabase.from('household_entry_reviews').select('period_month,reviewed_at,checks').eq('user_id',user.id),
    supabase.from('household_period_closures').select('period_month,status').eq('user_id',user.id).eq('status','closed'),
  ]);
  const reviewError=reviewResult.error||closureResult.error;
  if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 });

  return NextResponse.json({
    enabled: true,
    startedMonth: settings.entry_review_started_month,
    reviews: reviewResult.data ?? [],
    closedMonths: (closureResult.data??[]).map(item=>item.period_month),
  });
}

export async function POST(request: Request) {
  const { supabase, user, settings, error } = await getUserAndSettings();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!settings) return NextResponse.json({ error: '请先启用家庭财务' }, { status: 400 });

  const body = await request.json() as { period_month?: string; checks?: HouseholdEntryReviewChecks };
  const periodMonth = body.period_month;
  if (!periodMonth || !/^\d{4}-(0[1-9]|1[0-2])-01$/.test(periodMonth)) {
    return NextResponse.json({ error: '月份格式无效' }, { status: 400 });
  }
  if (periodMonth < settings.entry_review_started_month) {
    return NextResponse.json({ error: '该月份早于检查提醒启用月份' }, { status: 400 });
  }
  const allowed=new Set(manualFinanceChecks.map(item=>item.key));
  const entries=Object.entries(body.checks||{});
  if(entries.some(([key,value])=>!allowed.has(key as never)||typeof value!=='boolean')) return NextResponse.json({error:'检查项数据无效'},{status:400});

  const { data, error: upsertError } = await supabase
    .from('household_entry_reviews')
    .upsert({ user_id: user.id, period_month: periodMonth, checks:body.checks||{}, reviewed_at:new Date().toISOString() }, { onConflict: 'user_id,period_month' })
    .select('period_month,reviewed_at,checks')
    .single();
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  return NextResponse.json(data);
}
