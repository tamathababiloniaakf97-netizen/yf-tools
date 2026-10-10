import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InvestmentAttentionItem } from '@/lib/investment/attention';
import InvestmentAttentionCard, { formatPlannedPriceGap } from './InvestmentAttentionCard';

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
  afterEach(() => vi.unstubAllGlobals());
  it('formats the planned buy price distance from the previous close', () => {
    expect(formatPlannedPriceGap(400, 411.4)).toBe('-2.77%');
    expect(formatPlannedPriceGap(420, 400)).toBe('+5.00%');
    expect(formatPlannedPriceGap(400, 0)).toBeNull();
    expect(formatPlannedPriceGap(null, 411.4)).toBeNull();
  });

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

  it('shows a priced task and fetches its previous close in place', async () => {
    const priceItem: InvestmentAttentionItem = {
      id: 'task:price', source: 'task', sourceId: 'price', title: '400买入', detail: '腾讯', reason: '价格关注', date: null, href: '/investment/tasks?task=price',
      task: { id: 'price', user_id: 'u1', asset_name: '腾讯', task_type: 'price', title: '400买入', condition_note: '', ticker_id: 'ticker-1', price: 400, reminder_date: null, status: 'pending', notes: '', completed_at: null, source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '', updated_at: '' },
    };
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ price: 428.6, currency: 'HKD', source: '腾讯行情' }) })));
    render(<InvestmentAttentionCard items={[priceItem]} loading={false} onReview={vi.fn()} onSnooze={vi.fn()} onComplete={vi.fn()} />);
    const priceLine = screen.getByTestId('price-attention-line');
    expect(priceLine).toHaveTextContent('400买入');
    expect(priceLine).toHaveTextContent('腾讯');
    expect(screen.getByText('计划买入价：400')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '7天后提醒' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '获取前一日收盘价' }));
    expect(await screen.findByText(/前一日收盘：428.6 HKD/)).toBeInTheDocument();
    expect(priceLine).toHaveTextContent('前一日收盘：428.6 HKD');
    expect(priceLine).toHaveTextContent('计划价距前收：-6.67%');
  });
});
