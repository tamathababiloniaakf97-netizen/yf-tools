const guidance: Record<string, string> = {
  business_income: '只记录实际收到的教培款，不要再记为家庭收入。',
  business_expense: '只记录已经实际支付的经营费用。',
  household_income: '记录工资、报销返还等非经营收入；教培收入不要重复填写。',
  household_expense: '记录真实家庭消费；使用信用卡消费也在这里记，之后还卡不要重复记支出。',
  mortgage_repayment: '填写本次房贷中的本金和利息：本金减少负债，只有利息计入家庭支出。',
  credit_loan_repayment: '填写本次信用贷中的本金和利息：本金减少负债，只有利息计入家庭支出。',
  credit_card_payment: '这是偿还已经发生的信用卡消费，不要重复计入家庭支出。',
  investment_transfer_in: '银行卡转入证券账户只是资金换位置，不是支出，也不是投资亏损。',
  investment_transfer_out: '证券账户转回银行卡只是资金换位置，不是收入，也不是投资收益。',
  asset_purchase: '购置房产、车辆等大额资产时记录；它不是普通家庭消费。',
  asset_sale: '处置房产、车辆等大额资产时记录。',
  loan_drawdown: '只记录实际收到的新借款，并选择对应负债。',
};

export function entryGuidance(kind?: string) {
  return kind ? guidance[kind] ?? '' : '';
}
