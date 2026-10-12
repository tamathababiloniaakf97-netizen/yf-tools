import { describe, expect, it } from 'vitest';
import { buildPropertySummary } from './property-summary';
import type { HouseholdFinanceItem, HouseholdItemCategory, HouseholdLedgerEntry } from '@/types/household-finance';

const categories:HouseholdItemCategory[]=[
  {id:'property',item_type:'asset',name:'不动产',system_key:'real_estate',is_active:true},
  {id:'mortgage',item_type:'liability',name:'住房贷款',system_key:'mortgage',is_active:true},
];
const items:HouseholdFinanceItem[]=[
  {id:'home',item_type:'asset',category_id:'property',category:'不动产',name:'住宅',owner:'joint',current_value_cny:1000000,valuation_date:'2026-09-30',note:''},
  {id:'loan',item_type:'liability',category_id:'mortgage',category:'住房贷款',name:'住宅按揭',owner:'joint',current_value_cny:400000,valuation_date:'2026-09-30',note:''},
];
const entries:HouseholdLedgerEntry[]=[
  {entry_date:'2026-09-30',kind:'loan_principal_payment',amount_cny:3000,liability_id:'loan'},
  {entry_date:'2026-09-30',kind:'loan_interest',amount_cny:500,liability_id:'loan'},
  {entry_date:'2026-09-30',kind:'loan_principal_payment',amount_cny:999,liability_id:'other'},
];

describe('buildPropertySummary',()=>{
  it('uses stable category semantics after labels are renamed',()=>{
    expect(buildPropertySummary(items,categories,entries)).toEqual({propertyValue:1000000,mortgageBalance:400000,netEquity:600000,ltvPercent:40,principalPaid:3000,interestPaid:500});
  });
});
