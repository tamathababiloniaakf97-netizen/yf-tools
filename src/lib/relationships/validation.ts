import { relationshipTypes, type ContactInput, type ContactInteractionInput, type ReviewStatus, type SourceType } from '@/types/life-os';

type Validation<T> = { ok: true; value: T } | { ok: false; errors: string[] };
const text = (value: string | undefined) => value?.trim() ?? '';
function audit(sourceType: SourceType | undefined, sourceRef: string | null | undefined, reviewStatus: ReviewStatus | undefined, errors: string[]) {
  const source_type = sourceType ?? 'manual';
  const source_ref = text(sourceRef ?? undefined) || null;
  if (source_type === 'automation' && !source_ref) errors.push('自动化记录必须保留来源标识');
  return { source_type, source_ref, review_status: reviewStatus ?? (source_type === 'manual' ? 'approved' : 'pending') };
}

export function validateContactInput(input: ContactInput): Validation<ContactInput> {
  const errors: string[] = [];
  const name = text(input.name);
  if (!name) errors.push('姓名不能为空');
  if (!relationshipTypes.includes(input.relationship_type)) errors.push('关系类型无效');
  if (input.last_contact_at && input.next_contact_at && input.next_contact_at < input.last_contact_at) errors.push('下次联系不能早于最近联系');
  const auditFields = audit(input.source_type, input.source_ref, input.review_status, errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...input, name, role: text(input.role), met_context: text(input.met_context), family_context: text(input.family_context), work_context: text(input.work_context), important_notes: text(input.important_notes), next_action: text(input.next_action), notes: text(input.notes), ...auditFields } };
}

export function validateContactInteractionInput(input: ContactInteractionInput): Validation<ContactInteractionInput> {
  const errors: string[] = [];
  if (!input.occurred_at) errors.push('联系日期不能为空');
  const summary = text(input.summary);
  if (!summary) errors.push('联系摘要不能为空');
  if (input.occurred_at && input.next_contact_at && input.next_contact_at < input.occurred_at) errors.push('下次联系不能早于本次联系');
  const auditFields = audit(input.source_type, input.source_ref, input.review_status, errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...input, summary, next_action: text(input.next_action), ...auditFields } };
}
