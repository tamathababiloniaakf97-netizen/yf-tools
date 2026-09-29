import { investmentDecisionTypes } from '@/types/life-os';
import type { InvestmentDecisionInput } from '@/types/life-os';

const fields = [
  'market_expectation', 'personal_divergence', 'valuation_conclusion', 'valuation_assumptions',
  'safety_margin', 'investment_plan', 'error_signals', 'error_response', 'final_reason',
] as const;

export function normalizeDecisionDraft(input: InvestmentDecisionInput) {
  const errors: string[] = [];
  const profileId = input.research_profile_id?.trim();
  const assetName = input.asset_name?.trim();
  if (!profileId) errors.push('请选择公司研究');
  if (!assetName) errors.push('请填写公司或标的名称');
  if (input.decision_type && !investmentDecisionTypes.includes(input.decision_type)) errors.push('决策类型无效');
  if (input.source_type === 'automation' && !input.source_ref?.trim()) errors.push('自动化写入必须保留来源标识');
  if (errors.length) return { ok: false as const, errors };
  const normalized = Object.fromEntries(fields.map((field) => [field, String(input[field] ?? '').trim()]));
  return {
    ok: true as const,
    value: {
      ...input,
      ...normalized,
      research_profile_id: profileId,
      research_snapshot_id: input.research_snapshot_id || null,
      asset_name: assetName,
      status: 'draft' as const,
      do_not_list: (input.do_not_list ?? []).map((item) => item.trim()).filter(Boolean),
      decision_type: input.decision_type ?? null,
      decision_date: input.decision_date || null,
      source_type: input.source_type ?? 'manual',
      source_ref: input.source_ref?.trim() || null,
      review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved'),
    },
  };
}

export function validateDecisionFinalization(input: InvestmentDecisionInput) {
  const requirements: Array<[unknown, string]> = [
    [input.research_snapshot_id, '请选择研究快照'],
    [input.market_expectation, '请填写市场预期'],
    [input.personal_divergence, '请填写你与市场的分歧'],
    [input.valuation_conclusion, '请填写估值结论'],
    [input.valuation_assumptions, '请填写估值关键假设'],
    [input.safety_margin, '请填写安全边际判断'],
    [input.error_signals, '请填写判断错误的信号'],
    [input.error_response, '请填写判断错误后的处理原则'],
    [input.decision_type, '请选择最终决策'],
    [input.final_reason, '请填写最终决策的核心理由'],
    [input.decision_date, '请选择决策日期'],
  ];
  const errors = requirements.flatMap(([value, message]) => String(value ?? '').trim() ? [] : [message]);
  if (input.decision_type && !investmentDecisionTypes.includes(input.decision_type)) errors.push('决策类型无效');
  return { ok: errors.length === 0, errors };
}
