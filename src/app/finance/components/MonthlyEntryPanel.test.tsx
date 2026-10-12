import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import MonthlyEntryPanel, { capitalEntryOptions, firstBatchEntryDate } from './MonthlyEntryPanel';

describe('MonthlyEntryPanel', () => {
  it('defaults a historical month entry to that month instead of today', () => {
    render(<App><MonthlyEntryPanel selectedPeriod="2026-09" entries={[]} liabilities={[]} loading={false} onRefresh={vi.fn()} /></App>);
    expect(screen.getByLabelText('收付款日期')).toHaveValue('2026-09-30');
  });

  it('adds multiple business rows before saving them together', () => {
    render(<App><MonthlyEntryPanel entries={[]} liabilities={[]} loading={false} onRefresh={vi.fn()} /></App>);
    expect(screen.getAllByText('收付款日期')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '保存本行' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '新增一行' }));
    expect(screen.getAllByText('收付款日期')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: '保存本行' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '一并保存' })).toBeInTheDocument();
  });

  it('uses the first row date for every new business or household row', () => {
    const firstDate=dayjs('2026-09-02');
    const fallback=dayjs('2026-09-30');
    expect(firstBatchEntryDate([{entry_date:firstDate},{entry_date:dayjs('2026-09-18')}],fallback)).toBe(firstDate);
    expect(firstBatchEntryDate([{}],fallback)).toBe(fallback);
  });

  it('filters records by tab and exposes family income plus editing', () => {
    render(<App><MonthlyEntryPanel entries={[
      { id: '1', entry_date: '2026-09-30', kind: 'business_income', amount_cny: 100, note: '经营测试', created_at: '2026-10-02T01:30:00Z' },
      { id: '2', entry_date: '2026-09-30', kind: 'household_income', amount_cny: 50, note: '家庭测试' },
    ]} liabilities={[]} loading={false} onRefresh={vi.fn()} /></App>);
    expect(screen.getByText('经营收支')).toBeInTheDocument();
    expect(screen.getByText('家庭收支')).toBeInTheDocument();
    expect(screen.getByText('经营测试')).toBeInTheDocument();
    expect(screen.queryByText('家庭测试')).not.toBeInTheDocument();
    expect(screen.getByText('编辑')).toBeInTheDocument();
    expect(screen.getAllByText('收付款日期').length).toBeGreaterThan(0);
    expect(screen.getByText('录入时间')).toBeInTheDocument();
    expect(screen.getByText('2026-10-02 09:30')).toBeInTheDocument();
    fireEvent.click(screen.getByText('家庭收支'));
    expect(screen.getByText('家庭测试')).toBeInTheDocument();
    expect(screen.queryByText('经营测试')).not.toBeInTheDocument();
    expect(screen.getAllByText('收入').length).toBeGreaterThan(0);
    expect(screen.getAllByText('支出').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('其他大额事项'));
    expect(capitalEntryOptions.map(option => option.label)).toContain('房贷还款');
    expect(capitalEntryOptions.map(option => option.label)).toContain('信用贷还款');
    expect(capitalEntryOptions.map(option => option.label)).toContain('信用卡还款');
    expect(capitalEntryOptions.map(option => option.label)).not.toContain('偿还本金');
    expect(capitalEntryOptions.map(option => option.label)).not.toContain('贷款利息');
    expect(capitalEntryOptions.map(option => option.label)).toContain('投资转入');
    expect(capitalEntryOptions.map(option => option.label)).toContain('投资转出');
    expect(capitalEntryOptions.map(option => option.label)).not.toContain('内部转账');
    expect(screen.getAllByText('备注').length).toBeGreaterThan(0);
    expect(screen.queryByText('客户')).not.toBeInTheDocument();
    expect(screen.queryByText('课程')).not.toBeInTheDocument();
  });

  it('offers batch repayment rows for mortgages, credit loans and credit cards', () => {
    render(<App><MonthlyEntryPanel entries={[]} liabilities={[{ id:'loan-1', item_type:'liability', category:'房贷', name:'住房贷款', owner:'joint', current_value_cny:100000, valuation_date:'2026-09-30', note:'' }]} loading={false} onRefresh={vi.fn()} /></App>);
    fireEvent.click(screen.getByText('其他大额事项'));
    const batchControls = screen.getAllByText('批量还款');
    fireEvent.click(batchControls[batchControls.length - 1]);
    expect(screen.getByText('房贷还款')).toBeInTheDocument();
    expect(screen.getByText('信用贷还款')).toBeInTheDocument();
    expect(screen.getAllByText('信用卡还款').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '保存本行' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '新增还款行' }));
    expect(screen.getAllByRole('button', { name: '保存本行' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '一并保存' })).toBeInTheDocument();
    const principal = screen.getAllByText('本金')[0].closest('.repayment-field');
    const interest = screen.getAllByText('利息')[0].closest('.repayment-field');
    expect(principal).not.toBeNull();
    expect(principal?.parentElement).toBe(interest?.parentElement);
  });

  it('shows explicit signed amounts and semantic type tags for income and expense', () => {
    render(<App><MonthlyEntryPanel entries={[
      { id:'income', entry_date:'2026-09-30', kind:'business_income', amount_cny:234000, note:'学费' },
      { id:'expense', entry_date:'2026-09-30', kind:'business_expense', amount_cny:2300, note:'保险' },
    ]} liabilities={[]} loading={false} onRefresh={vi.fn()} /></App>);

    expect(screen.getAllByText('+¥234,000.00').some(element=>element.classList.contains('finance-flow-inflow'))).toBe(true);
    expect(screen.getAllByText('−¥2,300.00').some(element=>element.classList.contains('finance-flow-outflow'))).toBe(true);
    expect(screen.getByText('经营收入').closest('.ant-tag')).not.toBeNull();
    expect(screen.getAllByText('经营支出').some(element=>Boolean(element.closest('.ant-tag')))).toBe(true);
    expect(screen.getByText('净收入')).toBeInTheDocument();
    expect(screen.getByText('+¥231,700.00')).toBeInTheDocument();
    expect(screen.getByText('经营结余')).toBeInTheDocument();
  });

  it('shows professional capital summaries without counting principal as an expense', () => {
    render(<App><MonthlyEntryPanel entries={[
      {id:'purchase',entry_date:'2026-09-30',kind:'asset_purchase',amount_cny:100000},
      {id:'loan',entry_date:'2026-09-30',kind:'loan_drawdown',amount_cny:50000},
      {id:'principal',entry_date:'2026-09-30',kind:'loan_principal_payment',amount_cny:3000},
      {id:'interest',entry_date:'2026-09-30',kind:'loan_interest',amount_cny:500},
    ]} liabilities={[]} loading={false} onRefresh={vi.fn()}/></App>);
    fireEvent.click(screen.getByText('其他大额事项'));
    expect(screen.getByText('资产交易净额')).toBeInTheDocument();
    expect(screen.getByText('借贷净额')).toBeInTheDocument();
    expect(screen.getAllByText('贷款利息').length).toBeGreaterThan(0);
    expect(screen.getByText('大额事项净现金')).toBeInTheDocument();
    expect(screen.getByText(/本页共 4 笔/)).toBeInTheDocument();
  });

  it('shows the linked liability name for repayment entries', () => {
    render(<App><MonthlyEntryPanel entries={[
      { id:'principal', entry_date:'2026-09-30', kind:'loan_principal_payment', amount_cny:3000, liability_id:'loan-1', note:'' },
      { id:'interest', entry_date:'2026-09-30', kind:'loan_interest', amount_cny:500, liability_id:'loan-1', note:'' },
    ]} liabilities={[
      { id:'loan-1', item_type:'liability', category:'房贷', name:'住房贷款', owner:'joint', current_value_cny:100000, valuation_date:'2026-09-30', note:'' },
    ]} loading={false} onRefresh={vi.fn()} /></App>);

    fireEvent.click(screen.getByText('其他大额事项'));
    expect(screen.getByText('对应负债')).toBeInTheDocument();
    expect(screen.getAllByText('住房贷款')).toHaveLength(2);
  });

  it('uses semantic colors for debt entry types', () => {
    render(<App><MonthlyEntryPanel entries={[
      { id:'interest', entry_date:'2026-09-30', kind:'loan_interest', amount_cny:500, liability_id:'loan-1' },
      { id:'principal', entry_date:'2026-09-30', kind:'loan_principal_payment', amount_cny:3000, liability_id:'loan-1' },
      { id:'card', entry_date:'2026-09-30', kind:'credit_card_payment', amount_cny:2000, liability_id:'card-1' },
      { id:'drawdown', entry_date:'2026-09-30', kind:'loan_drawdown', amount_cny:10000, liability_id:'loan-1' },
    ]} liabilities={[]} loading={false} onRefresh={vi.fn()} /></App>);

    fireEvent.click(screen.getByText('其他大额事项'));
    expect(screen.getAllByText('贷款利息').find(element=>element.closest('.ant-tag'))?.closest('.ant-tag')).toHaveClass('ant-tag-orange');
    expect(screen.getByText('偿还本金').closest('.ant-tag')).toHaveClass('ant-tag-blue');
    expect(screen.getByText('偿还信用卡').closest('.ant-tag')).toHaveClass('ant-tag-purple');
    expect(screen.getByText('新增借款').closest('.ant-tag')).toHaveClass('ant-tag-green');
  });
});
