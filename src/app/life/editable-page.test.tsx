import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LifePage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

const project = {
  id: 'p1', user_id: 'u1', name: '形象管理与审美', long_term_goal: '形成稳定风格',
  practical_method: '比较颜色、比例和材质', stages: ['基础整洁', '场景穿搭'],
  default_key: 'appearance', is_default: true, is_active: true, created_at: '', updated_at: '',
};

describe('LifePage editable records', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [project] })));

  it('loads projects and offers simple editing actions', async () => {
    render(<LifePage />);
    expect(await screen.findByText('形象管理与审美')).toBeInTheDocument();
    expect(screen.getByText('形成稳定风格')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新增项目' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '编辑项目' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '记录训练' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看记录' })).toBeInTheDocument();
  });

  it('does not add scoring, reminders, or dashboard aggregation', async () => {
    render(<LifePage />);
    await screen.findByText('形象管理与审美');
    expect(screen.queryByText(/评分|打卡|连续天数|同步到工作台/)).not.toBeInTheDocument();
  });
});
