import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import GoalEditor from './GoalEditor';

describe('GoalEditor annual category reminder', () => {
  it('shows covered and missing annual-life areas and requires a category choice', () => {
    render(<App><GoalEditor open initial={null} saving={false} coveredCategories={['health_energy', 'learning_reading']} onCancel={vi.fn()} onSubmit={vi.fn()} /></App>);
    expect(screen.getByText('年度板块检查')).toBeInTheDocument();
    expect(screen.getByText('健康与精力 · 已覆盖')).toBeInTheDocument();
    expect(screen.getByText('家庭与育儿 · 尚未考虑')).toBeInTheDocument();
    expect(screen.getByText('兴趣与体验 · 尚未考虑')).toBeInTheDocument();
    expect(screen.getByLabelText('年度板块')).toBeInTheDocument();
    expect(screen.getByLabelText('行动截止日期')).toBeInTheDocument();
  });
});
