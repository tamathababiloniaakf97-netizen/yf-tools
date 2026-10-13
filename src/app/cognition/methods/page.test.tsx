import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CognitionMethodsPage from './page';
vi.mock('swr', () => ({ default: (key: string) => ({
  data: key.includes('categories')
    ? [{ id:'cat-1', user_id:'u1', name:'决策', sort_order:0, is_active:true, created_at:'', updated_at:'' }]
    : [{ id:'m1', user_id:'u1', title:'核实事实', category_id:'cat-1', content:'## 原则\n**先找原始资料**', applicable_context:'重大判断', evidence_basis:'一手证据', action_rule:'先查证', exceptions:'紧急情况', status:'verified', source_journal_id:null, created_at:'', updated_at:'' }],
  error: undefined,
  mutate: vi.fn(),
}) }));
vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe('CognitionMethodsPage', () => {
  it('presents cognition methods as bounded rules', () => {
    render(<CognitionMethodsPage />);
    expect(screen.getByRole('heading', { name: '认知方法论' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /添加方法/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /管理分类/ })).toBeInTheDocument();
    expect(screen.getByText(/适用边界/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '原则', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('先找原始资料').tagName).toBe('STRONG');
  });

  it('uses the formatting editor for all five long-form method fields', () => {
    render(<CognitionMethodsPage />);
    fireEvent.click(screen.getByRole('button', { name: /编辑$/ }));
    fireEvent.click(screen.getByText(/补充适用边界/));
    expect(screen.getAllByRole('button', { name: '粗体' })).toHaveLength(5);
    expect(screen.getAllByRole('button', { name: '强调' })).toHaveLength(5);
  });
});
