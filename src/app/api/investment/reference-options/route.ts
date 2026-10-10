import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import type { InvestmentJournalReference } from '@/types/life-os';

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const [decisions, research, hypotheses, materials, journals] = await Promise.all([
    supabase.from('investment_decisions').select('id,asset_name,decision_date,final_reason').eq('user_id', user.id).eq('status', 'finalized').order('decision_date', { ascending: false }),
    supabase.from('research_profiles').select('id,asset_name,current_judgment').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('research_hypotheses').select('id,research_profile_id,statement,status').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('research_materials').select('id,title,asset_name,material_type').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('investment_reviews').select('id,title,asset_name,review_date').eq('user_id', user.id).order('review_date', { ascending: false }),
  ]);
  const failed = [decisions, research, hypotheses, materials, journals].find((result) => result.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });
  const researchNames = new Map((research.data ?? []).map((item) => [item.id, item.asset_name]));
  const options: InvestmentJournalReference[] = [
    ...(decisions.data ?? []).map((item) => ({ type:'decision' as const, id:item.id, title:`${item.asset_name} · ${item.decision_date || '投资决策'}`, href:`/investment/decisions/${item.id}` })),
    ...(research.data ?? []).map((item) => ({ type:'research' as const, id:item.id, title:`${item.asset_name} · 公司研究`, href:`/investment/research?profile=${item.id}` })),
    ...(hypotheses.data ?? []).map((item) => ({ type:'hypothesis' as const, id:item.id, title:`${researchNames.get(item.research_profile_id) || '公司研究'} · ${item.statement}`, href:`/investment/research?profile=${item.research_profile_id}&tab=evidence&hypothesis=${item.id}` })),
    ...(materials.data ?? []).map((item) => ({ type:'material' as const, id:item.id, title:`${item.asset_name ? `${item.asset_name} · ` : ''}${item.title}`, href:`/investment/materials?material=${item.id}` })),
    ...(journals.data ?? []).filter((item) => item.title).map((item) => ({ type:'journal' as const, id:item.id, title:item.title, href:`/investment/reviews?journal=${item.id}` })),
  ];
  return NextResponse.json(options);
}
