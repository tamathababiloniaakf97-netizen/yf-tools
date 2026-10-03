import type { HouseholdEntryReviewChecks } from '@/types/household-finance';

export const manualFinanceChecks = [
  { key:'business', label:'经营收支', description:'经营收入、支出和退款已补齐' },
  { key:'household', label:'家庭收支', description:'家庭收入和日常支出已补齐' },
  { key:'repayments', label:'还款记录', description:'房贷、信用贷和信用卡还款已补齐' },
  { key:'capital', label:'其他大额事项', description:'资产购置、出售、借款和投资转入转出已确认' },
  { key:'cash_balances', label:'现金账户余额', description:'银行卡和现金账户已更新到月末' },
  { key:'liability_balances', label:'负债余额', description:'房贷、信用贷和信用卡未偿余额已更新' },
  { key:'investment_ready', label:'投资数据与汇率', description:'投资账户数据及月末 USD/CNY 汇率已准备' },
] as const;

export type ManualFinanceCheckKey = typeof manualFinanceChecks[number]['key'];

export function completedManualChecks(checks:HouseholdEntryReviewChecks={}) {
  return manualFinanceChecks.filter(item=>checks[item.key]===true).length;
}

export function buildMonthlyChecklist(checks:HouseholdEntryReviewChecks={}, monthClosed:boolean) {
  return [
    ...manualFinanceChecks.map(item=>({ ...item, manual:true as const, completed:checks[item.key]===true })),
    { key:'month_closed' as const, label:'月度结账', description:'核对现金、负债和投资快照后正式结账', manual:false as const, completed:monthClosed },
  ];
}
