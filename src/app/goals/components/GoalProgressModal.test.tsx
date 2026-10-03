import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GoalProgressModal from './GoalProgressModal';
import type { Goal } from '@/types/life-os';

const goal = { id: 'g1', title: '英语', goal_type: 'project', current_milestone: 'MVP', next_action: '上传资料', next_action_due_at: '2026-10-10' } as Goal;
afterEach(() => vi.unstubAllGlobals());

describe('GoalProgressModal', () => {
  it('shows prior updates and saves a new project update', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'p1', occurred_at: '2026-09-01', progress_note: '完成 MVP', current_milestone: 'MVP', next_action: '整理资料' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'p2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    const onSaved = vi.fn();
    render(<App><GoalProgressModal open goal={goal} onClose={vi.fn()} onSaved={onSaved} /></App>);
    expect(await screen.findByText('完成 MVP')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('本次完成了什么'), { target: { value: '完成资料整理' } });
    fireEvent.change(screen.getByLabelText('当前里程碑'), { target: { value: '资料完善' } });
    fireEvent.change(screen.getByLabelText('下一步行动'), { target: { value: '上传英语资料' } });
    expect(screen.getByLabelText('行动截止日期')).toHaveValue('2026-10-10');
    fireEvent.click(screen.getByRole('button', { name: '保存进展' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith('/api/goals/g1/progress', expect.objectContaining({ method: 'POST' }));
  });
});
