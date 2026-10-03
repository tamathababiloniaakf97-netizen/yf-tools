import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { InvestmentAttentionItem } from '@/lib/investment/attention';
import InvestmentAttentionCard from './InvestmentAttentionCard';

const items: InvestmentAttentionItem[] = [
  {
    id: 'watch:w1', source: 'watch', sourceId: 'w1', title: '腾讯游戏收入增速',
    detail: '关注新品表现', reason: '14天未复核', date: null,
    href: '/investment/watchlist',
    watchItem: { id: 'w1', user_id: 'u1', ticker_id: null, asset_name: '腾讯游戏收入增速', reason: '关注新品表现', entry_condition: '', status: 'watching', next_check_at: null, notes: '', source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '', updated_at: '' },
  },
  {
    id: 'task:t1', source: 'task', sourceId: 't1', title: '更新腾讯估值',
    detail: '腾讯', reason: '已逾期', date: '2026-09-30', href: '/investment/tasks?task=t1',
    task: { id: 't1', user_id: 'u1', asset_name: '腾讯', task_type: 'research', title: '更新腾讯估值', condition_note: '', reminder_date: '2026-09-30', status: 'pending', notes: '', completed_at: null, source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '', updated_at: '' },
  },
];

describe('InvestmentAttentionCard', () => {
  it('shows why records resurfaced and exposes concise handling actions', () => {
    const onReview = vi.fn();
    const onSnooze = vi.fn();
    const onComplete = vi.fn();
    render(<InvestmentAttentionCard items={items} loading={false} onReview={onReview} onSnooze={onSnooze} onComplete={onComplete} />);

    expect(screen.getByText('今日需要关注')).toBeInTheDocument();
    expect(screen.getByText('14天未复核')).toBeInTheDocument();
    expect(screen.getByText('已逾期')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '已复核' }));
    fireEvent.click(screen.getAllByRole('button', { name: '7天后提醒' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    expect(onReview).toHaveBeenCalledWith(items[0]);
    expect(onSnooze).toHaveBeenCalledWith(items[0]);
    expect(onComplete).toHaveBeenCalledWith(items[1]);
    expect(screen.getByRole('link', { name: '转为待办' })).toHaveAttribute('href', expect.stringContaining('/investment/tasks?new=1'));
  });
});
