import { describe, expect, it } from 'vitest';
import type { EvidenceRecord, ResearchHypothesis, ResearchProfile } from '@/types/life-os';
import { buildResearchPdfFilename, buildResearchReport } from './research-report';

const profile: ResearchProfile = {
  id: 'profile-1', user_id: 'user-1', ticker_id: null, asset_name: '腾讯/控股',
  investment_thesis: '关系链与内容生态形成长期价值', current_judgment: '继续观察广告恢复',
  risks: '竞争加剧', invalidation_conditions: '核心用户持续流失', business_model: '增值服务与广告',
  customer_value: '连接与内容消费', competitive_advantage: '关系链与规模',
  long_term_assumptions: '用户活跃保持稳定', earnings_quality: '', management_culture: '重视长期投入',
  unknowns: '视频号商业化上限', checklist_state: {
    pricing_power: { status: 'considered', note: '广告加载率仍有空间' },
    unused: { status: 'needs_validation', note: '' },
  },
  source_type: 'manual', source_ref: null, review_status: 'approved',
  created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-30T10:00:00.000Z',
};

const hypotheses: ResearchHypothesis[] = [
  { id: 'h1', user_id: 'user-1', research_profile_id: 'profile-1', statement: '广告业务恢复增长', key_variables: '广告加载率', status: 'challenged', next_check_at: '2026-11-01', created_at: '2026-09-01', updated_at: '2026-09-30' },
  { id: 'h2', user_id: 'user-1', research_profile_id: 'profile-1', statement: '现金流保持稳定', key_variables: '自由现金流', status: 'supported', next_check_at: null, created_at: '2026-09-01', updated_at: '2026-09-30' },
];

function evidence(overrides: Partial<EvidenceRecord>): EvidenceRecord {
  return {
    id: 'e1', user_id: 'user-1', ticker_id: null, asset_name: '腾讯/控股', hypothesis_id: null,
    content: '证据', impact: 'neutral', source_name: '财报', source_url: null, occurred_at: null,
    source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('company research report', () => {
  it('normalizes labels, hypotheses, evidence order and completeness gaps', () => {
    const report = buildResearchReport({
      profile,
      hypotheses,
      evidence: [
        evidence({ id: 'e-old', content: '较早证据', occurred_at: '2026-09-10', created_at: '2026-09-11T00:00:00.000Z' }),
        evidence({ id: 'e-none', content: '无日期证据', source_name: '', source_url: null, created_at: '2026-09-01T00:00:00.000Z' }),
        evidence({ id: 'e-new', content: '最新证据', hypothesis_id: 'h1', impact: 'challenge', occurred_at: '2026-09-30', created_at: '2026-09-30T00:00:00.000Z' }),
      ],
      exportedAt: '2026-10-01T08:00:00.000Z',
    });

    expect(report.meta).toMatchObject({ assetName: '腾讯/控股', status: '研究进行中', exportedAt: '2026-10-01T08:00:00.000Z' });
    expect(report.hypotheses[0].statusLabel).toBe('受到挑战');
    expect(report.evidence.map((item) => item.content)).toEqual(['最新证据', '较早证据', '无日期证据']);
    expect(report.evidence[0]).toMatchObject({ hypothesisStatement: '广告业务恢复增长', impactLabel: '挑战' });
    expect(report.gaps).toEqual({ missingCoreFields: ['盈利质量'], unresolvedHypothesisCount: 1, evidenceWithoutSourceCount: 1 });
    expect(report.checklist).toEqual([{ label: 'pricing power', statusLabel: '已考虑', note: '广告加载率仍有空间' }]);
  });

  it('marks a complete research profile as current research', () => {
    const report = buildResearchReport({ profile: { ...profile, earnings_quality: '自由现金流稳定' }, hypotheses: [], evidence: [], exportedAt: '2026-10-01T08:00:00.000Z' });
    expect(report.meta.status).toBe('当前研究');
    expect(report.gaps.missingCoreFields).toEqual([]);
  });

  it('creates a Windows-safe dated filename', () => {
    expect(buildResearchPdfFilename('腾讯/控股:*?', new Date('2026-10-01T08:00:00+08:00')))
      .toBe('腾讯-控股-当前公司研究-2026-10-01.pdf');
  });
});
