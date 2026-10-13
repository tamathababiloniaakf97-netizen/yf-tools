import { describe, expect, it } from 'vitest';
import type { Goal } from '@/types/life-os';
import { buildGoalProgress, getStagnation } from './progress';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1', user_id: 'u1', title: '目标', year: 2026, description: '',
    goal_type: 'direction', completion_criteria: '形成清晰判断', current_state: '探索中',
    current_milestone: '', next_action: '完成下一步', target_value: null,
    next_action_due_at: null,
    current_value: null, value_unit: '', habit_target_count: null,
    habit_completed_count: null, habit_period: null,
    last_progress_at: '2026-10-01T00:00:00+08:00', status: 'active',
    source_type: 'manual', source_ref: null, review_status: 'approved',
    created_at: '2026-09-28T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

describe('goal progress', () => {
  it('shows a clamped percentage only for measurable result goals', () => {
    expect(buildGoalProgress(goal({ goal_type: 'result', target_value: 5, current_value: 2, value_unit: '人' })))
      .toEqual({ kind: 'value', current: 2, target: 5, unit: '人', percent: 40 });
    expect(buildGoalProgress(goal({ goal_type: 'result', target_value: 2, current_value: 3 }))).toMatchObject({ percent: 100 });
  });

  it('does not invent percentages for project or direction goals', () => {
    expect(buildGoalProgress(goal({ goal_type: 'project', current_milestone: '完成内测' })))
      .toEqual({ kind: 'milestone', milestone: '完成内测', percent: null });
    expect(buildGoalProgress(goal({ goal_type: 'direction', current_state: '持续探索' })))
      .toEqual({ kind: 'direction', currentState: '持续探索', percent: null });
  });

  it('shows habit counts and period without a percentage bar', () => {
    expect(buildGoalProgress(goal({ goal_type: 'habit', habit_completed_count: 2, habit_target_count: 3, habit_period: 'weekly' })))
      .toEqual({ kind: 'habit', completed: 2, target: 3, period: 'weekly', percent: null });
  });
});

describe('goal stagnation', () => {
  it('uses 14 and 30 full-day boundaries', () => {
    const value = goal();
    expect(getStagnation(value, new Date('2026-10-14T23:59:59+08:00'))).toBe(null);
    expect(getStagnation(value, new Date('2026-10-15T00:00:00+08:00'))).toBe('check');
    expect(getStagnation(value, new Date('2026-10-31T00:00:00+08:00'))).toBe('stalled');
  });

  it('does not flag inactive goals', () => {
    expect(getStagnation(goal({ status: 'paused' }), new Date('2026-12-01T00:00:00+08:00'))).toBe(null);
  });
});
