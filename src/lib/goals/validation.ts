import type { GoalInput } from '@/types/life-os';
import { goalCategories, goalTypes } from '@/types/life-os';

type GoalValidation = { ok: true; value: GoalInput } | { ok: false; errors: string[] };

export function validateGoalInput(input: GoalInput): GoalValidation {
  const errors: string[] = [];
  const title = input.title?.trim();
  if (!title) errors.push('目标不能为空');
  if (!Number.isInteger(input.year) || input.year < 2020 || input.year > 2100) errors.push('年份无效');
  if (!input.goal_type || !goalTypes.includes(input.goal_type)) errors.push('目标类型无效');
  if (input.category && !goalCategories.includes(input.category)) errors.push('年度板块无效');
  const completionCriteria = input.completion_criteria?.trim();
  const nextAction = input.next_action?.trim();
  if (input.next_action_due_at && !/^\d{4}-\d{2}-\d{2}$/.test(input.next_action_due_at)) errors.push('行动截止日期无效');
  if (!completionCriteria) errors.push('请填写完成标准');
  if (!nextAction) errors.push('请填写下一步行动');
  if (input.goal_type === 'result') {
    if (typeof input.target_value !== 'number' || input.target_value <= 0) errors.push('结果型目标需要大于 0 的目标值');
    if (typeof input.current_value !== 'number' || input.current_value < 0) errors.push('结果型目标需要非负当前值');
    if (!input.value_unit?.trim()) errors.push('结果型目标需要计量单位');
  }
  if (input.goal_type === 'project' && !input.current_milestone?.trim()) errors.push('项目型目标需要当前里程碑');
  if (input.goal_type === 'habit') {
    if (!Number.isInteger(input.habit_target_count) || (input.habit_target_count ?? 0) <= 0) errors.push('习惯型目标需要正数计划次数');
    if (!Number.isInteger(input.habit_completed_count) || (input.habit_completed_count ?? -1) < 0) errors.push('习惯型目标需要非负完成次数');
    if (!input.habit_period) errors.push('习惯型目标需要统计周期');
  }
  if (input.source_type === 'automation' && !input.source_ref?.trim()) errors.push('自动化目标必须保留来源标识');
  if (errors.length) return { ok: false, errors };
  const sourceType = input.source_type ?? 'manual';
  return {
    ok: true,
    value: {
      ...input,
      title,
      description: input.description?.trim() ?? '',
      goal_type: input.goal_type,
      completion_criteria: completionCriteria,
      current_state: input.current_state?.trim() ?? '',
      current_milestone: input.current_milestone?.trim() ?? '',
      next_action: nextAction,
      next_action_due_at: input.next_action_due_at ?? null,
      value_unit: input.value_unit?.trim() ?? '',
      status: input.status ?? 'active',
      source_type: sourceType,
      source_ref: input.source_ref?.trim() || undefined,
      review_status: input.review_status ?? (sourceType === 'manual' ? 'approved' : 'pending'),
    },
  };
}
