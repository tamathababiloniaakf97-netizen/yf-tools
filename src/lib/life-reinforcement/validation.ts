import type { LifeReinforcementProjectInput, LifeTrainingRecordInput } from '@/types/life-os';

type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateLifeProjectInput(input: LifeReinforcementProjectInput): ValidationResult<Required<LifeReinforcementProjectInput>> {
  const value = {
    name: text(input.name),
    long_term_goal: text(input.long_term_goal),
    practical_method: text(input.practical_method),
    stages: Array.isArray(input.stages) ? input.stages.map(text).filter(Boolean).slice(0, 20) : [],
    is_active: input.is_active ?? true,
  };
  const errors: string[] = [];
  if (!value.name) errors.push('请填写项目名称');
  if (value.name.length > 100) errors.push('项目名称不能超过 100 个字');
  if (value.long_term_goal.length > 1000) errors.push('长期目标不能超过 1000 个字');
  if (value.practical_method.length > 2000) errors.push('实用方法不能超过 2000 个字');
  if (value.stages.some((stage) => stage.length > 100)) errors.push('阶段名称不能超过 100 个字');
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

export function validateLifeRecordInput(input: LifeTrainingRecordInput): ValidationResult<Required<LifeTrainingRecordInput>> {
  const value = {
    trained_on: text(input.trained_on),
    stage_name: text(input.stage_name),
    session_goal: text(input.session_goal),
    activity: text(input.activity),
    result_notes: text(input.result_notes),
  };
  const errors: string[] = [];
  if (!isIsoDate(value.trained_on)) errors.push('训练日期无效');
  if (!value.activity) errors.push('请填写做了什么');
  if (value.stage_name.length > 100) errors.push('阶段名称不能超过 100 个字');
  if (value.session_goal.length > 1000) errors.push('本次目标不能超过 1000 个字');
  if (value.activity.length > 3000) errors.push('训练内容不能超过 3000 个字');
  if (value.result_notes.length > 3000) errors.push('结果或感受不能超过 3000 个字');
  return errors.length ? { ok: false, errors } : { ok: true, value };
}
