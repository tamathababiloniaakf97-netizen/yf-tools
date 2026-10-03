import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Goal } from '@/types/life-os';
import GoalCard from './GoalCard';

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'g1', user_id: 'u1', title: '年度目标', year: 2026, description: '',
    goal_type: 'direction', completion_criteria: '形成稳定方法', current_state: '正在探索',
    current_milestone: '', next_action: '完成下一步', next_action_due_at: '2026-10-10', target_value: null, current_value: null,
    value_unit: '', habit_target_count: null, habit_completed_count: null, habit_period: null,
    last_progress_at: '2026-09-01T00:00:00+08:00', status: 'active',
    source_type: 'manual', source_ref: null, review_status: 'approved',
    created_at: '2026-09-01T00:00:00+08:00', updated_at: '2026-09-01T00:00:00+08:00',
    ...overrides,
  };
}

describe('GoalCard', () => {
  it('shows measurable result progress and common action fields', () => {
    render(<GoalCard goal={goal({ goal_type: 'result', current_value: 1, target_value: 2, value_unit: '人' })} now={new Date('2026-09-10T00:00:00+08:00')} onEdit={vi.fn()} />);
    expect(screen.getByText('1 / 2 人')).toBeInTheDocument();
    expect(screen.getByText('完成标准：形成稳定方法')).toBeInTheDocument();
    expect(screen.getByText('下一步：完成下一步')).toBeInTheDocument();
    expect(screen.getByText('截止：2026-10-10')).toBeInTheDocument();
  });

  it('shows project milestones and no invented percentage', () => {
    render(<GoalCard goal={goal({ goal_type: 'project', current_milestone: '完成内测' })} now={new Date('2026-09-10T00:00:00+08:00')} onEdit={vi.fn()} />);
    expect(screen.getByText('当前里程碑：完成内测')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('shows habit counts and direction state', () => {
    const { rerender } = render(<GoalCard goal={goal({ goal_type: 'habit', habit_completed_count: 2, habit_target_count: 3, habit_period: 'weekly' })} now={new Date('2026-09-10T00:00:00+08:00')} onEdit={vi.fn()} />);
    expect(screen.getByText('本周：2 / 3 次')).toBeInTheDocument();
    rerender(<GoalCard goal={goal()} now={new Date('2026-09-10T00:00:00+08:00')} onEdit={vi.fn()} />);
    expect(screen.getByText('当前状态：正在探索')).toBeInTheDocument();
  });

  it('marks a 30-day active goal as stalled', () => {
    render(<GoalCard goal={goal()} now={new Date('2026-10-01T00:00:00+08:00')} onEdit={vi.fn()} />);
    expect(screen.getByText('已停滞')).toBeInTheDocument();
  });

  it('offers a separate progress action instead of forcing progress through edit', () => {
    const onProgress = vi.fn();
    render(<GoalCard goal={goal()} onEdit={vi.fn()} onProgress={onProgress} />);
    fireEvent.click(screen.getByRole('button', { name: '更新进展' }));
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1' }));
  });
});
