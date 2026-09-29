import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { validateResearchSnapshotCore } from '@/lib/investment/research-validation';
import { buildResearchSnapshot } from '@/lib/investment/snapshot';
import type { EvidenceRecord, ResearchHypothesis, ResearchProfile } from '@/types/life-os';

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const { data, error } = await supabase.from('research_snapshots').select('*').eq('research_profile_id', id).eq('user_id', user.id).order('snapshot_version', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(_: Request, context: Context) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const profileResult = await supabase.from('research_profiles').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (profileResult.error) return NextResponse.json({ error: profileResult.error.message }, { status: 500 });
  if (!profileResult.data) return NextResponse.json({ error: '研究档案不存在' }, { status: 404 });
  const profile = profileResult.data as ResearchProfile;
  const core = validateResearchSnapshotCore(profile);
  if (!core.ok) return NextResponse.json({ error: core.errors.join('；'), errors: core.errors }, { status: 400 });
  const [hypothesesResult, evidenceResult, latestResult] = await Promise.all([
    supabase.from('research_hypotheses').select('*').eq('research_profile_id', id).eq('user_id', user.id).order('created_at'),
    supabase.from('evidence_records').select('*').eq('asset_name', profile.asset_name).eq('user_id', user.id).order('occurred_at'),
    supabase.from('research_snapshots').select('snapshot_version').eq('research_profile_id', id).eq('user_id', user.id).order('snapshot_version', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const queryError = hypothesesResult.error ?? evidenceResult.error ?? latestResult.error;
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
  const payload = buildResearchSnapshot(profile, (hypothesesResult.data ?? []) as ResearchHypothesis[], (evidenceResult.data ?? []) as EvidenceRecord[]);
  const { data, error } = await supabase.from('research_snapshots').insert({
    user_id: user.id,
    research_profile_id: id,
    snapshot_version: (latestResult.data?.snapshot_version ?? 0) + 1,
    ...payload,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
