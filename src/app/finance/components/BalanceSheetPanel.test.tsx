import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import BalanceSheetPanel from './BalanceSheetPanel';

const categories = [
  {id:'cat-property',item_type:'asset' as const,name:'房产',system_key:'real_estate' as const,is_active:true},
  {id:'cat-mortgage',item_type:'liability' as const,name:'房贷',system_key:'mortgage' as const,is_active:true},
];
const item = { id:'a1', item_type:'asset' as const, category_id:'cat-property', category:'房产', name:'李锋锋', owner:'self' as const, current_value_cny:1000000, valuation_date:'2026-10-02', note:'' };
const liability = { ...item, id:'l1', item_type:'liability' as const, category_id:'cat-mortgage', category:'房贷', name:'万科幸福誉房贷', note:'当前3.45%，LPR-30BP', calibration_date:'2026-09-30', principal_paid_after_calibration:5000 };

describe('BalanceSheetPanel', () => {
  it('offers metadata editing and guarded deletion for every item', () => {
    render(<App><BalanceSheetPanel items={[item]} categories={categories} onRefresh={vi.fn()} /></App>);
    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    fireEvent.click(screen.getByText('编辑'));
    expect(screen.getByRole('dialog', { name:'编辑资产或负债' })).toBeInTheDocument();
    expect(screen.getByLabelText('名称')).toHaveValue('李锋锋');
    expect(within(screen.getByRole('dialog', { name:'编辑资产或负债' })).getByText('房产')).toBeInTheDocument();
  });

  it('uses balance wording and explains the as-of date for liabilities', () => {
    render(<App><BalanceSheetPanel items={[]} categories={categories} onRefresh={vi.fn()} /></App>);
    fireEvent.click(screen.getByRole('button', { name:'添加资产或负债' }));
    fireEvent.click(screen.getByLabelText('负债'));
    expect(screen.getByLabelText('当前未偿余额（CNY）')).toBeInTheDocument();
    expect(screen.getByLabelText('余额截至日期')).toBeInTheDocument();
    expect(screen.getByText(/系统会从最近一次校准余额中自动扣除之后录入的本金/)).toBeInTheDocument();
    expect(screen.getByLabelText('利率与备注')).toBeInTheDocument();
  });

  it('presents liability updates as an occasional calibration', () => {
    render(<App><BalanceSheetPanel items={[liability]} categories={categories} onRefresh={vi.fn()} /></App>);
    expect(screen.getByText('当前3.45%，LPR-30BP')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:'校准余额' }));
    expect(screen.getByText(/系统当前推算/)).toBeInTheDocument();
    expect(screen.getByLabelText('银行实际余额（CNY）')).toBeInTheDocument();
    expect(screen.getByLabelText('核对日期')).toBeInTheDocument();
  });

  it('warns when latest balances are newer than the selected report period', () => {
    render(<App><BalanceSheetPanel items={[item, liability]} categories={categories} reportEnd="2026-09-30" onRefresh={vi.fn()} /></App>);
    expect(screen.getByText(/明细显示最新余额/)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-30/)).toBeInTheDocument();
    expect(screen.getByText('负债').closest('.ant-tag')).not.toBeNull();
  });

  it('opens category management with separate category groups', () => {
    render(<App><BalanceSheetPanel items={[]} categories={categories} onRefresh={vi.fn()} /></App>);
    fireEvent.click(screen.getByRole('button',{name:'管理类别'}));
    expect(screen.getByRole('dialog',{name:'管理类别标签'})).toBeInTheDocument();
    expect(screen.getByPlaceholderText('新增现金账户类别')).toBeInTheDocument();
  });
});
