import { researchFields } from '@/types/life-os';
import type { EvidenceInput, InvestmentReviewInput, MethodologyInput, WatchlistInput } from '@/types/life-os';

export function validateWatchlistInput(input: WatchlistInput) {
  const errors: string[] = [];
  if (!input.asset_name?.trim()) errors.push('请填写关注事项');
  if (errors.length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      ...input,
      asset_name: input.asset_name.trim(),
      reason: input.reason?.trim() ?? '',
      entry_condition: input.entry_condition?.trim() ?? '',
      status: input.status ?? 'watching',
      notes: input.notes?.trim() ?? '',
      source_type: input.source_type ?? 'manual',
      review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved'),
    },
  };
}

export function normalizeEvidenceInput(input: EvidenceInput) {
  const errors: string[] = [];
  if (!input.asset_name?.trim()) errors.push('请填写标的名称');
  if (!input.content?.trim()) errors.push('请填写证据内容');
  if (input.source_type === 'automation' && !input.source_ref?.trim()) errors.push('自动化写入必须保留来源标识');
  if (input.research_field && !(researchFields as readonly string[]).includes(input.research_field)) errors.push('请选择有效的当前研究栏目');
  if (errors.length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      ...input,
      asset_name: input.asset_name.trim(),
      content: input.content.trim(),
      source_name: input.source_name?.trim() ?? '',
      material_id: input.material_id?.trim() || null,
      research_field: input.research_field ?? null,
      source_type: input.source_type ?? 'manual',
      review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved'),
    },
  };
}

export function validateInvestmentReviewInput(input: InvestmentReviewInput) {
  const errors: string[] = [];
  if (!input.asset_name?.trim()) errors.push('请填写标的名称');
  if (!input.review_date) errors.push('请选择复盘日期');
  if (!input.original_reason?.trim()) errors.push('请填写当初的判断依据');
  if (!input.lesson?.trim()) errors.push('请填写本次复盘结论');
  if (input.source_type === 'automation' && !input.source_ref?.trim()) errors.push('自动化写入必须保留来源标识');
  if (errors.length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      ...input,
      asset_name: input.asset_name.trim(),
      original_reason: input.original_reason.trim(),
      actual_result: input.actual_result?.trim() ?? '',
      correct_points: input.correct_points?.trim() ?? '',
      mistake_points: input.mistake_points?.trim() ?? '',
      lesson: input.lesson.trim(),
      decision_id: input.decision_id?.trim() || null,
      source_type: input.source_type ?? 'manual',
      review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved'),
    },
  };
}

export function validateMethodologyInput(input: MethodologyInput) {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push('请填写方法标题');
  if (!input.content?.trim()) errors.push('请填写方法内容');
  if (input.source_type === 'automation' && !input.source_ref?.trim()) errors.push('自动化写入必须保留来源标识');
  if (errors.length) return { ok: false as const, errors };
  return {
    ok: true as const,
    value: {
      ...input,
      title: input.title.trim(),
      content: input.content.trim(),
      status: input.status ?? 'active',
      source_type: input.source_type ?? 'manual',
      review_status: input.review_status ?? (input.source_type === 'automation' ? 'pending' : 'approved'),
    },
  };
}
