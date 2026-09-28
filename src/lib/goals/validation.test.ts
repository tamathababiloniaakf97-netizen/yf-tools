import { describe, expect, it } from 'vitest';
import { validateGoalInput } from './validation';

describe('validateGoalInput', () => {
  it('accepts a concrete direction goal', () => {
    expect(validateGoalInput({
      title: '建立稳定投资研究体系', year: 2026, goal_type: 'direction',
      completion_criteria: '形成并持续使用方法论', next_action: '整理现有原则',
      current_state: '已有零散记录',
    }).ok).toBe(true);
  });

  it('requires common actionable fields', () => {
    expect(validateGoalInput({ title: ' ', year: 2026 })).toEqual({
      ok: false,
      errors: ['目标不能为空', '目标类型无效', '请填写完成标准', '请填写下一步行动'],
    });
  });

  it('requires type-specific progress fields', () => {
    expect(validateGoalInput({ title: '结果', year: 2026, goal_type: 'result', completion_criteria: '完成', next_action: '行动' }).ok).toBe(false);
    expect(validateGoalInput({ title: '项目', year: 2026, goal_type: 'project', completion_criteria: '上线', next_action: '开发' }).ok).toBe(false);
    expect(validateGoalInput({ title: '习惯', year: 2026, goal_type: 'habit', completion_criteria: '每周完成', next_action: '训练' }).ok).toBe(false);
  });

  it('defaults automation to pending and requires its source reference', () => {
    const missing = validateGoalInput({
      title: '自动目标', year: 2026, goal_type: 'direction', completion_criteria: '确认方向',
      next_action: '审核', source_type: 'automation',
    });
    expect(missing.ok).toBe(false);

    const valid = validateGoalInput({
      title: '自动目标', year: 2026, goal_type: 'direction', completion_criteria: '确认方向',
      next_action: '审核', source_type: 'automation', source_ref: 'job:123',
    });
    expect(valid).toMatchObject({ ok: true, value: { review_status: 'pending' } });
  });
});
