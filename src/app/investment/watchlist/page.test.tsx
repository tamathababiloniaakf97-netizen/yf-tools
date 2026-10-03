import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WatchlistItem } from '@/types/life-os';
import WatchlistPage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));

const item: WatchlistItem = {
  id: 'w1', user_id: 'u1', ticker_id: null, asset_name: '美国十年期国债利率',
  reason: '影响成长股估值', entry_condition: '', status: 'watching', next_check_at: null,
  notes: '', source_type: 'manual', source_ref: null, review_status: 'approved',
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('WatchlistPage', () => {
  it('uses low-friction attention wording and exposes follow-up actions', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [item] } as Response)));
    render(<App><WatchlistPage /></App>);

    expect(await screen.findByText('美国十年期国债利率')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '已复核' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7天后提醒' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '转为待办' })).toHaveAttribute('href', expect.stringContaining('/investment/tasks?new=1'));

    fireEvent.click(screen.getByRole('button', { name: /添加关注事项/ }));
    expect(screen.getByLabelText('关注事项')).toBeRequired();
    expect(screen.getByLabelText('为什么关注（可选）')).not.toBeRequired();
    expect(screen.getByLabelText('等待什么条件（可选）')).not.toBeRequired();
  });
});
