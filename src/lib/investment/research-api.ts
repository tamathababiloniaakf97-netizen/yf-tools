import type { ResearchProfileInput } from '@/types/life-os';
import { normalizeResearchProfileInput } from './research-validation';

export function buildResearchProfileRecord(userId: string, input: ResearchProfileInput) {
  const validation = normalizeResearchProfileInput(input);
  if (!validation.ok) return validation;
  return { ok: true as const, value: { ...validation.value, user_id: userId, updated_at: new Date().toISOString() } };
}

export function researchOwnershipFilter(userId: string, researchProfileId: string) {
  return { user_id: userId, research_profile_id: researchProfileId };
}
