import { investmentTaskStatuses, investmentTaskTypes, type InvestmentTaskInput, type ReviewStatus, type SourceType } from '@/types/life-os';

type Validation<T> = { ok: true; value: T } | { ok: false; errors: string[] };
const text = (value: string | undefined | null) => value?.trim() ?? '';

export function validateInvestmentTaskInput(input: InvestmentTaskInput): Validation<InvestmentTaskInput> {
  const errors: string[] = [];
  const title = text(input.title);
  const status = input.status ?? 'pending';
  const source_type: SourceType = input.source_type ?? 'manual';
  const source_ref = text(input.source_ref) || null;
  const review_status: ReviewStatus = input.review_status ?? (source_type === 'manual' ? 'approved' : 'pending');
  if (!title) errors.push('待办事项不能为空');
  if (!investmentTaskTypes.includes(input.task_type)) errors.push('投资待办类型无效');
  if (!investmentTaskStatuses.includes(status)) errors.push('投资待办状态无效');
  if (source_type === 'automation' && !source_ref) errors.push('自动化记录必须保留来源标识');
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: {
    ...input,
    asset_name: text(input.asset_name), title, condition_note: text(input.condition_note), notes: text(input.notes),
    status, completed_at: status === 'completed' ? (input.completed_at ?? new Date().toISOString()) : null,
    source_type, source_ref, review_status,
  } };
}
