import type { HouseholdEntryKind, HouseholdLedgerEntry } from '@/types/household-finance';
import { cnyAmount } from './statements';

const kinds: HouseholdEntryKind[] = ['business_income', 'business_expense', 'business_refund', 'household_expense', 'investment_income', 'security_buy', 'security_sell', 'asset_purchase', 'asset_sale', 'loan_drawdown', 'loan_principal_payment', 'loan_interest', 'internal_transfer', 'adjustment'];

export function validateLedgerEntry(input: Partial<HouseholdLedgerEntry>): { ok: true; value: HouseholdLedgerEntry } | { ok: false; error: string } {
  if (!input.entry_date || !/^\d{4}-\d{2}-\d{2}$/.test(input.entry_date)) return { ok: false, error: '请填写有效日期' };
  if (!input.kind || !kinds.includes(input.kind)) return { ok: false, error: '请选择有效收支类型' };
  const currency = input.currency || 'CNY';
  let amountCny = Number(input.amount_cny);
  if (currency !== 'CNY') {
    if (!Number.isFinite(input.original_amount) || !Number.isFinite(input.fx_rate) || (input.original_amount ?? 0) <= 0 || (input.fx_rate ?? 0) <= 0) return { ok: false, error: '外币记录必须填写原币金额和正数汇率' };
    amountCny = cnyAmount(input.original_amount!, input.fx_rate!);
  }
  if (!Number.isFinite(amountCny) || amountCny <= 0) return { ok: false, error: '金额必须大于 0' };
  return { ok: true, value: { entry_date: input.entry_date, kind: input.kind, amount_cny: amountCny, currency, original_amount: input.original_amount ?? null, fx_rate: input.fx_rate ?? null, owner: input.owner ?? 'joint', note: input.note?.trim() ?? '' } };
}
