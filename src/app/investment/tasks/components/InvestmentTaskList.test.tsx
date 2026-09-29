import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { InvestmentTask } from '@/types/life-os';
import InvestmentTaskList from './InvestmentTaskList';

function task(overrides: Partial<InvestmentTask> = {}): InvestmentTask {
  return { id: 't1', user_id: 'u1', asset_name: '腾讯', task_type: 'price', title: '320元附近重新评估', condition_note: '检查估值', reminder_date: '2026-10-10', status: 'pending', notes: '', completed_at: null, source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '2026-09-29T00:00:00Z', updated_at: '2026-09-29T00:00:00Z', ...overrides };
}

describe('InvestmentTaskList', () => {
  it('shows investment-specific content even without an asset', () => {
    render(<InvestmentTaskList tasks={[task(), task({ id: 't2', asset_name: '', task_type: 'research', title: '研究机器人行业' })]} loading={false} onEdit={vi.fn()} onComplete={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('价格计划')).toBeInTheDocument();
    expect(screen.getByText('研究任务')).toBeInTheDocument();
    expect(screen.getByText('腾讯')).toBeInTheDocument();
    expect(screen.getByText('研究机器人行业')).toBeInTheDocument();
  });
  it('exposes edit, complete, cancel, and delete actions', () => {
    const onEdit = vi.fn(); const onComplete = vi.fn(); const onCancel = vi.fn(); const onDelete = vi.fn();
    render(<InvestmentTaskList tasks={[task()]} loading={false} onEdit={onEdit} onComplete={onComplete} onCancel={onCancel} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /编\s*辑/ }));
    fireEvent.click(screen.getByRole('button', { name: /完\s*成/ }));
    fireEvent.click(screen.getByRole('button', { name: /取\s*消/ }));
    fireEvent.click(screen.getByRole('button', { name: /删\s*除/ }));
    expect(onEdit).toHaveBeenCalled(); expect(onComplete).toHaveBeenCalled(); expect(onCancel).toHaveBeenCalled(); expect(onDelete).toHaveBeenCalled();
  });
});
