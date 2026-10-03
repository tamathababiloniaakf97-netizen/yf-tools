import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MethodologyItem } from '@/types/life-os';
import MethodologyPage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));

const items: MethodologyItem[] = [
  {
    id: 'm1', user_id: 'u1', title: '现金流优先', content: '估值时检查自由现金流。', category: 'valuation',
    status: 'active', source_type: 'manual', source_ref: null, review_status: 'approved', created_at: '', updated_at: '',
  },
  {
    id: 'm2', user_id: 'u1', title: '分批建仓', content: '控制首次买入仓位。', category: 'position',
    status: 'active', source_type: 'manual', source_ref: null, review_status: 'pending', created_at: '', updated_at: '',
  },
];

function stubItems(data: MethodologyItem[]) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => data } as Response)));
}

afterEach(() => vi.unstubAllGlobals());

describe('MethodologyPage filtering', () => {
  it('同时应用关键词和分类筛选，并保留筛选条件直到用户修改', async () => {
    stubItems(items);
    render(<App><MethodologyPage /></App>);
    await screen.findByText('现金流优先');

    fireEvent.change(screen.getByPlaceholderText('搜索标题或规则内容'), { target: { value: '仓位' } });
    fireEvent.click(screen.getByText('仓位', { selector: '.ant-segmented-item-label' }));

    expect(screen.getByText('分批建仓')).toBeInTheDocument();
    expect(screen.queryByText('现金流优先')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索标题或规则内容')).toHaveValue('仓位');
  });

  it('有记录但筛选无结果时显示可清除的筛选空状态', async () => {
    stubItems(items);
    render(<App><MethodologyPage /></App>);
    await screen.findByText('现金流优先');

    fireEvent.change(screen.getByPlaceholderText('搜索标题或规则内容'), { target: { value: '不存在' } });
    expect(screen.getByText('没有匹配的方法')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }));
    await waitFor(() => expect(screen.getByText('现金流优先')).toBeInTheDocument());
    expect(screen.getByPlaceholderText('搜索标题或规则内容')).toHaveValue('');
  });

  it('没有任何记录时不显示筛选栏', async () => {
    stubItems([]);
    render(<App><MethodologyPage /></App>);

    expect(await screen.findByText('暂无方法。建议从一条已被真实经历验证的规则开始。')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('搜索标题或规则内容')).not.toBeInTheDocument();
  });
});
