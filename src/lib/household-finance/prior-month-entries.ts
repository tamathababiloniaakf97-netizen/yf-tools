import dayjs from 'dayjs';
import type { HouseholdEntryKind, HouseholdLedgerEntry } from '@/types/household-finance';

type EntryScope = 'business' | 'household';
const scopeKinds: Record<EntryScope, HouseholdEntryKind[]> = {
  business: ['business_income', 'business_expense', 'business_refund'],
  household: ['household_income', 'household_expense'],
};

export type PriorMonthEntryDraft = {
  source_id: string;
  previous_entry_date: string;
  entry_date: string;
  kind: HouseholdEntryKind;
  amount: number;
  currency: string;
  fx_rate?: number;
  note?: string;
  is_fixed: boolean;
};

const fixedKeywords = ['保险', '工资', '房租', '物业费'];

function moveDate(entryDate: string, selectedPeriod: string) {
  const target = dayjs(`${selectedPeriod}-01`);
  return target.date(Math.min(dayjs(entryDate).date(), target.daysInMonth())).format('YYYY-MM-DD');
}

export function buildPriorMonthEntryDrafts(entries: HouseholdLedgerEntry[], scope: EntryScope, selectedPeriod: string): PriorMonthEntryDraft[] {
  const previousPeriod = dayjs(`${selectedPeriod}-01`).subtract(1, 'month').format('YYYY-MM');
  return entries
    .filter(entry => entry.entry_date.slice(0, 7) === previousPeriod && scopeKinds[scope].includes(entry.kind))
    .map((entry, index) => ({
      source_id: entry.id || `${entry.entry_date}-${entry.kind}-${index}`,
      previous_entry_date: entry.entry_date,
      entry_date: moveDate(entry.entry_date, selectedPeriod),
      kind: entry.kind,
      amount: entry.currency && entry.currency !== 'CNY' && entry.original_amount != null ? Number(entry.original_amount) : Number(entry.amount_cny),
      currency: entry.currency || 'CNY',
      fx_rate: entry.fx_rate || undefined,
      note: entry.note,
      is_fixed: fixedKeywords.some(keyword => (entry.note || '').includes(keyword)),
    }))
    .sort((a, b) => Number(b.is_fixed) - Number(a.is_fixed) || a.previous_entry_date.localeCompare(b.previous_entry_date));
}
