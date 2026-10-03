import { describe, expect, it } from 'vitest';
import type { Contact, Goal, InvestmentTask } from '@/types/life-os';
import { buildDashboardActions } from './build-dashboard';

function task(overrides: Partial<InvestmentTask> = {}): InvestmentTask {
  return { id: 'task-1', user_id: 'u1', asset_name: '腾讯', task_type: 'research', title: '更新腾讯估值', condition_note: '', reminder_date: '2026-10-01', status: 'pending', notes: '', completed_at: null, source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '', updated_at: '', ...overrides };
}

function goal(overrides: Partial<Goal> = {}): Goal {
  return { id: 'goal-1', user_id: 'u1', title: '完成产品升级', year: 2026, description: '', goal_type: 'project', completion_criteria: '', current_state: '', current_milestone: '', next_action: '确定下一轮范围', next_action_due_at: '2026-10-03', target_value: null, current_value: null, value_unit: '', habit_target_count: null, habit_completed_count: null, habit_period: null, last_progress_at: null, status: 'active', source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '', updated_at: '', ...overrides };
}

function contact(overrides: Partial<Contact> = {}): Contact {
  return { id: 'contact-1', user_id: 'u1', name: '王律师', relationship_type: 'professional', role: '', met_context: '', family_context: '', work_context: '', important_notes: '', birthday_calendar: null, birthday_year: null, birthday_month: null, birthday_day: null, birthday_is_leap_month: false, birthday_reminder_enabled: true, holiday_contact_reminder_enabled: false, last_contact_at: null, next_contact_at: '2026-10-02', next_action: '确认合同修订意见', notes: '', source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '', updated_at: '', ...overrides };
}

describe('buildDashboardActions', () => {
  const now = new Date('2026-10-01T09:00:00+08:00');

  it('normalizes and orders actions from the three owning domains', () => {
    const actions = buildDashboardActions({ tasks: [task({ reminder_date: '2026-09-30' })], goals: [goal()], contacts: [contact()] }, now);
    expect(actions.map((item) => item.source)).toEqual(['investment', 'relationship', 'goal']);
    expect(actions[0]).toMatchObject({ id: 'investment:task-1', title: '更新腾讯估值', context: '腾讯', urgency: 'overdue', href: '/investment/tasks?task=task-1' });
    expect(actions[1]).toMatchObject({ href: '/relationships', urgency: 'upcoming' });
    expect(actions[2]).toMatchObject({ href: '/goals', dueDate: '2026-10-03', urgency: 'upcoming' });
  });

  it('excludes inactive, unapproved, and blank actions', () => {
    const actions = buildDashboardActions({ tasks: [task({ status: 'completed' }), task({ id: 'pending-review', review_status: 'pending' })], goals: [goal({ status: 'paused' }), goal({ id: 'blank-goal', next_action: '  ' })], contacts: [contact({ review_status: 'pending' }), contact({ id: 'blank-contact', next_action: '' })] }, now);
    expect(actions).toEqual([]);
  });

  it('sorts overdue, today, future, and undated actions deterministically', () => {
    const actions = buildDashboardActions({ tasks: [task({ id: 'future', reminder_date: '2026-10-03' }), task({ id: 'today', reminder_date: '2026-10-01' }), task({ id: 'late', reminder_date: '2026-09-29' }), task({ id: 'undated', reminder_date: null })], goals: [], contacts: [] }, now);
    expect(actions.map((item) => item.id)).toEqual(['investment:late', 'investment:today', 'investment:future', 'investment:undated']);
  });

  it('adds a finance entry-review action that links to its owning month', () => {
    const actions = buildDashboardActions({
      tasks: [], goals: [], contacts: [],
      financeReminder: { periodKey: '2026-09', periodMonth: '2026-09-01', month: 9, dueDate: '2026-10-07', overdue: false, statusLabel: '上月补录', completedCount:5, totalCount:8, missingLabels:['还款记录','负债余额','月度结账'] },
    }, now);

    expect(actions).toEqual([expect.objectContaining({
      id: 'finance-entry-review:2026-09',
      source: 'finance',
      title: '检查并补齐 9 月财务录入',
      href: '/finance?tab=entry&period=2026-09',
      urgency: 'upcoming',
      statusLabel: '上月补录',
      context: '已完成 5/8；未完成：还款记录、负债余额、月度结账',
    })]);
  });
});
