import { describe, expect, it } from 'vitest';
import { buildPriorMonthRepaymentDrafts } from './prior-month-repayments';
import type { HouseholdFinanceItem, HouseholdLedgerEntry } from '@/types/household-finance';

const liabilities: HouseholdFinanceItem[] = [
  { id:'mortgage', item_type:'liability', category:'房贷', name:'住房贷款', owner:'self', current_value_cny:1, valuation_date:'2026-01-01', note:'' },
  { id:'card', item_type:'liability', category:'信用卡', name:'招商信用卡', owner:'self', current_value_cny:1, valuation_date:'2026-01-01', note:'' },
];

describe('buildPriorMonthRepaymentDrafts', () => {
  it('groups loan principal and interest and shifts the date into the selected month', () => {
    const entries: HouseholdLedgerEntry[] = [
      { entry_date:'2026-01-31', kind:'loan_principal_payment', amount_cny:5000, liability_id:'mortgage', transaction_group_id:'g1', note:'月供', currency:'CNY' },
      { entry_date:'2026-01-31', kind:'loan_interest', amount_cny:1200, liability_id:'mortgage', transaction_group_id:'g1', note:'月供', currency:'CNY' },
    ];
    expect(buildPriorMonthRepaymentDrafts(entries, liabilities, '2026-02')).toEqual([expect.objectContaining({
      entry_date:'2026-02-28', repayment_type:'mortgage_repayment', liability_id:'mortgage', principal:5000, interest:1200, note:'月供',
    })]);
  });

  it('keeps a credit-card prior amount only as reference and leaves the new amount empty', () => {
    const entries: HouseholdLedgerEntry[] = [
      { entry_date:'2026-09-08', kind:'credit_card_payment', amount_cny:8600, liability_id:'card', currency:'CNY' },
    ];
    expect(buildPriorMonthRepaymentDrafts(entries, liabilities, '2026-10')).toEqual([expect.objectContaining({
      entry_date:'2026-10-08', repayment_type:'credit_card_payment', liability_id:'card', amount:undefined, previous_amount:8600,
    })]);
  });

  it('uses only the immediately preceding calendar month', () => {
    const entries: HouseholdLedgerEntry[] = [
      { entry_date:'2026-08-08', kind:'credit_card_payment', amount_cny:100, liability_id:'card', currency:'CNY' },
      { entry_date:'2026-09-08', kind:'credit_card_payment', amount_cny:200, liability_id:'card', currency:'CNY' },
    ];
    const drafts = buildPriorMonthRepaymentDrafts(entries, liabilities, '2026-10');
    expect(drafts).toHaveLength(1);
    expect(drafts[0].previous_amount).toBe(200);
  });
});
