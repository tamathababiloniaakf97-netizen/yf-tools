import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CognitionJournalsPage from './page';
vi.mock('swr', () => ({ default: (key: string) => ({
  data: key.includes('categories')
    ? [{ id:'cat-1', user_id:'u1', name:'决策', sort_order:0, is_active:true, created_at:'', updated_at:'' }]
    : [{ id:'j1', user_id:'u1', title:'一次误判', category_id:'cat-1', occurred_on:'2026-10-13', context:'工作', content:'## 结论\n**先核实事实**', facts:'', initial_judgment:'', judgment_basis:'', discovered_error:'', counterevidence:'', next_action:'', tags:[], error_tags:[], method_id:null, created_at:'', updated_at:'' }],
  error: undefined,
  mutate: vi.fn(),
}) }));
vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

describe('CognitionJournalsPage', () => {
  it('offers free writing and optional guided reflection', () => {
    render(<CognitionJournalsPage />);
    expect(screen.getByRole('heading', { name: '认知日志' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /写一条/ })).toBeInTheDocument();
    expect(screen.getByText(/真实事件中的判断/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '结论', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('先核实事实').tagName).toBe('STRONG');
  });

  it('uses the lightweight editor for the journal body', () => {
    render(<CognitionJournalsPage />);
    fireEvent.click(screen.getByRole('button', { name: /写一条/ }));
    expect(screen.getByRole('button', { name: '粗体' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '强调' })).toBeInTheDocument();
  });
});
