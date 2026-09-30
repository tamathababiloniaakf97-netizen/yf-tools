import type { HouseholdStatements, StatementInput } from '@/types/household-finance';

export function cnyAmount(originalAmount: number, fxRate: number) {
  if (!Number.isFinite(originalAmount) || !Number.isFinite(fxRate) || fxRate <= 0) throw new Error('原币金额和汇率必须是有效数字');
  return Math.round(originalAmount * fxRate * 100) / 100;
}

export function periodBounds(year: number, mode: 'month' | 'quarter' | 'year', index: number) {
  const startMonth = mode === 'month' ? index - 1 : mode === 'quarter' ? (index - 1) * 3 : 0;
  const endMonth = mode === 'month' ? index : mode === 'quarter' ? index * 3 : 12;
  const date = (value: Date) => value.toISOString().slice(0, 10);
  return { start: date(new Date(Date.UTC(year, startMonth, 1))), end: date(new Date(Date.UTC(year, endMonth, 0))) };
}

export function buildHouseholdStatements(input: StatementInput): HouseholdStatements {
  const entries = input.entries.filter(entry => entry.entry_date >= input.start && entry.entry_date <= input.end);
  const sum = (...kinds: string[]) => entries.filter(entry => kinds.includes(entry.kind)).reduce((total, entry) => total + Number(entry.amount_cny), 0);
  const businessIncome = sum('business_income') - sum('business_refund');
  const businessExpense = sum('business_expense');
  const householdIncome = sum('household_income');
  const householdExpense = sum('household_expense', 'loan_interest');
  const investmentIncome = sum('investment_income');
  const businessSurplus = businessIncome - businessExpense;
  const periodSurplus = businessSurplus + householdIncome + investmentIncome - householdExpense;
  const operating = periodSurplus;
  const investing = sum('security_sell', 'asset_sale') - sum('security_buy', 'asset_purchase');
  const financing = sum('loan_drawdown') - sum('loan_principal_payment');
  const assetValue = input.assets.reduce((total, item) => total + Number(item.value_cny), 0) + Number(input.investment?.securities_cny ?? 0) + Number(input.investment?.cash_cny ?? 0);
  const liabilityValue = input.liabilities.reduce((total, item) => total + Number(item.value_cny), 0);
  return {
    balanceSheet: { assets: assetValue, liabilities: liabilityValue, netWorth: assetValue - liabilityValue },
    income: { businessIncome, businessExpense, businessSurplus, householdIncome, householdExpense, investmentIncome, periodSurplus },
    cashFlow: { operating, investing, financing, netChange: operating + investing + financing },
    netWorthBridge: { unrealizedInvestmentChange: input.investment?.unrealized_change_cny ?? 0 },
  };
}
