import { fireEvent, render, screen } from '@testing-library/react';
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

  it('shows persistent boundaries for every part of the decision', () => {
    render(<DecisionEditor decision={draft} snapshots={[]} saving={false} onSave={vi.fn()} onFinalize={vi.fn()} />);

    expect(screen.getByText(/不要把自己的观点写在这里/)).toBeInTheDocument();
    expect(screen.getByText(/不把“好公司”等同于“有安全边际”/)).toBeInTheDocument();
    expect(screen.getByText(/不是补录或最后编辑日期/)).toBeInTheDocument();
    expect(screen.getByText(/不要复制整份公司研究/)).toBeInTheDocument();
  });

  it('renders finalized decisions as read-only history', () => {
    render(<DecisionEditor decision={{ ...draft, status: 'finalized' }} snapshots={[]} saving={false} onSave={vi.fn()} onFinalize={vi.fn()} />);
    expect(screen.getByText('已定稿，只读')).toBeInTheDocument();
    expect(screen.getByText(/定稿后该版本不会被后续研究覆盖/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '保存草稿' })).not.toBeInTheDocument();
  });
});

it('restores unsaved text after leaving and keeps other accounts separate', async () => {
  localStorage.clear();
  const decision = { ...draft, user_id: 'user-a' };
  const props = { decision, snapshots: [], saving: false, onSave: vi.fn(), onFinalize: vi.fn() };
  const first = render(<DecisionEditor {...props} />);
  fireEvent.change(screen.getByLabelText('核心理由'), { target: { value: '尚未保存的重要判断' } });
  first.unmount();
  const restored = render(<DecisionEditor {...props} />);
  expect(screen.getByLabelText('核心理由')).toHaveValue('尚未保存的重要判断');
  expect(await screen.findByText('已恢复本浏览器中未保存的草稿')).toBeInTheDocument();
  restored.unmount();
  render(<DecisionEditor {...props} decision={{ ...decision, user_id: 'user-b' }} />);
  expect(screen.getByLabelText('核心理由')).not.toHaveValue('尚未保存的重要判断');
  localStorage.clear();
});

