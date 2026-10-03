import { render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomePage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const task = { id: 'task-1', asset_name: '腾讯', title: '更新腾讯估值', task_type: 'research', reminder_date: '2099-10-01', status: 'pending', review_status: 'approved' };
const goal = { id: 'goal-1', title: '产品升级', next_action: '确定下一轮范围', status: 'active', review_status: 'approved' };
const contact = { id: 'contact-1', name: '王律师', next_action: '确认合同修订意见', next_contact_at: '2099-10-02', review_status: 'approved' };

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function stubSources(overrides: Partial<Record<string, { ok: boolean; data: unknown }>> = {}) {
  const responses = {
    '/api/investment/tasks': { ok: true, data: [task] },
    '/api/goals': { ok: true, data: [goal] },
    '/api/relationships': { ok: true, data: [contact] },
    '/api/household-finance/entry-reviews': { ok: true, data: { enabled: false, startedMonth: null, reviews: [] } },
    ...overrides,
  };
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const response = responses[String(input) as keyof typeof responses];
    if (!response) throw new Error(`Unexpected request: ${String(input)}`);
    return { ok: response.ok, json: async () => response.data } as Response;
  }));
}

describe('HomePage actions', () => {
  it('shows Shanghai year and month progress with the daily thought', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-02T08:00:00+08:00'));
    stubSources();
    render(<App><HomePage /></App>);

    expect(await screen.findByRole('heading', { name: '行动工作台' })).toBeInTheDocument();
    expect(await screen.findByText('2026年10月2日')).toBeInTheDocument();
    expect(screen.getByText('星期五')).toBeInTheDocument();
    expect(screen.getByText('距离年末还有 90 天')).toBeInTheDocument();
    expect(screen.getByText('本月剩余 29 天')).toBeInTheDocument();
    expect(screen.getByText('每日一念')).toBeInTheDocument();
    expect(screen.getByText('理性决策')).toBeInTheDocument();
    expect(screen.getByText('今日自问')).toBeInTheDocument();
  });

  it('shows domain-owned actions as links back to their source', async () => {
    stubSources();
    render(<App><HomePage /></App>);

    expect(await screen.findByText('更新腾讯估值')).toBeInTheDocument();
    expect(screen.getByText('确定下一轮范围')).toBeInTheDocument();
    expect(screen.getByText('确认合同修订意见')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `去处理 更新腾讯估值` })).toHaveAttribute('href', '/investment/tasks?task=task-1');
  });

  it('shows the month-end finance check as a link to the selected entry month', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-25T08:00:00+08:00'));
    stubSources({
      '/api/household-finance/entry-reviews': {
        ok: true,
        data: { enabled: true, startedMonth: '2026-10-01', reviews: [] },
      },
    });
    render(<App><HomePage /></App>);

    expect(await screen.findByText('检查并补齐 10 月财务录入')).toBeInTheDocument();
    expect(screen.getByText('家庭财务')).toBeInTheDocument();
    expect(screen.getByText('月底预检查')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去处理 检查并补齐 10 月财务录入' }))
      .toHaveAttribute('href', '/finance?tab=entry&period=2026-10');
  });

  it('keeps successful actions when one source fails', async () => {
    stubSources({ '/api/goals': { ok: false, data: { error: '目标加载失败' } } });
    render(<App><HomePage /></App>);

    expect(await screen.findByText('更新腾讯估值')).toBeInTheDocument();
    expect(screen.getByText('目标加载失败')).toBeInTheDocument();
    expect(screen.queryByText('确定下一轮范围')).not.toBeInTheDocument();
  });

  it('shows a neutral empty state without a create action', async () => {
    stubSources({
      '/api/investment/tasks': { ok: true, data: [] },
      '/api/goals': { ok: true, data: [] },
      '/api/relationships': { ok: true, data: [] },
    });
    render(<App><HomePage /></App>);

    await waitFor(() => expect(screen.getByText('暂无待推进行动')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /新建|管理/ })).not.toBeInTheDocument();
  });
});
