import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MarketCyclesPage from './page';
const profile={id:'cycle-1',user_id:'user-1',cycle_key:'btc',name:'BTC 周期',is_active:true,current_phase:'启动',confidence:'medium',summary:'继续观察',support_evidence:'需求改善',counter_evidence:'流动性风险',uncertainties:'核实需求是否真实增长',last_reviewed_at:null,next_review_at:null,review_frequency_days:30,indicators:[],cycle_started_on:'2026-01-01',cycle_start_price:50000,latest_price:70000,latest_price_on:'2026-10-09',return_percent:40,running_days:281,ticker_id:'ticker-1',ticker:{id:'ticker-1',name:'比特币',code:'BTC',currency:'USD'},created_at:'',updated_at:''};
vi.mock('swr',()=>({default:(key:string)=>({data:key==='/api/investment/cycles'?[profile]:key==='/api/tickers'?[profile.ticker]:[],error:undefined,mutate:vi.fn(),isLoading:false})}));
vi.mock('@/components/AuthGuard',()=>({default:({children}:{children:React.ReactNode})=><>{children}</>}));

describe('MarketCyclesPage',()=>{
  it('provides the four-cycle review workspace',()=>{
    render(<MarketCyclesPage/>);
    expect(screen.getByRole('heading',{name:'周期观察'})).toBeInTheDocument();
    expect(screen.getAllByText('BTC 周期').length).toBeGreaterThan(0);
    expect(screen.getByText('待思考事项')).toBeInTheDocument();
    expect(screen.getByText('观察指标')).toBeInTheDocument();
    expect(screen.getByText('历史复核')).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'管理观察主题'})).toBeInTheDocument();
  });

  it('separates manual thoughts from automatic reminders and shows price anchors',()=>{
    render(<MarketCyclesPage/>);
    expect(screen.getByText('我的待思考')).toBeInTheDocument();
    expect(screen.getByText('核实需求是否真实增长')).toBeInTheDocument();
    expect(screen.getByText('系统提醒')).toBeInTheDocument();
    expect(screen.getByText('当前没有条件提醒')).toBeInTheDocument();
    expect(screen.getByText('比特币 · BTC')).toBeInTheDocument();
    expect(screen.queryByText('关键未知')).not.toBeInTheDocument();
  });
});
