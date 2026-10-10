import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReminderCenter from './ReminderCenter';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

describe('ReminderCenter', () => {
  it('labels the bell popover as reminders because priced items are not necessarily due', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    render(<App><ReminderCenter enabled /></App>);
    fireEvent.click(screen.getByRole('button', { name: '提醒' }));
    expect(await screen.findByText('提醒 · 0')).toBeInTheDocument();
    expect(screen.queryByText(/到期提醒/)).not.toBeInTheDocument();
    expect(screen.queryByText(/需要处理/)).not.toBeInTheDocument();
  });

  it('fetches and displays the previous close for a price reminder', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'price-1', subject_type: 'investment_task', subject_id: 'task-1', title: '腾讯：观察买入价', kind: 'investment_task_price', due_date: null, href: '/investment/tasks?task=task-1', ticker_id: 'ticker-1', reference_price: 420, currency: 'HKD' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ price: 428.6, currency: 'HKD', source: '腾讯行情' }) });
    vi.stubGlobal('fetch', fetcher);
    render(<App><ReminderCenter enabled /></App>);
    fireEvent.click(screen.getByRole('button', { name: '提醒' }));
    expect(await screen.findByText(/参考价.*420/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '获取前一日收盘价' }));
    expect(await screen.findByText(/前一日收盘.*428.6/)).toBeInTheDocument();
    expect(fetcher).toHaveBeenLastCalledWith('/api/prices/previous-close?ticker_id=ticker-1');
  });
});
