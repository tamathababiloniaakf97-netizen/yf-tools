import { describe, expect, it } from 'vitest';
import { normalizeHypothesisInput, normalizeResearchProfileInput, validateResearchSnapshotCore } from './research-validation';
import type { ResearchProfileInput } from '@/types/life-os';

const completeProfile: ResearchProfileInput = {
  asset_name: ' 腾讯 ',
  business_model: ' 社交与内容生态变现 ',
  customer_value: ' 用户关系链与商家触达 ',
  competitive_advantage: ' 关系链与规模 ',
  long_term_assumptions: ' 用户与商业化保持平衡 ',
  invalidation_conditions: ' 关系链显著迁移 ',
  earnings_quality: ' 经营现金流长期覆盖利润 ',
};

describe('research validation', () => {
  it('normalizes a research draft without requiring complete core answers', () => {
    const result = normalizeResearchProfileInput({ asset_name: ' 腾讯 ', business_model: ' 平台收入 ', industry_profile_id: 'industry-1', industry_impact: ' 需求增长 ' });
    expect(result).toMatchObject({ ok: true, value: { asset_name: '腾讯', business_model: '平台收入', checklist_state: {}, industry_profile_id: 'industry-1', industry_impact: '需求增长' } });
  });

  it('requires all six core answers before snapshotting', () => {
    expect(validateResearchSnapshotCore(completeProfile)).toEqual({ ok: true, errors: [] });
    expect(validateResearchSnapshotCore({ ...completeProfile, earnings_quality: '' }).errors)
      .toContain('请回答：挣到的钱质量如何');
  });

  it('accepts an explicit unknown when it names the validation direction', () => {
    expect(validateResearchSnapshotCore({ ...completeProfile, earnings_quality: '暂不知道，需要核对现金流量表' }).ok).toBe(true);
  });

  it('normalizes hypotheses and rejects unsupported states', () => {
    expect(normalizeHypothesisInput({ statement: ' 广告收入保持增长 ', key_variables: ' 广告加载率 ' })).toMatchObject({ ok: true, value: { statement: '广告收入保持增长', key_variables: '广告加载率', status: 'unverified' } });
    expect(normalizeHypothesisInput({ statement: '假设', status: 'bad' as 'unverified' }).ok).toBe(false);
  });
});
