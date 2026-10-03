import { describe, expect, it } from 'vitest';
import type { Goal } from '@/types/life-os';
import { buildGoalReminders } from './reminders';

const goal = (overrides: Partial<Goal> = {}) => ({
  id: 'g1', title: '英语', next_action: '复习单词', next_action_due_at: '2026-10-02',
  status: 'active', review_status: 'approved', ...overrides,
}) as Goal;

describe('buildGoalReminders', () => {
  it('includes today and overdue actions but excludes future and undated actions', () => {
    const result = buildGoalReminders([
      goal({ id: 'late', next_action_due_at: '2026-10-01' }),
      goal({ id: 'today' }),
      goal({ id: 'future', next_action_due_at: '2026-10-03' }),
      goal({ id: 'undated', next_action_due_at: null }),
    ], new Date('2026-10-02T09:00:00+08:00'));

    expect(result.map(item => [item.subject_id, item.kind])).toEqual([
      ['late', 'goal_action_overdue'], ['today', 'goal_action_today'],
    ]);
  });
});
