import { describe, expect, it } from 'vitest';
import { entryGuidance } from './entry-guidance';

describe('entryGuidance', () => {
  it('explains the accounting consequence of common entries', () => {
    expect(entryGuidance('mortgage_repayment')).toContain('本金');
    expect(entryGuidance('credit_loan_repayment')).toContain('利息');
    expect(entryGuidance('credit_card_payment')).toContain('不要重复');
    expect(entryGuidance('investment_transfer_in')).toContain('不是支出');
    expect(entryGuidance('business_income')).toContain('实际收到');
    expect(entryGuidance('household_income')).toContain('不要重复');
  });
});
