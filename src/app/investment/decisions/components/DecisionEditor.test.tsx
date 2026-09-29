import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DecisionEditor from './DecisionEditor';
import type { InvestmentDecision } from '@/types/life-os';

const draft = { id: 'd1', asset_name: '腾讯', status: 'draft', research_profile_id: 'p1', research_snapshot_id: 's1', do_not_list: [] } as unknown as InvestmentDecision;

describe('DecisionEditor', () => {
  it('shows the complete decision framework and core finalization guidance', () => {
    render(<DecisionEditor decision={draft} snapshots={[]} saving={false} onSave={vi.fn()} onFinalize={vi.fn()} />);
    for (const label of ['市场预期', '估值', '安全边际', '投资计划', '如果错了怎么办', '不为清单', '最终结论']) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存草稿' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /定\s*稿/ })).toBeInTheDocument();
  });

  it('renders finalized decisions as read-only history', () => {
    render(<DecisionEditor decision={{ ...draft, status: 'finalized' }} snapshots={[]} saving={false} onSave={vi.fn()} onFinalize={vi.fn()} />);
    expect(screen.getByText('已定稿，只读')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '保存草稿' })).not.toBeInTheDocument();
  });
});
