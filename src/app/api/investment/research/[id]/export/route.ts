import { buildResearchPdfFilename, buildResearchReport } from '@/lib/investment/research-report';
import { renderResearchPdf } from '@/lib/investment/research-pdf';
import { createServerSideClient } from '@/lib/supabase/server';
import type { EvidenceRecord, ResearchHypothesis, ResearchProfile } from '@/types/life-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSideClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: '未登录' }, { status: 401 });

  const { id } = await context.params;
  const profileResult = await supabase.from('research_profiles').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (profileResult.error) return Response.json({ error: profileResult.error.message }, { status: 500 });
  if (!profileResult.data) return Response.json({ error: '公司研究不存在' }, { status: 404 });

  const profile = profileResult.data as ResearchProfile;
  const [hypothesisResult, evidenceResult] = await Promise.all([
    supabase.from('research_hypotheses').select('*').eq('research_profile_id', id).eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('evidence_records').select('*').eq('asset_name', profile.asset_name).eq('user_id', user.id).order('occurred_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
  ]);
  if (hypothesisResult.error || evidenceResult.error) {
    return Response.json({ error: hypothesisResult.error?.message || evidenceResult.error?.message || '研究资料加载失败' }, { status: 500 });
  }

  try {
    const exportedAt = new Date();
    const report = buildResearchReport({
      profile,
      hypotheses: (hypothesisResult.data ?? []) as ResearchHypothesis[],
      evidence: (evidenceResult.data ?? []) as EvidenceRecord[],
      exportedAt: exportedAt.toISOString(),
    });
    const pdf = await renderResearchPdf(report);
    const filename = buildResearchPdfFilename(profile.asset_name, exportedAt);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="company-research.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'PDF 生成失败' }, { status: 500 });
  }
}
