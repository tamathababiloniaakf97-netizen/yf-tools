import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContactEditor from './ContactEditor';

describe('ContactEditor', () => {
  it('shows the agreed profile, birthday, observation, and action fields', async () => {
    render(<ContactEditor open initial={null} saving={false} onCancel={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('观察与相处提示')).toBeInTheDocument();
    expect(screen.getByText(/如何对待承诺和他人/)).toBeInTheDocument();
    expect(screen.getByText(/孩子几个及年龄阶段/)).toBeInTheDocument();
    expect(screen.getByText(/所在行业与公司/)).toBeInTheDocument();
    expect(screen.getByLabelText('最近联系日期')).toBeInTheDocument();
    expect(screen.getByLabelText('计划联系日期')).toBeInTheDocument();
    expect(screen.getByLabelText('我的下一步行动')).toBeInTheDocument();
    expect(screen.getByLabelText('生日历法')).toBeInTheDocument();
    expect(screen.getByLabelText('知道出生年份')).toBeInTheDocument();
    expect(screen.queryByLabelText('生日月份')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('生日日期')).not.toBeInTheDocument();
    expect(screen.getByLabelText('重要节日联系提示')).toBeInTheDocument();
    expect(screen.getByText('春节、端午和中秋前3天开始提示。')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByLabelText('关系类型'));
    expect(await screen.findByText('同学')).toBeInTheDocument();
  });

  it('uses one birthday control after choosing a calendar', async () => {
    render(<ContactEditor open initial={null} saving={false} onCancel={vi.fn()} onSubmit={vi.fn()} />);

    fireEvent.mouseDown(screen.getByLabelText('生日历法'));
    fireEvent.click(await screen.findByText('公历'));
    expect(await screen.findByLabelText('公历生日')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByLabelText('生日历法'));
    fireEvent.click(await screen.findByText('农历'));
    expect(await screen.findByLabelText('农历生日')).toBeInTheDocument();
    expect(screen.getByLabelText('闰月')).toBeInTheDocument();
  });
});
