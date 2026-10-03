import { describe, expect, it } from 'vitest';
import { validateGoalProgressInput } from './progress-update';
import type { Goal } from '@/types/life-os';

const goal = { goal_type: 'project' } as Goal;

describe('validateGoalProgressInput', () => {
  it('accepts a dated project update with a new milestone and next action', () => {
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: 'MVP 已经完成', current_milestone: '资料完善', next_action: '上传英语资料', next_action_due_at: '2026-10-10' }, goal)).toEqual({
      ok: true,
      value: { occurred_at: '2026-10-02', progress_note: 'MVP 已经完成', current_state: '', current_milestone: '资料完善', next_action: '上传英语资料', next_action_due_at: '2026-10-10', current_value: null, habit_completed_count: null },
    });
  });

  it('requires a valid deadline for the next action', () => {
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: '完成一阶段', current_milestone: '资料完善', next_action: '继续' }, goal)).toMatchObject({ ok: false, errors: expect.arrayContaining(['请填写行动截止日期']) });
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: '完成一阶段', current_milestone: '资料完善', next_action: '继续', next_action_due_at: '10/10/2026' }, goal)).toMatchObject({ ok: false });
  });

  it('rejects blank history text and missing type-specific progress', () => {
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: ' ', next_action: '继续' }, goal)).toMatchObject({ ok: false });
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: '完成一阶段', next_action: '继续' }, goal)).toMatchObject({ ok: false });
  });

  it('accepts decimal result values and integer habit counts', () => {
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: '完成一半', next_action: '继续', next_action_due_at: '2026-10-10', current_value: 1.5 }, { goal_type: 'result' } as Goal).ok).toBe(true);
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: '本周训练', next_action: '继续', next_action_due_at: '2026-10-10', habit_completed_count: 3 }, { goal_type: 'habit' } as Goal).ok).toBe(true);
    expect(validateGoalProgressInput({ occurred_at: '2026-10-02', progress_note: '本周训练', next_action: '继续', habit_completed_count: 1.2 }, { goal_type: 'habit' } as Goal).ok).toBe(false);
  });
});
