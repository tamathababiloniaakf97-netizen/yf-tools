import { describe, expect, it } from 'vitest';
import { buildHouseholdStatements, cnyAmount, periodBounds } from './statements';

describe('household finance statements', () => {
  it('locks an entered foreign currency amount to its manual exchange rate', () => {
    expect(cnyAmount(100, 7.2)).toBe(720);
  });

  it('builds month, quarter and year bounds', () => {
    expect(periodBounds(2026, 'month', 2)).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(periodBounds(2026, 'quarter', 3)).toEqual({ start: '2026-07-01', end: '2026-09-30' });
    expect(periodBounds(2026, 'year', 1)).toEqual({ start: '2026-01-01', end: '2026-12-31' });
  });

  it('keeps transfers and loan principal out of income while treating interest as expense', () => {
    const report = buildHouseholdStatements({
      start: '2026-07-01', end: '2026-09-30',
      entries: [
        { entry_date: '2026-07-02', kind: 'business_income', amount_cny: 100000 },
        { entry_date: '2026-07-03', kind: 'business_expense', amount_cny: 20000 },
        { entry_date: '2026-07-04', kind: 'household_expense', amount_cny: 10000 },
        { entry_date: '2026-07-05', kind: 'internal_transfer', amount_cny: 50000 },
        { entry_date: '2026-07-06', kind: 'loan_principal_payment', amount_cny: 5000 },
        { entry_date: '2026-07-06', kind: 'loan_interest', amount_cny: 1000 },
      ],
      assets: [{ value_cny: 1500000 }], liabilities: [{ value_cny: 400000 }],
      investment: { securities_cny: 200000, cash_cny: 50000, unrealized_change_cny: 12000 },
    });
    expect(report.income.businessSurplus).toBe(80000);
    expect(report.income.householdExpense).toBe(11000);
    expect(report.income.periodSurplus).toBe(69000);
    expect(report.cashFlow.financing).toBe(-5000);
    expect(report.cashFlow.netChange).toBe(64000);
    expect(report.balanceSheet.netWorth).toBe(1350000);
    expect(report.netWorthBridge.unrealizedInvestmentChange).toBe(12000);
  });
});
