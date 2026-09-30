export interface HouseholdPeriodClosureState {
  period_month: string;
  status: 'closed' | 'reopened';
}

export function assertHouseholdPeriodEditable(entryDate: string, closures: HouseholdPeriodClosureState[]) {
  const month = `${entryDate.slice(0, 7)}-01`;
  const closure = closures.find(item => item.period_month.slice(0, 10) === month);
  return closure?.status === 'closed'
    ? { ok: false as const, error: '该月份已结账，请先重新打开月份' }
    : { ok: true as const };
}
