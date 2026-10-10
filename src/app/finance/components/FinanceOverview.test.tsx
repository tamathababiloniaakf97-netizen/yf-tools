import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FinanceOverview from './FinanceOverview';
import type { HouseholdStatements } from '@/types/household-finance';

const statements: HouseholdStatements = {
  balanceSheet:{assets:1000000,liabilities:1200000,netWorth:-200000},
  income:{businessIncome:234000,businessExpense:72000,businessSurplus:162000,householdIncome:0,householdExpense:270,investmentIncome:0,periodSurplus:161730},
  cashFlow:{operating:161730,investing:0,financing:0,netChange:161730},
  netWorthBridge:{unrealizedInvestmentChange:0},
};

describe('FinanceOverview', () => {
  it('makes the balance-sheet date explicit and separates surplus from debt ratio', () => {
    render(<FinanceOverview statements={statements} reportEnd="2026-09-30" />);
    expect(screen.getByText('家庭净资产（截至 2026-09-30）')).toBeInTheDocument();
    expect(screen.getByText('本期结余')).toBeInTheDocument();
    expect(screen.getByText('负债率')).toBeInTheDocument();
    expect(screen.getByText('负债率').closest('.ant-statistic')).toHaveTextContent('120.0%');
  });
});
