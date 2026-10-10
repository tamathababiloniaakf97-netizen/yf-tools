import { describe, expect, it } from 'vitest';
import type { InvestmentTask, WatchlistItem } from '@/types/life-os';
import { buildInvestmentAttentionItems } from './attention';

function task(overrides: Partial<InvestmentTask> = {}): InvestmentTask {
  return {
    id: 'task-1', user_id: 'user-1', asset_name: '', task_type: 'research',
    title: '研究机器人行业', condition_note: '', reminder_date: null,
    status: 'pending', notes: '', completed_at: null, source_type: 'manual',
    source_ref: null, review_status: 'approved', created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z', ...overrides,
  };
}

function watch(overrides: Partial<WatchlistItem> = {}): WatchlistItem {
  return {
    id: 'watch-1', user_id: 'user-1', ticker_id: null, asset_name: '腾讯游戏收入增速',
    reason: '', entry_condition: '', status: 'watching', next_check_at: null,
    notes: '', source_type: 'manual', source_ref: null, review_status: 'approved',
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildInvestmentAttentionItems', () => {
  const now = new Date('2026-10-01T04:00:00Z');

  it('puts overdue and due dated records before neglected undated records', () => {
    const result = buildInvestmentAttentionItems({
      tasks: [
        task({ id: 'task-stale', updated_at: '2026-09-23T03:59:59Z' }),
        task({ id: 'task-due', reminder_date: '2026-10-01' }),
      ],
      watchItems: [
        watch({ id: 'watch-late', next_check_at: '2026-09-30' }),
        watch({ id: 'watch-stale', updated_at: '2026-09-16T03:59:59Z' }),
      ],
      now,
    });

    expect(result.map((item) => [item.id, item.reason])).toEqual([
      ['watch:watch-late', '已逾期'],
      ['task:task-due', '今天提醒'],
      ['task:task-stale', '7天未推进'],
      ['watch:watch-stale', '14天未复核'],
    ]);
  });

  it('does not resurface recent, completed, cancelled, paused, or unapproved records', () => {
    const result = buildInvestmentAttentionItems({
      tasks: [
        task({ id: 'recent-task', updated_at: '2026-09-30T00:00:00Z' }),
        task({ id: 'done', status: 'completed', completed_at: '2026-09-30T00:00:00Z', reminder_date: '2026-09-30' }),
        task({ id: 'cancelled', status: 'cancelled', reminder_date: '2026-09-30' }),
        task({ id: 'pending-review', review_status: 'pending', reminder_date: '2026-09-30' }),
      ],
      watchItems: [
        watch({ id: 'recent-watch', updated_at: '2026-09-30T00:00:00Z' }),
        watch({ id: 'paused', status: 'paused', updated_at: '2026-09-01T00:00:00Z' }),
        watch({ id: 'pending-review-watch', review_status: 'pending', next_check_at: '2026-09-30' }),
      ],
      now,
    });

    expect(result).toEqual([]);
  });

  it('puts active priced tasks first regardless of reminder date', () => {
    const result = buildInvestmentAttentionItems({
      tasks: [
        task({ id: 'priced', title: '400买入', ticker_id: 'ticker-1', price: 400, reminder_date: '2026-12-01', updated_at: '2026-10-01T00:00:00Z' }),
        task({ id: 'due', reminder_date: '2026-10-01' }),
        task({ id: 'cancelled-price', ticker_id: 'ticker-1', price: 390, status: 'cancelled' }),
      ],
      watchItems: [], now,
    });
    expect(result.map((item) => [item.sourceId, item.reason, item.task?.price])).toEqual([
      ['priced', '价格关注', 400],
      ['due', '今天提醒', undefined],
    ]);
  });

  it('keeps an explicitly dated paused watch item visible and supports a display limit', () => {
    const result = buildInvestmentAttentionItems({
      tasks: [task({ id: 'task-late', reminder_date: '2026-09-28' })],
      watchItems: [watch({ id: 'paused-due', status: 'paused', next_check_at: '2026-10-01' })],
      now,
      limit: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('task:task-late');
  });
});
