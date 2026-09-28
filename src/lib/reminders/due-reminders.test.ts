import { describe, expect, it } from 'vitest';
import { buildDueReminders } from './due-reminders';
import type { Plan } from '@/types/life-os';

function plan(overrides: Partial<Plan>): Plan {
  return {
    id: 'p1', user_id: 'u1', title: '验证财报', description: '', plan_type: 'validation',
    domain: 'investment', project_id: null, start_date: null, due_date: null,
    reminder_at: null, recurrence_rule: null, status: 'not_started', is_weekly_focus: false,
    notes: '', source_type: 'manual', source_ref: null, review_status: 'approved',
    completed_at: null, created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('due reminders', () => {
  const now = new Date('2026-09-28T01:00:00Z'); // 上海 09:00

  it('shows due-today and overdue plans once', () => {
    const result = buildDueReminders([
      plan({ id: 'today', due_date: '2026-09-28' }),
      plan({ id: 'late', due_date: '2026-09-27' }),
    ], now);
    expect(result.map((item) => [item.subject_id, item.kind])).toEqual([
      ['late', 'overdue'], ['today', 'due_today'],
    ]);
  });

  it('excludes paused, completed and cancelled plans', () => {
    const result = buildDueReminders([
      plan({ id: 'paused', due_date: '2026-09-28', status: 'paused' }),
      plan({ id: 'done', due_date: '2026-09-28', status: 'completed' }),
      plan({ id: 'cancelled', due_date: '2026-09-28', status: 'cancelled' }),
    ], now);
    expect(result).toEqual([]);
  });

  it('uses Asia/Shanghai for weekly recurrence boundaries', () => {
    const result = buildDueReminders([
      plan({ id: 'weekly', start_date: '2026-09-21', recurrence_rule: 'weekly' }),
    ], now);
    expect(result[0]).toMatchObject({ subject_id: 'weekly', kind: 'recurring', href: '/investment/tasks' });
  });
});
