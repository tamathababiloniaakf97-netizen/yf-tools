import { fireEvent, render, screen } from '@testing-library/react';
import { App } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import MonthlyEntryPanel, { capitalEntryOptions } from './MonthlyEntryPanel';

describe('MonthlyEntryPanel', () => {
  it('filters records by tab and exposes family income plus editing', () => {
    render(<App><MonthlyEntryPanel entries={[
      { id: '1', entry_date: '2026-09-30', kind: 'business_income', amount_cny: 100, note: '经营测试' },
      { id: '2', entry_date: '2026-09-30', kind: 'household_income', amount_cny: 50, note: '家庭测试' },
    ]} liabilities={[]} loading={false} onRefresh={vi.fn()} /></App>);
    expect(screen.getByText('经营收支')).toBeInTheDocument();
    expect(screen.getByText('家庭收支')).toBeInTheDocument();
    expect(screen.getByText('经营测试')).toBeInTheDocument();
    expect(screen.queryByText('家庭测试')).not.toBeInTheDocument();
    expect(screen.getByText('编辑')).toBeInTheDocument();
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
});
