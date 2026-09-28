import { describe, expect, it } from 'vitest';
import type { Contact, Plan } from '@/types/life-os';
import { buildDashboard } from './build-dashboard';

function plan(overrides: Partial<Plan>): Plan {
  return {
    id: '1', user_id: 'u1', title: '计划', description: '', plan_type: 'action',
    domain: 'annual_goal', project_id: null, start_date: null, due_date: null,
    reminder_at: null, recurrence_rule: null, status: 'not_started', is_weekly_focus: false,
    notes: '', source_type: 'manual', source_ref: null, review_status: 'approved',
    completed_at: null, created_at: '2026-09-20T00:00:00Z', updated_at: '2026-09-20T00:00:00Z',
    ...overrides,
  };
}

describe('buildDashboard', () => {
  it('limits weekly focus to three items', () => {
    const result = buildDashboard([1, 2, 3, 4].map((id) => plan({ id: String(id), is_weekly_focus: true })), new Date('2026-09-28T08:00:00+08:00'));
    expect(result.weeklyFocus).toHaveLength(3);
  });

  it('separates overdue attention from work completed this week', () => {
    const result = buildDashboard([
      plan({ id: 'late', due_date: '2026-09-20', status: 'in_progress' }),
      plan({ id: 'done', status: 'completed', completed_at: '2026-09-28T07:00:00+08:00' }),
    ], new Date('2026-09-28T08:00:00+08:00'));
    expect(result.needsAttention.map((item) => item.id)).toEqual(['late']);
    expect(result.completedThisWeek.map((item) => item.id)).toEqual(['done']);
  });

  it('keeps relationship follow-ups separate from plan priorities', () => {
    const contact = { id: 'c1', name: '王律师', next_contact_at: '2026-09-27', review_status: 'approved' } as Contact;
    const result = buildDashboard([], [contact], new Date('2026-09-28T08:00:00+08:00'));
    expect(result.relationshipAttention.map((item) => item.id)).toEqual(['c1']);
    expect(result.weeklyFocus).toEqual([]);
  });
});
