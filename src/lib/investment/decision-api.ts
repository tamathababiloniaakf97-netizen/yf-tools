import { investmentDecisionStatuses, investmentDecisionTypes } from '@/types/life-os';
import type { InvestmentDecision, InvestmentDecisionInput, InvestmentDecisionStatus } from '@/types/life-os';
import { normalizeDecisionDraft, validateDecisionFinalization } from './decision-validation';

export function buildDecisionFilters(params: URLSearchParams) {
  const filters: { status?: string; research_profile_id?: string; decision_type?: string } = {};
  const status = params.get('status'); const profileId = params.get('research_profile_id'); const type = params.get('decision_type');
  if (status && investmentDecisionStatuses.includes(status as InvestmentDecisionStatus)) filters.status = status;
  if (profileId?.trim()) filters.research_profile_id = profileId.trim();
  if (type && investmentDecisionTypes.includes(type as typeof investmentDecisionTypes[number])) filters.decision_type = type;
  return filters;
}

export function canEditDecision(status: InvestmentDecisionStatus) { return status === 'draft'; }

export function buildDecisionDraftCopy(source: InvestmentDecision): InvestmentDecisionInput {
  return {
    research_profile_id: source.research_profile_id,
    research_snapshot_id: source.research_snapshot_id,
    asset_name: source.asset_name,
    market_expectation: source.market_expectation,
    personal_divergence: source.personal_divergence,
    valuation_conclusion: source.valuation_conclusion,
    valuation_assumptions: source.valuation_assumptions,
    safety_margin: source.safety_margin,
    investment_plan: source.investment_plan,
    error_signals: source.error_signals,
    error_response: source.error_response,
    do_not_list: source.do_not_list,
    decision_type: source.decision_type,
    final_reason: source.final_reason,
    decision_date: null,
    source_type: 'manual',
    source_ref: source.id,
    review_status: 'approved',
  };
}

export function finalizeDecisionRecord(input: InvestmentDecisionInput) {
  const finalization = validateDecisionFinalization(input);
  if (!finalization.ok) return { ok: false as const, errors: finalization.errors };
  const normalized = normalizeDecisionDraft(input);
  if (!normalized.ok) return normalized;
  return { ok: true as const, value: { ...normalized.value, status: 'finalized' as const } };
}
