import { describe, expect, it } from 'vitest';
import type { InvestmentDecision, ResearchSnapshot } from '@/types/life-os';
import { buildDecisionArchivePdfFilename, buildDecisionPdfFilename, buildDecisionReport } from './decision-report';

const decision: InvestmentDecision = {
  id: 'decision-1', user_id: 'user-1', research_profile_id: 'profile-1', research_snapshot_id: 'snapshot-1',
  asset_name: '腾讯/控股', status: 'finalized', market_expectation: '市场预期游戏恢复缓慢',
  personal_divergence: '新品和广告可能好于预期', valuation_conclusion: '估值处于可接受区间',
  valuation_assumptions: '收入增长10%，利润率稳定', safety_margin: '目标回报覆盖预测误差',
  investment_plan: '分三次建仓，上限10%', error_signals: '流水连续两个季度低于预期',
  error_response: '停止加仓并重新评估', do_not_list: ['不因单日涨跌追价', '不使用短期借款'],
  decision_type: 'buy', final_reason: '赔率和长期质量匹配', decision_date: '2026-10-01',
  source_type: 'manual', source_ref: null, review_status: 'approved',
  created_at: '2026-09-30T01:00:00Z', updated_at: '2026-10-01T01:00:00Z',
};

const snapshot: ResearchSnapshot = {
  id: 'snapshot-1', user_id: 'user-1', research_profile_id: 'profile-1', snapshot_version: 3,
  created_at: '2026-09-29T08:00:00Z', evidence_snapshot: [],
  snapshot_data: {
    profile: {
      id: 'profile-1', user_id: 'user-1', ticker_id: null, asset_name: '腾讯',
      investment_thesis: '长期现金流质量较高', current_judgment: '等待估值进入区间',
      risks: '监管和竞争', invalidation_conditions: '核心业务持续衰退',
      business_model: '游戏、广告和金融科技', customer_value: '连接用户与内容服务',
      competitive_advantage: '社交关系链和规模', long_term_assumptions: '用户价值保持稳定',
      earnings_quality: '自由现金流稳定', management_culture: '资本配置谨慎', unknowns: 'AI投入回报',
      checklist_state: {}, source_type: 'manual', source_ref: null, review_status: 'approved',
      created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-29T08:00:00Z',
    },
    hypotheses: [{ id: 'h1', user_id: 'user-1', research_profile_id: 'profile-1', statement: '广告份额继续提升', key_variables: '广告收入增速', status: 'unverified', next_check_at: '2026-11-15', created_at: '', updated_at: '' }],
  },
};

describe('decision report', () => {
  it('creates a stable archive filename', () => {
    expect(buildDecisionArchivePdfFilename('腾讯/控股')).toBe('腾讯-控股-投资决策档案.pdf');
  });
  it('uses the finalized decision and its stored snapshot rather than current research', () => {
    const report = buildDecisionReport({ decision, snapshot, exportedAt: '2026-10-02T02:00:00Z' });
    expect(report.meta).toMatchObject({ assetName: '腾讯/控股', decisionLabel: '买入', snapshotVersion: 3 });
    expect(report.conclusion).toEqual([
      { label: '最终决定', value: '买入' },
      { label: '核心理由', value: '赔率和长期质量匹配' },
    ]);
    expect(report.researchSummary).toContainEqual({ label: '当时的投资逻辑', value: '长期现金流质量较高' });
    expect(report.hypotheses[0]).toMatchObject({ statement: '广告份额继续提升', statusLabel: '待验证' });
  });

  it('builds a safe filename from the decision date and falls back to export date', () => {
    expect(buildDecisionPdfFilename('腾讯/控股', '2026-10-01', new Date('2026-10-02T00:00:00Z'))).toBe('腾讯-控股-投资决策-2026-10-01.pdf');
    expect(buildDecisionPdfFilename('腾讯', null, new Date('2026-10-02T00:00:00+08:00'))).toBe('腾讯-投资决策-2026-10-02.pdf');
  });
});
