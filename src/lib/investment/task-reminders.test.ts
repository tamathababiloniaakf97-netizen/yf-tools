import { describe, expect, it } from 'vitest';
import type { InvestmentTask } from '@/types/life-os';
import { buildInvestmentTaskReminders } from './task-reminders';

function task(overrides: Partial<InvestmentTask>): InvestmentTask {
  return { id: 't1', user_id: 'u1', asset_name: '腾讯', task_type: 'price', title: '320元附近重新评估', condition_note: '', reminder_date: null, status: 'pending', notes: '', completed_at: null, source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z', ...overrides };
}

describe('investment task reminders', () => {
  const now = new Date('2026-09-29T01:00:00Z');
  it('returns approved active tasks due today and overdue', () => {
    const result = buildInvestmentTaskReminders([
      task({ id: 'late', reminder_date: '2026-09-28' }),
      task({ id: 'today', status: 'waiting', reminder_date: '2026-09-29' }),
      task({ id: 'future', reminder_date: '2026-09-30' }),
    ], now);
    expect(result.map((item) => [item.subject_id, item.kind, item.href])).toEqual([
      ['late', 'investment_task_overdue', '/investment/tasks?task=late'],
      ['today', 'investment_task_today', '/investment/tasks?task=today'],
    ]);
  });
  it('omits completed, cancelled, and unapproved tasks', () => {
    expect(buildInvestmentTaskReminders([
      task({ status: 'completed', reminder_date: '2026-09-29', completed_at: '2026-09-29T00:00:00Z' }),
      task({ status: 'cancelled', reminder_date: '2026-09-29' }),
      task({ review_status: 'pending', reminder_date: '2026-09-29' }),
    ], now)).toEqual([]);
  });
});
