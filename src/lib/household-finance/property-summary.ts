import type { HouseholdFinanceItem, HouseholdItemCategory, HouseholdLedgerEntry } from '@/types/household-finance';

export function buildPropertySummary(items:HouseholdFinanceItem[],categories:HouseholdItemCategory[],entries:HouseholdLedgerEntry[]){
  const propertyCategoryIds=new Set(categories.filter(category=>category.item_type==='asset'&&category.system_key==='real_estate').map(category=>category.id));
  const mortgageCategoryIds=new Set(categories.filter(category=>category.item_type==='liability'&&category.system_key==='mortgage').map(category=>category.id));
  const properties=items.filter(item=>item.item_type==='asset'&&(propertyCategoryIds.has(item.category_id||'')||(!item.category_id&&item.category==='房产')));
  const mortgages=items.filter(item=>item.item_type==='liability'&&(mortgageCategoryIds.has(item.category_id||'')||(!item.category_id&&item.category==='房贷')));
  const mortgageIds=new Set(mortgages.map(item=>item.id));
  const propertyValue=properties.reduce((total,item)=>total+Number(item.current_value_cny),0);
  const mortgageBalance=mortgages.reduce((total,item)=>total+Number(item.current_value_cny),0);
  const principalPaid=entries.filter(entry=>entry.kind==='loan_principal_payment'&&entry.liability_id&&mortgageIds.has(entry.liability_id)).reduce((total,entry)=>total+Number(entry.amount_cny),0);
  const interestPaid=entries.filter(entry=>entry.kind==='loan_interest'&&entry.liability_id&&mortgageIds.has(entry.liability_id)).reduce((total,entry)=>total+Number(entry.amount_cny),0);
  return {propertyValue,mortgageBalance,netEquity:propertyValue-mortgageBalance,ltvPercent:propertyValue>0?mortgageBalance/propertyValue*100:0,principalPaid,interestPaid};
}
