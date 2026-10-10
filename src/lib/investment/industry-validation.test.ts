import { describe, expect, it } from 'vitest';
import { normalizeExternalVariableInput, normalizeIndustryCompanyInput, normalizeIndustryIndicatorInput, normalizeIndustryProfileInput } from './industry-validation';

describe('industry research validation', () => {
  it('normalizes a minimal industry profile', () => {
    expect(normalizeIndustryProfileInput({ name: ' 云计算 ' })).toMatchObject({ ok: true, value: { name: '云计算', summary_judgment: '' } });
  });

  it('rejects empty industry and indicator names', () => {
    expect(normalizeIndustryProfileInput({ name: ' ' }).ok).toBe(false);
    expect(normalizeIndustryIndicatorInput({ name: ' ' }).ok).toBe(false);
  });

  it('validates company stage and role', () => {
    expect(normalizeIndustryCompanyInput({ name: ' 腾讯 ', stage: 'industry', role: 'leader' })).toMatchObject({ ok: true, value: { name: '腾讯' } });
    expect(normalizeIndustryCompanyInput({ name: '腾讯', stage: 'bad' as 'industry' }).ok).toBe(false);
  });

  it('requires exactly the owner matching the external variable type', () => {
    expect(normalizeExternalVariableInput({ owner_type: 'industry', industry_profile_id: 'i1', name: ' 利率 ' }).ok).toBe(true);
    expect(normalizeExternalVariableInput({ owner_type: 'industry', research_profile_id: 'r1', name: '利率' }).ok).toBe(false);
  });
});
