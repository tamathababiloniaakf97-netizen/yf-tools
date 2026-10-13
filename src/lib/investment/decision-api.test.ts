import { describe, expect, it } from 'vitest';
import { buildDecisionDraftCopy, buildDecisionFilters, canEditDecision, finalizeDecisionRecord } from './decision-api';
import type { InvestmentDecision, InvestmentDecisionInput } from '@/types/life-os';

const complete: InvestmentDecisionInput = {
  research_profile_id: 'p1', research_snapshot_id: 's1', asset_name: '腾讯',
  market_expectation: '低增长', personal_divergence: '广告更强', valuation_conclusion: '合理',
  valuation_assumptions: '利润增长', safety_margin: '可接受', error_signals: '现金流恶化',
  error_response: '停止加仓', decision_type: 'watch', final_reason: '等待价格', decision_date: '2026-09-29',
};

describe('decision API helpers', () => {
  it('builds only supported list filters', () => {
    expect(buildDecisionFilters(new URLSearchParams('status=draft&research_profile_id=p1&decision_type=watch'))).toEqual({ status: 'draft', research_profile_id: 'p1', decision_type: 'watch' });
    expect(buildDecisionFilters(new URLSearchParams('status=bad&decision_type=bad'))).toEqual({});
  });

  it('allows edits only while a decision is a draft', () => {
    expect(canEditDecision('draft')).toBe(true);
    expect(canEditDecision('finalized')).toBe(false);
  });

  it('creates an immutable finalization patch after validation', () => {
    expect(finalizeDecisionRecord(complete)).toMatchObject({ ok: true, value: { status: 'finalized', research_snapshot_id: 's1', decision_date: '2026-09-29' } });
    expect(finalizeDecisionRecord({ ...complete, research_snapshot_id: null }).ok).toBe(false);
  });

  it('copies a finalized decision into a traceable editable draft', () => {
    const source = {
      id: 'decision-1', user_id: 'user-1', status: 'finalized', created_at: '2026-10-01', updated_at: '2026-10-02',
      source_type: 'manual', source_ref: null, review_status: 'approved', investment_plan: '', do_not_list: [],
      ...complete,
    } as InvestmentDecision;
    expect(buildDecisionDraftCopy(source)).toMatchObject({
      research_profile_id: 'p1', research_snapshot_id: 's1', asset_name: '腾讯',
      market_expectation: '低增长', decision_type: 'watch', final_reason: '等待价格',
      decision_date: null, source_type: 'manual', source_ref: 'decision-1', review_status: 'approved',
    });
    expect(buildDecisionDraftCopy(source)).not.toHaveProperty('id');
    expect(buildDecisionDraftCopy(source)).not.toHaveProperty('status');
  });
});
