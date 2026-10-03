import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LifePage from './page';

vi.mock('@/components/AuthGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('LifePage', () => {
  it('shows the four approved reinforcement routes and their stages', () => {
    render(<LifePage />);

    expect(screen.getByRole('heading', { name: '生活补强' })).toBeInTheDocument();
    expect(screen.getByText('表达能力')).toBeInTheDocument();
    expect(screen.getByText('人际关系')).toBeInTheDocument();
    expect(screen.getByText('形象管理')).toBeInTheDocument();
    expect(screen.getByText('组织能力')).toBeInTheDocument();
    expect(screen.getByLabelText('结构化表达 → 短视频实战 → 真实对话')).toBeInTheDocument();
    expect(screen.queryByText('健康管理')).not.toBeInTheDocument();
  });

  it('provides practical methods and reuses existing execution routes', () => {
    render(<LifePage />);

    expect(screen.getByText(/希望听众记住什么/)).toBeInTheDocument();
    expect(screen.getByText(/每周选择一位值得维护的联系人/)).toBeInTheDocument();
    expect(screen.getByText(/日常、工作和正式场景/)).toBeInTheDocument();
    expect(screen.getByText(/30 分钟内可启动/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '去年度目标' })).toHaveAttribute('href', '/goals');
    expect(screen.getByRole('link', { name: '返回工作台' })).toHaveAttribute('href', '/');
    expect(screen.queryByText(/评分|打卡|解锁/)).not.toBeInTheDocument();
  });
});
