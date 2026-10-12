import { describe, expect, it } from 'vitest';
import { summarizeEntryScope } from './entry-summaries';
import type { HouseholdLedgerEntry } from '@/types/household-finance';

const entry=(kind:HouseholdLedgerEntry['kind'],amount_cny:number):HouseholdLedgerEntry=>({entry_date:'2026-09-30',kind,amount_cny});

describe('summarizeEntryScope',()=>{
  it('calculates net business income after refunds and operating surplus',()=>{
    expect(summarizeEntryScope('business',[entry('business_income',1000),entry('business_refund',100),entry('business_expense',300)])).toEqual({
      count:3, income:900, expense:300, net:600,
    });
  });

  it('calculates household surplus without treating debt principal as household expense',()=>{
    expect(summarizeEntryScope('household',[entry('household_income',1000),entry('household_expense',250),entry('loan_principal_payment',400)])).toEqual({
      count:2, income:1000, expense:250, net:750,
    });
  });

  it('separates capital cash movements and debt costs',()=>{
    expect(summarizeEntryScope('capital',[
      entry('asset_purchase',100000),entry('asset_sale',20000),entry('loan_drawdown',50000),entry('loan_principal_payment',3000),entry('loan_interest',500),entry('credit_card_payment',800),entry('investment_transfer_in',2000),entry('investment_transfer_out',600),
    ])).toEqual({count:8,assetNet:-80000,financingNet:47000,investmentNet:-1400,interest:500,creditCardPayment:800,netCash:-35700});
  });
});
