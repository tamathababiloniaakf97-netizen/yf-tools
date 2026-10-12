import type { HouseholdLedgerEntry } from '@/types/household-finance';

export type EntryScope='business'|'household'|'capital';

export function summarizeEntryScope(scope:EntryScope,entries:HouseholdLedgerEntry[]){
  const kinds=scope==='business'?new Set(['business_income','business_expense','business_refund']):scope==='household'?new Set(['household_income','household_expense']):new Set(['asset_purchase','asset_sale','loan_drawdown','loan_principal_payment','loan_interest','credit_card_payment','investment_transfer_in','investment_transfer_out']);
  const rows=entries.filter(entry=>kinds.has(entry.kind));
  const sum=(...selected:HouseholdLedgerEntry['kind'][])=>rows.filter(entry=>selected.includes(entry.kind)).reduce((total,entry)=>total+Number(entry.amount_cny),0);
  if(scope==='business'){
    const income=sum('business_income')-sum('business_refund');const expense=sum('business_expense');
    return {count:rows.length,income,expense,net:income-expense};
  }
  if(scope==='household'){
    const income=sum('household_income');const expense=sum('household_expense');
    return {count:rows.length,income,expense,net:income-expense};
  }
  const assetNet=sum('asset_sale')-sum('asset_purchase');
  const financingNet=sum('loan_drawdown')-sum('loan_principal_payment');
  const investmentNet=sum('investment_transfer_out')-sum('investment_transfer_in');
  const interest=sum('loan_interest');const creditCardPayment=sum('credit_card_payment');
  return {count:rows.length,assetNet,financingNet,investmentNet,interest,creditCardPayment,netCash:assetNet+financingNet+investmentNet-interest-creditCardPayment};
}
