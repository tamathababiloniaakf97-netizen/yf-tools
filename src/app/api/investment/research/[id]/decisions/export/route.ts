import { buildDecisionArchivePdfFilename, buildDecisionReport } from '@/lib/investment/decision-report';
import { renderDecisionArchivePdf } from '@/lib/investment/decision-pdf';
import { createServerSideClient } from '@/lib/supabase/server';
import type { InvestmentDecision, ResearchSnapshot } from '@/types/life-os';

export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });
  const { id } = await context.params;
  const decisionResult = await supabase.from('investment_decisions').select('*').eq('research_profile_id', id).eq('user_id', user.id).eq('status', 'finalized').order('decision_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  if (decisionResult.error) return Response.json({ error: decisionResult.error.message }, { status: 500 });
  const decisions = (decisionResult.data ?? []) as InvestmentDecision[];
  if (!decisions.length) return Response.json({ error: '该公司暂无已定稿决策' }, { status: 409 });
  if (decisions.some((item) => !item.research_snapshot_id)) return Response.json({ error: '部分已定稿决策缺少研究快照' }, { status: 409 });
  const snapshotIds = decisions.map((item) => item.research_snapshot_id!);
  const snapshotResult = await supabase.from('research_snapshots').select('*').in('id', snapshotIds).eq('user_id', user.id);
  if (snapshotResult.error) return Response.json({ error: snapshotResult.error.message }, { status: 500 });
  const snapshots = new Map(((snapshotResult.data ?? []) as ResearchSnapshot[]).map((item) => [item.id, item]));
  if (decisions.some((item) => !snapshots.has(item.research_snapshot_id!))) return Response.json({ error: '部分决策关联的研究快照不存在' }, { status: 409 });
  const exportedAt = new Date(); const reports = decisions.map((decision) => buildDecisionReport({ decision, snapshot: snapshots.get(decision.research_snapshot_id!)!, exportedAt: exportedAt.toISOString() }));
  const pdf = await renderDecisionArchivePdf(reports); const filename = buildDecisionArchivePdfFilename(decisions[0].asset_name);
  return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="investment-decision-archive.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`, 'Cache-Control': 'private, no-store' } });
}
