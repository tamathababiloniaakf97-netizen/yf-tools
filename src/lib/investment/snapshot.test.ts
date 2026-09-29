import { describe, expect, it } from 'vitest';
import { buildResearchSnapshot } from './snapshot';
import type { EvidenceRecord, ResearchHypothesis, ResearchProfile } from '@/types/life-os';

describe('buildResearchSnapshot', () => {
  it('freezes research, hypothesis states and compact evidence values', () => {
    const profile = {
      id: 'p1', asset_name: '腾讯', business_model: '社交广告', customer_value: '连接用户',
      competitive_advantage: '关系链', long_term_assumptions: '用户活跃',
      invalidation_conditions: '用户迁移', earnings_quality: '现金流良好',
      checklist_state: { pricing: { status: 'considered', note: '有定价权' } },
      investment_thesis: '原逻辑', current_judgment: '观察', risks: '竞争', management_culture: '', unknowns: '',
      user_id: 'u1', ticker_id: null, source_type: 'manual', source_ref: null, review_status: 'approved',
      created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z',
    } as ResearchProfile;
    const hypotheses = [{ id: 'h1', statement: '广告增长', status: 'unverified' }] as ResearchHypothesis[];
    const evidence = [{ id: 'e1', content: '季报广告增长', impact: 'support', source_name: '财报', source_url: null, occurred_at: '2026-09-01', hypothesis_id: 'h1' }] as EvidenceRecord[];

    const snapshot = buildResearchSnapshot(profile, hypotheses, evidence);
    profile.business_model = '已修改';
    hypotheses[0].statement = '已修改';
    evidence[0].content = '已修改';

    expect(snapshot.snapshot_data.profile.business_model).toBe('社交广告');
    expect(snapshot.snapshot_data.hypotheses[0].statement).toBe('广告增长');
    expect(snapshot.evidence_snapshot[0]).toEqual({ id: 'e1', content: '季报广告增长', impact: 'support', source_name: '财报', source_url: null, occurred_at: '2026-09-01', hypothesis_id: 'h1' });
  });
});
