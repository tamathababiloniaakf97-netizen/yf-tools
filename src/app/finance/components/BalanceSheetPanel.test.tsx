import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import BalanceSheetPanel from './BalanceSheetPanel';

const item = { id:'a1', item_type:'asset' as const, category:'万科幸福誉', name:'李锋锋', owner:'self' as const, current_value_cny:1000000, valuation_date:'2026-10-02', note:'' };
const liability = { ...item, id:'l1', item_type:'liability' as const, category:'房贷', name:'万科幸福誉房贷' };

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
    expect(screen.getByText('后续还款记录将关联此负债，余额以你更新或月度确认的数据为准。')).toBeInTheDocument();
  });

  it('uses the same liability wording when updating an existing balance', () => {
    render(<App><BalanceSheetPanel items={[liability]} onRefresh={vi.fn()} /></App>);
    fireEvent.click(screen.getByRole('button', { name:'更新金额' }));
    expect(screen.getByLabelText('当前未偿余额（CNY）')).toBeInTheDocument();
    expect(screen.getByLabelText('余额截至日期')).toBeInTheDocument();
  });
});
