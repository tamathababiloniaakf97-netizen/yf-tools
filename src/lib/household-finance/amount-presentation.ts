import type { HouseholdEntryKind } from '@/types/household-finance';

export type MoneyFlow = 'inflow' | 'outflow' | 'neutral';

const inflows = new Set<HouseholdEntryKind>(['business_income', 'household_income', 'investment_income', 'security_sell', 'asset_sale', 'loan_drawdown', 'investment_transfer_out']);
const outflows = new Set<HouseholdEntryKind>(['business_expense', 'business_refund', 'household_expense', 'security_buy', 'asset_purchase', 'loan_principal_payment', 'loan_interest', 'credit_card_payment', 'investment_transfer_in']);

export function entryFlow(kind: HouseholdEntryKind): MoneyFlow {
  if (inflows.has(kind)) return 'inflow';
  if (outflows.has(kind)) return 'outflow';
  return 'neutral';
}

export function valueFlow(value: number): MoneyFlow {
  return value > 0 ? 'inflow' : value < 0 ? 'outflow' : 'neutral';
}

export function formatFlowAmount(value: number, flow: MoneyFlow, currency = 'CNY') {
  const symbol = currency === 'USD' ? '$' : '¥';
  const amount = Math.abs(Number(value) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = flow === 'inflow' ? '+' : flow === 'outflow' ? '−' : '';
  return `${sign}${symbol}${amount}`;
}

export const flowClassName = (flow: MoneyFlow) => `finance-flow-amount finance-flow-${flow}`;
