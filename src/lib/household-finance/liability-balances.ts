import type { HouseholdLedgerEntry } from '@/types/household-finance';

export interface LiabilitySnapshot {
  liability_id?: string;
  snapshot_date: string;
  value_cny: number;
}

export interface DerivedLiabilityBalance {
  value_cny: number;
  calibration_date: string;
  calculated_through_date: string;
  principal_paid_after_calibration: number;
}

export function deriveLiabilityBalances(
  snapshots: LiabilitySnapshot[],
  entries: Pick<HouseholdLedgerEntry, 'entry_date' | 'kind' | 'amount_cny' | 'liability_id'>[],
  asOf: string,
) {
  const latest = new Map<string, LiabilitySnapshot>();
  snapshots
    .filter((snapshot) => snapshot.liability_id && snapshot.snapshot_date <= asOf)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .forEach((snapshot) => latest.set(snapshot.liability_id!, snapshot));

  return new Map([...latest].map(([liabilityId, snapshot]) => {
    const principalPayments = entries.filter((entry) => (
      entry.liability_id === liabilityId
      && entry.kind === 'loan_principal_payment'
      && entry.entry_date > snapshot.snapshot_date
      && entry.entry_date <= asOf
    ));
    const principalPaid = principalPayments.reduce((sum, entry) => sum + Number(entry.amount_cny || 0), 0);
    const latestPaymentDate = principalPayments.reduce(
      (latestDate, entry) => entry.entry_date > latestDate ? entry.entry_date : latestDate,
      snapshot.snapshot_date,
    );

    return [liabilityId, {
      value_cny: Math.max(0, Number(snapshot.value_cny || 0) - principalPaid),
      calibration_date: snapshot.snapshot_date,
      calculated_through_date: latestPaymentDate,
      principal_paid_after_calibration: principalPaid,
    } satisfies DerivedLiabilityBalance];
  }));
}
