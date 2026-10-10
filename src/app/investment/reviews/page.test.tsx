import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SWRConfig } from 'swr';
import InvestmentReviewsPage from './page';
import { fetchJson } from '@/lib/api/fetch-json';

vi.mock('@/components/AuthGuard', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

const journals = [
  { id:'j1', user_id:'u1', title:'泡泡玛特：没有写清买入条件', journal_type:'missed_opportunity', review_date:'2026-09-28', content:'等待变成了没有期限的拖延。', asset_name:'泡泡玛特', tags:['估值'], references:[{type:'research',id:'r1',title:'泡泡玛特公司研究',href:'/investment/research?profile=r1'}], source_type:'manual',source_ref:null,review_status:'approved',created_at:'',updated_at:'' },
  { id:'j2', user_id:'u1', title:'腾讯加仓复盘', journal_type:'decision_review', review_date:'2026-09-18', content:'广告恢复速度超过预期。', asset_name:'腾讯', tags:['仓位'], references:[], source_type:'manual',source_ref:null,review_status:'approved',created_at:'',updated_at:'' },
];

describe('InvestmentReviewsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => Promise.resolve(new Response(JSON.stringify(String(input).includes('reference-options') ? [] : journals), { status:200, headers:{'Content-Type':'application/json'} }))));
  });

  it('shows a searchable journal list and the selected article detail', async () => {
    render(<SWRConfig value={{fetcher:fetchJson,provider:()=>new Map()}}><App><InvestmentReviewsPage /></App></SWRConfig>);
    expect(await screen.findByRole('heading', { name:'投资日志' })).toBeInTheDocument();
    expect((await screen.findAllByText('泡泡玛特：没有写清买入条件')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('等待变成了没有期限的拖延。').length).toBeGreaterThan(0);
    expect(screen.getByText('泡泡玛特公司研究')).toBeInTheDocument();
    const divider = screen.getByRole('separator', { name: '调整列表宽度' });
    expect(divider.parentElement).toHaveAttribute('data-storage-key', 'life-os:investment-journal:left-width');

    fireEvent.change(screen.getByPlaceholderText('搜索标题、正文、公司或标签'), { target:{ value:'腾讯' } });
    await waitFor(() => expect(screen.queryAllByText('泡泡玛特：没有写清买入条件')).toHaveLength(0));
    expect(screen.getAllByText('腾讯加仓复盘').length).toBeGreaterThan(0);
  });
});
