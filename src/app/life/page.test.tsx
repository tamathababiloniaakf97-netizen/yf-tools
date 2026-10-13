import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LifePage from './page';

vi.mock('@/components/AuthGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const projects = [
  {
    id: 'expression', user_id: 'u1', name: '表达能力', long_term_goal: '让听众理解重点',
    practical_method: '每次先写一句“希望听众记住什么”', stages: ['结构化表达', '短视频实战', '真实对话'],
  },
  {
    id: 'relationships', user_id: 'u1', name: '人际关系', long_term_goal: '延续真实关系',
    practical_method: '每周选择一位值得维护的联系人', stages: ['记住重要信息', '主动联系', '深度交流与持续跟进'],
  },
  {
    id: 'appearance', user_id: 'u1', name: '形象管理与审美', long_term_goal: '形成稳定风格',
    practical_method: '固定日常、工作和正式场景的搭配', stages: ['基础整洁', '场景穿搭', '审美判断与稳定风格'],
  },
  {
    id: 'organization', user_id: 'u1', name: '组织能力', long_term_goal: '把想法转化为行动',
    practical_method: '把第一步缩小为 30 分钟内可启动的动作', stages: ['明确结果', '拆解行动', '推进与复盘'],
  },
].map((project) => ({
  ...project,
  default_key: project.id,
  is_default: true,
  is_active: true,
  created_at: '',
  updated_at: '',
}));

describe('LifePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => projects }));
  });

  it('shows the four approved reinforcement routes and their stages after loading', async () => {
    render(<LifePage />);

    expect(screen.getByRole('heading', { name: '生活补强' })).toBeInTheDocument();
    expect(await screen.findByText('表达能力')).toBeInTheDocument();
    expect(screen.getByText('人际关系')).toBeInTheDocument();
    expect(screen.getByText('形象管理与审美')).toBeInTheDocument();
    expect(screen.getByText('组织能力')).toBeInTheDocument();
    expect(screen.getByText('结构化表达')).toBeInTheDocument();
    expect(screen.getByText('短视频实战')).toBeInTheDocument();
    expect(screen.getByText('真实对话')).toBeInTheDocument();
    expect(screen.queryByText('健康管理')).not.toBeInTheDocument();
  });

  it('provides practical methods without adding excluded tracking features', async () => {
    render(<LifePage />);

    expect(await screen.findByText(/希望听众记住什么/)).toBeInTheDocument();
    expect(screen.getByText(/每周选择一位值得维护的联系人/)).toBeInTheDocument();
    expect(screen.getByText(/日常、工作和正式场景/)).toBeInTheDocument();
    expect(screen.getByText(/30 分钟内可启动/)).toBeInTheDocument();
    expect(screen.queryByText(/评分|打卡|连续天数|同步到工作台/)).not.toBeInTheDocument();
  });
});
