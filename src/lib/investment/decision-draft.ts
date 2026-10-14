import type { InvestmentDecision } from '@/types/life-os';
export function decisionDraftKey(userId: string, decision: Pick<InvestmentDecision, 'id' | 'research_profile_id'>) {
  return `investment-decision-draft:${userId}:${decision.research_profile_id}:${decision.id || 'new'}`;
}
