import { describe, expect, it } from 'vitest';
import { deriveLiabilityBalances } from './liability-balances';

const snapshots = [
  { liability_id: 'mortgage', snapshot_date: '2026-03-31', value_cny: 1_000_000 },
];

describe('deriveLiabilityBalances', () => {
  it('subtracts only principal payments after the latest calibration', () => {
    const result = deriveLiabilityBalances(snapshots, [
      { entry_date: '2026-04-10', kind: 'loan_principal_payment', amount_cny: 5_000, liability_id: 'mortgage' },
      { entry_date: '2026-04-10', kind: 'loan_interest', amount_cny: 1_200, liability_id: 'mortgage' },
      { entry_date: '2026-04-11', kind: 'loan_principal_payment', amount_cny: 9_000, liability_id: 'other' },
    ], '2026-04-30');

    expect(result.get('mortgage')).toEqual({
      value_cny: 995_000,
      calibration_date: '2026-03-31',
      calculated_through_date: '2026-04-10',
      principal_paid_after_calibration: 5_000,
    });
  });

  it('uses a later manual calibration as the new starting point', () => {
    const result = deriveLiabilityBalances([
      ...snapshots,
      { liability_id: 'mortgage', snapshot_date: '2026-06-30', value_cny: 990_000 },
    ], [
      { entry_date: '2026-04-10', kind: 'loan_principal_payment', amount_cny: 5_000, liability_id: 'mortgage' },
      { entry_date: '2026-07-10', kind: 'loan_principal_payment', amount_cny: 4_000, liability_id: 'mortgage' },
    ], '2026-07-31');

    expect(result.get('mortgage')?.value_cny).toBe(986_000);
    expect(result.get('mortgage')?.calibration_date).toBe('2026-06-30');
  });

  it('does not subtract same-day or future payments and never returns a negative balance', () => {
    const result = deriveLiabilityBalances(snapshots, [
      { entry_date: '2026-03-31', kind: 'loan_principal_payment', amount_cny: 5_000, liability_id: 'mortgage' },
      { entry_date: '2026-04-10', kind: 'loan_principal_payment', amount_cny: 2_000_000, liability_id: 'mortgage' },
      { entry_date: '2026-05-10', kind: 'loan_principal_payment', amount_cny: 1_000, liability_id: 'mortgage' },
    ], '2026-04-30');

    expect(result.get('mortgage')?.value_cny).toBe(0);
    expect(result.get('mortgage')?.principal_paid_after_calibration).toBe(2_000_000);
    expect(result.get('mortgage')?.calculated_through_date).toBe('2026-04-10');
  });
});
