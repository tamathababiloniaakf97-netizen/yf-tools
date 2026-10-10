import { externalVariableOwnerTypes, industryCompanyRoles, industryCompanyStages } from '@/types/life-os';
import type { ExternalVariableInput, IndustryCompanyInput, IndustryIndicatorInput, IndustryProfileInput } from '@/types/life-os';

const profileFields = ['summary_judgment', 'upstream_overview', 'industry_overview', 'downstream_overview', 'key_drivers', 'risks_and_reversal_signals', 'notes'] as const;
const trim = (value: unknown) => String(value ?? '').trim();

export function normalizeIndustryProfileInput(input: IndustryProfileInput) {
  const name = trim(input.name); const errors: string[] = [];
  if (!name) errors.push('请填写行业名称');
  if (input.source_type === 'automation' && !trim(input.source_ref)) errors.push('自动化写入必须保留来源标识');
  if (errors.length) return { ok: false as const, errors };
  return { ok: true as const, value: { ...input, ...Object.fromEntries(profileFields.map((field) => [field, trim(input[field])])), name, source_type: input.source_type ?? 'manual', source_ref: trim(input.source_ref) || null, review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved') } };
}

export function normalizeIndustryCompanyInput(input: IndustryCompanyInput) {
  const name = trim(input.name); const errors: string[] = [];
  if (!name) errors.push('请填写企业名称');
  if (input.stage && !industryCompanyStages.includes(input.stage)) errors.push('产业链位置无效');
  if (input.role && !industryCompanyRoles.includes(input.role)) errors.push('企业角色无效');
  if (errors.length) return { ok: false as const, errors };
  return { ok: true as const, value: { name, stage: input.stage ?? 'industry', role: input.role ?? 'other', importance: trim(input.importance), research_profile_id: input.research_profile_id || null } };
}

export function normalizeIndustryIndicatorInput(input: IndustryIndicatorInput) {
  const name = trim(input.name);
  if (!name) return { ok: false as const, errors: ['请填写指标名称'] };
  return { ok: true as const, value: { name, current_observation: trim(input.current_observation), watch_for: trim(input.watch_for) } };
}

export function normalizeExternalVariableInput(input: ExternalVariableInput) {
  const name = trim(input.name); const errors: string[] = [];
  if (!externalVariableOwnerTypes.includes(input.owner_type)) errors.push('外部变量归属类型无效');
  if (!name) errors.push('请填写变量名称');
  const industryOwner = input.owner_type === 'industry' && Boolean(input.industry_profile_id) && !input.research_profile_id;
  const companyOwner = input.owner_type === 'company' && Boolean(input.research_profile_id) && !input.industry_profile_id;
  if (!industryOwner && !companyOwner) errors.push('外部变量必须且只能关联一个匹配的研究对象');
  if (errors.length) return { ok: false as const, errors };
  return { ok: true as const, value: { owner_type: input.owner_type, industry_profile_id: input.industry_profile_id || null, research_profile_id: input.research_profile_id || null, name, current_state: trim(input.current_state), impact: trim(input.impact), watch_for: trim(input.watch_for), reversal_signal: trim(input.reversal_signal) } };
}
