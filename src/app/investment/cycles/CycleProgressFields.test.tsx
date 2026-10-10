import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CycleProgressFields from './CycleProgressFields';
import type { MarketCycleReviewInput } from '@/types/life-os';

function Subject({ initialValues={}, tickerId }: { initialValues?: Partial<MarketCycleReviewInput>; tickerId?: string | null }) {
  const [form]=Form.useForm<MarketCycleReviewInput>();
  return <Form form={form} initialValues={initialValues}><CycleProgressFields form={form} tickerId={tickerId}/></Form>;
}

describe('CycleProgressFields',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it('shows the short risk reminder and honest empty results',()=>{
    render(<Subject/>);
    expect(screen.getByText('周期只用于判断环境，不用于预测顶底；通过分批买卖降低误判与踏空风险。')).toBeInTheDocument();
    expect(screen.getAllByText('尚未填写')).toHaveLength(2);
  });

  it('shows calculated return, duration and selected phase prompt',()=>{
    render(<Subject initialValues={{cycle_started_on:'2026-01-01',cycle_start_price:100,latest_price:125,latest_price_on:'2026-01-31',phase:'亢奋'}}/>);
    expect(screen.getByText('+25.00%')).toBeInTheDocument();
    expect(screen.getByText('30 天')).toBeInTheDocument();
    expect(screen.getByText(/忽略风险、估值和反面证据/)).toBeInTheDocument();
  });

  it('defaults the price date only when a latest price is first entered',()=>{
    render(<Subject/>);
    fireEvent.change(screen.getByLabelText('最新价格'),{target:{value:'120'}});
    expect(screen.getByLabelText('最新价格日期')).toHaveValue(new Date().toISOString().slice(0,10));
  });

  it('only offers quote fetching for a user-selected benchmark',()=>{
    const { rerender }=render(<Subject/>);
    expect(screen.queryByRole('button',{name:'获取当前价格'})).not.toBeInTheDocument();
    rerender(<Subject tickerId="ticker-1"/>);
    expect(screen.getByRole('button',{name:'获取当前价格'})).toBeInTheDocument();
  });

  it('fills the fetched price and quote date while keeping them editable',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({price:70000,observedOn:'2026-10-08'}),{status:200})));
    render(<Subject tickerId="ticker-1"/>);
    fireEvent.click(screen.getByRole('button',{name:'获取当前价格'}));
    await waitFor(()=>expect(screen.getByLabelText('最新价格')).toHaveValue('70000'));
    expect(screen.getByLabelText('最新价格日期')).toHaveValue('2026-10-08');
    fireEvent.change(screen.getByLabelText('最新价格'),{target:{value:'71000'}});
    expect(screen.getByLabelText('最新价格')).toHaveValue('71000');
  });

  it('does not overwrite an existing price when fetching fails',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({error:'行情不可用'}),{status:502})));
    render(<Subject tickerId="ticker-1" initialValues={{latest_price:65000,latest_price_on:'2026-10-01'}}/>);
    fireEvent.click(screen.getByRole('button',{name:'获取当前价格'}));
    await screen.findByText('行情不可用');
    expect(screen.getByLabelText('最新价格')).toHaveValue('65000');
    expect(screen.getByLabelText('最新价格日期')).toHaveValue('2026-10-01');
  });
});
