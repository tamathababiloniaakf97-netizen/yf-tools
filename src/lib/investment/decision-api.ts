import { investmentDecisionStatuses, investmentDecisionTypes } from '@/types/life-os';
import type { InvestmentDecisionInput, InvestmentDecisionStatus } from '@/types/life-os';
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

export function finalizeDecisionRecord(input: InvestmentDecisionInput) {
  const finalization = validateDecisionFinalization(input);
  if (!finalization.ok) return { ok: false as const, errors: finalization.errors };
  const normalized = normalizeDecisionDraft(input);
  if (!normalized.ok) return normalized;
  return { ok: true as const, value: { ...normalized.value, status: 'finalized' as const } };
}
