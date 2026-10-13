import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResearchEditor from './ResearchEditor';
import type { ResearchProfile } from '@/types/life-os';

describe('ResearchEditor', () => {
  afterEach(() => vi.unstubAllGlobals());
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

  it('shows financial evidence reminders only for the three core fields', () => {
    render(<ResearchEditor initial={{ asset_name: '腾讯', investment_thesis: '' } as ResearchProfile} saving={false} onSubmit={vi.fn()} />);

    expect(screen.getAllByText('财务佐证')).toHaveLength(3);
    expect(screen.getByText('必要时确认主要收入和利润来源。')).toBeInTheDocument();
    expect(screen.getByText('尽量加入可通过财务数据验证的反证条件。')).toBeInTheDocument();
    expect(screen.getByText('该判断应有财务数据支持，避免只有主观结论。')).toBeInTheDocument();
  });

  it('shows material citations under the matching current-research field', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [{
      id: 'e1', asset_name: '腾讯', content: '客户续约率稳定', impact: 'support', research_field: 'customer_value',
    }] } as Response)));
    render(<ResearchEditor initial={{ asset_name: '腾讯', investment_thesis: '' } as ResearchProfile} saving={false} onSubmit={vi.fn()} />);
    expect(await screen.findByText('参考资料')).toBeInTheDocument();
    fireEvent.focus(screen.getByLabelText('为什么客户愿意持续付钱？'));
    expect(await screen.findByText('客户续约率稳定')).toBeInTheDocument();
    expect(screen.getByText('客户价值 · 1 条')).toBeInTheDocument();
  });

  it('separates the scrollable writing area from the persistent reference area', () => {
    render(<ResearchEditor initial={{ asset_name: '腾讯', investment_thesis: '' } as ResearchProfile} saving={false} onSubmit={vi.fn()} />);

    expect(screen.getByRole('region', { name: '研究内容滚动区' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '当前栏目参考资料' })).toBeInTheDocument();
  });

  it('allows every current-research text area to be resized vertically', () => {
    render(<ResearchEditor initial={{ asset_name: '腾讯', investment_thesis: '' } as ResearchProfile} saving={false} onSubmit={vi.fn()} />);

    const textAreas = screen.getAllByRole('textbox');
    expect(textAreas.length).toBeGreaterThan(0);
    textAreas.forEach((textArea) => expect(textArea).toHaveStyle({ resize: 'vertical' }));
  });
});
