import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import BalanceSheetPanel from './BalanceSheetPanel';

const item = { id:'a1', item_type:'asset' as const, category:'万科幸福誉', name:'李锋锋', owner:'self' as const, current_value_cny:1000000, valuation_date:'2026-10-02', note:'' };
const liability = { ...item, id:'l1', item_type:'liability' as const, category:'房贷', name:'万科幸福誉房贷', note:'当前3.45%，LPR-30BP', calibration_date:'2026-09-30', principal_paid_after_calibration:5000 };

describe('BalanceSheetPanel', () => {
  it('offers metadata editing and guarded deletion for every item', () => {
    render(<App><BalanceSheetPanel items={[item]} onRefresh={vi.fn()} /></App>);
    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getByText('删除')).toBeInTheDocument();
    fireEvent.click(screen.getByText('编辑'));
    expect(screen.getByRole('dialog', { name:'编辑资产或负债' })).toBeInTheDocument();
    expect(screen.getByLabelText('名称')).toHaveValue('李锋锋');
    expect(screen.getByLabelText('类别')).toHaveValue('万科幸福誉');
  });

  it('uses balance wording and explains the as-of date for liabilities', () => {
    render(<App><BalanceSheetPanel items={[]} onRefresh={vi.fn()} /></App>);
    fireEvent.click(screen.getByRole('button', { name:'添加资产或负债' }));
    fireEvent.click(screen.getByLabelText('负债'));
    expect(screen.getByLabelText('当前未偿余额（CNY）')).toBeInTheDocument();
    expect(screen.getByLabelText('余额截至日期')).toBeInTheDocument();
    expect(screen.getByText(/系统会从最近一次校准余额中自动扣除之后录入的本金/)).toBeInTheDocument();
    expect(screen.getByLabelText('利率与备注')).toBeInTheDocument();
  });

  it('presents liability updates as an occasional calibration', () => {
    render(<App><BalanceSheetPanel items={[liability]} onRefresh={vi.fn()} /></App>);
    expect(screen.getByText('当前3.45%，LPR-30BP')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name:'校准余额' }));
    expect(screen.getByText(/系统当前推算/)).toBeInTheDocument();
    expect(screen.getByLabelText('银行实际余额（CNY）')).toBeInTheDocument();
    expect(screen.getByLabelText('核对日期')).toBeInTheDocument();
  });

  it('warns when latest balances are newer than the selected report period', () => {
    render(<App><BalanceSheetPanel items={[item, liability]} reportEnd="2026-09-30" onRefresh={vi.fn()} /></App>);
    expect(screen.getByText(/明细显示最新余额/)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-30/)).toBeInTheDocument();
    expect(screen.getByText('负债').closest('.ant-tag')).not.toBeNull();
  });
});
