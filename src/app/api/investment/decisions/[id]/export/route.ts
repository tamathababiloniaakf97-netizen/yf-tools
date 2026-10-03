import { buildDecisionPdfFilename, buildDecisionReport } from '@/lib/investment/decision-report';
import { renderDecisionPdf } from '@/lib/investment/decision-pdf';
import { createServerSideClient } from '@/lib/supabase/server';
import type { InvestmentDecision, ResearchSnapshot } from '@/types/life-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });

  const { id } = await context.params;
  const decisionResult = await supabase.from('investment_decisions').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (decisionResult.error) return Response.json({ error: decisionResult.error.message }, { status: 500 });
  if (!decisionResult.data) return Response.json({ error: '投资决策不存在' }, { status: 404 });
  const decision = decisionResult.data as InvestmentDecision;
  if (decision.status !== 'finalized') return Response.json({ error: '只有已定稿的投资决策可以导出 PDF' }, { status: 409 });
  if (!decision.research_snapshot_id) return Response.json({ error: '已定稿决策缺少关联研究快照' }, { status: 409 });

  const snapshotResult = await supabase.from('research_snapshots').select('*').eq('id', decision.research_snapshot_id).eq('user_id', user.id).maybeSingle();
  if (snapshotResult.error) return Response.json({ error: snapshotResult.error.message }, { status: 500 });
  if (!snapshotResult.data) return Response.json({ error: '关联研究快照不存在' }, { status: 404 });

  try {
    const exportedAt = new Date();
    const report = buildDecisionReport({ decision, snapshot: snapshotResult.data as ResearchSnapshot, exportedAt: exportedAt.toISOString() });
    const pdf = await renderDecisionPdf(report);
    const filename = buildDecisionPdfFilename(decision.asset_name, decision.decision_date, exportedAt);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="investment-decision.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'PDF 生成失败' }, { status: 500 });
  }
}
