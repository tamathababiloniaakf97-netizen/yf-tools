import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { journalContent, normalizeInvestmentJournalInput } from '@/lib/investment/journal';
import type { InvestmentJournalInput } from '@/types/life-os';

function asJournal(row: Record<string, unknown>) {
  return {
    ...row,
    title: String(row.title || `${row.asset_name || ''}投资复盘` || '投资复盘'),
    journal_type: row.journal_type || 'decision_review',
    content: journalContent(row as { content?: string; original_reason?: string; actual_result?: string; correct_points?: string; mistake_points?: string; lesson?: string }),
    tags: Array.isArray(row.tags) ? row.tags : [],
    references: Array.isArray(row.references) ? row.references : [],
  };
}

export async function GET() {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { data, error } = await supabase.from('investment_reviews').select('*').eq('user_id', user.id).order('review_date', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row) => asJournal(row)));
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const validation = normalizeInvestmentJournalInput(await request.json() as InvestmentJournalInput);
  if (!validation.ok) return NextResponse.json({ error: validation.errors.join('；') }, { status: 400 });
  if (validation.value.decision_id) {
    const decision = await supabase.from('investment_decisions').select('id').eq('id', validation.value.decision_id).eq('user_id', user.id).eq('status', 'finalized').maybeSingle();
    if (decision.error) return NextResponse.json({ error: decision.error.message }, { status: 500 });
    if (!decision.data) return NextResponse.json({ error: '关联的已定稿决策不存在' }, { status: 400 });
  }
  const { data, error } = await supabase.from('investment_reviews').insert({
    ...validation.value,
    user_id: user.id,
    decision_type: 'hold',
    original_reason: '', actual_result: '', correct_points: '', mistake_points: '', lesson: '',
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(asJournal(data as Record<string, unknown>), { status: 201 });
}
