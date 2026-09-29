import { describe, expect, it } from 'vitest';
import { normalizeDecisionDraft, validateDecisionFinalization } from './decision-validation';
import type { InvestmentDecisionInput } from '@/types/life-os';

const completeDecision: InvestmentDecisionInput = {
  research_profile_id: 'profile-1', asset_name: '腾讯', research_snapshot_id: 'snapshot-1',
  market_expectation: '市场预期低增长', personal_divergence: '广告增长可能更强',
  valuation_conclusion: '估值处于合理区间', valuation_assumptions: '利润保持增长',
  safety_margin: '下行情景仍可接受', error_signals: '现金流显著恶化',
  error_response: '停止加仓并重新研究', decision_type: 'watch', final_reason: '等待更好价格',
  decision_date: '2026-09-29',
};

describe('investment decision validation', () => {
  it('allows an incomplete draft and normalizes optional values', () => {
    expect(normalizeDecisionDraft({ research_profile_id: ' profile-1 ', asset_name: ' 腾讯 ' })).toMatchObject({
      ok: true,
      value: { research_profile_id: 'profile-1', asset_name: '腾讯', status: 'draft', do_not_list: [] },
    });
  });

  it('requires a snapshot and the approved core groups for finalization', () => {
    expect(validateDecisionFinalization(completeDecision)).toEqual({ ok: true, errors: [] });
    expect(validateDecisionFinalization({ ...completeDecision, research_snapshot_id: null, safety_margin: '' }).errors)
      .toEqual(expect.arrayContaining(['请选择研究快照', '请填写安全边际判断']));
  });

  it('rejects unsupported decision types', () => {
    expect(normalizeDecisionDraft({ ...completeDecision, decision_type: 'trade' as 'buy' }).ok).toBe(false);
  });

  it('does not let draft normalization write finalized state', () => {
    expect(normalizeDecisionDraft({ ...completeDecision, status: 'finalized' })).toMatchObject({ ok: true, value: { status: 'draft' } });
  });
});
