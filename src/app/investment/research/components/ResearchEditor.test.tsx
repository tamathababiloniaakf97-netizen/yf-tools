import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResearchEditor from './ResearchEditor';
import type { ResearchProfile } from '@/types/life-os';

describe('ResearchEditor', () => {
  it('focuses on six core conclusions without fake completion scoring', () => {
    render(<ResearchEditor initial={{ asset_name: '腾讯', investment_thesis: '原有内容' } as ResearchProfile} saving={false} onSubmit={vi.fn()} />);
    expect(screen.getByText('公司靠什么生意挣钱？')).toBeInTheDocument();
    expect(screen.getByText('为什么客户愿意持续付钱？')).toBeInTheDocument();
    expect(screen.getByText('为什么竞争者难以抢走？')).toBeInTheDocument();
    expect(screen.getByText('五年后继续挣钱依赖哪些关键假设？')).toBeInTheDocument();
    expect(screen.getByText('什么事实出现会证明判断错误？')).toBeInTheDocument();
    expect(screen.getByText('挣到的钱质量如何？')).toBeInTheDocument();
    expect(screen.getByText('原投资逻辑 / 研究摘要')).toBeInTheDocument();
    expect(screen.queryByText(/完成率|评分|%/)).not.toBeInTheDocument();
  });

  it('keeps concise writing boundaries visible for every research section', () => {
    render(<ResearchEditor initial={{ asset_name: '腾讯', investment_thesis: '原有内容' } as ResearchProfile} saving={false} onSubmit={vi.fn()} />);

    expect(screen.getByText(/不必复述公司历史/)).toBeInTheDocument();
    expect(screen.getByText(/不以个人魅力代替证据/)).toBeInTheDocument();
    expect(screen.getByText(/这里不直接写买卖决定/)).toBeInTheDocument();
    expect(screen.getByText(/不要用它替代上方的结构化回答/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/辅助检查提示/));
    expect(screen.getByText(/不代表研究得分/)).toBeInTheDocument();
  });
});
