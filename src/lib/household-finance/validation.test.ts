import { describe, expect, it } from 'vitest';
import { validateLedgerEntry } from './validation';

describe('household finance validation', () => {
  it('accepts a minimal CNY business entry', () => {
    const result = validateLedgerEntry({ entry_date: '2026-09-30', kind: 'business_income', amount_cny: 1000, note: '本月教培实收' });
    expect(result.ok).toBe(true);
  });

  it('requires original amount and a positive manual rate for foreign currency', () => {
    const result = validateLedgerEntry({ entry_date: '2026-09-30', kind: 'business_income', amount_cny: 0, currency: 'USD', note: '' });
    expect(result).toEqual({ ok: false, error: '外币记录必须填写原币金额和正数汇率' });
  });
});
