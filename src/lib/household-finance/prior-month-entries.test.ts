import { describe, expect, it } from 'vitest';
import { buildPriorMonthEntryDrafts } from './prior-month-entries';
import type { HouseholdLedgerEntry } from '@/types/household-finance';

const entries: HouseholdLedgerEntry[] = [
  { id:'salary', entry_date:'2026-01-31', kind:'household_income', amount_cny:20000, currency:'CNY', note:'工资' },
  { id:'rent', entry_date:'2026-01-05', kind:'household_expense', amount_cny:5000, currency:'CNY', note:'房租' },
  { id:'business', entry_date:'2026-01-10', kind:'business_expense', amount_cny:1200, currency:'CNY', note:'办公室' },
  { id:'older', entry_date:'2025-12-05', kind:'household_expense', amount_cny:99, currency:'CNY', note:'旧数据' },
];

describe('buildPriorMonthEntryDrafts', () => {
  it('returns only the selected scope from the immediately preceding month', () => {
    const drafts = buildPriorMonthEntryDrafts(entries, 'household', '2026-02');
    expect(drafts.map(draft => draft.source_id)).toEqual(['rent', 'salary']);
  });

  it('moves dates into the selected month and clamps an invalid month-end day', () => {
    const drafts = buildPriorMonthEntryDrafts(entries, 'household', '2026-02');
    expect(drafts.find(draft => draft.source_id === 'salary')?.entry_date).toBe('2026-02-28');
  });

  it('preserves the editable amount, currency, exchange rate and note', () => {
    const usd: HouseholdLedgerEntry = { id:'usd', entry_date:'2026-09-08', kind:'business_expense', amount_cny:710, original_amount:100, currency:'USD', fx_rate:7.1, note:'订阅' };
    expect(buildPriorMonthEntryDrafts([usd], 'business', '2026-10')[0]).toEqual(expect.objectContaining({ amount:100, currency:'USD', fx_rate:7.1, note:'订阅' }));
  });

  it('marks the agreed fixed items from explicit note keywords and sorts them first', () => {
    const source: HouseholdLedgerEntry[] = [
      { id:'meal', entry_date:'2026-09-01', kind:'household_expense', amount_cny:100, currency:'CNY', note:'聚餐' },
      { id:'property', entry_date:'2026-09-30', kind:'household_expense', amount_cny:2300, currency:'CNY', note:'万科物业费' },
    ];
    const drafts = buildPriorMonthEntryDrafts(source, 'household', '2026-10');
    expect(drafts.map(draft => ({ id:draft.source_id, fixed:draft.is_fixed }))).toEqual([
      { id:'property', fixed:true }, { id:'meal', fixed:false },
    ]);
  });

  it('does not guess a fixed item when the note is vague', () => {
    const vague: HouseholdLedgerEntry = { id:'vague', entry_date:'2026-09-30', kind:'household_expense', amount_cny:2300, currency:'CNY', note:'9月家庭支出' };
    expect(buildPriorMonthEntryDrafts([vague], 'household', '2026-10')[0].is_fixed).toBe(false);
  });
});
