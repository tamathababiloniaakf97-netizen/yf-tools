import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatementsPanel from './StatementsPanel';
import type { HouseholdStatements } from '@/types/household-finance';

const statements: HouseholdStatements = {
  balanceSheet: { assets: 100, liabilities: 30, netWorth: 70 },
  income: { businessIncome: 50, businessExpense: 10, businessSurplus: 40, householdIncome: 3, householdExpense: 20, investmentIncome: 5, periodSurplus: 28 },
  cashFlow: { operating: 25, investing: -5, financing: -3, netChange: 17 },
  netWorthBridge: { unrealizedInvestmentChange: 2 },
};

describe('StatementsPanel', () => {
  it('uses household management statement names', () => {
    render(<StatementsPanel statements={statements} />);
    expect(screen.getByText('家庭资产负债表')).toBeInTheDocument();
    expect(screen.getByText('家庭收支表')).toBeInTheDocument();
    expect(screen.getByText('家庭现金流量表')).toBeInTheDocument();
    expect(screen.queryByText('利润表')).not.toBeInTheDocument();
  });
});
