import { birthdayCalendars, interactionTypes, relationshipTypes, type ContactInput, type ContactInteractionInput, type ReviewStatus, type SourceType } from '@/types/life-os';

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
  const birthdayValues = [input.birthday_calendar, input.birthday_month, input.birthday_day, input.birthday_year];
  const hasBirthdayValue = birthdayValues.some((value) => value !== undefined && value !== null);
  if (hasBirthdayValue && (!input.birthday_calendar || input.birthday_month == null || input.birthday_day == null)) errors.push('生日的历法、月和日必须填写完整');
  if (input.birthday_calendar && !birthdayCalendars.includes(input.birthday_calendar)) errors.push('生日历法无效');
  if (input.birthday_year != null && (input.birthday_year < 1900 || input.birthday_year > 2100)) errors.push('出生年份无效');
  if (input.birthday_calendar === 'solar' && input.birthday_month != null && input.birthday_day != null) {
    const candidate = new Date(Date.UTC(2000, input.birthday_month - 1, input.birthday_day));
    if (candidate.getUTCMonth() + 1 !== input.birthday_month || candidate.getUTCDate() !== input.birthday_day) errors.push('公历生日无效');
  }
  if (input.birthday_calendar === 'lunar' && (input.birthday_month == null || input.birthday_month < 1 || input.birthday_month > 12 || input.birthday_day == null || input.birthday_day < 1 || input.birthday_day > 30)) errors.push('农历生日无效');
  if (input.birthday_calendar !== 'lunar' && input.birthday_is_leap_month) errors.push('只有农历生日可以选择闰月');
  const auditFields = audit(input.source_type, input.source_ref, input.review_status, errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...input, name, role: text(input.role), met_context: text(input.met_context), family_context: text(input.family_context), work_context: text(input.work_context), important_notes: text(input.important_notes), birthday_is_leap_month: input.birthday_is_leap_month ?? false, birthday_reminder_enabled: input.birthday_reminder_enabled ?? true, next_action: text(input.next_action), notes: text(input.notes), ...auditFields } };
}

export function validateContactInteractionInput(input: ContactInteractionInput): Validation<ContactInteractionInput> {
  const errors: string[] = [];
  if (!input.occurred_at) errors.push('往来日期不能为空');
  const summary = text(input.summary);
  if (!summary) errors.push('往来内容不能为空');
  const interaction_type = input.interaction_type ?? 'contact';
  if (!interactionTypes.includes(interaction_type)) errors.push('往来类型无效');
  if (input.occurred_at && input.next_contact_at && input.next_contact_at < input.occurred_at) errors.push('下次联系不能早于本次联系');
  const auditFields = audit(input.source_type, input.source_ref, input.review_status, errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...input, interaction_type, summary, next_action: text(input.next_action), ...auditFields } };
}
