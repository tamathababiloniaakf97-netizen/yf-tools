import { beforeEach, describe, expect, it, vi } from 'vitest';

const from = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) }, from }),
}));
vi.mock('@/lib/relationships/reminders', () => ({ buildAllRelationshipReminders: () => [{ id: 'contact-reminder' }] }));
vi.mock('@/lib/investment/task-reminders', () => ({ buildInvestmentTaskReminders: () => [{ id: 'task-reminder' }] }));
vi.mock('@/lib/goals/reminders', () => ({ buildGoalReminders: () => [{ id: 'goal-reminder' }] }));
vi.mock('@/lib/household-finance/entry-review-reminder', () => ({ buildEntryReviewReminder: () => ({ periodKey: '2026-09', month: 9, dueDate: '2026-09-30', overdue: true, completedCount:3, totalCount:8, missingLabels:['还款记录'] }) }));

import { GET } from './route';

describe('GET /api/reminders/due', () => {
  beforeEach(() => {
    from.mockReset();
    from.mockImplementation((table: string) => ({ select: () => ({ eq: () => table === 'household_finance_settings'
      ? { maybeSingle: async () => ({ data: { entry_review_started_month: '2026-09-01' }, error: null }) }
      : table === 'household_entry_reviews'
        ? Promise.resolve({ data: [], error: null })
        : table === 'household_period_closures'
          ? {eq:()=>Promise.resolve({data:[],error:null})}
        : { eq: () => table === 'goals'
          ? { eq: () => Promise.resolve({ data: [{ id: 'g1' }], error: null }) }
          : Promise.resolve({ data: table === 'contacts' ? [{ id: 'c1' }] : [{ id: 't1' }], error: null }) },
    }) }));
  });

  it('combines relationship, investment, goal, and finance due reminders', async () => {
    const response = await GET();
    expect(from.mock.calls.map(([table]) => table)).toEqual(['contacts', 'investment_tasks', 'goals', 'household_finance_settings', 'household_entry_reviews','household_period_closures']);
    expect(await response.json()).toEqual([
      { id: 'contact-reminder' },
      { id: 'task-reminder' },
      { id: 'goal-reminder' },
      expect.objectContaining({ id: 'finance-entry-review:2026-09', kind: 'finance_entry_review', href: '/finance?tab=entry&period=2026-09' }),
    ]);
  });
});
