import { describe, expect, it } from 'vitest';
import { buildResearchProfileRecord, researchOwnershipFilter } from './research-api';

describe('research API helpers', () => {
  it('builds an additive profile record without dropping legacy fields', () => {
    const result = buildResearchProfileRecord('user-1', {
      asset_name: ' 腾讯 ', investment_thesis: ' 原投资逻辑 ', current_judgment: ' 继续观察 ',
      risks: ' 竞争 ', invalidation_conditions: ' 用户迁移 ', business_model: ' 社交广告 ',
      customer_value: ' 连接用户 ', competitive_advantage: ' 关系链 ',
      long_term_assumptions: ' 用户活跃 ', earnings_quality: ' 现金流良好 ',
    });
    expect(result).toMatchObject({ ok: true, value: {
      user_id: 'user-1', asset_name: '腾讯', investment_thesis: '原投资逻辑',
      current_judgment: '继续观察', risks: '竞争', invalidation_conditions: '用户迁移',
      business_model: '社交广告', earnings_quality: '现金流良好',
    } });
  });

  it('requires both user and parent profile ownership for nested records', () => {
    expect(researchOwnershipFilter('user-1', 'profile-1')).toEqual({ user_id: 'user-1', research_profile_id: 'profile-1' });
  });
});
