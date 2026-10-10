export type HouseholdOwner = 'self' | 'spouse' | 'joint';
export type HouseholdEntryKind =
  | 'business_income' | 'business_expense' | 'business_refund'
  | 'household_income' | 'household_expense' | 'investment_income'
  | 'security_buy' | 'security_sell' | 'asset_purchase' | 'asset_sale'
  | 'loan_drawdown' | 'loan_principal_payment' | 'loan_interest'
  | 'credit_card_payment' | 'investment_transfer_in' | 'investment_transfer_out'
  | 'internal_transfer' | 'adjustment';

export interface HouseholdLedgerEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  kind: HouseholdEntryKind;
  amount_cny: number;
  currency?: string;
  original_amount?: number | null;
  fx_rate?: number | null;
  owner?: HouseholdOwner;
  note?: string;
  liability_id?: string | null;
  transaction_group_id?: string | null;
  created_at?: string;
}

export interface HouseholdValuation { value_cny: number; }
export interface HouseholdInvestmentSnapshot {
  securities_cny: number;
  cash_cny: number;
  unrealized_change_cny?: number;
}
export interface StatementInput {
  start: string;
  end: string;
  entries: HouseholdLedgerEntry[];
  assets: HouseholdValuation[];
  liabilities: HouseholdValuation[];
  investment?: HouseholdInvestmentSnapshot | null;
}
export interface HouseholdStatements {
  balanceSheet: { assets: number; liabilities: number; netWorth: number };
  income: { businessIncome: number; businessExpense: number; businessSurplus: number; householdIncome: number; householdExpense: number; investmentIncome: number; periodSurplus: number };
  cashFlow: { operating: number; investing: number; financing: number; netChange: number };
  netWorthBridge: { unrealizedInvestmentChange: number };
}

export interface HouseholdFinanceItem {
  id: string;
  item_type: 'account' | 'asset' | 'liability';
  category: string;
  name: string;
  owner: HouseholdOwner;
  current_value_cny: number;
  valuation_date: string;
  note: string;
  calibration_date?: string;
  principal_paid_after_calibration?: number;
  created_at?: string;
}

export interface HouseholdClosure {
  period_month: string;
  status: 'closed' | 'reopened';
  actual_cash_cny: number;
  theoretical_cash_cny: number;
  unexplained_difference_cny: number;
  investment_value_usd: number;
  usd_cny_rate: number;
  investment_value_cny: number;
  closed_at?: string;
}

export interface HouseholdFinanceSettings {
  enabled_date: string;
  base_currency: 'CNY';
  entry_review_started_month: string;
}

export interface HouseholdEntryReview {
  period_month: string;
  reviewed_at: string;
  checks?: HouseholdEntryReviewChecks;
}

export interface HouseholdEntryReviewChecks {
  business?: boolean;
  household?: boolean;
  repayments?: boolean;
  capital?: boolean;
  cash_balances?: boolean;
  liability_balances?: boolean;
  investment_ready?: boolean;
}
