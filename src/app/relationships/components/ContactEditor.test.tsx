import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContactEditor from './ContactEditor';

describe('ContactEditor', () => {
  it('shows the agreed profile, birthday, observation, and action fields', async () => {
    render(<ContactEditor open initial={null} saving={false} onCancel={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('观察与相处提示')).toBeInTheDocument();
    expect(screen.getByText(/如何对待承诺和他人/)).toBeInTheDocument();
    expect(screen.getByLabelText('最近联系日期')).toBeInTheDocument();
    expect(screen.getByLabelText('计划联系日期')).toBeInTheDocument();
    expect(screen.getByLabelText('我的下一步行动')).toBeInTheDocument();
    expect(screen.getByLabelText('生日历法')).toBeInTheDocument();
    expect(screen.getByLabelText('生日月份')).toBeInTheDocument();
    expect(screen.getByLabelText('生日日期')).toBeInTheDocument();
    expect(screen.getByLabelText('重要节日联系提示')).toBeInTheDocument();
    expect(screen.getByText('春节、端午和中秋前3天开始提示。')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByLabelText('关系类型'));
    expect(await screen.findByText('同学')).toBeInTheDocument();
  });
});
