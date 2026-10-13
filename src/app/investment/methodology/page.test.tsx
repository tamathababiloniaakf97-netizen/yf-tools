import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MethodologyItem } from '@/types/life-os';
import MethodologyPage from './page';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));

const items: MethodologyItem[] = [
  {
    id: 'm1', user_id: 'u1', title: '现金流优先', content: '## 检查项\n估值时检查**自由现金流**。', category: 'valuation',
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
  it('使用左侧列表切换右侧阅读详情', async () => {
    stubItems(items);
    render(<App><MethodologyPage /></App>);

    expect(await screen.findByRole('heading', { name: '现金流优先', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '检查项', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('自由现金流').tagName).toBe('STRONG');
    const divider = screen.getByRole('separator', { name: '调整列表宽度' });
    expect(divider.parentElement).toHaveAttribute('data-storage-key', 'life-os:investment-methodology:left-width');
    fireEvent.click(screen.getByRole('button', { name: /分批建仓/ }));

    expect(screen.getByRole('heading', { name: '分批建仓', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('待确认', { selector: '.methodology-reader .ant-tag' })).toBeInTheDocument();
  });

  it('编辑时预填当前方法并通过 PATCH 保存', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'PATCH') return { ok: true, json: async () => ({ ...items[0], title: '现金流与资本开支' }) } as Response;
      return { ok: true, json: async () => items } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<App><MethodologyPage /></App>);
    await screen.findByRole('heading', { name: '现金流优先', level: 2 });

    fireEvent.click(screen.getByRole('button', { name: /编辑$/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('编辑投资方法');
    expect(screen.getByLabelText('方法标题')).toHaveValue('现金流优先');
    expect(screen.getByLabelText('规则内容')).toHaveValue('## 检查项\n估值时检查**自由现金流**。');
    expect(screen.getByRole('button', { name: '粗体' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('方法标题'), { target: { value: '现金流与资本开支' } });
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/investment/methodology/m1', expect.objectContaining({
      method: 'PATCH',
      body: expect.stringContaining('"review_status":"approved"'),
    })));
  });

  it('同时应用关键词和分类筛选，并保留筛选条件直到用户修改', async () => {
    stubItems(items);
    render(<App><MethodologyPage /></App>);
    await screen.findByRole('heading', { name: '现金流优先', level: 2 });

    fireEvent.change(screen.getByPlaceholderText('搜索标题或规则内容'), { target: { value: '仓位' } });
    fireEvent.click(screen.getByText('仓位', { selector: '.ant-segmented-item-label' }));

    expect(screen.getByRole('heading', { name: '分批建仓', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '现金流优先', level: 2 })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索标题或规则内容')).toHaveValue('仓位');
  });

  it('有记录但筛选无结果时显示可清除的筛选空状态', async () => {
    stubItems(items);
    render(<App><MethodologyPage /></App>);
    await screen.findByRole('heading', { name: '现金流优先', level: 2 });

    fireEvent.change(screen.getByPlaceholderText('搜索标题或规则内容'), { target: { value: '不存在' } });
    expect(screen.getByText('没有匹配的方法')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: '现金流优先', level: 2 })).toBeInTheDocument());
    expect(screen.getByPlaceholderText('搜索标题或规则内容')).toHaveValue('');
  });

  it('没有任何记录时不显示筛选栏', async () => {
    stubItems([]);
    render(<App><MethodologyPage /></App>);

    expect(await screen.findByText('暂无方法。建议从一条已被真实经历验证的规则开始。')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('搜索标题或规则内容')).not.toBeInTheDocument();
  });
});
