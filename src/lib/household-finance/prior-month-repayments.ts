import dayjs from 'dayjs';
import type { HouseholdFinanceItem, HouseholdLedgerEntry } from '@/types/household-finance';

export type PriorMonthRepaymentDraft = {
  entry_date: string;
  repayment_type: 'mortgage_repayment' | 'credit_loan_repayment' | 'credit_card_payment';
  liability_id?: string;
  principal?: number;
  interest?: number;
  amount?: number;
  currency: string;
  fx_rate?: number;
  note?: string;
  previous_amount?: number;
  previous_entry_date: string;
};

function originalAmount(entry: HouseholdLedgerEntry) {
  return entry.currency && entry.currency !== 'CNY' && entry.original_amount != null ? Number(entry.original_amount) : Number(entry.amount_cny);
}

function shiftedDate(entryDate: string, selectedPeriod: string) {
  const day = dayjs(entryDate).date();
  const target = dayjs(`${selectedPeriod}-01`);
  return target.date(Math.min(day, target.daysInMonth())).format('YYYY-MM-DD');
}

function repaymentType(item?: HouseholdFinanceItem): PriorMonthRepaymentDraft['repayment_type'] {
  const text = `${item?.category || ''}${item?.name || ''}`;
  return text.includes('信用贷') ? 'credit_loan_repayment' : 'mortgage_repayment';
}

export function buildPriorMonthRepaymentDrafts(entries: HouseholdLedgerEntry[], liabilities: HouseholdFinanceItem[], selectedPeriod: string) {
  const previousPeriod = dayjs(`${selectedPeriod}-01`).subtract(1, 'month').format('YYYY-MM');
  const relevant = entries.filter(entry => entry.entry_date.slice(0, 7) === previousPeriod && ['loan_principal_payment', 'loan_interest', 'credit_card_payment'].includes(entry.kind));
  const byLiability = new Map(liabilities.map(item => [item.id, item]));
  const drafts: PriorMonthRepaymentDraft[] = [];
  const loanGroups = new Map<string, HouseholdLedgerEntry[]>();

  for (const entry of relevant) {
    if (entry.kind === 'credit_card_payment') {
      drafts.push({
        entry_date: shiftedDate(entry.entry_date, selectedPeriod), repayment_type: 'credit_card_payment', liability_id: entry.liability_id || undefined,
        amount: undefined, previous_amount: originalAmount(entry), previous_entry_date: entry.entry_date, currency: entry.currency || 'CNY', fx_rate: entry.fx_rate || undefined, note: entry.note,
      });
      continue;
    }
    const key = entry.transaction_group_id || `${entry.liability_id || ''}|${entry.entry_date}|${entry.note || ''}`;
    loanGroups.set(key, [...(loanGroups.get(key) || []), entry]);
  }

  for (const group of loanGroups.values()) {
    const sample = group[0];
    const principal = group.find(entry => entry.kind === 'loan_principal_payment');
    const interest = group.find(entry => entry.kind === 'loan_interest');
    drafts.push({
      entry_date: shiftedDate(sample.entry_date, selectedPeriod), repayment_type: repaymentType(byLiability.get(sample.liability_id || '')),
      liability_id: sample.liability_id || undefined, principal: principal ? originalAmount(principal) : undefined,
      interest: interest ? originalAmount(interest) : undefined, previous_entry_date: sample.entry_date, currency: sample.currency || 'CNY', fx_rate: sample.fx_rate || undefined, note: sample.note,
    });
  }

  return drafts.sort((a, b) => a.entry_date.localeCompare(b.entry_date));
}
