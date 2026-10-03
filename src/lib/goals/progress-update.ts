import type { Goal, GoalProgressInput } from '@/types/life-os';

type Result = { ok: true; value: Required<GoalProgressInput> } | { ok: false; errors: string[] };

export function validateGoalProgressInput(input: GoalProgressInput, goal: Goal): Result {
  const errors: string[] = [];
  const occurredAt = input.occurred_at?.trim();
  const note = input.progress_note?.trim();
  const nextAction = input.next_action?.trim();
  const nextActionDueAt = input.next_action_due_at?.trim();
  if (!occurredAt || !/^\d{4}-\d{2}-\d{2}$/.test(occurredAt)) errors.push('进展日期无效');
  if (!note) errors.push('请填写本次完成了什么');
  if (!nextAction) errors.push('请填写下一步行动');
  if (!nextActionDueAt) errors.push('请填写行动截止日期');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(nextActionDueAt)) errors.push('行动截止日期无效');
  if (goal.goal_type === 'project' && !input.current_milestone?.trim()) errors.push('请填写当前里程碑');
  if (goal.goal_type === 'result' && (typeof input.current_value !== 'number' || !Number.isFinite(input.current_value) || input.current_value < 0)) errors.push('请填写有效的当前值');
  if (goal.goal_type === 'habit' && (!Number.isInteger(input.habit_completed_count) || (input.habit_completed_count ?? -1) < 0)) errors.push('请填写有效的已完成次数');
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: {
    occurred_at: occurredAt!, progress_note: note!, next_action: nextAction!, next_action_due_at: nextActionDueAt!,
    current_state: input.current_state?.trim() ?? '', current_milestone: input.current_milestone?.trim() ?? '',
    current_value: input.current_value ?? null, habit_completed_count: input.habit_completed_count ?? null,
  } };
}
