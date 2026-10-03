import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccountSummaryCards from './AccountSummaryCards';
import type { AccountSummary } from '@/types';

const summary: AccountSummary = {
  totalAssets: 15000, cashBalance: -5000, marketValue: 20000, totalInvested: 12000,
  totalPnL: 3000, pnlPercent: 25, positions: [], openOptions: [], openingConfigured: true,
  netContributions: 12000, cumulativePnl: 3000, xirr: 18.5, stockExposurePercent: 133.33, leverageMultiple: 1.33,
};

describe('AccountSummaryCards', () => {
  it('shows exactly the five professional account metrics', () => {
    render(<AccountSummaryCards summary={summary} loading={false} />);
    ['账户净资产', '融资余额/现金占比', '净入金', '累计盈亏', '资金收益率(XIRR)'].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.queryByText('策略收益率(TWR)')).not.toBeInTheDocument();
  });

  it('hides performance values before opening setup', () => {
    render(<AccountSummaryCards summary={{ ...summary, openingConfigured: false, netContributions: null, cumulativePnl: null, xirr: null }} loading={false} />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('opens account distribution from the net-assets card only', async () => {
    const onOpenAccountDistribution = vi.fn();
    render(<AccountSummaryCards summary={summary} loading={false} onOpenAccountDistribution={onOpenAccountDistribution} />);
    fireEvent.click(screen.getByRole('button', { name: '查看账户分布' }));
    expect(onOpenAccountDistribution).toHaveBeenCalledOnce();
  });
});
